"""Commodity market data ingestion service.

Retrieves daily and monthly global benchmark commodity prices:
- Brent Crude Oil (BZ=F) via yfinance
- Iron Ore Futures (TIO=F) via yfinance & Global Iron Ore Index (PIORECRUSDM) via FRED
- Australian Thermal Coal (PCOALAUUSDM) via Federal Reserve Economic Data (FRED)
"""

import logging
from io import StringIO
from typing import Optional

import numpy as np
import pandas as pd
import requests
import yfinance as yf

from app.config import get_settings

logger = logging.getLogger(__name__)

FRED_API_URL = "https://api.stlouisfed.org/fred/series/observations"
FRED_CSV_URL = "https://fred.stlouisfed.org/graph/fredgraph.csv"


class CommodityIngestion:
    """Ingestion and alignment of global dry-bulk commodities and fuel drivers."""

    @staticmethod
    def fetch_fred_series(series_id: str, api_key: Optional[str] = None) -> pd.DataFrame:
        """Fetch historical time series from Federal Reserve Economic Data (FRED).

        First attempts the official FRED JSON API if an API key is available.
        Falls back to the direct public FRED CSV download endpoint if the API key
        is omitted or encounters an error.

        Args:
            series_id: FRED series identifier (e.g. 'PCOALAUUSDM', 'PIORECRUSDM').
            api_key: Optional FRED developer API key.

        Returns:
            pd.DataFrame: Cleaned DataFrame with ['date', 'value'] sorted chronologically.
        """
        settings = get_settings()
        key = api_key or settings.FRED_API_KEY

        # 1. Attempt official FRED JSON API if key is available
        if key:
            try:
                params = {
                    "series_id": series_id,
                    "api_key": key,
                    "file_type": "json",
                }
                resp = requests.get(FRED_API_URL, params=params, timeout=30)
                if resp.status_code == 200:
                    data = resp.json().get("observations", [])
                    if data:
                        df = pd.DataFrame(data)
                        df = df.rename(columns={"date": "date"})
                        df["date"] = pd.to_datetime(df["date"]).dt.tz_localize(None)
                        df["value"] = pd.to_numeric(df["value"], errors="coerce")
                        df = df.dropna(subset=["value"]).sort_values("date").reset_index(drop=True)
                        logger.info("Fetched %d records for FRED series %s via JSON API", len(df), series_id)
                        return df[["date", "value"]]
                else:
                    logger.warning(
                        "FRED JSON API returned status %d for %s. Falling back to CSV.",
                        resp.status_code,
                        series_id,
                    )
            except Exception as e:
                logger.warning("FRED JSON API failed for %s (%s). Falling back to CSV.", series_id, e)

        # 2. Fallback: Direct public CSV download endpoint
        try:
            url = f"{FRED_CSV_URL}?id={series_id}"
            resp = requests.get(url, timeout=30)
            resp.raise_for_status()

            df = pd.read_csv(StringIO(resp.text))
            if df.empty or len(df.columns) < 2:
                logger.warning("FRED CSV returned empty or invalid dataset for %s", series_id)
                return pd.DataFrame()

            # The first column is observation_date (or DATE), second is the series ID
            date_col = df.columns[0]
            val_col = df.columns[1]

            df = df.rename(columns={date_col: "date", val_col: "value"})
            df["date"] = pd.to_datetime(df["date"]).dt.tz_localize(None)
            df["value"] = pd.to_numeric(df["value"], errors="coerce")
            df = df.dropna(subset=["value"]).sort_values("date").reset_index(drop=True)

            logger.info("Fetched %d records for FRED series %s via direct CSV", len(df), series_id)
            return df[["date", "value"]]

        except Exception as e:
            logger.error("Failed to fetch FRED series %s: %s", series_id, e)
            return pd.DataFrame()

    @staticmethod
    def fetch_daily_commodities(period: str = "5y") -> pd.DataFrame:
        """Fetch daily Brent Crude Oil (BZ=F) and Iron Ore Futures (TIO=F) from yfinance.

        Args:
            period: Lookback duration supported by yfinance (e.g., '1y', '2y', '5y').

        Returns:
            pd.DataFrame: Merged daily DataFrame with ['date', 'brent_usd', 'iron_ore_usd'].
        """
        daily_dfs: list[pd.DataFrame] = []

        # 1. Brent Crude
        try:
            brent_ticker = yf.Ticker("BZ=F")
            brent_hist = brent_ticker.history(period=period, interval="1d").reset_index()
            if not brent_hist.empty and "Close" in brent_hist.columns:
                brent_df = pd.DataFrame()
                brent_df["date"] = pd.to_datetime(brent_hist["Date"]).dt.tz_localize(None)
                brent_df["brent_usd"] = pd.to_numeric(brent_hist["Close"], errors="coerce")
                brent_df = brent_df.dropna(subset=["brent_usd"])
                daily_dfs.append(brent_df)
                logger.info("Fetched %d Brent records from yfinance", len(brent_df))
        except Exception as e:
            logger.error("Error fetching Brent crude from yfinance: %s", e)

        # 2. Iron Ore (TIO=F)
        try:
            iron_ticker = yf.Ticker("TIO=F")
            iron_hist = iron_ticker.history(period=period, interval="1d").reset_index()
            if not iron_hist.empty and "Close" in iron_hist.columns:
                iron_df = pd.DataFrame()
                iron_df["date"] = pd.to_datetime(iron_hist["Date"]).dt.tz_localize(None)
                iron_df["iron_ore_usd"] = pd.to_numeric(iron_hist["Close"], errors="coerce")
                iron_df = iron_df.dropna(subset=["iron_ore_usd"])
                daily_dfs.append(iron_df)
                logger.info("Fetched %d Iron Ore futures records from yfinance", len(iron_df))
        except Exception as e:
            logger.warning("Error fetching Iron Ore futures from yfinance: %s", e)

        if not daily_dfs:
            return pd.DataFrame(columns=["date", "brent_usd", "iron_ore_usd"])

        # Merge available daily time series on date
        merged = daily_dfs[0]
        for next_df in daily_dfs[1:]:
            merged = pd.merge(merged, next_df, on="date", how="outer")

        merged = merged.sort_values("date").reset_index(drop=True)
        if "brent_usd" not in merged.columns:
            merged["brent_usd"] = np.nan
        if "iron_ore_usd" not in merged.columns:
            merged["iron_ore_usd"] = np.nan

        return merged[["date", "brent_usd", "iron_ore_usd"]]

    @staticmethod
    def fetch_monthly_commodities(api_key: Optional[str] = None) -> pd.DataFrame:
        """Fetch monthly benchmark coal and iron ore prices from FRED.

        - PCOALAUUSDM: Coal, Australian thermal coal, monthly ($/metric ton)
        - PIORECRUSDM: Iron Ore, standard 62% Fe CFR China, monthly ($/dry metric ton)

        Args:
            api_key: Optional FRED API key.

        Returns:
            pd.DataFrame: Merged monthly DataFrame with columns:
                ['date', 'coal_price_usd', 'iron_ore_price_usd']
        """
        coal_df = CommodityIngestion.fetch_fred_series("PCOALAUUSDM", api_key=api_key)
        iron_df = CommodityIngestion.fetch_fred_series("PIORECRUSDM", api_key=api_key)

        if coal_df.empty and iron_df.empty:
            return pd.DataFrame(columns=["date", "coal_price_usd", "iron_ore_price_usd"])

        if not coal_df.empty:
            coal_df = coal_df.rename(columns={"value": "coal_price_usd"})
        else:
            coal_df = pd.DataFrame(columns=["date", "coal_price_usd"])

        if not iron_df.empty:
            iron_df = iron_df.rename(columns={"value": "iron_ore_price_usd"})
        else:
            iron_df = pd.DataFrame(columns=["date", "iron_ore_price_usd"])

        merged = pd.merge(coal_df, iron_df, on="date", how="outer")
        merged = merged.sort_values("date").reset_index(drop=True)
        return merged

    @staticmethod
    def fetch_all_commodities(api_key: Optional[str] = None, period: str = "5y") -> pd.DataFrame:
        """Merge daily and monthly commodities into a unified daily dataset with forward-fill.

        Monthly indicator values (Coal, benchmark Iron Ore) are aligned and forward-filled
        across daily trading dates to avoid look-ahead bias and eliminate NaNs.

        Args:
            api_key: Optional FRED API key.
            period: Lookback window for daily commodities ('1y', '5y', etc.).

        Returns:
            pd.DataFrame: Daily DataFrame with columns:
                ['date', 'brent_usd', 'iron_ore_usd', 'coal_price_usd']
        """
        daily_df = CommodityIngestion.fetch_daily_commodities(period=period)
        monthly_df = CommodityIngestion.fetch_monthly_commodities(api_key=api_key)

        if daily_df.empty and monthly_df.empty:
            logger.warning("Both daily and monthly commodity datasets are empty.")
            return pd.DataFrame(columns=["date", "brent_usd", "iron_ore_usd", "coal_price_usd"])

        if daily_df.empty:
            merged = monthly_df.copy()
            merged["brent_usd"] = np.nan
        elif monthly_df.empty:
            merged = daily_df.copy()
            merged["coal_price_usd"] = np.nan
        else:
            # Rename monthly iron ore if daily is also present to prioritize high-frequency daily
            monthly_renamed = monthly_df.rename(columns={"iron_ore_price_usd": "iron_ore_monthly"})
            merged = pd.merge(daily_df, monthly_renamed, on="date", how="outer")

            # Supplement iron ore: use daily futures if available, else fill from monthly
            if "iron_ore_monthly" in merged.columns:
                merged["iron_ore_usd"] = merged["iron_ore_usd"].combine_first(merged["iron_ore_monthly"])
                merged = merged.drop(columns=["iron_ore_monthly"])

        merged = merged.sort_values("date").reset_index(drop=True)

        # Forward fill monthly macroeconomic indicators across daily rows
        if "coal_price_usd" in merged.columns:
            merged["coal_price_usd"] = merged["coal_price_usd"].ffill().bfill()
        if "iron_ore_usd" in merged.columns:
            merged["iron_ore_usd"] = merged["iron_ore_usd"].ffill().bfill()
        if "brent_usd" in merged.columns:
            merged["brent_usd"] = merged["brent_usd"].ffill().bfill()

        cols = ["date", "brent_usd", "iron_ore_usd", "coal_price_usd"]
        result = merged[[c for c in cols if c in merged.columns]].dropna(how="all", subset=[c for c in cols if c != "date"])
        result = result.reset_index(drop=True)
        logger.info("Successfully assembled unified commodity dataset with %d rows", len(result))
        return result


# Module-level convenience functions
fetch_fred_series = CommodityIngestion.fetch_fred_series
fetch_daily_commodities = CommodityIngestion.fetch_daily_commodities
fetch_monthly_commodities = CommodityIngestion.fetch_monthly_commodities
fetch_all_commodities = CommodityIngestion.fetch_all_commodities
