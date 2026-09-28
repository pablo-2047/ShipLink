"""Bunker fuel price ingestion service.

Integrates:
1. USDA AgTransport Socrata dataset (4v3x-mj86) for historical/current VLSFO, MGO, and IFO380/180.
2. Brent crude oil proxy via yfinance (BZ=F) to calculate VLSFO benchmark estimates (Brent * 1.15).
3. Fuel cost calculations for sea voyage estimation.
"""

import logging
from typing import Any, Dict, Optional

import numpy as np
import pandas as pd
import requests
import yfinance as yf

logger = logging.getLogger(__name__)

# USDA AgTransport Open Data Socrata Endpoint for Bunker Fuel Prices
USDA_BUNKER_API_URL = "https://agtransport.usda.gov/resource/4v3x-mj86.json"


class BunkerFuelIngestion:
    """Bunker fuel market data ingestion and voyage fuel cost computation."""

    @staticmethod
    def fetch_usda_bunker_prices(limit: int = 5000) -> pd.DataFrame:
        """Fetch VLSFO, MGO, and IFO bunker prices from USDA AgTransport Socrata endpoint.

        Args:
            limit: Maximum number of records to retrieve (default 5000).

        Returns:
            pd.DataFrame: Cleaned DataFrame with columns:
                ['date', 'vlsfo_usd_mt', 'mgo_usd_mt', 'ifo380_usd_mt',
                 'ifo180_usd_mt', 'ifo_composite_usd_mt']
                sorted chronologically. Empty DataFrame on failure.
        """
        params = {
            "$order": "day DESC",
            "$limit": limit,
        }
        try:
            resp = requests.get(USDA_BUNKER_API_URL, params=params, timeout=30)
            resp.raise_for_status()
            data = resp.json()

            if not data or not isinstance(data, list):
                logger.warning("USDA Bunker Fuel API returned empty or invalid data.")
                return pd.DataFrame()

            df = pd.DataFrame(data)

            # Map Socrata column schema to standard internal names
            rename_map = {
                "day": "date",
                "vlsfo_fuel_oil_imo_2020_grade_0_5": "vlsfo_usd_mt",
                "marine_gas_oil": "mgo_usd_mt",
                "intermdiate_fuel_oil_380cst": "ifo380_usd_mt",
                "intermdiate_fuel_oil_180cst": "ifo180_usd_mt",
            }
            df = df.rename(columns={k: v for k, v in rename_map.items() if k in df.columns})

            if "date" in df.columns:
                df["date"] = pd.to_datetime(df["date"]).dt.tz_localize(None)

            # Parse numeric fuel price fields
            price_cols = ["vlsfo_usd_mt", "mgo_usd_mt", "ifo380_usd_mt", "ifo180_usd_mt"]
            for col in price_cols:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors="coerce")
                else:
                    df[col] = np.nan

            # Compute IFO composite price (average of available 380 and 180 cSt grades)
            ifo_candidates = [c for c in ["ifo380_usd_mt", "ifo180_usd_mt"] if c in df.columns]
            if ifo_candidates:
                df["ifo_composite_usd_mt"] = df[ifo_candidates].mean(axis=1)
            else:
                df["ifo_composite_usd_mt"] = np.nan

            df = df.sort_values("date").reset_index(drop=True)

            keep_cols = ["date", "vlsfo_usd_mt", "mgo_usd_mt", "ifo380_usd_mt", "ifo180_usd_mt", "ifo_composite_usd_mt"]
            result_df = df[[c for c in keep_cols if c in df.columns]]
            logger.info("Successfully fetched %d bunker fuel records from USDA", len(result_df))
            return result_df

        except Exception as e:
            logger.error("USDA bunker fuel fetch failed: %s", e)
            return pd.DataFrame()

    @staticmethod
    def fetch_brent_crude_proxy(period: str = "5y") -> pd.DataFrame:
        """Fetch Brent crude futures (BZ=F) to calculate VLSFO benchmark estimate.

        Empirical shipping rule of thumb: VLSFO ($/mt) ≈ Brent Crude ($/bbl) * 1.15 * ~7.33 (or index ratio ~1.15 to bunker index).
        Here benchmark VLSFO proxy = Brent crude close * 1.15 (representing refinery crack spread / fuel oil parity).

        Args:
            period: Lookback duration supported by yfinance (e.g., '1y', '2y', '5y').

        Returns:
            pd.DataFrame: DataFrame with columns ['date', 'brent_usd', 'vlsfo_estimate_usd', 'volume'].
        """
        try:
            ticker = yf.Ticker("BZ=F")
            hist = ticker.history(period=period, interval="1d").reset_index()

            if hist.empty or "Close" not in hist.columns:
                logger.warning("yfinance Brent crude (BZ=F) returned empty data.")
                return pd.DataFrame()

            hist = hist.rename(columns={"Date": "date", "Close": "brent_usd", "Volume": "volume"})
            hist["date"] = pd.to_datetime(hist["date"]).dt.tz_localize(None)
            hist["brent_usd"] = pd.to_numeric(hist["brent_usd"], errors="coerce")
            hist["vlsfo_estimate_usd"] = (hist["brent_usd"] * 1.15).round(2)

            cols = [c for c in ["date", "brent_usd", "vlsfo_estimate_usd", "volume"] if c in hist.columns]
            result_df = hist[cols].dropna(subset=["brent_usd"]).sort_values("date").reset_index(drop=True)
            logger.info("Fetched %d Brent crude proxy records from yfinance", len(result_df))
            return result_df

        except Exception as e:
            logger.error("Brent crude proxy fetch failed: %s", e)
            return pd.DataFrame()

    @staticmethod
    def compute_voyage_fuel_cost(
        distance_nm: float,
        speed_knots: float,
        consumption_mt_day: float,
        vlsfo_price_mt: float,
    ) -> Dict[str, float]:
        """Compute estimated voyage fuel consumption and dollar costs.

        Args:
            distance_nm: Voyage distance in nautical miles.
            speed_knots: Vessel average service speed in knots (nm/hour).
            consumption_mt_day: Daily fuel consumption rate in metric tons per day.
            vlsfo_price_mt: Cost of Very Low Sulfur Fuel Oil in USD per metric ton.

        Returns:
            dict: {
                'voyage_days': float,
                'fuel_consumed_mt': float,
                'total_fuel_cost_usd': float,
                'fuel_cost_per_nm': float
            }
        """
        if speed_knots <= 0:
            logger.warning("speed_knots must be positive. Received %s, defaulting to 12.0 knots.", speed_knots)
            speed_knots = 12.0

        if distance_nm < 0:
            distance_nm = 0.0

        voyage_hours = distance_nm / speed_knots
        voyage_days = round(voyage_hours / 24.0, 2)
        fuel_consumed_mt = round(voyage_days * max(0.0, consumption_mt_day), 2)
        total_fuel_cost_usd = round(fuel_consumed_mt * max(0.0, vlsfo_price_mt), 2)
        fuel_cost_per_nm = round(total_fuel_cost_usd / distance_nm, 2) if distance_nm > 0 else 0.0

        return {
            "voyage_days": voyage_days,
            "fuel_consumed_mt": fuel_consumed_mt,
            "total_fuel_cost_usd": total_fuel_cost_usd,
            "fuel_cost_per_nm": fuel_cost_per_nm,
        }


# Module-level convenience functions
fetch_usda_bunker_prices = BunkerFuelIngestion.fetch_usda_bunker_prices
fetch_brent_crude_proxy = BunkerFuelIngestion.fetch_brent_crude_proxy
compute_voyage_fuel_cost = BunkerFuelIngestion.compute_voyage_fuel_cost
