"""Impute missing price observations using temporal and seasonal heuristics."""

from __future__ import annotations

from pathlib import Path
from typing import Dict, Iterable, Optional

import calendar
import json
import re
from datetime import datetime, timezone

import numpy as np
import pandas as pd
import pdfplumber

from .clean_workbook import CLEAN_ROOT, clean_workbook, _safe_folder_name


MOBILE_JSON = Path("mobile/assets/data/prices.json")
DA_DAILY_DIR = Path("data/daily_price_index")

DA_MAPPING = [
    ("IMPORTED COMMERCIAL RICE", "SPECIAL RICE", None, "Imported Special"),
    ("IMPORTED COMMERCIAL RICE", "PREMIUM", None, "Imported Premium"),
    ("IMPORTED COMMERCIAL RICE", "WELL MILLED", None, "Imported Well milled"),
    ("IMPORTED COMMERCIAL RICE", "REGULAR MILLED", None, "Imported Regular milled"),
    ("LOCAL COMMERCIAL RICE", "SPECIAL RICE", None, "Local Special"),
    ("LOCAL COMMERCIAL RICE", "PREMIUM", None, "Local Premium"),
    ("LOCAL COMMERCIAL RICE", "WELL MILLED", None, "Local Well milled"),
    ("LOCAL COMMERCIAL RICE", "REGULAR MILLED", None, "Local Regular milled"),
    ("LOWLAND VEGETABLES", "AMPALAYA", None, "Bittergourd (Ampalaya)"),
    ("LOWLAND VEGETABLES", "EGGPLANT", None, "Eggplant (Talong)"),
    ("LOWLAND VEGETABLES", "NATIVE PECHAY", None, "Pechay (Native)"),
    ("LOWLAND VEGETABLES", "POLE SITA0", None, "String Beans (Sitao)"),  # alternate typo protection
    ("LOWLAND VEGETABLES", "POLE SITAO", None, "String Beans (Sitao)"),
    ("LOWLAND VEGETABLES", "SQUASH", None, "Squash"),
    ("SPICES", "CHILLI (RED), LOCAL", None, "Chilli (Labuyo)"),
    ("SPICES", "GARLIC, IMPORTED", None, "Imported Garlic"),
    ("SPICES", "GARLIC, NATIVE/LOCAL", None, "Local Garlic"),
    ("SPICES", "GINGER, LOCAL", None, "Ginger"),
    ("SPICES", "RED ONION, LOCAL", None, "Local Red Onion"),
    ("FRUITS", "BANANA (LAKATAN)", None, "Banana (Lakatan)"),
    ("FRUITS", "BANANA (LATUNDAN)", None, "Banana (Latundan)"),
    ("FRUITS", "BANANA (SABA)", None, "Banana (Saba)"),
    ("FRUITS", "CALAMANSI", None, "Calamansi"),
    ("FRUITS", "PAPAYA", None, "Papaya"),
    ("POULTRY PRODUCTS", "WHOLE CHICKEN, LOCAL", "FULLY DRESSED", "Whole Chicken"),
    ("POULTRY PRODUCTS", "CHICKEN EGG (WHITE, MEDIUM)", None, "Chicken Egg(White,M)"),
    ("OTHER LIVESTOCK MEAT", "PORK BELLY (LIEMPO), LOCAL", None, "Pork Ham Belly(Liempo)"),
    ("OTHER LIVESTOCK MEAT", "PORK BELLY (LIEMPO), IMPORTED", None, "Frozen Liempo"),
    ("OTHER LIVESTOCK MEAT", "PORK PICNIC SHOULDER (KASIM), LOCAL", None, "Pork Ham(Kasim)"),
    ("OTHER LIVESTOCK MEAT", "PORK PICNIC SHOULDER (KASIM), IMPORTED", None, "Frozen Kasim"),
    ("LOWLAND VEGETABLES", "TOMATO", None, "Tomato"),
    ("HIGHLAND VEGETABLES", "LETTUCE (GREEN ICE)", None, "Lettuce (Green Ice)"),
    ("HIGHLAND VEGETABLES", "LETTUCE (ICEBERG)", None, "Lettuce (Iceberg)"),
    ("HIGHLAND VEGETABLES", "LETTUCE (ROMAINE)", None, "Lettuce (Romaine)"),
]


def impute_prices() -> Path:
    """Clean the raw workbook, impute gaps, and export results."""

    exports = clean_workbook()
    combined = _build_dataset(exports)

    if combined.empty:
        raise ValueError("No price observations were found to impute.")

    imputed = _apply_imputation(combined)
    _write_clean_csvs(imputed, exports)
    _export_mobile_json(imputed)
    return CLEAN_ROOT


def _build_dataset(exports: Dict[str, Dict[str, Path]]) -> pd.DataFrame:
    rows = []
    for sheet_name, year_map in exports.items():
        for year, csv_path in year_map.items():
            year_value = _coerce_year(year)
            if year_value is None:
                continue
            df = pd.read_csv(csv_path, parse_dates=["date"])
            df["item"] = sheet_name
            df["year"] = year_value
            rows.append(df)

    if not rows:
        return pd.DataFrame(columns=["date", "price", "item", "year"])

    combined = pd.concat(rows, ignore_index=True)
    combined = combined.sort_values(by=["item", "year", "date"])
    combined["day_of_year"] = combined["date"].dt.dayofyear
    combined["month"] = combined["date"].dt.month
    return combined


def _apply_imputation(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df = _merge_official_prices(df)

    available = df.dropna(subset=["price"])  # original observed values
    seasonal_mean = (
        available.groupby(["item", "day_of_year"])["price"].mean()
        if not available.empty
        else pd.Series(dtype=float)
    )
    monthly_median = (
        available.groupby(["item", "month"])["price"].median()
        if not available.empty
        else pd.Series(dtype=float)
    )
    item_median = (
        available.groupby("item")["price"].median()
        if not available.empty
        else pd.Series(dtype=float)
    )

    imputed_frames = []

    for (item, year), group in df.groupby(["item", "year"], sort=False):
        seasonal_item = seasonal_mean.xs(item) if item in seasonal_mean.index.levels[0] else None
        monthly_item = monthly_median.xs(item) if item in monthly_median.index.levels[0] else None
        item_default = item_median.loc[item] if item in item_median.index else np.nan

        processed = _impute_series(group, seasonal_item, monthly_item, item_default)
        processed["item"] = item
        processed["year"] = year
        imputed_frames.append(processed)

    imputed_df = pd.concat(imputed_frames, ignore_index=True)
    imputed_df = imputed_df.sort_values(by=["item", "year", "date"])
    imputed_df = _rebuild_calendar_dates(imputed_df)
    imputed_df = _apply_future_cutoff(imputed_df)
    return imputed_df


def _impute_series(
    group: pd.DataFrame,
    seasonal_item: pd.Series | None,
    monthly_item: pd.Series | None,
    item_default: float,
) -> pd.DataFrame:
    if group.empty:
        return pd.DataFrame(columns=["date", "day_of_year", "month", "price", "was_imputed", "was_adjusted"])

    data = group.copy().sort_values("date")
    year = int(data["year"].iloc[0])
    full_index = pd.date_range(f"{year}-01-01", f"{year}-12-31", freq="D")

    data = data.set_index("date").reindex(full_index)
    data.index.name = "date"
    data["item"] = data["item"].fillna(method="ffill").fillna(method="bfill")
    data["year"] = year
    data["day_of_year"] = data.index.dayofyear
    data["month"] = data.index.month
    if "was_imputed" not in data.columns:
        data["was_imputed"] = False
    if "was_adjusted" not in data.columns:
        data["was_adjusted"] = False

    series = data["price"]

    interpolated = series.interpolate(method="time", limit=14, limit_direction="both")
    result = interpolated.copy()

    missing = result.isna()
    if missing.any() and seasonal_item is not None and not seasonal_item.empty:
        seasonal_values = data.loc[missing, "day_of_year"].map(seasonal_item)
        result.loc[missing] = seasonal_values

    missing = result.isna()
    if missing.any() and monthly_item is not None and not monthly_item.empty:
        monthly_values = data.loc[missing, "month"].map(monthly_item)
        result.loc[missing] = monthly_values

    missing = result.isna()
    if missing.any():
        fallback = item_default
        if np.isnan(fallback):
            fallback = series.median()
        result.loc[missing] = fallback

    smoothed = _smooth_outliers(result)

    imputed_flags = series.isna() & smoothed.notna()
    adjusted_flags = ~series.isna() & (smoothed != series)

    output = data.reset_index()[["date", "day_of_year", "month"]].copy()
    output["price"] = smoothed.values
    output["was_imputed"] = (
        imputed_flags.reindex(output["date"]).fillna(False).astype(bool).values
    )
    output["was_adjusted"] = (
        adjusted_flags.reindex(output["date"]).fillna(False).astype(bool).values
    )
    return output


def _smooth_outliers(series: pd.Series) -> pd.Series:
    values = series.copy()
    window = 7
    rolling_median = values.rolling(window, center=True, min_periods=3).median()
    rolling_mad = (values - rolling_median).abs().rolling(window, center=True, min_periods=3).median()

    for idx in range(1, len(values) - 1):
        current = values.iloc[idx]
        if pd.isna(current):
            continue

        local_median = rolling_median.iloc[idx]
        if pd.isna(local_median):
            continue

        local_mad = rolling_mad.iloc[idx]
        if pd.isna(local_mad) or local_mad == 0:
            local_mad = max(0.1 * abs(local_median), 1.0)

        deviation = abs(current - local_median)
        threshold = 3 * local_mad

        prev_val = values.iloc[idx - 1]
        next_val = values.iloc[idx + 1]
        if pd.isna(prev_val) or pd.isna(next_val):
            continue

        neighbor_avg = (prev_val + next_val) / 2
        neighbor_span = max(abs(prev_val - local_median), abs(next_val - local_median))

        if deviation > threshold and neighbor_span < threshold / 2:
            values.iloc[idx] = neighbor_avg

    return values


def _coerce_year(label: object) -> Optional[int]:
    if isinstance(label, (int, np.integer)):
        return int(label)
    text = str(label).strip()
    if not text:
        return None
    if text.isdigit():
        return int(text)
    for token in text.replace("_", " ").split():
        if token.isdigit() and len(token) == 4:
            return int(token)
    return None


def _write_clean_csvs(
    imputed: pd.DataFrame, exports: Dict[str, Dict[str, Path]]
) -> None:
    for item, year_map in exports.items():
        item_data = imputed.loc[imputed["item"] == item]
        if item_data.empty:
            continue

        for year_key, csv_path in year_map.items():
            year = _coerce_year(year_key)
            if year is None:
                continue

            subset = item_data.loc[item_data["year"] == year]
            if subset.empty:
                continue

            sorted_subset = subset.sort_values("day_of_year")
            output = pd.DataFrame(
                {
                    "date": sorted_subset["date"].dt.strftime("%Y-%m-%d"),
                    "price": sorted_subset["price"].round(2),
                }
            )
            output.to_csv(csv_path, index=False)

        written_years = {
            _coerce_year(year_key)
            for year_key in year_map.keys()
            if _coerce_year(year_key) is not None
        }

        extra_years = sorted(
            year
            for year in set(item_data["year"].unique())
            if pd.notna(year) and int(year) not in written_years
        )
        if not extra_years:
            continue

        sheet_dir = (
            next(iter(year_map.values())).parent
            if year_map
            else CLEAN_ROOT / _safe_folder_name(item)
        )
        sheet_dir.mkdir(parents=True, exist_ok=True)

        for year in extra_years:
            subset = item_data.loc[item_data["year"] == year]
            if subset.empty:
                continue
            sorted_subset = subset.sort_values("day_of_year")
            output_path = sheet_dir / f"{int(year)}.csv"
            output = pd.DataFrame(
                {
                    "date": sorted_subset["date"].dt.strftime("%Y-%m-%d"),
                    "price": sorted_subset["price"].round(2),
                }
            )
            output.to_csv(output_path, index=False)


def _export_mobile_json(df: pd.DataFrame) -> None:
    monthly_labels = {idx: calendar.month_abbr[idx] for idx in range(1, 13)}
    items_payload = []

    for item_name, item_group in df.groupby("item"):
        year_payload = []
        for year, year_group in item_group.groupby("year"):
            monthly_prices = (
                year_group.groupby("month")["price"].mean().reindex(range(1, 13))
            )
            months_payload = []
            for month in range(1, 13):
                price = monthly_prices.iloc[month - 1]
                months_payload.append(
                    {
                        "month": month,
                        "label": monthly_labels[month],
                        "price": round(float(price), 2) if pd.notna(price) else None,
                    }
                )
            year_payload.append({"year": int(year), "months": months_payload})
        year_payload.sort(key=lambda entry: entry["year"])
        items_payload.append({"name": item_name, "years": year_payload})

    items_payload.sort(key=lambda entry: entry["name"].lower())
    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "items": items_payload,
    }

    MOBILE_JSON.parent.mkdir(parents=True, exist_ok=True)
    with MOBILE_JSON.open("w", encoding="utf-8") as stream:
        json.dump(payload, stream, indent=2)


def _rebuild_calendar_dates(df: pd.DataFrame) -> pd.DataFrame:
    rebuilt = df.copy()
    base_dates = pd.to_datetime(rebuilt["year"].astype(str) + "-01-01")
    rebuilt["date"] = base_dates + pd.to_timedelta(rebuilt["day_of_year"].astype(int) - 1, unit="D")
    rebuilt["month"] = rebuilt["date"].dt.month
    return rebuilt


def _apply_future_cutoff(df: pd.DataFrame) -> pd.DataFrame:
    observed = _load_daily_index_records()
    if observed.empty:
        baseline_cutoff = pd.Timestamp(2025, 11, 1)
    else:
        last_date = observed["date"].max()
        baseline_cutoff = last_date + pd.Timedelta(days=1)

    mask = (df["date"] >= baseline_cutoff) & (df["year"] == baseline_cutoff.year)
    if mask.any():
        df = df.copy()
        df.loc[mask, "price"] = np.nan
        df.loc[mask, "was_imputed"] = False
        df.loc[mask, "was_adjusted"] = False
    return df


def _merge_official_prices(df: pd.DataFrame) -> pd.DataFrame:
    observed = _load_daily_index_records()
    if observed.empty:
        return df

    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    df["item"] = df["item"].astype(str)

    merged = df.set_index(["item", "date"])
    new_rows: list[dict[str, object]] = []

    for record in observed.itertuples(index=False):
        key = (record.item, record.date)
        if key in merged.index:
            merged.loc[key, "price"] = record.price
            merged.loc[key, "was_imputed"] = False
            merged.loc[key, "was_adjusted"] = False
            continue
        new_rows.append(
            {
                "item": record.item,
                "date": record.date,
                "price": record.price,
                "was_imputed": False,
                "was_adjusted": False,
                "year": record.date.year,
                "day_of_year": record.date.timetuple().tm_yday,
                "month": record.date.month,
            }
        )

    merged = merged.reset_index()
    if new_rows:
        merged = pd.concat([merged, pd.DataFrame(new_rows)], ignore_index=True)

    return merged


def _load_daily_index_records() -> pd.DataFrame:
    if not DA_DAILY_DIR.exists():
        return pd.DataFrame(columns=["item", "date", "price"])

    records: list[dict[str, object]] = []

    for path in sorted(DA_DAILY_DIR.glob("*.pdf")):
        date_value = _date_from_filename(path.name)
        if date_value is None:
            continue

        for item, price in _iter_daily_index_rows(path):
            if price is None:
                continue
            records.append(
                {
                    "item": item,
                    "date": pd.Timestamp(date_value),
                    "price": price,
                }
            )

    if not records:
        return pd.DataFrame(columns=["item", "date", "price"])

    observed = pd.DataFrame(records)
    observed = observed.groupby(["item", "date"], as_index=False)["price"].mean()
    return observed


def _iter_daily_index_rows(path: Path):
    with pdfplumber.open(path) as pdf:
        current_category: Optional[str] = None

        for page in pdf.pages:
            tables = page.extract_tables()
            if not tables:
                continue
            table = tables[0]
            for raw_row in table:
                cells = [
                    (cell or "").replace("\n", " ").strip()
                    for cell in raw_row
                    if (cell or "").strip()
                ]

                if not cells:
                    continue

                header = cells[0].upper()
                if header.startswith("COMMODITY") or header.startswith("PREVAILING"):
                    continue

                if len(cells) == 1 and header.isupper():
                    current_category = header
                    continue

                if current_category is None:
                    continue

                commodity = cells[0]
                specification = cells[1] if len(cells) > 2 else ""
                price_text = cells[-1]
                price = _coerce_price(price_text)
                item = _map_daily_index_item(current_category, commodity, specification)

                if item and price is not None:
                    yield item, price


def _map_daily_index_item(category: str, commodity: str, specification: str) -> Optional[str]:
    cat = category.upper().strip()
    com = commodity.upper().strip()
    spec = (specification or "").upper()

    for map_cat, map_com, spec_hint, item in DA_MAPPING:
        if cat != map_cat:
            continue
        if com != map_com:
            continue
        if spec_hint and spec_hint not in spec:
            continue
        return item

    # fallback by ignoring category when unique
    for map_cat, map_com, spec_hint, item in DA_MAPPING:
        if map_cat:
            continue
        if com != map_com:
            continue
        if spec_hint and spec_hint not in spec:
            continue
        return item
    return None


def _coerce_price(value: str) -> Optional[float]:
    cleaned = value.replace(",", "").replace("₱", "").strip().lower()
    if not cleaned or cleaned in {"n/a", "na", "-", "--"}:
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


def _date_from_filename(name: str) -> Optional[datetime]:
    match = re.search(r"(\d{4})-(\d{2})-(\d{2})", name)
    if match:
        return datetime.strptime(match.group(0), "%Y-%m-%d").date()

    match = re.search(r"(january|february|march|april|may|june|july|august|september|october|november|december)-(\d{1,2})-(\d{4})", name, re.IGNORECASE)
    if match:
        month_name, day, year = match.groups()
        month = datetime.strptime(month_name[:3], "%b").month
        return datetime(int(year), month, int(day)).date()

    return None


def main() -> None:
    path = impute_prices()
    print(f"Imputed price workbook written to '{path}'.")


if __name__ == "__main__":
    main()


__all__ = ["impute_prices", "main"]

