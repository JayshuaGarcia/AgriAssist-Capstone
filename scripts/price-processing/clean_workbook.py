"""Utilities for normalizing legacy Excel price workbook into tidy CSVs."""

from __future__ import annotations

from pathlib import Path
from typing import Dict, Optional

import pandas as pd
from pandas.api import types as ptypes

RAW_WORKBOOK = Path("data/all.xlsx")
CLEAN_ROOT = Path("data/cleaned")

_NON_NUMERIC_MARKERS = {
    "",
    "n/a",
    "na",
    "none",
    "not available",
    "null",
}


def clean_workbook(
    source: Path | str = RAW_WORKBOOK,
    *,
    destination_root: Path | str = CLEAN_ROOT,
    overwrite: bool = True,
) -> Dict[str, Dict[str, Path]]:
    """Clean the raw workbook and emit per-sheet/year CSV files."""

    source_path = Path(source)
    if not source_path.exists():
        raise FileNotFoundError(f"Workbook not found: {source_path}")

    dest_root = Path(destination_root)
    dest_root.mkdir(parents=True, exist_ok=True)

    workbook = pd.ExcelFile(source_path)
    exports: Dict[str, Dict[str, Path]] = {}

    for sheet_name in workbook.sheet_names:
        sheet_df = workbook.parse(sheet_name)
        date_col = _detect_date_column(sheet_df)
        if date_col is None:
            continue

        sheet_dir = dest_root / _safe_folder_name(sheet_name)
        sheet_dir.mkdir(parents=True, exist_ok=True)

        exports[sheet_name] = {}
        dates = pd.to_datetime(sheet_df[date_col], errors="coerce")

        for column in sheet_df.columns:
            if column == date_col:
                continue

            prices = sheet_df[column].apply(_normalize_price)
            cleaned = pd.DataFrame({"date": dates, "price": prices})
            cleaned = cleaned.dropna(subset=["date"], how="all")

            output_path = sheet_dir / f"{column}.csv"
            if output_path.exists() and not overwrite:
                continue

            cleaned.to_csv(output_path, index=False)
            exports[sheet_name][str(column)] = output_path

    return exports


def _detect_date_column(df: pd.DataFrame) -> Optional[str]:
    if df.empty:
        return None

    for column in df.columns:
        if ptypes.is_datetime64_any_dtype(df[column]):
            return column

    lowered = {col: str(col).strip().lower() for col in df.columns}
    for original, lowered_name in lowered.items():
        if lowered_name in {"date", "dates"}:
            return original
    for original, lowered_name in lowered.items():
        if lowered_name in {"", "unnamed: 0"}:
            return original

    return df.columns[0]


def _normalize_price(value) -> Optional[float]:
    if pd.isna(value):
        return None
    if isinstance(value, (int, float)):
        return float(value)

    text = str(value).strip()
    if not text:
        return None

    lowered = text.lower()
    if lowered in _NON_NUMERIC_MARKERS:
        return None

    normalized = lowered.replace("–", "-").replace(",", "")
    parts = [part for part in normalized.replace(" to ", "-").split("-") if part]

    numbers = []
    for part in parts:
        try:
            numbers.append(float(part))
        except ValueError:
            continue

    if not numbers:
        return None

    return sum(numbers) / len(numbers)


def _safe_folder_name(name: str) -> str:
    sanitized = "".join(ch if ch.isalnum() or ch in "._- " else "_" for ch in name)
    sanitized = sanitized.strip().replace("  ", " ")
    return sanitized or "Sheet"


def main() -> None:
    exports = clean_workbook()
    total = sum(len(years) for years in exports.values())
    print(f"Cleaned {len(exports)} sheets into {total} CSV files under '{CLEAN_ROOT}'.")


if __name__ == "__main__":
    main()


__all__ = ["clean_workbook", "main", "_safe_folder_name", "CLEAN_ROOT"]







