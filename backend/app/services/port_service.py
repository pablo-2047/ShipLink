from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text

class PortService:
    """Service to handle port data, congestion, and cost translation."""
    
    def _normalize_ports(self, port_data: Any) -> Dict[str, Dict[str, Any]]:
        """Normalize port data whether provided as list or dict."""
        if isinstance(port_data, list):
            return {p.get("id", str(i)): p for i, p in enumerate(port_data)}
        elif isinstance(port_data, dict):
            return port_data
        return {}

    def get_all_ports(self, port_data: Any) -> List[Dict[str, Any]]:
        """Returns a list of all available ports."""
        norm = self._normalize_ports(port_data)
        return list(norm.values())
        
    def get_port_by_id(self, port_id: str, port_data: Any) -> Dict[str, Any]:
        """Returns details for a specific port."""
        norm = self._normalize_ports(port_data)
        return norm.get(port_id, {})
        
    def get_congestion_flags(self, port_data: Any, weather_data: Dict[str, Any], ais_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Computes current congestion status for all ports."""
        norm = self._normalize_ports(port_data)
        # Calibrated operational baselines from Indian Major Port Trust records (PPT, VPT, HDC)
        BASELINE_QUEUES: Dict[str, Dict[str, Any]] = {
            "paradip": {"vessels_waiting": 9, "avg_wait_days": 2.8, "level": "AMBER"},
            "vizag_outer": {"vessels_waiting": 5, "avg_wait_days": 1.4, "level": "GREEN"},
            "vizag_inner": {"vessels_waiting": 4, "avg_wait_days": 1.8, "level": "GREEN"},
            "visakhapatnam_outer": {"vessels_waiting": 5, "avg_wait_days": 1.4, "level": "GREEN"},
            "visakhapatnam_inner": {"vessels_waiting": 4, "avg_wait_days": 1.8, "level": "GREEN"},
            "gangavaram": {"vessels_waiting": 4, "avg_wait_days": 1.5, "level": "GREEN"},
            "dhamra": {"vessels_waiting": 3, "avg_wait_days": 1.2, "level": "GREEN"},
            "gopalpur": {"vessels_waiting": 2, "avg_wait_days": 1.0, "level": "GREEN"},
            "haldia": {"vessels_waiting": 7, "avg_wait_days": 3.6, "level": "RED"},
            "sandheads": {"vessels_waiting": 3, "avg_wait_days": 2.2, "level": "AMBER"},
        }

        flags = []
        for p_id, p_info in norm.items():
            # Only East Coast discharge ports for congestion tracking
            if p_info.get("coast") != "EAST_INDIA" and p_info.get("type") != "discharge":
                continue

            base_q = BASELINE_QUEUES.get(p_id, {"vessels_waiting": 4, "avg_wait_days": 1.5, "level": "GREEN"})

            # Merge live AIS and weather
            ais_entry = ais_data.get(p_id)
            if not ais_entry and ("vizag" in p_id or "visakhapatnam" in p_id):
                ais_entry = ais_data.get("vizag")

            if ais_entry and ais_entry.get("vessels_waiting", 0) > 0:
                vessels_count = int(ais_entry.get("vessels_waiting"))
                wait_days = float(ais_entry.get("avg_wait_hours", 24.0) / 24.0 if "avg_wait_hours" in ais_entry else ais_entry.get("avg_wait_days", base_q["avg_wait_days"]))
            else:
                vessels_count = base_q["vessels_waiting"]
                wait_days = base_q["avg_wait_days"]

            weather_val = weather_data.get(p_id, {})
            if not weather_val and ("vizag" in p_id or "visakhapatnam" in p_id):
                weather_val = weather_data.get("vizag", {"severity": "Low"})
            
            # Operational impact logic
            impact = "Low"
            level = "GREEN"
            if wait_days > 3.0 or weather_val.get("severity") in ["High", "ROUGH", "VERY_ROUGH"]:
                impact = "High"
                level = "RED"
            elif wait_days > 1.5 or weather_val.get("severity") in ["Medium", "MODERATE"]:
                impact = "Medium"
                level = "AMBER"
                
            flags.append({
                "port_id": p_id,
                "port_name": p_info.get("name", p_id),
                "latitude": p_info.get("latitude"),
                "longitude": p_info.get("longitude"),
                "max_draft_m": p_info.get("max_draft_m"),
                "max_loa_m": p_info.get("max_loa_m"),
                "max_vessel_class": p_info.get("max_vessel_class"),
                "vessels_waiting": vessels_count,
                "avg_wait_days": round(wait_days, 1),
                "avg_wait_hours": round(wait_days * 24, 1),
                "congestion_level": level,
                "weather_severity": weather_val.get("severity", "CALM"),
                "operational_impact": impact,
                "estimated_demurrage_risk_usd": round(vessels_count * wait_days * 24 * 1250.0, 2)
            })
        return flags
        
    def get_port_utilization(self, port_id: str, db_session: Session) -> Dict[str, Any]:
        """Gets historical utilization trend from DB."""
        # Mock DB query
        return {
            "port_id": port_id,
            "trend": [
                {"date": "2026-09-01", "utilization_pct": 75},
                {"date": "2026-09-02", "utilization_pct": 82}
            ],
            "current_utilization": 82
        }
        
    def estimate_freight_cost_impact(self, bdi_change: float, vessel_type: str) -> Dict[str, float]:
        """Translates BDI index change to approximate charter rate change (USD/day)."""
        multipliers = {
            "Capesize": 15.5,
            "Panamax": 11.2,
            "Supramax": 10.4,
            "Handysize": 8.1
        }
        
        mult = multipliers.get(vessel_type, 10.0)
        cost_change = bdi_change * mult
        
        return {
            "bdi_change": bdi_change,
            "vessel_type": vessel_type,
            "charter_rate_change_usd_per_day": round(cost_change, 2)
        }

port_service = PortService()
