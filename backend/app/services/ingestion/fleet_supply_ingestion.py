"""Global dry bulk fleet supply and orderbook ingestion service.

Tracks the four major dry bulk carrier classes (Capesize, Panamax, Supramax, Handysize):
- Existing active sailing fleet capacity (vessel count and total DWT)
- Shipyard forward orderbook pipeline
- Newbuilding delivery schedules and vessel demolition/scrapping rates
- Calculates net fleet capacity growth and forward supply pressure indicators.
"""

import logging
from pathlib import Path
from typing import Any, Dict, Optional

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# Default location for persistent fleet supply data
DEFAULT_FLEET_CSV_PATH = (
    Path(__file__).resolve().parent.parent.parent / "data" / "fleet_supply.csv"
)

VESSEL_CLASSES = ["Capesize", "Panamax", "Supramax", "Handysize"]


class FleetSupplyIngestion:
    """Fleet capacity tracking and orderbook supply pressure analytics."""

    @staticmethod
    def generate_sample_fleet_csv(output_path: Optional[Path | str] = None) -> str:
        """Generate realistic monthly dry bulk fleet supply dataset from 2020 to 2026.

        Simulates historical fleet expansion, shipyard delivery waves, and recycling rates
        modeled after real-world Clarkson / BIMCO maritime industry dynamics.

        Args:
            output_path: Target CSV file path. Defaults to app/data/fleet_supply.csv.

        Returns:
            str: Path to the generated CSV file.
        """
        dest = Path(output_path) if output_path else DEFAULT_FLEET_CSV_PATH
        dest.parent.mkdir(parents=True, exist_ok=True)

        dates = pd.date_range(start="2020-01-01", end="2026-09-01", freq="MS")
        rows = []

        # Baseline parameters per vessel class in Jan 2020
        specs = {
            "Capesize": {
                "base_count": 1820,
                "avg_dwt": 180000,
                "orderbook_ratio": 0.095,  # 9.5%
                "annual_growth": 0.022,
            },
            "Panamax": {
                "base_count": 2850,
                "avg_dwt": 76000,
                "orderbook_ratio": 0.108,  # 10.8%
                "annual_growth": 0.026,
            },
            "Supramax": {
                "base_count": 3520,
                "avg_dwt": 58000,
                "orderbook_ratio": 0.115,  # 11.5%
                "annual_growth": 0.028,
            },
            "Handysize": {
                "base_count": 3720,
                "avg_dwt": 32000,
                "orderbook_ratio": 0.072,  # 7.2% (historically tight orderbook)
                "annual_growth": 0.012,
            },
        }

        rng = np.random.default_rng(seed=42)

        for i, dt in enumerate(dates):
            year_fraction = i / 12.0
            date_str = dt.strftime("%Y-%m-%d")

            for vtype in VESSEL_CLASSES:
                cfg = specs[vtype]
                growth_factor = 1.0 + (cfg["annual_growth"] * year_fraction)

                # Active fleet count and DWT with slight seasonal noise
                count_noise = rng.integers(-2, 3)
                fleet_count = int(cfg["base_count"] * growth_factor) + count_noise
                active_dwt = round(fleet_count * cfg["avg_dwt"] * 1e-6, 3) * 1e6

                # Orderbook dynamic modulation (surged in 2021-2022, normalized in 2024-2026)
                cycle_wave = np.sin(i / 10.0) * 0.015
                ob_ratio = max(0.05, cfg["orderbook_ratio"] + cycle_wave)
                orderbook_dwt = round(active_dwt * ob_ratio, 0)
                orderbook_count = int(orderbook_dwt / cfg["avg_dwt"])

                # Monthly deliveries and demolition scrapping
                monthly_deliv_vessels = max(1, int(rng.normal(loc=fleet_count * 0.0025, scale=1.5)))
                monthly_scrap_vessels = max(0, int(rng.normal(loc=fleet_count * 0.0008, scale=1.0)))

                deliveries_dwt = monthly_deliv_vessels * cfg["avg_dwt"]
                scrapping_dwt = monthly_scrap_vessels * cfg["avg_dwt"]
                net_growth_dwt = deliveries_dwt - scrapping_dwt

                rows.append({
                    "date": date_str,
                    "vessel_type": vtype,
                    "fleet_count": fleet_count,
                    "active_fleet_dwt": int(active_dwt),
                    "orderbook_count": orderbook_count,
                    "orderbook_dwt": int(orderbook_dwt),
                    "deliveries_dwt": int(deliveries_dwt),
                    "scrapping_dwt": int(scrapping_dwt),
                    "net_growth_dwt": int(net_growth_dwt),
                })

        df = pd.DataFrame(rows)
        df.to_csv(dest, index=False)
        logger.info("Generated sample fleet supply CSV at %s (%d records)", dest, len(df))
        return str(dest)

    @classmethod
    def load_fleet_supply_data(cls, csv_path: Optional[Path | str] = None) -> pd.DataFrame:
        """Load fleet supply dataset from disk, generating sample baseline if missing.

        Args:
            csv_path: Optional explicit file path to fleet_supply.csv.

        Returns:
            pd.DataFrame: Cleaned fleet supply time series DataFrame.
        """
        path = Path(csv_path) if csv_path else DEFAULT_FLEET_CSV_PATH

        if not path.exists():
            logger.info("Fleet supply file %s not found. Auto-generating sample dataset...", path)
            cls.generate_sample_fleet_csv(path)

        try:
            df = pd.read_csv(path)
            df["date"] = pd.to_datetime(df["date"])
            df = df.sort_values(["vessel_type", "date"]).reset_index(drop=True)
            logger.info("Loaded %d fleet supply rows from %s", len(df), path)
            return df
        except Exception as e:
            logger.error("Failed to load fleet supply CSV from %s: %s", path, e)
            return pd.DataFrame()

    @classmethod
    def compute_supply_pressure(cls, fleet_data: Optional[pd.DataFrame] = None) -> Dict[str, Dict[str, Any]]:
        """Compute supply pressure metrics and qualitative assessment per vessel segment.

        Evaluates:
        - Orderbook to Fleet Ratio: Orderbook DWT / Active Fleet DWT
        - Net Fleet Expansion Rate: (Annualized Deliveries - Scrapping) / Active Fleet DWT * 100
        - Supply Pressure Label:
          * HIGH_SUPPLY_INCOMING: Orderbook ratio > 12% or Net Growth > 3.5% (Bearish freight rates)
          * TIGHT_SUPPLY: Orderbook ratio < 7% or Net Growth < 1.0% (Bullish freight rates)
          * BALANCED: 7% <= Orderbook ratio <= 12% and 1.0% <= Net Growth <= 3.5%

        Args:
            fleet_data: Optional DataFrame. If None, loads from CSV.

        Returns:
            dict: Mapping of vessel class to supply pressure metrics and commentary.
        """
        if fleet_data is None or fleet_data.empty:
            fleet_data = cls.load_fleet_supply_data()

        if fleet_data.empty:
            logger.warning("Empty fleet dataset provided for supply pressure analysis.")
            return {}

        results: Dict[str, Dict[str, Any]] = {}

        for vtype in VESSEL_CLASSES:
            type_df = fleet_data[fleet_data["vessel_type"] == vtype]
            if type_df.empty:
                continue

            type_sorted = type_df.sort_values("date", ascending=False).reset_index(drop=True)
            latest = type_sorted.iloc[0]

            active_dwt = float(latest["active_fleet_dwt"])
            orderbook_dwt = float(latest["orderbook_dwt"])
            fleet_count = int(latest["fleet_count"])
            orderbook_count = int(latest.get("orderbook_count", 0))

            # Orderbook ratio
            ob_ratio = (orderbook_dwt / active_dwt) if active_dwt > 0 else 0.0

            # Annualized net capacity growth over the trailing 12 months (or available period)
            trailing_window = type_sorted.head(12)
            trailing_net_dwt = float(trailing_window["net_growth_dwt"].sum())
            net_growth_pct = (trailing_net_dwt / active_dwt * 100.0) if active_dwt > 0 else 0.0

            # Determine Supply Pressure Label
            if ob_ratio > 0.12 or net_growth_pct > 3.5:
                pressure_label = "HIGH_SUPPLY_INCOMING"
                commentary = (
                    f"Elevated shipyard orderbook ({ob_ratio:.1%}) and expanding tonnage ({net_growth_pct:.1f}% net) "
                    "threaten forward rate deflation as newbuilding deliveries enter service."
                )
            elif ob_ratio < 0.07 or net_growth_pct < 1.0:
                pressure_label = "TIGHT_SUPPLY"
                commentary = (
                    f"Subdued forward orderbook ({ob_ratio:.1%}) and constrained net additions ({net_growth_pct:.1f}%) "
                    "create a tight tonnage supply favorable to vessel owners and higher charter rates."
                )
            else:
                pressure_label = "BALANCED"
                commentary = (
                    f"Orderbook ratio ({ob_ratio:.1%}) and trailing fleet expansion ({net_growth_pct:.1f}%) "
                    "indicate orderly fleet replacement with balanced supply/demand fundamentals."
                )

            results[vtype] = {
                "vessel_type": vtype,
                "latest_date": latest["date"].strftime("%Y-%m-%d"),
                "fleet_count": fleet_count,
                "orderbook_count": orderbook_count,
                "active_fleet_dwt": active_dwt,
                "orderbook_dwt": orderbook_dwt,
                "orderbook_ratio": round(ob_ratio, 4),
                "orderbook_ratio_pct": round(ob_ratio * 100.0, 2),
                "net_growth_pct": round(net_growth_pct, 2),
                "supply_pressure": pressure_label,
                "commentary": commentary,
            }

            logger.info("Supply pressure for %s: %s (OB=%.1f%%, Net=%.1f%%)", vtype, pressure_label, ob_ratio * 100.0, net_growth_pct)

        return results


# Module-level convenience functions
load_fleet_supply_data = FleetSupplyIngestion.load_fleet_supply_data
compute_supply_pressure = FleetSupplyIngestion.compute_supply_pressure
generate_sample_fleet_csv = FleetSupplyIngestion.generate_sample_fleet_csv
