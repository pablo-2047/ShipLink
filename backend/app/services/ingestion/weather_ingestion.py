"""Marine weather ingestion service for Indian East Coast ports.

Fetches oceanographic conditions (wave height, wave direction, swell, wave period)
from Open-Meteo Marine API and calculates maritime severity and operational impacts.
"""

import logging
from typing import Any, Dict, Optional

import requests

logger = logging.getLogger(__name__)

OPEN_METEO_MARINE_URL = "https://marine-api.open-meteo.com/v1/marine"

# Coordinates (lat, lon) for all 6 core Indian East Coast ports
PORT_COORDS: Dict[str, Dict[str, Any]] = {
    "paradip": {
        "name": "Paradip Port",
        "lat": 20.26,
        "lon": 86.67,
    },
    "vizag": {
        "name": "Visakhapatnam (Vizag) Port",
        "lat": 17.68,
        "lon": 83.29,
    },
    "gangavaram": {
        "name": "Gangavaram Port",
        "lat": 17.61,
        "lon": 83.24,
    },
    "gopalpur": {
        "name": "Gopalpur Port",
        "lat": 19.30,
        "lon": 84.97,
    },
    "dhamra": {
        "name": "Dhamra Port",
        "lat": 20.80,
        "lon": 86.97,
    },
    "haldia": {
        "name": "Haldia Dock Complex",
        "lat": 22.02,
        "lon": 88.06,
    },
}

# Severity classification thresholds based on wave height (meters)
SEVERITY_THRESHOLDS = {
    "CALM": 1.5,        # < 1.5m
    "MODERATE": 3.0,    # 1.5m - 3.0m
    "ROUGH": 5.0,       # 3.0m - 5.0m
    # >= 5.0m: VERY_ROUGH
}

OPERATIONAL_IMPACTS = {
    "CALM": "Normal port and lighterage operations. Safe for pilot boarding.",
    "MODERATE": "Pilotage advisory in effect; minor berthing delays possible. Small craft caution.",
    "ROUGH": "Cargo and lighterage operations suspended. High swell warnings; berthing halted.",
    "VERY_ROUGH": "Port closure; severe cyclone or storm swell conditions. Vessels ordered to sea.",
}


class WeatherIngestion:
    """Marine weather fetcher and operational impact classifier."""

    @staticmethod
    def classify_severity(wave_height_m: Optional[float]) -> tuple[str, str]:
        """Classify marine weather severity and determine port operational impact.

        Args:
            wave_height_m: Significant wave height in meters.

        Returns:
            tuple[str, str]: (severity_code, operational_impact_description)
        """
        if wave_height_m is None:
            return "MODERATE", "Weather observation data currently unavailable; standard harbor vigilance."

        if wave_height_m < SEVERITY_THRESHOLDS["CALM"]:
            severity = "CALM"
        elif wave_height_m < SEVERITY_THRESHOLDS["MODERATE"]:
            severity = "MODERATE"
        elif wave_height_m < SEVERITY_THRESHOLDS["ROUGH"]:
            severity = "ROUGH"
        else:
            severity = "VERY_ROUGH"

        return severity, OPERATIONAL_IMPACTS[severity]

    @staticmethod
    def fetch_port_marine_weather(lat: float, lon: float) -> Dict[str, Any]:
        """Fetch current conditions and 7-day hourly marine forecast for a coordinate.

        Args:
            lat: Port latitude in decimal degrees.
            lon: Port longitude in decimal degrees.

        Returns:
            dict: Open-Meteo response dictionary containing 'current' and 'hourly' forecasts.
        """
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "wave_height,wave_direction,wave_period,wind_wave_height,swell_wave_height",
            "hourly": "wave_height,wave_direction,wave_period,wind_wave_height,swell_wave_height",
            "timezone": "auto",
        }
        try:
            resp = requests.get(OPEN_METEO_MARINE_URL, params=params, timeout=20)
            resp.raise_for_status()
            data = resp.json()
            return data
        except Exception as e:
            logger.error("Open-Meteo Marine API request failed for (%.2f, %.2f): %s", lat, lon, e)
            return {}

    @classmethod
    def fetch_all_ports_weather(cls) -> Dict[str, Dict[str, Any]]:
        """Fetch marine weather across all 6 core East Coast ports with error isolation.

        Returns:
            dict: Mapping of port_id to weather profile and operational assessment:
                {
                    'port_name': str,
                    'lat': float,
                    'lon': float,
                    'wave_height_m': float | None,
                    'wave_period_s': float | None,
                    'wave_direction_deg': float | None,
                    'swell_wave_height_m': float | None,
                    'severity': 'CALM' | 'MODERATE' | 'ROUGH' | 'VERY_ROUGH',
                    'operational_impact': str,
                    'hourly_forecast': dict,
                    'timestamp': str | None
                }
        """
        results: Dict[str, Dict[str, Any]] = {}

        for port_id, info in PORT_COORDS.items():
            lat = info["lat"]
            lon = info["lon"]
            port_name = info["name"]

            try:
                raw_data = cls.fetch_port_marine_weather(lat, lon)
                current = raw_data.get("current", {})
                hourly = raw_data.get("hourly", {})

                wave_height = current.get("wave_height")
                wave_period = current.get("wave_period")
                wave_direction = current.get("wave_direction")
                swell_height = current.get("swell_wave_height")
                timestamp = current.get("time")

                severity, impact = cls.classify_severity(wave_height)

                results[port_id] = {
                    "port_name": port_name,
                    "lat": lat,
                    "lon": lon,
                    "wave_height_m": wave_height,
                    "wave_period_s": wave_period,
                    "wave_direction_deg": wave_direction,
                    "swell_wave_height_m": swell_height,
                    "severity": severity,
                    "operational_impact": impact,
                    "hourly_forecast": {
                        "time": hourly.get("time", []),
                        "wave_height": hourly.get("wave_height", []),
                        "wave_period": hourly.get("wave_period", []),
                    },
                    "timestamp": timestamp,
                }
                logger.info(
                    "Port %s (%s): wave=%.2fm, severity=%s",
                    port_id,
                    port_name,
                    wave_height or 0.0,
                    severity,
                )

            except Exception as e:
                logger.error("Failed to process marine weather for %s: %s", port_id, e)
                # Resilient fallback so single failure doesn't compromise system
                results[port_id] = {
                    "port_name": port_name,
                    "lat": lat,
                    "lon": lon,
                    "wave_height_m": None,
                    "wave_period_s": None,
                    "wave_direction_deg": None,
                    "swell_wave_height_m": None,
                    "severity": "MODERATE",
                    "operational_impact": "Marine weather telemetry temporarily unreachable.",
                    "hourly_forecast": {},
                    "timestamp": None,
                }

        return results


# Module-level convenience functions
fetch_port_marine_weather = WeatherIngestion.fetch_port_marine_weather
fetch_all_ports_weather = WeatherIngestion.fetch_all_ports_weather
