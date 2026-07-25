-- Migration: 0001_create_real_estate_listings
-- Creates the real_estate_listings table and supporting indexes.

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
