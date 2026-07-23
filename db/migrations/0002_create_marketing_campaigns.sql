-- Migration: 0002_create_marketing_campaigns
-- Creates the marketing_campaigns table and supporting indexes.

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
