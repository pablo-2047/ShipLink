"""Tropical Cyclone Ingestion Service.

Tracks active tropical cyclones and marine storm depressions via the Global Disaster
Alert and Coordination System (GDACS) API, specifically monitoring the Bay of Bengal
basin (Lat 5-25°N, Lon 80-95°E) and identifying ports within the threat cone.
"""

import logging
import math
from typing import Any, Dict, List, Optional, Tuple

import requests

logger = logging.getLogger(__name__)

GDACS_TC_API_URL = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventtypes=TC"

# Indian East Coast Port coordinates for cyclone proximity analysis
MONITORED_PORTS: Dict[str, Tuple[float, float]] = {
    "Paradip Port": (20.26, 86.67),
    "Visakhapatnam (Vizag) Port": (17.68, 83.29),
    "Gangavaram Port": (17.61, 83.24),
    "Gopalpur Port": (19.30, 84.97),
    "Dhamra Port": (20.80, 86.97),
    "Haldia Dock Complex": (22.02, 88.06),
    "Sandheads Anchorage": (21.00, 88.20),
    "Kolkata Port": (22.57, 88.36),
    "Chennai Port": (13.08, 80.30),
    "Ennore (Kamarajar) Port": (13.26, 80.33),
}

# Bay of Bengal / Andaman Sea Bounding Box
BOB_BOUNDS = {
    "min_lat": 5.0,
    "max_lat": 25.0,
    "min_lon": 80.0,
    "max_lon": 95.0,
}


class CycloneIngestion:
    """Monitors tropical storms in the Bay of Bengal and evaluates port exposure."""

    @staticmethod
    def _calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate great-circle distance between two points in kilometers using Haversine formula.

        Args:
            lat1, lon1: First coordinate in decimal degrees.
            lat2, lon2: Second coordinate in decimal degrees.

        Returns:
            float: Distance in kilometers.
        """
        r = 6371.0  # Earth's mean radius in km
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = (
            math.sin(delta_phi / 2.0) ** 2
            + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return round(r * c, 1)

    @classmethod
    def _identify_affected_ports(
        cls, lat: float, lon: float, radius_deg: float = 3.0
    ) -> List[Dict[str, Any]]:
        """Identify Indian ports located within the storm impact radius.

        Args:
            lat: Storm center latitude.
            lon: Storm center longitude.
            radius_deg: Threat radius in degrees (3.0 deg ≈ ~333 km).

        Returns:
            list[dict]: List of affected ports with name, distance_km, and threat level.
        """
        affected = []
        for port_name, (p_lat, p_lon) in MONITORED_PORTS.items():
            deg_distance = math.sqrt((lat - p_lat) ** 2 + (lon - p_lon) ** 2)
            if deg_distance <= radius_deg:
                dist_km = cls._calculate_distance_km(lat, lon, p_lat, p_lon)
                threat = "DIRECT_HIT" if dist_km < 120.0 else "PERIPHERAL_SWELL"
                affected.append({
                    "port_name": port_name,
                    "distance_km": dist_km,
                    "threat": threat,
                })

        affected.sort(key=lambda x: x["distance_km"])
        return affected

    @classmethod
    def get_active_bay_of_bengal_cyclones(cls) -> List[Dict[str, Any]]:
        """Query GDACS for active tropical cyclone events in the Bay of Bengal basin.

        Filters events within:
        - Lat: 5.0°N to 25.0°N
        - Lon: 80.0°E to 95.0°E

        Returns:
            list[dict]: Structured list of active cyclones with:
                [
                    {
                        'id': int | str,
                        'name': str,
                        'alert_level': str ('Green', 'Orange', 'Red'),
                        'alert_score': float,
                        'severity': float,
                        'severity_text': str,
                        'coords': {'lat': float, 'lon': float},
                        'affected_ports': list[dict],
                        'affected_port_names': list[str],
                        'from_date': str,
                        'to_date': str,
                        'report_url': str,
                        'is_current': bool
                    },
                    ...
                ]
        """
        cyclones: List[Dict[str, Any]] = []

        try:
            logger.info("Fetching tropical cyclone alerts from GDACS: %s", GDACS_TC_API_URL)
            resp = requests.get(GDACS_TC_API_URL, timeout=25)
            resp.raise_for_status()
            data = resp.json()

            features = data.get("features", [])
            if not features:
                logger.info("No tropical cyclones returned by GDACS API.")
                return []

            for feat in features:
                props = feat.get("properties", {})
                geom = feat.get("geometry", {})

                # Validate Tropical Cyclone event type
                if props.get("eventtype") != "TC":
                    continue

                # Coordinates in GeoJSON are [longitude, latitude]
                coords = geom.get("coordinates", [])
                if not coords or len(coords) < 2:
                    continue

                lon = float(coords[0])
                lat = float(coords[1])

                # Filter within Bay of Bengal bounding box
                in_bob = (
                    BOB_BOUNDS["min_lat"] <= lat <= BOB_BOUNDS["max_lat"]
                    and BOB_BOUNDS["min_lon"] <= lon <= BOB_BOUNDS["max_lon"]
                )

                # Also accept storms where affected countries include India
                affected_countries = props.get("affectedcountries", [])
                affects_india = any(
                    c.get("iso3") == "IND" or "India" in c.get("countryname", "")
                    for c in affected_countries
                )

                if not (in_bob or affects_india):
                    continue

                # Identify affected Indian ports within 3.0 degrees (~330 km)
                affected_ports = cls._identify_affected_ports(lat, lon, radius_deg=3.0)
                affected_port_names = [p["port_name"] for p in affected_ports]

                sev_data = props.get("severitydata", {})
                sev_score = sev_data.get("severity")
                sev_text = sev_data.get("severitytext", "Tropical Cyclone Advisory")
                alert_level = props.get("alertlevel", "Green")
                name = props.get("name") or props.get("eventname") or f"Cyclone-{props.get('eventid')}"

                url_info = props.get("url", {})
                report_url = (
                    url_info.get("report")
                    if isinstance(url_info, dict)
                    else f"https://www.gdacs.org/report.aspx?eventid={props.get('eventid')}&eventtype=TC"
                )

                cyclone_record = {
                    "id": props.get("eventid"),
                    "name": name,
                    "alert_level": alert_level,
                    "alert_score": float(props.get("alertscore", 0.0)),
                    "severity": float(sev_score) if sev_score is not None else 0.0,
                    "severity_text": sev_text,
                    "coords": {"lat": lat, "lon": lon},
                    "affected_ports": affected_ports,
                    "affected_port_names": affected_port_names,
                    "from_date": props.get("fromdate"),
                    "to_date": props.get("todate"),
                    "report_url": report_url,
                    "is_current": props.get("iscurrent") == "true",
                }

                cyclones.append(cyclone_record)
                logger.warning(
                    "Active Bay of Bengal Cyclone detected: %s (Alert: %s, Lat: %.2f, Lon: %.2f, Affected Ports: %s)",
                    name,
                    alert_level,
                    lat,
                    lon,
                    affected_port_names or "None in immediate range",
                )

            logger.info("Found %d active Bay of Bengal cyclones", len(cyclones))
            return cyclones

        except Exception as e:
            logger.error("GDACS cyclone ingestion failed: %s", e)
            return []


# Module-level convenience functions
get_active_bay_of_bengal_cyclones = CycloneIngestion.get_active_bay_of_bengal_cyclones
