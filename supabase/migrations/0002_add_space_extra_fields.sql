-- ============================================================================
-- Somespai — add missing columns to spaces
-- Adds: price_unit, contact_url, rating, reviews_count
-- Adds: lat/lng as generated columns extracted from PostGIS geography point
-- ============================================================================

ALTER TABLE spaces
  ADD COLUMN IF NOT EXISTS price_unit text NOT NULL DEFAULT 'month'
    CHECK (price_unit IN ('month', 'day', 'hour')),
  ADD COLUMN IF NOT EXISTS contact_url text,
  ADD COLUMN IF NOT EXISTS rating numeric(3,2) NOT NULL DEFAULT 0
    CHECK (rating >= 0 AND rating <= 5),
  ADD COLUMN IF NOT EXISTS reviews_count integer NOT NULL DEFAULT 0
    CHECK (reviews_count >= 0);

-- Generated stored columns: automatically extracted from the geography point.
-- st_x = longitude, st_y = latitude (standard WGS-84 order).
ALTER TABLE spaces
  ADD COLUMN IF NOT EXISTS lat double precision
    GENERATED ALWAYS AS (st_y(location::geometry)) STORED,
  ADD COLUMN IF NOT EXISTS lng double precision
    GENERATED ALWAYS AS (st_x(location::geometry)) STORED;
