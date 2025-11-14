"""Export the latest fetched DA prices to JSON for mobile app."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from .clean_workbook import CLEAN_ROOT
from .impute_prices import _load_daily_index_records

MOBILE_CURRENT_JSON = Path("mobile/assets/data/current_prices.json")
DAYS_TO_SHOW = 30  # Show last 30 days of fetched prices


def export_current_prices() -> Path:
    """Export the latest DA prices to JSON for mobile consumption."""
    observed = _load_daily_index_records()
    
    if observed.empty:
        # Fallback: read from latest CSV files
        observed = _load_from_latest_csvs()
    
    if observed.empty:
        payload = {
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "latestDate": None,
            "items": [],
        }
    else:
        # Get the latest date
        latest_date = observed["date"].max()
        cutoff_date = latest_date - pd.Timedelta(days=DAYS_TO_SHOW)
        
        # Filter to recent dates
        recent = observed[observed["date"] >= cutoff_date].copy()
        
        # Group by item and date
        items_payload = []
        for item_name, item_group in recent.groupby("item"):
            dates_payload = []
            for _, row in item_group.sort_values("date").iterrows():
                dates_payload.append({
                    "date": row["date"].strftime("%Y-%m-%d"),
                    "price": round(float(row["price"]), 2),
                })
            
            if dates_payload:
                items_payload.append({
                    "name": item_name,
                    "prices": dates_payload,
                })
        
        items_payload.sort(key=lambda entry: entry["name"].lower())
        
        payload = {
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "latestDate": latest_date.strftime("%Y-%m-%d"),
            "daysShown": DAYS_TO_SHOW,
            "items": items_payload,
        }
    
    MOBILE_CURRENT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with MOBILE_CURRENT_JSON.open("w", encoding="utf-8") as stream:
        json.dump(payload, stream, indent=2)
    
    return MOBILE_CURRENT_JSON


def _load_from_latest_csvs() -> pd.DataFrame:
    """Fallback: load from the latest CSV files in cleaned directory."""
    if not CLEAN_ROOT.exists():
        return pd.DataFrame(columns=["item", "date", "price"])
    
    records = []
    
    # Find the latest year
    all_years = []
    for item_dir in CLEAN_ROOT.iterdir():
        if not item_dir.is_dir():
            continue
        for csv_file in item_dir.glob("*.csv"):
            try:
                year = int(csv_file.stem)
                all_years.append(year)
            except ValueError:
                continue
    
    if not all_years:
        return pd.DataFrame(columns=["item", "date", "price"])
    
    latest_year = max(all_years)
    
    # Load data from latest year
    for item_dir in CLEAN_ROOT.iterdir():
        if not item_dir.is_dir():
            continue
        
        item_name = item_dir.name
        csv_file = item_dir / f"{latest_year}.csv"
        
        if not csv_file.exists():
            continue
        
        try:
            df = pd.read_csv(csv_file, parse_dates=["date"])
            for _, row in df.iterrows():
                if pd.notna(row.get("price")):
                    records.append({
                        "item": item_name,
                        "date": pd.Timestamp(row["date"]),
                        "price": float(row["price"]),
                    })
        except Exception:
            continue
    
    if not records:
        return pd.DataFrame(columns=["item", "date", "price"])
    
    df = pd.DataFrame(records)
    # Get only the most recent dates
    if not df.empty:
        latest_date = df["date"].max()
        cutoff = latest_date - pd.Timedelta(days=DAYS_TO_SHOW)
        df = df[df["date"] >= cutoff]
    
    return df


def main() -> None:
    path = export_current_prices()
    print(f"Current prices exported to '{path}'.")


if __name__ == "__main__":
    main()


__all__ = ["export_current_prices", "main"]

