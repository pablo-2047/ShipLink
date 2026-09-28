"""Global maritime chokepoint transit ingestion service.

Queries the IMF PortWatch ArcGIS REST API (Daily_Chokepoints_Data) to monitor
daily ship transits through key strategic maritime corridors:
Suez Canal, Bab el-Mandeb, Panama Canal, Strait of Malacca, Cape of Good Hope, and Strait of Hormuz.
Detects traffic drop disruptions and diversions affecting global dry bulk and tanker flows.
"""

import logging
from typing import Any, Dict, List, Optional

import pandas as pd
import requests

logger = logging.getLogger(__name__)

PORTWATCH_ARCGIS_URL = (
    "https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services/"
    "Daily_Chokepoints_Data/FeatureServer/0/query"
)

CHOKEPOINTS: List[str] = [
    "Suez Canal",
    "Bab el-Mandeb",
    "Panama Canal",
    "Strait of Malacca",
    "Cape of Good Hope",
    "Strait of Hormuz",
]

# Mapping from canonical name to PortWatch ArcGIS database portname
CHOKEPOINT_ALIASES: Dict[str, str] = {
    "Suez Canal": "Suez Canal",
    "Bab el-Mandeb": "Bab el-Mandeb Strait",
    "Bab el-Mandeb Strait": "Bab el-Mandeb Strait",
    "Panama Canal": "Panama Canal",
    "Strait of Malacca": "Malacca Strait",
    "Malacca Strait": "Malacca Strait",
    "Cape of Good Hope": "Cape of Good Hope",
    "Strait of Hormuz": "Strait of Hormuz",
}


class ChokepointIngestion:
    """IMF PortWatch transit data ingestion and anomaly detection."""

    @staticmethod
    def fetch_transit_data(chokepoint: str, limit: int = 500) -> pd.DataFrame:
        """Fetch historical daily transit volume for a specific chokepoint from IMF PortWatch.

        Handles both string date stamps and epoch milliseconds timestamps.

        Args:
            chokepoint: Name of chokepoint (e.g. 'Suez Canal', 'Bab el-Mandeb').
            limit: Maximum records to retrieve (default 500).

        Returns:
            pd.DataFrame: Columns ['date', 'chokepoint', 'total_transits',
                          'dry_bulk_transits', 'tanker_transits',
                          'container_transits', 'total_capacity_dwt'],
                          sorted chronologically.
        """
        db_name = CHOKEPOINT_ALIASES.get(chokepoint, chokepoint)
        # Construct query using SQL LIKE to ensure resilient matching across name variations
        clean_search = db_name.replace(" Strait", "").replace(" Canal", "").strip()
        where_clause = f"portname LIKE '%{clean_search}%'"

        params = {
            "where": where_clause,
            "outFields": "*",
            "orderByFields": "date desc",
            "resultRecordCount": limit,
            "f": "json",
        }

        try:
            logger.info("Fetching transit data for %s (query: %s)", chokepoint, where_clause)
            resp = requests.get(PORTWATCH_ARCGIS_URL, params=params, timeout=5)
            resp.raise_for_status()
            data = resp.json()

            features = data.get("features", [])
            if not features:
                logger.warning("No PortWatch records found for chokepoint %s", chokepoint)
                return pd.DataFrame(columns=[
                    "date", "chokepoint", "total_transits",
                    "dry_bulk_transits", "tanker_transits",
                    "container_transits", "total_capacity_dwt",
                ])

            rows = []
            for feat in features:
                attrs = feat.get("attributes", {})
                raw_date = attrs.get("date")

                # Parse date: either epoch ms (integer) or ISO string ('YYYY-MM-DD')
                if isinstance(raw_date, (int, float)):
                    parsed_date = pd.to_datetime(raw_date, unit="ms").normalize()
                else:
                    parsed_date = pd.to_datetime(raw_date).normalize()

                rows.append({
                    "date": parsed_date,
                    "chokepoint": chokepoint,
                    "total_transits": int(attrs.get("n_total") or 0),
                    "dry_bulk_transits": int(attrs.get("n_dry_bulk") or 0),
                    "tanker_transits": int(attrs.get("n_tanker") or 0),
                    "container_transits": int(attrs.get("n_container") or 0),
                    "total_capacity_dwt": float(attrs.get("capacity") or 0.0),
                })

            df = pd.DataFrame(rows).sort_values("date").reset_index(drop=True)
            logger.info("Fetched %d transit records for %s from IMF PortWatch", len(df), chokepoint)
            return df

        except Exception as e:
            logger.error("Failed to fetch PortWatch data for %s: %s", chokepoint, e)
            return pd.DataFrame(columns=[
                "date", "chokepoint", "total_transits",
                "dry_bulk_transits", "tanker_transits",
                "container_transits", "total_capacity_dwt",
            ])

    @classmethod
    def fetch_all_chokepoints(cls, limit: int = 60) -> Dict[str, pd.DataFrame]:
        """Fetch recent transit series for all 6 major strategic chokepoints.

        Args:
            limit: Number of recent daily observations to fetch per chokepoint.

        Returns:
            dict[str, pd.DataFrame]: Dictionary mapping chokepoint name to its transit DataFrame.
        """
        results: Dict[str, pd.DataFrame] = {}
        for cp in CHOKEPOINTS:
            try:
                df = cls.fetch_transit_data(cp, limit=limit)
                results[cp] = df
            except Exception as e:
                logger.error("Error retrieving %s: %s", cp, e)
                results[cp] = pd.DataFrame()
        return results

    @classmethod
    def detect_disruptions(cls) -> Dict[str, Dict[str, Any]]:
        """Detect chokepoint traffic disruptions by comparing 7-day average to 30-day baseline.

        Classification criteria:
        - > 40% drop: CRITICAL (e.g. Red Sea Houthi conflict crisis)
        - > 20% drop: WARNING (severe congestion, low water, or labor action)
        - Otherwise: NORMAL

        Returns:
            dict: Mapping of chokepoint to disruption analysis:
                {
                    'status': 'NORMAL' | 'WARNING' | 'CRITICAL',
                    'drop_pct': float,
                    'avg_7d': float,
                    'avg_30d': float,
                    'latest_date': str | None,
                    'latest_transits': int,
                    'dry_bulk_avg_7d': float
                }
        """
        analysis: Dict[str, Dict[str, Any]] = {}

        for cp in CHOKEPOINTS:
            try:
                df = cls.fetch_transit_data(cp, limit=45)
                if df.empty or len(df) < 7:
                    analysis[cp] = {
                        "status": "NORMAL",
                        "drop_pct": 0.0,
                        "avg_7d": 0.0,
                        "avg_30d": 0.0,
                        "latest_date": None,
                        "latest_transits": 0,
                        "dry_bulk_avg_7d": 0.0,
                    }
                    continue

                # Sort descending to compute recent windows
                df_desc = df.sort_values("date", ascending=False).reset_index(drop=True)

                recent_7 = df_desc.head(7)
                recent_30 = df_desc.head(30)

                avg_7d = float(recent_7["total_transits"].mean())
                avg_30d = float(recent_30["total_transits"].mean())
                dry_bulk_7d = float(recent_7["dry_bulk_transits"].mean())

                latest_row = df_desc.iloc[0]
                latest_date = latest_row["date"].strftime("%Y-%m-%d")
                latest_transits = int(latest_row["total_transits"])

                if avg_30d > 0:
                    drop_pct = round(((avg_30d - avg_7d) / avg_30d) * 100.0, 1)
                else:
                    drop_pct = 0.0

                if drop_pct >= 40.0:
                    status = "CRITICAL"
                elif drop_pct >= 20.0:
                    status = "WARNING"
                else:
                    status = "NORMAL"

                analysis[cp] = {
                    "status": status,
                    "drop_pct": drop_pct,
                    "avg_7d": round(avg_7d, 1),
                    "avg_30d": round(avg_30d, 1),
                    "latest_date": latest_date,
                    "latest_transits": latest_transits,
                    "dry_bulk_avg_7d": round(dry_bulk_7d, 1),
                }

                logger.info(
                    "Chokepoint %s: Status=%s (Drop=%.1f%%, 7d=%.1f vs 30d=%.1f)",
                    cp,
                    status,
                    drop_pct,
                    avg_7d,
                    avg_30d,
                )

            except Exception as e:
                logger.error("Failed disruption analysis for %s: %s", cp, e)
                analysis[cp] = {
                    "status": "NORMAL",
                    "drop_pct": 0.0,
                    "avg_7d": 0.0,
                    "avg_30d": 0.0,
                    "latest_date": None,
                    "latest_transits": 0,
                    "dry_bulk_avg_7d": 0.0,
                }

        return analysis


# Module-level convenience functions
fetch_transit_data = ChokepointIngestion.fetch_transit_data
fetch_all_chokepoints = ChokepointIngestion.fetch_all_chokepoints
detect_disruptions = ChokepointIngestion.detect_disruptions
