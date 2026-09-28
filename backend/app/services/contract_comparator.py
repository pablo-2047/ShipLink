import numpy as np
from typing import List, Dict

class ContractComparatorService:
    """Service to compare Spot, Short-term, and Mid-term charter contracts."""
    
    def compare(self, current_rate: float, forecast_values: List[float], voyage_days: float, usd_inr_rate: float) -> dict:
        """Compares different charter strategies based on forecast data."""
        # Spot strategy
        spot_cost_usd = current_rate * voyage_days
        spot_cost_inr = spot_cost_usd * usd_inr_rate
        spot_3_voyages = spot_cost_usd * 3
        spot_6_voyages = spot_cost_usd * 6
        
        # Short-term strategy (approx 90 days, 3 voyages, slight volume discount)
        short_term_horizon = min(90, len(forecast_values))
        if short_term_horizon > 0:
            short_term_avg_rate = sum(forecast_values[:short_term_horizon]) / short_term_horizon
        else:
            short_term_avg_rate = current_rate
        # Apply slight charterer discount for commit
        short_term_contract_rate = short_term_avg_rate * 0.96
        short_term_cost_usd = short_term_contract_rate * voyage_days * 3
        short_term_cost_inr = short_term_cost_usd * usd_inr_rate
        short_term_savings = max(0.0, spot_3_voyages - short_term_cost_usd)
        
        # Mid-term strategy (approx 180 days, 6 voyages, larger volume discount)
        mid_term_horizon = min(180, len(forecast_values))
        if mid_term_horizon > 0:
            mid_term_avg_rate = sum(forecast_values[:mid_term_horizon]) / mid_term_horizon
        else:
            mid_term_avg_rate = current_rate
        mid_term_contract_rate = mid_term_avg_rate * 0.91
        mid_term_cost_usd = mid_term_contract_rate * voyage_days * 6
        mid_term_cost_inr = mid_term_cost_usd * usd_inr_rate
        mid_term_savings = max(0.0, spot_6_voyages - mid_term_cost_usd)
        
        # Trend Analysis
        if len(forecast_values) > 1:
            x = np.arange(len(forecast_values))
            slope, _ = np.polyfit(x, forecast_values, 1)
        else:
            slope = 0.0
            
        recommendation = "WAIT_AND_SPOT"
        if slope > 1.5:
            recommendation = "LOCK_SHORT_TERM"
        if slope > 3.5:
            recommendation = "LOCK_MID_TERM"

        reason_str = (
            f"Forecast slope of {slope:+.2f} pts/day indicates rising freight rates over the next 3–6 months. "
            f"Locking mid-term fixture captures an estimated ${mid_term_savings:,.0f} (₹{(mid_term_savings * usd_inr_rate / 1e7):.2f} Cr) "
            "in volume discount hedging against spot market volatility."
            if slope > 2.0 else
            f"Forecast slope of {slope:+.2f} pts/day indicates softening market rates. Recommendation is to fix prompt spot voyages."
        )
            
        return {
            "spot": {
                "rate_per_day": round(current_rate, 2),
                "cost_per_voyage": round(spot_cost_usd, 2),
                "total_cost_3_voyages": round(spot_3_voyages, 2),
                "avg_rate": round(current_rate, 2),
                "total_cost_usd": round(spot_cost_usd, 2),
                "total_cost_inr": round(spot_cost_inr, 2)
            },
            "short_term": {
                "rate_per_day": round(short_term_contract_rate, 2),
                "cost_per_voyage": round(short_term_contract_rate * voyage_days, 2),
                "total_cost": round(short_term_cost_usd, 2),
                "savings_vs_spot": round(short_term_savings, 2),
                "avg_rate": round(short_term_avg_rate, 2),
                "total_cost_usd": round(short_term_cost_usd, 2),
                "total_cost_inr": round(short_term_cost_inr, 2)
            },
            "mid_term": {
                "rate_per_day": round(mid_term_contract_rate, 2),
                "cost_per_voyage": round(mid_term_contract_rate * voyage_days, 2),
                "total_cost": round(mid_term_cost_usd, 2),
                "savings_vs_spot": round(mid_term_savings, 2),
                "avg_rate": round(mid_term_avg_rate, 2),
                "total_cost_usd": round(mid_term_cost_usd, 2),
                "total_cost_inr": round(mid_term_cost_inr, 2)
            },
            "short_term_3mo": {
                "avg_rate": round(short_term_contract_rate, 2),
                "total_cost_usd": round(short_term_cost_usd, 2),
                "total_cost_inr": round(short_term_cost_inr, 2)
            },
            "mid_term_6mo": {
                "avg_rate": round(mid_term_contract_rate, 2),
                "total_cost_usd": round(mid_term_cost_usd, 2),
                "total_cost_inr": round(mid_term_cost_inr, 2)
            },
            "recommendation": recommendation,
            "reason": reason_str,
            "forecast_trend_slope": round(slope, 3),
            "trend_slope": round(slope, 3)
        }

contract_comparator = ContractComparatorService()
