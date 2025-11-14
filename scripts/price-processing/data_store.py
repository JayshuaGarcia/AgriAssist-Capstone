"""Utilities for loading, validating, and persisting Excel price datasets."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional

import pandas as pd
from pandas import DataFrame


WORKSHEET_NAME = "Prices"
REQUIRED_COLUMNS = ["item", "year", "currency", "price"]


@dataclass(frozen=True)
class PriceRecord:
    """One price observation for a given item and year."""

    item: str
    year: int
    currency: str
    price: float


def ensure_directory(path: Path) -> None:
    """Ensure the parent directory for *path* exists."""

    path.parent.mkdir(parents=True, exist_ok=True)


def load_prices(path: Path | str, *, create_if_missing: bool = False) -> DataFrame:
    """Load and validate a price dataset from an Excel file.

    Parameters
    ----------
    path:
        Excel file to read.
    create_if_missing:
        When ``True`` and the path does not exist, an empty, schema-valid
        ``DataFrame`` is returned.

    Returns
    -------
    pandas.DataFrame
        Normalized dataset with enforced schema.
    """

    path = Path(path)

    if not path.exists():
        if create_if_missing:
            return _empty_dataset()
        raise FileNotFoundError(f"Excel file not found: {path}")

    df = pd.read_excel(path, sheet_name=WORKSHEET_NAME, dtype={"year": int})
    return _normalize_dataset(df)


def save_prices(df: DataFrame, path: Path | str) -> None:
    """Persist the dataset to disk, enforcing schema and sorting."""

    normalized = _normalize_dataset(df)
    normalized = normalized.sort_values(by=["item", "year"], kind="mergesort")
    path = Path(path)
    ensure_directory(path)
    normalized.to_excel(path, sheet_name=WORKSHEET_NAME, index=False)


def upsert_records(path: Path | str, records: Iterable[PriceRecord]) -> DataFrame:
    """Merge the provided records into the dataset, overwriting duplicates."""

    path = Path(path)
    existing = load_prices(path, create_if_missing=True)
    incoming = _records_to_frame(records)

    if existing.empty:
        combined = incoming
    else:
        combined = pd.concat([existing, incoming], ignore_index=True)
        combined = combined.drop_duplicates(subset=["item", "year"], keep="last")

    save_prices(combined, path)
    return combined


def summarize_by_item(df: DataFrame) -> DataFrame:
    """Return aggregate statistics per item."""

    normalized = _normalize_dataset(df)
    summary = (
        normalized.groupby("item")
        .agg(
            observations=("price", "count"),
            first_year=("year", "min"),
            latest_year=("year", "max"),
            min_price=("price", "min"),
            max_price=("price", "max"),
            avg_price=("price", "mean"),
        )
        .reset_index()
        .sort_values(by="item")
    )
    return summary


def compare_years(df: DataFrame, base_year: int, target_year: int) -> DataFrame:
    """Compare price deltas for each item between two years."""

    normalized = _normalize_dataset(df)
    pivot = normalized.pivot_table(
        index="item", columns="year", values="price", aggfunc="last"
    )

    if base_year not in pivot.columns:
        raise ValueError(f"Base year {base_year} not present in dataset")
    if target_year not in pivot.columns:
        raise ValueError(f"Target year {target_year} not present in dataset")

    result = pivot[[base_year, target_year]].copy()
    result["delta"] = result[target_year] - result[base_year]
    result["pct_change"] = (result["delta"] / result[base_year]) * 100.0
    return result.reset_index()


def filter_by_item(df: DataFrame, item: str) -> DataFrame:
    """Return all rows for the requested *item*."""

    normalized = _normalize_dataset(df)
    mask = normalized["item"].str.lower() == item.lower()
    return normalized.loc[mask].sort_values(by="year")


def filter_by_year(df: DataFrame, year: int) -> DataFrame:
    """Return all rows for the requested *year*."""

    normalized = _normalize_dataset(df)
    return normalized.loc[normalized["year"] == year]


def _records_to_frame(records: Iterable[PriceRecord]) -> DataFrame:
    data = [record.__dict__ for record in records]
    if not data:
        return _empty_dataset()
    return _normalize_dataset(pd.DataFrame(data))


def _empty_dataset() -> DataFrame:
    return pd.DataFrame(columns=REQUIRED_COLUMNS)


def _normalize_dataset(df: DataFrame) -> DataFrame:
    """Ensure consistent column names, ordering, and data types."""

    renamed = df.rename(columns={orig: orig.lower() for orig in df.columns})

    missing = [col for col in REQUIRED_COLUMNS if col not in renamed.columns]
    if missing:
        raise ValueError(
            "Dataset is missing required columns: " + ", ".join(sorted(missing))
        )

    normalized = renamed[REQUIRED_COLUMNS].copy()
    normalized["item"] = normalized["item"].astype(str).str.strip()
    normalized["currency"] = normalized["currency"].astype(str).str.upper()
    normalized["year"] = normalized["year"].astype(int)
    normalized["price"] = normalized["price"].astype(float)
    return normalized

