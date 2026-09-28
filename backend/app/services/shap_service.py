from typing import List, Dict, Any

class ShapService:
    """Service to provide SHAP explainability for model predictions."""
    
    def get_shap_explanations(self, model: Any, features: Any) -> List[Dict[str, Any]]:
        """Returns the top contributing features for a prediction."""
        try:
            # Assume model.explain returns a dict of feature_name -> shap_value
            raw_explanations = model.explain(features)
        except AttributeError:
            # Fallback if model doesn't support explain natively in this mock
            raw_explanations = {
                "brent_price": 45.2,
                "tonne_mile": 30.1,
                "iron_ore": -15.4,
                "congestion_index": 12.0,
                "usd_inr": 5.5,
                "coal": -3.2,
                "bdi_lag1": 10.1
            }
            
        display_map = self.get_feature_display_mapping()
        
        results = []
        for feat, val in raw_explanations.items():
            results.append({
                "feature_name": feat,
                "display_name": display_map.get(feat, feat),
                "shap_value": val,
                "absolute_impact": abs(val)
            })
            
        # Sort by absolute impact descending
        results.sort(key=lambda x: x["absolute_impact"], reverse=True)
        return results[:10]
        
    def get_feature_display_mapping(self) -> Dict[str, str]:
        """Maps raw feature names to human-readable strings."""
        return {
            "brent_price": "Brent Crude Price (USD)",
            "tonne_mile": "Tonne-Mile Demand",
            "iron_ore": "Iron Ore Trade Volume",
            "congestion_index": "Port Congestion Index",
            "usd_inr": "USD/INR Exchange Rate",
            "coal": "Coal Trade Volume",
            "bdi_lag1": "BDI (Previous Day)",
            "bdi_lag7": "BDI (7-Day Lag)",
            "bunker": "Bunker Fuel Price"
        }

shap_service = ShapService()
