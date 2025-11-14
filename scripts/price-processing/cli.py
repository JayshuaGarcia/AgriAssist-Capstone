"""Command-line interface for the Excel Price Manager."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

import pandas as pd
import typer
from rich.console import Console
from rich.table import Table

from .data_store import (
    PriceRecord,
    compare_years,
    filter_by_item,
    filter_by_year,
    load_prices,
    summarize_by_item,
    upsert_records,
)


app = typer.Typer(add_completion=False, no_args_is_help=True, help=__doc__)
console = Console()


def _dataset_or_exit(path: Path) -> pd.DataFrame:
    try:
        return load_prices(path, create_if_missing=True)
    except ValueError as exc:  # schema issues
        typer.secho(f"Error: {exc}", fg=typer.colors.RED)
        raise typer.Exit(code=1) from exc


@app.command()
def summary(input_path: Path = typer.Argument(..., exists=False, file_okay=True)) -> None:
    """Show per-item price statistics."""

    df = _dataset_or_exit(input_path)
    if df.empty:
        console.print("[yellow]No data found. Use the add command to insert rows.")
        raise typer.Exit(code=0)

    summary_df = summarize_by_item(df)
    table = Table(title="Price Summary", show_lines=False)
    for column in summary_df.columns:
        table.add_column(column.replace("_", " ").title(), justify="right")

    for _, row in summary_df.iterrows():
        table.add_row(*(f"{value:.2f}" if isinstance(value, float) else str(value) for value in row))

    console.print(table)


@app.command()
def add(
    input_path: Path = typer.Argument(..., help="Excel file to update"),
    item: str = typer.Option(..., prompt=True, help="Product or service name"),
    year: int = typer.Option(..., prompt=True, help="Calendar year"),
    price: float = typer.Option(..., prompt=True, help="Price for the specified year"),
    currency: str = typer.Option("USD", prompt=False, help="ISO currency code"),
) -> None:
    """Insert or update a price observation."""

    record = PriceRecord(item=item, year=year, price=price, currency=currency)
    dataset = upsert_records(input_path, [record])
    console.print(
        f"[green]Record saved[/green] for [bold]{record.item}[/bold] ({record.currency}) in {record.year}: {record.price:.2f}"
    )
    console.print(f"Dataset now contains {len(dataset)} rows.")


@app.command()
def compare(
    input_path: Path = typer.Argument(..., help="Excel file to read"),
    base_year: int = typer.Option(..., help="Year used as the comparison baseline"),
    target_year: int = typer.Option(..., help="Year to compare against the baseline"),
) -> None:
    """Show price deltas between two years."""

    df = _dataset_or_exit(input_path)
    if df.empty:
        console.print("[yellow]Dataset is empty; nothing to compare.")
        raise typer.Exit(code=0)

    try:
        comparison = compare_years(df, base_year=base_year, target_year=target_year)
    except ValueError as exc:
        typer.secho(str(exc), fg=typer.colors.RED)
        raise typer.Exit(code=1) from exc

    table = Table(title=f"Comparison: {base_year} → {target_year}")
    for column in comparison.columns:
        table.add_column(column.replace("_", " ").title(), justify="right")

    for _, row in comparison.iterrows():
        table.add_row(
            str(row["item"]),
            f"{row[base_year]:.2f}",
            f"{row[target_year]:.2f}",
            f"{row['delta']:.2f}",
            f"{row['pct_change']:.2f}%",
        )

    console.print(table)


@app.command()
def year(
    input_path: Path = typer.Argument(..., help="Excel file to read"),
    value: int = typer.Argument(..., help="Year to filter by"),
) -> None:
    """List all items for a specific year."""

    df = _dataset_or_exit(input_path)
    filtered = filter_by_year(df, value)
    if filtered.empty:
        console.print(f"[yellow]No records found for year {value}.")
        raise typer.Exit()

    table = Table(title=f"Prices in {value}")
    for column in filtered.columns:
        table.add_column(column.title())

    for _, row in filtered.iterrows():
        table.add_row(*(str(row[col]) for col in filtered.columns))
    console.print(table)


@app.command()
def item(
    input_path: Path = typer.Argument(..., help="Excel file to read"),
    name: str = typer.Argument(..., help="Item name to inspect"),
) -> None:
    """Show price history for a single item."""

    df = _dataset_or_exit(input_path)
    filtered = filter_by_item(df, name)
    if filtered.empty:
        console.print(f"[yellow]No records found for item '{name}'.")
        raise typer.Exit()

    table = Table(title=f"History for {name}")
    for column in filtered.columns:
        table.add_column(column.title())

    for _, row in filtered.iterrows():
        table.add_row(*(str(row[col]) for col in filtered.columns))

    console.print(table)


def main() -> None:
    app()


if __name__ == "__main__":  # pragma: no cover
    main()

