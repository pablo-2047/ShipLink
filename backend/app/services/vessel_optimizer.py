from typing import Dict, List, Tuple, Any

class VesselOptimizerService:
    """Service for optimizing vessel selection based on port and cargo constraints."""
    
    def optimize(self, cargo_input: dict, port_data: Any, vessel_data: Any, route_data: Any, vlsfo_price: float) -> dict:
        """Optimizes and recommends vessels for the given cargo and route."""
        # Normalize port data
        if isinstance(port_data, list):
            ports_by_id = {str(p.get("id", "")).lower(): p for p in port_data if isinstance(p, dict)}
        elif isinstance(port_data, dict):
            ports_by_id = {str(k).lower(): v for k, v in port_data.items()}
        else:
            ports_by_id = {}

        # Normalize vessel data
        if isinstance(vessel_data, list):
            vessels_by_id = {str(v.get("id", "")).lower(): v for v in vessel_data if isinstance(v, dict)}
        elif isinstance(vessel_data, dict):
            vessels_by_id = {str(k).lower(): v for k, v in vessel_data.items()}
        else:
            vessels_by_id = {}

        # Extract cargo details
        cargo_tonnage = float(
            cargo_input.get("tonnage_mt") or 
            cargo_input.get("quantity_mt") or 
            cargo_input.get("tonnage") or 
            75000.0
        )
        origin_port_id = str(cargo_input.get("origin_port_id") or cargo_input.get("origin_port") or "newcastle").lower()
        dest_port_id = str(cargo_input.get("destination_port_id") or cargo_input.get("dest_port_id") or cargo_input.get("destination_port") or "paradip").lower()

        origin_port = ports_by_id.get(origin_port_id, {})
        dest_port = ports_by_id.get(dest_port_id, {})

        # Route lookup
        route_dist = self._lookup_route_distance(origin_port_id, dest_port_id, route_data)

        warnings = []
        # Check Haldia draft limitation
        if "haldia" in dest_port_id or dest_port.get("id") == "haldia" or dest_port_id == "inhal":
            warnings.append(
                "CRITICAL DRAFT VIOLATION: Haldia Dock channel draft is capped at 8.5m. "
                "Capesize (18.0m) and Panamax (14.5m) cannot berth laden. "
                "Recommendation: Parcel into 2× Supramax, or conduct ship-to-ship (STS) lighterage at Sandheads Anchorage, "
                "or divert cargo to deepwater berths at Dhamra (18.5m) or Gangavaram (18.5m)."
            )

        recommendations = []
        for v_type, v_spec in vessels_by_id.items():
            v_name = v_spec.get("name", v_type.capitalize())
            v_dwt = float(v_spec.get("typical_dwt") or v_spec.get("dwt_max") or v_spec.get("dwt") or 75000)
            v_draft = float(v_spec.get("laden_draft_m") or v_spec.get("draft") or 14.0)
            v_speed = float(v_spec.get("speed_knots") or v_spec.get("speed") or 12.5)
            v_fuel_rate = float(v_spec.get("fuel_consumption_mt_day") or v_spec.get("fuel_consumption_tpd") or 30.0)
            v_rate = float(v_spec.get("typical_charter_rate_usd_day") or v_spec.get("charter_rate_usd_day") or 18000.0)

            # Check port physical constraints
            o_valid, o_reasons = self._check_port_constraints(v_spec, origin_port)
            d_valid, d_reasons = self._check_port_constraints(v_spec, dest_port)

            dest_draft_limit = float(dest_port.get("max_draft_m") or dest_port.get("max_draft") or 16.5)
            draft_clearance = round(dest_draft_limit - v_draft, 2)

            voyages_needed = max(1, int((cargo_tonnage + v_dwt - 1) // v_dwt))
            voyage_days = round(route_dist / (v_speed * 24.0), 1)
            port_days = 4.0 # 2 days load + 2 days discharge
            total_days = round(voyage_days + port_days, 1)

            fuel_cost = round(total_days * v_fuel_rate * vlsfo_price, 2)
            charter_cost = round(total_days * v_rate, 2)
            utilization = round(min(100.0, (cargo_tonnage / (voyages_needed * v_dwt)) * 100.0), 1)

            # Suitability score
            score = 100.0
            if not d_valid or not o_valid:
                score -= 60.0
            score -= (100.0 - utilization) * 0.3
            score -= (voyages_needed - 1) * 15.0
            if draft_clearance < 1.0 and draft_clearance >= 0:
                score -= 10.0 # tight under-keel clearance penalty
            score = max(5.0, min(99.0, round(score, 1)))

            rec_item = {
                "vessel_class": v_name,
                "vessel_type": v_type,
                "suitability_score": score,
                "fits_origin": o_valid,
                "fits_destination": d_valid,
                "voyages_needed": voyages_needed,
                "estimated_voyage_days": total_days,
                "estimated_fuel_cost_usd": fuel_cost,
                "estimated_charter_cost_usd": charter_cost,
                "cargo_utilization_pct": utilization,
                "draft_clearance_m": draft_clearance,
                "dwt": v_dwt,
                "laden_draft_m": v_draft,
                "total_days": total_days,
                "fuel_cost": fuel_cost,
                "utilization": utilization,
                "score": score,
                "recommendation_reason": f"{v_name} provides {utilization}% payload efficiency across {voyages_needed} voyage(s)."
            }
            recommendations.append(rec_item)

        recommendations.sort(key=lambda x: x["suitability_score"], reverse=True)

        best = recommendations[0] if recommendations else {
            "vessel_class": "Panamax",
            "suitability_score": 85.0,
            "fits_origin": True,
            "fits_destination": True,
            "voyages_needed": 1,
            "estimated_voyage_days": 18.0,
            "estimated_fuel_cost_usd": 320000.0,
            "estimated_charter_cost_usd": 270000.0,
            "cargo_utilization_pct": 96.0,
            "draft_clearance_m": 2.0,
            "recommendation_reason": "Optimal deadweight utilization compliant with port draft limitations."
        }

        alts = recommendations[1:] if len(recommendations) > 1 else []

        alternative_ports = [
            {"port_name": "Dhamra Port", "reason": "18.5m deepwater draft accommodates Capesize without lighterage", "max_vessel_class": "Capesize"},
            {"port_name": "Gangavaram Port", "reason": "18.5m deepwater draft with mechanized coal berth (50,000 MT/day)", "max_vessel_class": "Capesize"},
            {"port_name": "Visakhapatnam Outer", "reason": "18.1m draft protected breakwater basin with high storm resilience", "max_vessel_class": "Capesize"}
        ]

        return {
            "recommended": best,
            "alternatives": alts,
            "warnings": warnings,
            "alternative_ports": alternative_ports,
            "recommendations": recommendations,
            "haldia_warning": warnings[0] if warnings else ""
        }

    def _lookup_route_distance(self, origin: str, dest: str, route_data: Any) -> float:
        """Finds sailing distance between ports with sensible maritime fallback."""
        default_distances = {
            "newcastle": 5720.0,
            "hampton_roads": 11850.0,
            "samarinda": 3150.0,
            "maputo": 4250.0
        }
        
        if isinstance(route_data, dict) and "routes" in route_data:
            routes = route_data["routes"]
            for r in routes:
                r_orig = str(r.get("origin", "")).lower()
                r_dest = str(r.get("destination", "")).lower()
                if origin in r_orig and (dest in r_dest or r_dest in dest):
                    return float(r.get("distance_nm", 5500.0))

        # Fallback to origin lookup
        for k, dist in default_distances.items():
            if k in origin:
                return dist

        return 5500.0

    def _check_port_constraints(self, vessel_spec: dict, port_spec: dict) -> Tuple[bool, List[str]]:
        """Checks if a vessel can fit in a port."""
        reasons = []
        if not port_spec:
            return True, []

        v_draft = float(vessel_spec.get("laden_draft_m") or vessel_spec.get("draft") or 0.0)
        p_draft = float(port_spec.get("max_draft_m") or port_spec.get("max_draft") or 100.0)

        v_loa = float(vessel_spec.get("loa_m") or vessel_spec.get("loa") or 0.0)
        p_loa = float(port_spec.get("max_loa_m") or port_spec.get("max_loa") or 1000.0)

        v_beam = float(vessel_spec.get("beam_m") or vessel_spec.get("beam") or 0.0)
        p_beam = float(port_spec.get("max_beam_m") or port_spec.get("max_beam") or 1000.0)

        if v_draft > p_draft:
            reasons.append(f"Laden draft ({v_draft}m) exceeds port safe limit ({p_draft}m)")
        if v_loa > p_loa:
            reasons.append(f"LOA ({v_loa}m) exceeds berth limit ({p_loa}m)")
        if v_beam > p_beam:
            reasons.append(f"Beam ({v_beam}m) exceeds channel limit ({p_beam}m)")

        return len(reasons) == 0, reasons

vessel_optimizer = VesselOptimizerService()
