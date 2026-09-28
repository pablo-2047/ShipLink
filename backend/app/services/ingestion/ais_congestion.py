"""AIS Vessel Traffic & Port Congestion Tracking Service.

Connects to the AISStream.io real-time WebSocket stream to track vessels at anchor
and compute waiting times, congestion levels, and demurrage risks for 7 major Indian East Coast ports.
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import websockets

from app.config import get_settings

logger = logging.getLogger(__name__)

AISSTREAM_WS_URL = "wss://stream.aisstream.io/v0/stream"
DEMURRAGE_RATE_USD_PER_HOUR = 1250.0  # ~$30,000/day standard bulk carrier demurrage

# Accurate geofence bounding boxes (min_lat, min_lon, max_lat, max_lon) for 7 East Coast ports
PORT_GEOFENCES: Dict[str, Dict[str, Any]] = {
    "paradip": {
        "name": "Paradip Port",
        "min_lat": 20.15,
        "max_lat": 20.35,
        "min_lon": 86.60,
        "max_lon": 86.85,
        "center": (20.26, 86.67),
    },
    "vizag": {
        "name": "Visakhapatnam (Vizag) Port",
        "min_lat": 17.63,
        "max_lat": 17.75,
        "min_lon": 83.25,
        "max_lon": 83.42,
        "center": (17.68, 83.29),
    },
    "gangavaram": {
        "name": "Gangavaram Port",
        "min_lat": 17.58,
        "max_lat": 17.65,
        "min_lon": 83.20,
        "max_lon": 83.30,
        "center": (17.61, 83.24),
    },
    "gopalpur": {
        "name": "Gopalpur Port",
        "min_lat": 19.25,
        "max_lat": 19.36,
        "min_lon": 84.92,
        "max_lon": 85.05,
        "center": (19.30, 84.97),
    },
    "dhamra": {
        "name": "Dhamra Port",
        "min_lat": 20.78,
        "max_lat": 20.90,
        "min_lon": 86.92,
        "max_lon": 87.08,
        "center": (20.80, 86.97),
    },
    "haldia": {
        "name": "Haldia Dock Complex",
        "min_lat": 21.98,
        "max_lat": 22.08,
        "min_lon": 88.02,
        "max_lon": 88.15,
        "center": (22.02, 88.06),
    },
    "sandheads": {
        "name": "Sandheads Anchorage (Haldia/Kolkata Deep Water)",
        "min_lat": 20.80,
        "max_lat": 21.20,
        "min_lon": 88.00,
        "max_lon": 88.40,
        "center": (21.00, 88.20),
    },
}


class AISCongestionTracker:
    """Real-time AIS congestion monitor for Indian East Coast bulk terminals."""

    def __init__(self, api_key: Optional[str] = None) -> None:
        """Initialize tracker with API key and per-port vessel tracking stores.

        Args:
            api_key: Optional AISStream API key. Defaults to settings.AISSTREAM_API_KEY.
        """
        settings = get_settings()
        self.api_key: str = api_key or settings.AISSTREAM_API_KEY
        self.is_running: bool = False

        # Nested mapping: port_id -> {mmsi_str: {first_seen, last_seen, sog, cog, ship_name, lat, lon}}
        self.vessels_at_anchor: Dict[str, Dict[str, Dict[str, Any]]] = {
            port: {} for port in PORT_GEOFENCES
        }

    def _build_subscription_message(self) -> Dict[str, Any]:
        """Construct AISStream WebSocket subscription payload with port bounding boxes."""
        bounding_boxes = []
        for fence in PORT_GEOFENCES.values():
            # AISStream expects [[min_lat, min_lon], [max_lat, max_lon]]
            bounding_boxes.append([
                [fence["min_lat"], fence["min_lon"]],
                [fence["max_lat"], fence["max_lon"]],
            ])

        return {
            "Apikey": self.api_key,
            "BoundingBoxes": bounding_boxes,
            "FilterMessageTypes": ["PositionReport", "ShipStaticData"],
        }

    def _match_port(self, lat: float, lon: float) -> Optional[str]:
        """Determine which port geofence contains the given coordinates.

        Args:
            lat: Latitude in decimal degrees.
            lon: Longitude in decimal degrees.

        Returns:
            str | None: port_id if within a geofence, otherwise None.
        """
        for port_id, fence in PORT_GEOFENCES.items():
            if fence["min_lat"] <= lat <= fence["max_lat"] and fence["min_lon"] <= lon <= fence["max_lon"]:
                return port_id
        return None

    def _process_event(self, event: Dict[str, Any]) -> None:
        """Process an individual AISStream message event and update anchorage status.

        Args:
            event: Parsed JSON dictionary from AISStream WebSocket.
        """
        try:
            msg_type = event.get("MessageType")
            if msg_type != "PositionReport":
                return

            metadata = event.get("MetaData", {})
            pos_report = event.get("Message", {}).get("PositionReport", {})

            # Extract MMSI
            mmsi = str(pos_report.get("UserID") or metadata.get("MMSI") or "")
            if not mmsi:
                return

            # Extract Coordinates
            lat = pos_report.get("Latitude")
            if lat is None:
                lat = metadata.get("latitude")

            lon = pos_report.get("Longitude")
            if lon is None:
                lon = metadata.get("longitude")

            if lat is None or lon is None:
                return

            lat = float(lat)
            lon = float(lon)

            # Speed Over Ground (SOG) in knots
            sog = pos_report.get("Sog")
            if sog is None:
                sog = 0.0
            sog = float(sog)

            ship_name = metadata.get("ShipName", "").strip() or f"MMSI_{mmsi}"
            now = datetime.now(timezone.utc)

            port_id = self._match_port(lat, lon)
            if not port_id:
                # If vessel moved out of port geofence, remove from tracked vessels
                for p_id, vessels in self.vessels_at_anchor.items():
                    if mmsi in vessels:
                        logger.info("Vessel %s left geofence of %s", ship_name, p_id)
                        del vessels[mmsi]
                return

            # Nautical threshold: SOG < 0.5 knots within port area indicates waiting at anchor / drifting
            if sog < 0.5:
                port_vessels = self.vessels_at_anchor[port_id]
                if mmsi not in port_vessels:
                    logger.info("New vessel anchored at %s: %s (MMSI: %s)", port_id, ship_name, mmsi)
                    port_vessels[mmsi] = {
                        "mmsi": mmsi,
                        "ship_name": ship_name,
                        "first_seen": now,
                        "last_seen": now,
                        "sog": sog,
                        "lat": lat,
                        "lon": lon,
                    }
                else:
                    # Update active vessel info
                    port_vessels[mmsi]["last_seen"] = now
                    port_vessels[mmsi]["sog"] = sog
                    port_vessels[mmsi]["lat"] = lat
                    port_vessels[mmsi]["lon"] = lon
                    if ship_name and port_vessels[mmsi]["ship_name"].startswith("MMSI_"):
                        port_vessels[mmsi]["ship_name"] = ship_name
            else:
                # SOG >= 0.5: Vessel underway (berthing or departing)
                port_vessels = self.vessels_at_anchor[port_id]
                if mmsi in port_vessels:
                    logger.info("Vessel %s underway (SOG: %.1f kn), removing from anchor queue at %s", ship_name, sog, port_id)
                    del port_vessels[mmsi]

        except Exception as e:
            logger.debug("Error processing AIS event: %s", e)

    async def connect_and_track(self, duration_seconds: Optional[int] = None) -> None:
        """Establish WebSocket connection to AISStream and process stream events.

        Must send subscription message within 3 seconds of connecting.

        Args:
            duration_seconds: Optional runtime duration. If None, runs indefinitely.
        """
        if not self.api_key:
            logger.warning("No AISStream API key configured. Live tracking cannot start.")
            return

        self.is_running = True
        sub_msg = self._build_subscription_message()
        start_time = asyncio.get_running_loop().time()

        while self.is_running:
            try:
                logger.info("Connecting to AISStream WebSocket: %s", AISSTREAM_WS_URL)
                async with websockets.connect(AISSTREAM_WS_URL, ping_interval=20, ping_timeout=20) as ws:
                    # AISStream requires subscription message within 3 seconds
                    await ws.send(json.dumps(sub_msg))
                    logger.info("Subscribed to AISStream for %d East Coast port geofences", len(PORT_GEOFENCES))

                    async for message in ws:
                        if not self.is_running:
                            break

                        try:
                            event = json.loads(message)
                            self._process_event(event)
                        except json.JSONDecodeError:
                            continue

                        if duration_seconds is not None:
                            elapsed = asyncio.get_running_loop().time() - start_time
                            if elapsed >= duration_seconds:
                                logger.info("AIS tracking duration (%ds) elapsed.", duration_seconds)
                                self.is_running = False
                                break

            except websockets.ConnectionClosed as cc:
                logger.warning("AISStream connection closed (%s). Reconnecting in 5s...", cc)
                await asyncio.sleep(5)
            except Exception as e:
                logger.error("AISStream websocket error: %s. Reconnecting in 10s...", e)
                await asyncio.sleep(10)

    def stop(self) -> None:
        """Stop tracking loop."""
        self.is_running = False

    def get_congestion_snapshot(self) -> Dict[str, Dict[str, Any]]:
        """Compute port congestion metrics from currently anchored vessels.

        Returns:
            dict: Mapping of port_id to:
                {
                    'vessels_waiting': int,
                    'avg_wait_hours': float,
                    'level': 'GREEN' | 'AMBER' | 'RED',
                    'estimated_demurrage_risk_usd': float,
                    'vessels': list[dict]
                }
        """
        now = datetime.now(timezone.utc)
        snapshot: Dict[str, Dict[str, Any]] = {}

        for port_id, vessels in self.vessels_at_anchor.items():
            waiting_count = len(vessels)
            wait_hours_list: List[float] = []
            vessel_list: List[Dict[str, Any]] = []

            for v in vessels.values():
                first_seen = v["first_seen"]
                wait_hours = (now - first_seen).total_seconds() / 3600.0
                wait_hours_list.append(wait_hours)
                vessel_list.append({
                    "mmsi": v["mmsi"],
                    "ship_name": v["ship_name"],
                    "wait_hours": round(wait_hours, 1),
                    "sog": v["sog"],
                    "lat": v["lat"],
                    "lon": v["lon"],
                })

            avg_wait = round(sum(wait_hours_list) / waiting_count, 1) if waiting_count > 0 else 0.0

            # Determine Congestion Level:
            # GREEN: < 4 vessels and avg_wait < 24 hrs
            # AMBER: 4-7 vessels or avg_wait between 24-48 hrs
            # RED: >= 8 vessels or avg_wait >= 48 hrs
            if waiting_count >= 8 or avg_wait >= 48.0:
                level = "RED"
            elif waiting_count >= 4 or avg_wait >= 24.0:
                level = "AMBER"
            else:
                level = "GREEN"

            # Total demurrage accrued/risked across waiting fleet
            total_demurrage = round(sum(w * DEMURRAGE_RATE_USD_PER_HOUR for w in wait_hours_list), 2)

            snapshot[port_id] = {
                "port_name": PORT_GEOFENCES[port_id]["name"],
                "vessels_waiting": waiting_count,
                "avg_wait_hours": avg_wait,
                "level": level,
                "estimated_demurrage_risk_usd": total_demurrage,
                "vessels": vessel_list,
            }

        return snapshot
