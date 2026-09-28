"""USD to INR Foreign Exchange (Forex) rate ingestion service.

Provides real-time and historical currency exchange rates using the Frankfurter API
(European Central Bank data) with fallback to Yahoo Finance (USDINR=X).
"""

import logging
from typing import Optional

import pandas as pd
import requests
import yfinance as yf

logger = logging.getLogger(__name__)

FRANKFURTER_BASE_URL = "https://api.frankfurter.app"
FALLBACK_USD_INR_RATE = 84.0


class ForexIngestion:
    """Foreign exchange ingestion and conversion for Indian East Coast shipping operations."""

    @staticmethod
    def fetch_current_usd_inr() -> float:
        """Fetch the latest USD/INR exchange rate.

        First queries Frankfurter API; falls back to yfinance (USDINR=X) if unavailable.

        Returns:
            float: Current USD to INR conversion rate.
        """
        # 1. Primary: Frankfurter API
        try:
            url = f"{FRANKFURTER_BASE_URL}/latest?from=USD&to=INR"
            resp = requests.get(url, timeout=15)
            if resp.status_code == 200:
                data = resp.json()
                rate = data.get("rates", {}).get("INR")
                if rate is not None:
                    logger.info("Fetched current USD/INR from Frankfurter: %.2f", rate)
                    return float(rate)
        except Exception as e:
            logger.warning("Frankfurter latest rate fetch failed: %s. Falling back to yfinance.", e)

        # 2. Fallback: yfinance USDINR=X
        try:
            ticker = yf.Ticker("USDINR=X")
            hist = ticker.history(period="5d", interval="1d")
            if not hist.empty and "Close" in hist.columns:
                last_price = float(hist["Close"].dropna().iloc[-1])
                logger.info("Fetched current USD/INR from yfinance: %.2f", last_price)
                return round(last_price, 4)
        except Exception as e:
            logger.error("yfinance USD/INR fetch failed: %s", e)

        logger.warning("Using static fallback USD/INR rate: %.2f", FALLBACK_USD_INR_RATE)
        return FALLBACK_USD_INR_RATE

    @staticmethod
    def fetch_historical_usd_inr(years: int = 5) -> pd.DataFrame:
        """Fetch historical daily USD/INR exchange rates from yfinance.

        Args:
            years: Number of historical years to retrieve (default 5).

        Returns:
            pd.DataFrame: DataFrame with ['date', 'usd_inr'] sorted chronologically.
        """
        try:
            ticker = yf.Ticker("USDINR=X")
            hist = ticker.history(period=f"{years}y", interval="1d").reset_index()
            if hist.empty or "Close" not in hist.columns:
                logger.warning("yfinance returned empty historical data for USDINR=X")
                return pd.DataFrame(columns=["date", "usd_inr"])

            df = pd.DataFrame()
            df["date"] = pd.to_datetime(hist["Date"]).dt.tz_localize(None)
            df["usd_inr"] = pd.to_numeric(hist["Close"], errors="coerce")
            df = df.dropna(subset=["usd_inr"]).sort_values("date").reset_index(drop=True)
            logger.info("Fetched %d historical USD/INR records from yfinance", len(df))
            return df[["date", "usd_inr"]]

        except Exception as e:
            logger.error("Failed to fetch historical USD/INR from yfinance: %s", e)
            return pd.DataFrame(columns=["date", "usd_inr"])

    @staticmethod
    def fetch_historical_range(start_date: str, end_date: str) -> pd.DataFrame:
        """Fetch historical USD/INR rate for a specific date range.

        Args:
            start_date: Start date in 'YYYY-MM-DD' format.
            end_date: End date in 'YYYY-MM-DD' format.

        Returns:
            pd.DataFrame: DataFrame with columns ['date', 'usd_inr'].
        """
        # 1. Try Frankfurter date range endpoint
        try:
            url = f"{FRANKFURTER_BASE_URL}/{start_date}..{end_date}?from=USD&to=INR"
            resp = requests.get(url, timeout=25)
            if resp.status_code == 200:
                data = resp.json()
                rates_dict = data.get("rates", {})
                records = []
                for d_str, rates in rates_dict.items():
                    inr_val = rates.get("INR")
                    if inr_val is not None:
                        records.append({"date": pd.to_datetime(d_str), "usd_inr": float(inr_val)})

                if records:
                    df = pd.DataFrame(records).sort_values("date").reset_index(drop=True)
                    logger.info("Fetched %d records from Frankfurter for range %s to %s", len(df), start_date, end_date)
                    return df
        except Exception as e:
            logger.warning("Frankfurter range fetch failed (%s). Falling back to yfinance.", e)

        # 2. Fallback to yfinance with start/end
        try:
            ticker = yf.Ticker("USDINR=X")
            hist = ticker.history(start=start_date, end=end_date, interval="1d").reset_index()
            if not hist.empty and "Close" in hist.columns:
                df = pd.DataFrame()
                df["date"] = pd.to_datetime(hist["Date"]).dt.tz_localize(None)
                df["usd_inr"] = pd.to_numeric(hist["Close"], errors="coerce")
                df = df.dropna(subset=["usd_inr"]).sort_values("date").reset_index(drop=True)
                logger.info("Fetched %d records from yfinance for range %s to %s", len(df), start_date, end_date)
                return df[["date", "usd_inr"]]
        except Exception as e:
            logger.error("yfinance range fetch failed for USD/INR: %s", e)

        return pd.DataFrame(columns=["date", "usd_inr"])

    @staticmethod
    def translate_to_inr(usd_amount: float, usd_inr_rate: Optional[float] = None) -> float:
        """Convert a USD dollar amount into Indian Rupees (INR).

        Args:
            usd_amount: Monetary amount in USD.
            usd_inr_rate: Optional conversion rate. If None, queries current rate.

        Returns:
            float: Converted amount in INR rounded to 2 decimal places.
        """
        if usd_inr_rate is None or usd_inr_rate <= 0:
            usd_inr_rate = ForexIngestion.fetch_current_usd_inr()

        return round(float(usd_amount) * float(usd_inr_rate), 2)


# Module-level convenience functions
fetch_current_usd_inr = ForexIngestion.fetch_current_usd_inr
fetch_historical_usd_inr = ForexIngestion.fetch_historical_usd_inr
fetch_historical_range = ForexIngestion.fetch_historical_range
translate_to_inr = ForexIngestion.translate_to_inr
