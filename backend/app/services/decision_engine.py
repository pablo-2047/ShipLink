from dataclasses import dataclass, asdict
from typing import Optional, Dict, Any

# Directional accuracy above this is treated as a real (if modest) edge over a coin flip.
DIR_ACC_HIGH_CONFIDENCE = 0.60
DIR_ACC_MIN_USABLE = 0.52  # below this, the call is still made, just labeled "Low" confidence


@dataclass
class ChartingDecision:
    horizon: int
    call: str                    # "BOOK_NOW" | "WAIT"
    headline: str                # short human-readable recommendation
    reason: str                  # why, in plain language - always shown, never hidden
    confidence: Optional[str]    # "High" | "Moderate" | "Low" | None
    pct_change: Optional[float]  # predicted % move vs. latest actual BDI
    forecast: Optional[float]
    latest_bdi: float

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def _confidence_tier(directional_accuracy: float) -> str:
    if directional_accuracy is None:
        return "Low"
    if directional_accuracy >= DIR_ACC_HIGH_CONFIDENCE:
        return "High"
    if directional_accuracy >= DIR_ACC_MIN_USABLE:
        return "Moderate"
    return "Low"


def charter_timing_decision(
    horizon: int,
    forecast: float,
    latest_bdi: float,
    deployed_strategy_label: str,
    is_naive_fallback: bool,
    backtest_directional_accuracy: Optional[float],
    backtest_wape_pct: Optional[float],
    backtest_mae: Optional[float] = None,
    validated_through: Optional[str] = None,
) -> ChartingDecision:

    validation_note = f" (backtest last validated through {validated_through})" if validated_through else ""

    forecast_used = forecast if forecast is not None else latest_bdi
    pct_change = (forecast_used - latest_bdi) / latest_bdi * 100

    confidence = "Low" if is_naive_fallback else _confidence_tier(backtest_directional_accuracy)
    spread_text = f" (±{backtest_mae:,.0f})" if backtest_mae is not None else ""

    if pct_change >= 0:
        return ChartingDecision(
            horizon=horizon, call="BOOK_NOW",
            headline=f"Book now - rates likely rising {pct_change:+.1f}% by {horizon}d",
            reason=(
                f"Multi-horizon models project Baltic Dry rising to {forecast_used:,.0f}{spread_text} "
                f"(from {latest_bdi:,.0f} today, +{pct_change:.1f}%). "
                f"Locking forward charters now avoids paying the higher rate this trajectory implies."
            ),
            confidence=confidence, pct_change=pct_change, forecast=forecast_used, latest_bdi=latest_bdi,
        )

    return ChartingDecision(
        horizon=horizon, call="WAIT",
        headline=f"Wait - rates likely falling {pct_change:+.1f}% by {horizon}d",
        reason=(
            f"Multi-horizon models project Baltic Dry softening to {forecast_used:,.0f}{spread_text} "
            f"(from {latest_bdi:,.0f} today, {pct_change:.1f}%). "
            f"Deferring fixture nominations is advised to capture lower spot rates."
        ),
        confidence=confidence, pct_change=pct_change, forecast=forecast_used, latest_bdi=latest_bdi,
    )
