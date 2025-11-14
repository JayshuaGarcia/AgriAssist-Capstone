"""
Fetch the latest Daily Price Index PDFs and refresh the cleaned datasets.

Usage
-----
    python scripts/daily_price_sync.py

Options
-------
    --lookback DAYS   Number of days (from today) to consider when fetching
                      PDFs. Defaults to 14.
    --force           Force re-download even when the PDF already exists.
"""

from __future__ import annotations

import argparse
import sys
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Iterable, List, Tuple
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.price_manager.impute_prices import DA_DAILY_DIR, impute_prices  # noqa: E402
from src.price_manager.forecast import generate_forecasts  # noqa: E402
from src.price_manager.export_current_prices import export_current_prices  # noqa: E402

DA_PRICE_MONITORING_URL = "https://www.da.gov.ph/price-monitoring/"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; price-sync/1.0)"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--lookback",
        type=int,
        default=14,
        help="Number of days before today to consider when pulling PDFs.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-download PDFs even if they already exist locally.",
    )
    return parser.parse_args()


def fetch_daily_links() -> List[Tuple[date, str]]:
    response = requests.get(DA_PRICE_MONITORING_URL, headers=HEADERS, timeout=30)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    table = soup.select_one("#tablepress-112 tbody")
    if table is None:
        raise RuntimeError("Unable to locate Daily Price Index table on DA website.")

    rows: List[Tuple[date, str]] = []
    for row in table.find_all("tr"):
        link = row.find("a")
        if not link or not link.get_text(strip=True):
            continue
        date_text = link.get_text(strip=True)
        try:
            parsed_date = datetime.strptime(date_text, "%B %d, %Y").date()
        except ValueError:
            # Skip rows with unexpected labels such as pagination controls
            continue
        href = link["href"]
        rows.append((parsed_date, href))

    return rows


def ensure_directory(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def download_pdfs(
    links: Iterable[Tuple[date, str]],
    *,
    lookback_days: int,
    force: bool = False,
) -> int:
    ensure_directory(DA_DAILY_DIR)
    today = date.today()
    cutoff = today - timedelta(days=lookback_days)

    downloaded = 0
    for file_date, href in links:
        if file_date < cutoff:
            continue

        filename = Path(urlparse(href).path).name or f"daily-price-index-{file_date}.pdf"
        destination = DA_DAILY_DIR / filename

        if destination.exists() and not force:
            continue

        response = requests.get(href, headers=HEADERS, timeout=60)
        response.raise_for_status()
        destination.write_bytes(response.content)
        downloaded += 1
        print(f"Downloaded {filename}")

    return downloaded


def main() -> None:
    args = parse_args()
    print("Fetching latest Daily Price Index links…")
    links = fetch_daily_links()
    print(f"Found {len(links)} entries on the DA website.")

    downloaded = download_pdfs(
        links,
        lookback_days=args.lookback,
        force=args.force,
    )
    if downloaded == 0:
        print("No new PDFs downloaded (already up to date).")
    else:
        print(f"Downloaded {downloaded} new PDF file(s).")

    print("Rebuilding cleaned datasets…")
    impute_prices()
    print("Updating forecasts…")
    generate_forecasts()
    print("Exporting current prices…")
    export_current_prices()
    print("Finished refreshing price datasets and mobile JSON.")


if __name__ == "__main__":
    main()

