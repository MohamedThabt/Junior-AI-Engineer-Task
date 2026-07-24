# Issue #2 — Database layer: migrations & connection factory

**Status:** Complete
**Labels:** `db`
**Depends on:** #1

## Task
Implement `db/` per `docs/agent-architecture.md` §5.

## Deliverables

### `db/database.py`
- `get_connection() -> sqlite3.Connection` — returns a configured connection (row_factory = sqlite3.Row)
- `init_db()` — applies `.sql` files in `db/migrations/` in filename order; tracks applied migrations in a `_migrations` table (columns: `filename`, `applied_at`); skips already-applied files

### `db/migrations/0001_create_real_estate_listings.sql`
```sql
CREATE TABLE IF NOT EXISTS real_estate_listings (
    listing_id     TEXT PRIMARY KEY,
    property_type  TEXT,
    city           TEXT,
    state          TEXT,
    bedrooms       INTEGER,
    bathrooms      REAL,
    square_footage INTEGER,
    year_built     INTEGER,
    list_price     REAL,
    sale_price     REAL,
    listing_status TEXT,
    created_at     TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at     TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_listings_state
    ON real_estate_listings(state);

CREATE INDEX IF NOT EXISTS idx_listings_status
    ON real_estate_listings(listing_status);
```

### `db/migrations/0002_create_marketing_campaigns.sql`
```sql
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    campaign_id       TEXT PRIMARY KEY,
    campaign_name     TEXT,
    channel           TEXT,
    start_date        TEXT,
    end_date          TEXT,
    budget_allocated  REAL,
    amount_spent      REAL,
    impressions       INTEGER,
    clicks            INTEGER,
    conversions       INTEGER,
    revenue_generated REAL,
    created_at        TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at        TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_campaigns_channel
    ON marketing_campaigns(channel);
```

### `db/migrations/0003_create_chat_sessions.sql`
```sql
CREATE TABLE IF NOT EXISTS chat_sessions (
    id           TEXT PRIMARY KEY,
    session_name TEXT NOT NULL,
    context      TEXT DEFAULT '[]',
    created_at   TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at   TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### `db/seed_database.py`
- Reads the existing XLSX dataset files
- Inserts rows into `real_estate_listings` and `marketing_campaigns` using `get_connection()`
- Skips rows whose primary key already exists (idempotent re-run using INSERT OR REPLACE)
- Callable as `python -m db.seed_database` from project root
