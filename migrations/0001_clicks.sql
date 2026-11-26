-- Phase 3a click counts. Aggregates only: no IPs, user agents, cookies or visitor ids.
CREATE TABLE IF NOT EXISTS clicks (
  slug   TEXT NOT NULL,
  source TEXT NOT NULL,              -- yt | tt | fb | ig | x | direct
  day    TEXT NOT NULL,              -- YYYY-MM-DD, America/New_York
  count  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (slug, source, day)
);
