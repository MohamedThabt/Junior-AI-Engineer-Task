"""One-time (re-runnable) seeder — reads the two source Excel files and loads
their data into the SQLite database.

Usage::

    python -m db.seed_database
"""

from pathlib import Path

import pandas as pd

from db.database import get_connection, init_db

# Resolve data directory relative to the project root.
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
_DATA_DIR = _PROJECT_ROOT / "data"

_RE_FILE = _DATA_DIR / "Real Estate Listings.xlsx"
_MC_FILE = _DATA_DIR / "Marketing Campaigns.xlsx"

# Column rename maps: Excel column → SQLite column.
_RE_COLUMN_MAP = {
    "Listing ID": "listing_id",
    "Property Type": "property_type",
    "City": "city",
    "State": "state",
    "Bedrooms": "bedrooms",
    "Bathrooms": "bathrooms",
    "Square Footage": "square_footage",
    "Year Built": "year_built",
    "List Price": "list_price",
    "Sale Price": "sale_price",
    "Listing Status": "listing_status",
}

_MC_COLUMN_MAP = {
    "Campaign ID": "campaign_id",
    "Campaign Name": "campaign_name",
    "Channel": "channel",
    "Start Date": "start_date",
    "End Date": "end_date",
    "Budget Allocated": "budget_allocated",
    "Amount Spent": "amount_spent",
    "Impressions": "impressions",
    "Clicks": "clicks",
    "Conversions": "conversions",
    "Revenue Generated": "revenue_generated",
}


# ---------------------------------------------------------------------------
# Cleaning helpers
# ---------------------------------------------------------------------------

def _strip_currency(series: pd.Series) -> pd.Series:
    """Remove ``$`` and ``,`` from a string-typed currency column and cast to float."""
    return (
        series.astype(str)
        .str.replace("$", "", regex=False)
        .str.replace(",", "", regex=False)
        .apply(lambda v: None if v in ("", "nan", "None") else float(v))
    )


def _strip_thousands(series: pd.Series) -> pd.Series:
    """Remove ``,`` thousands separator and cast to int."""
    return (
        series.astype(str)
        .str.replace(",", "", regex=False)
        .apply(lambda v: None if v in ("", "nan", "None") else int(float(v)))
    )


def _parse_dates(series: pd.Series) -> pd.Series:
    """Parse ``MM/DD/YYYY`` strings into ISO ``YYYY-MM-DD`` using pandas."""
    return pd.to_datetime(series, format="%m/%d/%Y", errors="coerce").dt.strftime(
        "%Y-%m-%d"
    )


# ---------------------------------------------------------------------------
# Seeding logic
# ---------------------------------------------------------------------------

def _seed_real_estate(conn) -> int:
    """Read, clean, and insert Real Estate Listings into SQLite. Returns row count."""
    df = pd.read_excel(_RE_FILE, engine="openpyxl")
    df.rename(columns=_RE_COLUMN_MAP, inplace=True)

    # Keep only mapped columns (ignore any extras).
    df = df[[c for c in _RE_COLUMN_MAP.values() if c in df.columns]]

    # Cleaning rules per spec §3.1.
    df["square_footage"] = _strip_thousands(df["square_footage"])
    df["list_price"] = _strip_currency(df["list_price"])
    df["sale_price"] = _strip_currency(df["sale_price"])

    # Cast integer columns explicitly.
    df["bedrooms"] = df["bedrooms"].apply(
        lambda v: None if pd.isna(v) else int(v)
    )
    df["year_built"] = df["year_built"].apply(
        lambda v: None if pd.isna(v) else int(v)
    )

    # Insert or replace.
    cols = list(df.columns)
    placeholders = ", ".join("?" for _ in cols)
    col_names = ", ".join(cols)
    sql = f"INSERT OR REPLACE INTO real_estate_listings ({col_names}) VALUES ({placeholders})"

    for _, row in df.iterrows():
        values = [None if pd.isna(v) else v for v in row[cols]]
        conn.execute(sql, values)

    conn.commit()
    return len(df)


def _seed_marketing(conn) -> int:
    """Read, clean, and insert Marketing Campaigns into SQLite. Returns row count."""
    df = pd.read_excel(_MC_FILE, engine="openpyxl")
    df.rename(columns=_MC_COLUMN_MAP, inplace=True)

    df = df[[c for c in _MC_COLUMN_MAP.values() if c in df.columns]]

    # Cleaning rules per spec §3.2.
    df["budget_allocated"] = _strip_currency(df["budget_allocated"])
    df["amount_spent"] = _strip_currency(df["amount_spent"])
    df["revenue_generated"] = _strip_currency(df["revenue_generated"])
    df["impressions"] = _strip_thousands(df["impressions"])
    df["clicks"] = _strip_thousands(df["clicks"])
    df["conversions"] = _strip_thousands(df["conversions"])

    # Parse dates.
    df["start_date"] = _parse_dates(df["start_date"])
    df["end_date"] = _parse_dates(df["end_date"])

    cols = list(df.columns)
    placeholders = ", ".join("?" for _ in cols)
    col_names = ", ".join(cols)
    sql = f"INSERT OR REPLACE INTO marketing_campaigns ({col_names}) VALUES ({placeholders})"

    for _, row in df.iterrows():
        values = [None if pd.isna(v) else v for v in row[cols]]
        conn.execute(sql, values)

    conn.commit()
    return len(df)


def seed(conn=None) -> None:
    """Run the full seeding pipeline.

    Parameters
    ----------
    conn:
        Optional pre-existing connection (for tests). When *None*, uses the
        default ``db/app.db``.
    """
    own_conn = conn is None
    if own_conn:
        conn = get_connection()

    try:
        # Ensure schema exists.
        init_db(conn)

        re_count = _seed_real_estate(conn)
        mc_count = _seed_marketing(conn)

        print(f"Seeded {re_count} rows into real_estate_listings.")
        print(f"Seeded {mc_count} rows into marketing_campaigns.")
    finally:
        if own_conn:
            conn.close()


if __name__ == "__main__":
    seed()
