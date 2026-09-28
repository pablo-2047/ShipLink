import json
import numpy as np
import pandas as pd
import lightgbm as lgb


# h=1: Quantile LightGBM on the delta target

def train_quantile_delta_models(train_df, feature_cols, quantiles=(0.1, 0.5, 0.9)):
    models = {}
    for q in quantiles:
        m = lgb.LGBMRegressor(
            objective="quantile", alpha=q,
            n_estimators=300, learning_rate=0.05, max_depth=6,
            num_leaves=31, random_state=42, verbose=-1,
        )
        m.fit(train_df[feature_cols], train_df["delta_target"])
        models[q] = m
    return models


def enforce_quantile_ordering(low, median, high):
    stacked = np.vstack([low, median, high])
    sorted_preds = np.sort(stacked, axis=0)
    return sorted_preds[0], sorted_preds[1], sorted_preds[2]


def h1_interval(quantile_models, latest_row_features, latest_bdi_lag1):
    preds = {q: m.predict(latest_row_features)[0] for q, m in quantile_models.items()}
    low, med, high = enforce_quantile_ordering(
        np.array([preds[0.1]]), np.array([preds[0.5]]), np.array([preds[0.9]])
    )
    return {
        "low": float(latest_bdi_lag1 + low[0]),
        "central": float(latest_bdi_lag1 + med[0]),
        "high": float(latest_bdi_lag1 + high[0]),
        "method": "quantile_lightgbm",
    }



# h=7: ARIMA's native confidence interval

def h7_interval(arima_fitted_model, horizon, alpha=0.20):
    """alpha=0.20 -> 80% interval, matching the convention used throughout
    this project's earlier quantile work (0.1/0.9 = 80% central interval)."""
    forecast_result = arima_fitted_model.get_forecast(steps=horizon)
    point = float(forecast_result.predicted_mean.iloc[-1])
    ci = forecast_result.conf_int(alpha=alpha)
    low = float(ci.iloc[-1, 0])
    high = float(ci.iloc[-1, 1])
    return {"low": low, "central": point, "high": high, "method": "arima_conf_int"}


# h=14 / h=30: Empirical residual-based interval for the Naive fallback

def compute_naive_residual_interval_params(df, horizon, confidence=0.80):
    """
    Run ONCE (offline, here) to compute the historical spread of Naive's
    own errors at this horizon: residual = actual_target - bdi_lag1.
    Save the resulting percentile OFFSETS - the dashboard then just adds
    these fixed offsets to today's latest_bdi at inference time, no
    retraining needed.
    """
    df = df.sort_values("date").reset_index(drop=True)
    target = df["bdi"].shift(-(horizon - 1))
    residuals = (target - df["bdi_lag1"]).dropna()

    lower_pct = (1 - confidence) / 2 * 100
    upper_pct = 100 - lower_pct
    return {
        "horizon": horizon,
        "low_offset": float(np.percentile(residuals, lower_pct)),
        "high_offset": float(np.percentile(residuals, upper_pct)),
        "n_residuals": int(len(residuals)),
        "confidence": confidence,
    }


def naive_interval(latest_bdi, offset_params):
    return {
        "low": float(latest_bdi + offset_params["low_offset"]),
        "central": float(latest_bdi),
        "high": float(latest_bdi + offset_params["high_offset"]),
        "method": "naive_empirical_residual",
    }



# Unified dispatch - one function the dashboard actually calls

def interval_for(horizon, artifact, df, feature_cols=None, naive_offset_params=None):
    """
    artifact: the loaded freight_h{h}.pkl content (same object
    freight_dashboard.py already loads via load_artifact()).
    """
    strategy = artifact.get("strategy", "")

    if strategy == "naive":
        latest_bdi = float(df["bdi"].iloc[-1])
        return naive_interval(latest_bdi, naive_offset_params[horizon])

    if "_quantile_models" in artifact:
        cols = artifact["feature_cols"]
        latest_row = df[cols].iloc[[-1]]
        latest_lag1 = float(df["bdi_lag1"].iloc[-1])
        return h1_interval(artifact["_quantile_models"], latest_row, latest_lag1)

    if "arima" in strategy.lower() and "model" in artifact:
        return h7_interval(artifact["model"], horizon)

    # A delta/level/log-delta strategy with no quantile models attached yet -
    # run prediction_intervals.py's __main__ step for this horizon first.
    return None


if __name__ == "__main__":
    import joblib

    df = pd.read_csv("data/processed/features_full1.csv", parse_dates=["date"])
    df = df.sort_values("date").reset_index(drop=True)

    # Same engineered features freight_dashboard.py's load_features() computes -
    # the h=1 artifact's feature_cols depend on these existing.
    df["bdi_momentum_7_30"] = df["bdi_rollmean7"] - df["bdi_rollmean30"]
    df["coal_momentum14"] = df["coal_price"].pct_change(14)
    df["fuel_momentum14"] = df["brent_usd_per_bbl"].pct_change(14)
    df["iron_coal_ratio"] = df["iron_ore_price"] / (df["coal_price"] + 1e-5)
    df["iron_coal_ratio_change14"] = df["iron_coal_ratio"].pct_change(14)

    # --- h=1: train and attach quantile models to the existing artifact ---
    h1_artifact = joblib.load("models/freight_h1.pkl")
    feature_cols = h1_artifact["feature_cols"]

    df_h1 = df.copy()
    df_h1["target"] = df_h1["bdi"].shift(-(1 - 1))
    df_h1["delta_target"] = df_h1["target"] - df_h1["bdi_lag1"]
    df_h1 = df_h1.replace([np.inf, -np.inf], np.nan).dropna(subset=feature_cols + ["delta_target"])

    quantile_models = train_quantile_delta_models(df_h1, feature_cols)
    h1_artifact["_quantile_models"] = quantile_models
    joblib.dump(h1_artifact, "models/freight_h1.pkl")
    print("h=1: quantile models trained and attached to freight_h1.pkl")

    # --- h=14, h=30: precompute Naive residual offsets ---
    naive_offset_params = {
        14: compute_naive_residual_interval_params(df, 14),
        30: compute_naive_residual_interval_params(df, 30),
    }
    with open("models/naive_interval_params.json", "w") as f:
        json.dump(naive_offset_params, f, indent=2)
    print("h=14/30: Naive residual interval params saved to models/naive_interval_params.json")
    print(json.dumps(naive_offset_params, indent=2))

    print("\nh=7 (ARIMA): no extra step needed - conf_int() is computed live from the "
          "existing freight_h7.pkl model at inference time.")
