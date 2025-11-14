"""Generate daily price forecasts using seasonal historical patterns adjusted by current trend."""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Dict, List

import numpy as np
import pandas as pd

from .clean_workbook import CLEAN_ROOT, _safe_folder_name


FORECAST_ROOT = Path("data/forecast")
MOBILE_FORECAST_JSON = Path("mobile/assets/data/forecasts.json")
HORIZON_DAYS = 90
HOLDOUT_DAYS = 45
TREND_WINDOW_DAYS = 60  # Look back this many days to calculate current trend


@dataclass
class ForecastResult:
    item: str  # sanitized filesystem name
    display_name: str
    metric: float | None
    output_path: Path
    model_type: str


def _list_item_directories(root: Path) -> Dict[str, Path]:
    mapping: Dict[str, Path] = {}
    for path in sorted(root.iterdir()):
        if path.is_dir():
            mapping[path.name] = path
    return mapping


def _load_item_series(item: str, directory: Path) -> pd.DataFrame:
    frames: List[pd.DataFrame] = []
    for csv_path in sorted(directory.glob("*.csv")):
        df = pd.read_csv(csv_path, parse_dates=["date"])
        if "price" not in df.columns:
            continue
        frames.append(df[["date", "price"]])

    if not frames:
        return pd.DataFrame(columns=["ds", "y"])

    combined = pd.concat(frames, ignore_index=True)
    combined = combined.dropna(subset=["price"]).sort_values("date")
    combined = combined.rename(columns={"date": "ds", "price": "y"})
    combined = combined.set_index("ds").resample("D").ffill().reset_index()
    return combined


def _calculate_trend_ratio(series: pd.Series, historical_seasonal: pd.Series) -> float:
    """Calculate how current prices compare to historical seasonal averages.
    
    Returns a ratio: if > 1.0, prices are trending higher than historical;
    if < 1.0, prices are trending lower.
    
    Args:
        series: Current price series with datetime index
        historical_seasonal: Series with MultiIndex (month, day) -> median price
    """
    if len(series) < TREND_WINDOW_DAYS:
        return 1.0  # No trend data available
    
    # Get recent prices (last TREND_WINDOW_DAYS)
    recent = series.iloc[-TREND_WINDOW_DAYS:]
    recent_mean = float(recent.mean())
    
    if recent_mean <= 0 or recent_mean != recent_mean:  # NaN check
        return 1.0
    
    # Get historical seasonal values for the same dates
    recent_dates = recent.index
    historical_values = []
    for date in recent_dates:
        month_day = (date.month, date.day)
        # Look for same month-day in historical seasonal data (MultiIndex)
        try:
            if month_day in historical_seasonal.index:
                historical_values.append(float(historical_seasonal.loc[month_day]))
        except (KeyError, TypeError):
            pass
    
    if not historical_values:
        return 1.0
    
    historical_mean = float(np.nanmean(historical_values))
    if historical_mean <= 0 or historical_mean != historical_mean:
        return 1.0
    
    # Calculate trend ratio
    ratio = recent_mean / historical_mean
    # Cap extreme ratios to prevent unrealistic forecasts
    return float(np.clip(ratio, 0.5, 2.0))


def _forecast_with_seasonal_trend(
    series_df: pd.DataFrame,
    *,
    horizon: int,
    holdout_days: int,
) -> tuple[pd.DataFrame, float | None]:
    """Forecast using historical same-date prices adjusted by current trend."""
    series = series_df.set_index("ds")["y"].astype(float)
    
    # Build historical seasonal pattern: for each (month, day), get median price
    series_with_dates = series_df.copy()
    series_with_dates["ds"] = pd.to_datetime(series_with_dates["ds"])
    series_with_dates["month"] = series_with_dates["ds"].dt.month
    series_with_dates["day"] = series_with_dates["ds"].dt.day
    series_with_dates = series_with_dates.dropna(subset=["y"])
    
    # Group by month-day and get median (more robust than mean)
    seasonal_pattern = series_with_dates.groupby(["month", "day"])["y"].median()
    
    # Calculate current trend ratio
    trend_ratio = _calculate_trend_ratio(series, seasonal_pattern)
    
    # Generate future dates - always start from day after last actual price
    # This ensures smooth transition from historical data to forecast
    last_date = series.index[-1]
    start_date = last_date + pd.Timedelta(days=1)
    
    future_dates = pd.date_range(start_date, periods=horizon, freq="D")
    
    # For each future date, get historical seasonal value and apply trend
    forecasts = []
    lower_bounds = []
    upper_bounds = []
    
    # Get last known price for smoothing transition
    # Use dropna() to ensure we get the actual last price, not a forward-filled NaN
    last_valid_series = series.dropna()
    last_known_price = float(last_valid_series.iloc[-1]) if len(last_valid_series) > 0 else None
    
    for idx, future_date in enumerate(future_dates):
        month = future_date.month
        day = future_date.day
        
        # Get historical prices for this month-day
        historical_prices = series_with_dates[
            (series_with_dates["month"] == month) & (series_with_dates["day"] == day)
        ]["y"].values
        
        if len(historical_prices) > 0:
            # Use median for robustness
            seasonal_value = float(np.nanmedian(historical_prices))
            # Apply trend adjustment
            forecast_value = seasonal_value * trend_ratio
            
            # Smooth transition: blend with last known price for first few days
            # This prevents sudden jumps from current price to forecast
            if idx < 7 and last_known_price is not None:  # First week
                # Gradually transition: 100% last price on day 1, to 100% forecast by day 7
                blend_factor = idx / 7.0
                forecast_value = last_known_price * (1 - blend_factor) + forecast_value * blend_factor
            
            # Calculate confidence interval from historical variation
            std_dev = float(np.nanstd(historical_prices)) if len(historical_prices) > 1 else seasonal_value * 0.1
            lower = forecast_value - 1.96 * std_dev
            upper = forecast_value + 1.96 * std_dev
        else:
            # No historical data for this date, use last known price with trend
            forecast_value = float(series.iloc[-1]) * trend_ratio if last_known_price else 0
            std_dev = float(series.std()) * 0.1 if len(series) > 1 else forecast_value * 0.1
            lower = forecast_value - 1.96 * std_dev
            upper = forecast_value + 1.96 * std_dev
        
        forecasts.append(max(0, forecast_value))  # Ensure non-negative
        lower_bounds.append(max(0, lower))
        upper_bounds.append(max(0, upper))
    
    # Evaluate on holdout set if we have enough data
    metric = None
    if len(series) > holdout_days + 30:
        try:
            # Use last holdout_days as test set
            test_start_idx = len(series) - holdout_days
            test_series = series.iloc[test_start_idx:]
            
            # Generate "forecasts" for test period using data up to test_start_idx
            train_series = series.iloc[:test_start_idx]
            train_df = pd.DataFrame({"ds": train_series.index, "y": train_series.values})
            
            # Recalculate seasonal pattern and trend from training data only
            train_with_dates = train_df.copy()
            train_with_dates["ds"] = pd.to_datetime(train_with_dates["ds"])
            train_with_dates["month"] = train_with_dates["ds"].dt.month
            train_with_dates["day"] = train_with_dates["ds"].dt.day
            train_with_dates = train_with_dates.dropna(subset=["y"])
            train_seasonal = train_with_dates.groupby(["month", "day"])["y"].median()
            train_series_indexed = train_series
            train_trend = _calculate_trend_ratio(train_series_indexed, train_seasonal)
            
            # Generate predictions for test dates
            test_predictions = []
            for test_date in test_series.index:
                month = test_date.month
                day = test_date.day
                historical = train_with_dates[
                    (train_with_dates["month"] == month) & (train_with_dates["day"] == day)
                ]["y"].values
                if len(historical) > 0:
                    seasonal_val = float(np.nanmedian(historical))
                    pred = seasonal_val * train_trend
                else:
                    pred = float(train_series.iloc[-1]) * train_trend
                test_predictions.append(pred)
            
            # Calculate MAPE
            with np.errstate(divide="ignore", invalid="ignore"):
                mape = np.abs((test_series.values - np.array(test_predictions)) / 
                             np.where(test_series.values != 0, test_series.values, np.nan))
            if not np.isnan(mape).all():
                metric = float(np.nanmean(mape) * 100)
        except Exception:
            pass  # Evaluation failed, metric stays None
    
    output = pd.DataFrame(
        {
            "date": future_dates,
            "forecast": forecasts,
            "lower": lower_bounds,
            "upper": upper_bounds,
        }
    )
    return output, metric


def _forecast_item(
    item: str,
    directory: Path,
    display_name: str,
    *,
    horizon: int,
    holdout_days: int,
) -> ForecastResult | None:
    series = _load_item_series(item, directory)
    if series.empty:
        return None

    forecast_df, metric = _forecast_with_seasonal_trend(series, horizon=horizon, holdout_days=holdout_days)
    model_type = "seasonal_trend"

    item_dir = FORECAST_ROOT / _safe_folder_name(item)
    item_dir.mkdir(parents=True, exist_ok=True)
    output_path = item_dir / "forecast.csv"
    forecast_df.to_csv(output_path, index=False)

    return ForecastResult(item=item, display_name=display_name, metric=metric, output_path=output_path, model_type=model_type)


def generate_forecasts(*, horizon: int = HORIZON_DAYS, holdout_days: int = HOLDOUT_DAYS) -> List[ForecastResult]:
    FORECAST_ROOT.mkdir(parents=True, exist_ok=True)

    item_dirs = _list_item_directories(CLEAN_ROOT)
    display_map = _load_display_name_map()
    total_items = len(item_dirs)
    if not total_items:
        print("No cleaned item directories found; skipping forecast generation.", flush=True)
        return []

    print(f"Starting forecast generation for {total_items} items...", flush=True)
    results: List[ForecastResult] = []

    for idx, (item, directory) in enumerate(item_dirs.items(), start=1):
        display_name = display_map.get(item, item)
        print(f"[{idx}/{total_items}] Forecasting '{display_name}'...", flush=True)
        result = _forecast_item(item, directory, display_name, horizon=horizon, holdout_days=holdout_days)
        if result:
            results.append(result)
            print(f"    [OK] {display_name}: wrote {result.output_path.name} using {result.model_type}", flush=True)
        else:
            print(f"    [SKIP] {display_name}: no data available, skipped.", flush=True)

    summary = pd.DataFrame(
        [
            {
                "item": r.item,
                "display_name": r.display_name,
                "model": r.model_type,
                "mape": r.metric,
                "path": str(r.output_path),
            }
            for r in results
        ]
    ).sort_values("item")
    summary.to_csv(FORECAST_ROOT / "summary.csv", index=False)

    _write_mobile_forecast_json(results, horizon)
    return results


def _load_display_name_map() -> Dict[str, str]:
    price_json = Path("mobile/assets/data/prices.json")
    mapping: Dict[str, str] = {}
    if not price_json.exists():
        return mapping

    try:
        payload = json.loads(price_json.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return mapping

    for item in payload.get("items", []):
        name = item.get("name")
        if not name:
            continue
        mapping[_safe_folder_name(name)] = name
    return mapping


def _write_mobile_forecast_json(results: List[ForecastResult], horizon: int) -> None:
    items_payload: List[dict[str, object]] = []

    for result in results:
        frame = pd.read_csv(result.output_path, parse_dates=["date"]) if result.output_path.exists() else pd.DataFrame()
        points = [
            {
                "date": row.date.date().isoformat() if isinstance(row.date, pd.Timestamp) else str(row.date),
                "forecast": float(row.forecast) if pd.notna(row.forecast) else None,
                "lower": float(row.lower) if pd.notna(row.lower) else None,
                "upper": float(row.upper) if pd.notna(row.upper) else None,
            }
            for row in frame.itertuples(index=False)
        ]
        items_payload.append(
            {
                "name": result.display_name,
                "key": result.item,
                "model": result.model_type,
                "mape": result.metric,
                "points": points,
            }
        )

    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "horizonDays": horizon,
        "items": items_payload,
    }
    MOBILE_FORECAST_JSON.parent.mkdir(parents=True, exist_ok=True)
    MOBILE_FORECAST_JSON.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--horizon", type=int, default=HORIZON_DAYS, help="Forecast horizon in days.")
    parser.add_argument("--holdout", type=int, default=HOLDOUT_DAYS, help="Holdout window (days) for MAPE calculation.")
    args = parser.parse_args()

    results = generate_forecasts(horizon=args.horizon, holdout_days=args.holdout)
    print(f"Generated forecasts for {len(results)} items; files written to '{FORECAST_ROOT}'.")


if __name__ == "__main__":
    main()


