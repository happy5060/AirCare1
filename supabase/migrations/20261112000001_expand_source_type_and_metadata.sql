-- =============================================================================
-- Migration: 20261112000001_expand_source_type_and_metadata.sql
-- Description: Phase 3 Schema Extension for Archived Forecasts, Meteorology &
--              Structured Model-Derived Rolling Averages
-- Principles: Non-destructive with documented rollback limitations, Strict Provenance Demarcation
-- =============================================================================

-- =============================================================================
-- 1. Expand source_type CHECK constraint
-- =============================================================================
-- Live operational runs: 'atmospheric_model'
-- Physical ground stations: 'physical_station'
-- Archived operational runs: 'archived_forecast' (Open-Meteo CAMS Global past_days)
-- Retrospective reanalysis: 'historical_reanalysis' (ERA5 / CAMS EAC4 multi-decadal)

ALTER TABLE air_quality_readings
    DROP CONSTRAINT IF EXISTS air_quality_readings_source_type_check;

ALTER TABLE air_quality_readings
    ADD CONSTRAINT air_quality_readings_source_type_check
    CHECK (source_type IN (
        'atmospheric_model',
        'physical_station',
        'archived_forecast',
        'historical_reanalysis'
    ));

-- =============================================================================
-- 2. Allow NULL for Composite AQI Fields on Insufficient Criteria Pollutants
-- =============================================================================
-- CPCB NAQI mandates >= 3 criteria pollutants with >= 1 particulate fraction (PM2.5 or PM10).
-- When criteria are unfulfilled, composite AQI, category, and dominant pollutant must evaluate to NULL
-- while raw concentrations and individual pollutant sub-indices are preserved.

ALTER TABLE air_quality_readings
    ALTER COLUMN estimated_aqi DROP NOT NULL,
    ALTER COLUMN aqi_category DROP NOT NULL,
    ALTER COLUMN dominant_pollutant DROP NOT NULL;

-- =============================================================================
-- 3. Add Structured Meteorological & Dispersion Columns
-- =============================================================================
-- Sourced from Open-Meteo operational numerical weather archive.
-- Enables direct relational filtering, indexing, and ML feature extraction.

ALTER TABLE air_quality_readings
    ADD COLUMN IF NOT EXISTS temperature_c NUMERIC(5, 2)
        CHECK (temperature_c IS NULL OR (temperature_c >= -50 AND temperature_c <= 65)),
    ADD COLUMN IF NOT EXISTS relative_humidity_pct NUMERIC(5, 2)
        CHECK (relative_humidity_pct IS NULL OR (relative_humidity_pct >= 0 AND relative_humidity_pct <= 100)),
    ADD COLUMN IF NOT EXISTS wind_speed_10m_ms NUMERIC(5, 2)
        CHECK (wind_speed_10m_ms IS NULL OR wind_speed_10m_ms >= 0),
    ADD COLUMN IF NOT EXISTS boundary_layer_height_m NUMERIC(8, 2)
        CHECK (boundary_layer_height_m IS NULL OR boundary_layer_height_m >= 0),
    ADD COLUMN IF NOT EXISTS ventilation_coefficient_m2s NUMERIC(10, 2)
        CHECK (ventilation_coefficient_m2s IS NULL OR ventilation_coefficient_m2s >= 0);

-- =============================================================================
-- 4. Add Structured Model-Derived Rolling Average Columns
-- =============================================================================
-- Distinguishes instantaneous observations (stored in raw pm2_5, pm10, etc.)
-- from rolling window averages without trapping derived metrics inside JSONB.
-- NOTE: Labelled 'model_derived' — NOT certified CPCB regulatory 24-hr bulletins.

ALTER TABLE air_quality_readings
    ADD COLUMN IF NOT EXISTS rolling_24h_pm2_5 NUMERIC(8, 2)
        CHECK (rolling_24h_pm2_5 IS NULL OR rolling_24h_pm2_5 >= 0),
    ADD COLUMN IF NOT EXISTS rolling_24h_pm10 NUMERIC(8, 2)
        CHECK (rolling_24h_pm10 IS NULL OR rolling_24h_pm10 >= 0),
    ADD COLUMN IF NOT EXISTS rolling_24h_no2 NUMERIC(8, 2)
        CHECK (rolling_24h_no2 IS NULL OR rolling_24h_no2 >= 0),
    ADD COLUMN IF NOT EXISTS rolling_24h_so2 NUMERIC(8, 2)
        CHECK (rolling_24h_so2 IS NULL OR rolling_24h_so2 >= 0),
    ADD COLUMN IF NOT EXISTS rolling_8h_co NUMERIC(8, 2)
        CHECK (rolling_8h_co IS NULL OR rolling_8h_co >= 0),
    ADD COLUMN IF NOT EXISTS rolling_8h_o3 NUMERIC(8, 2)
        CHECK (rolling_8h_o3 IS NULL OR rolling_8h_o3 >= 0),
    ADD COLUMN IF NOT EXISTS derived_rolling_aqi INTEGER
        CHECK (derived_rolling_aqi IS NULL OR (derived_rolling_aqi >= 0 AND derived_rolling_aqi <= 500)),
    ADD COLUMN IF NOT EXISTS derived_rolling_category VARCHAR(50)
        CHECK (derived_rolling_category IS NULL OR derived_rolling_category IN ('Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor', 'Severe'));

-- =============================================================================
-- 5. Indexing for High-Performance Historical & ML Retrieval
-- =============================================================================
-- NOTE ON INDEX DEDUPLICATION:
-- uq_city_source_observed UNIQUE (city, source, observed_at) already generates
-- a unique B-Tree index covering (city, source, observed_at). A redundant index
-- on (city, source, observed_at DESC) has been intentionally omitted.

CREATE INDEX IF NOT EXISTS idx_readings_source_type_observed
    ON air_quality_readings (source_type, observed_at DESC);

-- =============================================================================
-- 6. Comments for Data Governance & Schema Reflection
-- =============================================================================
COMMENT ON COLUMN air_quality_readings.source_type IS 'Atmospheric data provenance: physical_station (ground sensors), atmospheric_model (live CAMS), archived_forecast (past CAMS forecast archive), historical_reanalysis (ERA5/EAC4).';
COMMENT ON COLUMN air_quality_readings.temperature_c IS 'Ambient 2-meter air temperature (°C) from Open-Meteo operational weather archive.';
COMMENT ON COLUMN air_quality_readings.relative_humidity_pct IS '2-meter relative humidity (%) from Open-Meteo operational weather archive.';
COMMENT ON COLUMN air_quality_readings.wind_speed_10m_ms IS 'Wind speed at 10 meters (m/s) from Open-Meteo operational weather archive.';
COMMENT ON COLUMN air_quality_readings.boundary_layer_height_m IS 'Planetary Boundary Layer Height (PBLH) in meters from Open-Meteo operational weather archive.';
COMMENT ON COLUMN air_quality_readings.ventilation_coefficient_m2s IS 'Ventilation Coefficient Vc = PBLH * WindSpeed (m²/s), representing atmospheric pollutant dispersion capacity.';
COMMENT ON COLUMN air_quality_readings.rolling_24h_pm2_5 IS 'Model-derived 24-hour rolling arithmetic mean of PM2.5 (µg/m³). Not an official regulatory CPCB station average.';
COMMENT ON COLUMN air_quality_readings.rolling_24h_pm10 IS 'Model-derived 24-hour rolling arithmetic mean of PM10 (µg/m³).';
COMMENT ON COLUMN air_quality_readings.derived_rolling_aqi IS 'Estimated NAQI derived from multi-hour rolling concentrations. Distinct from instantaneous estimated_aqi.';
COMMENT ON COLUMN air_quality_readings.model_or_source_metadata IS 'JSONB document storing deep provenance: model parameters, grid resolution, sampling assumptions (verified vs assumed vs unknown), and retrospective rolling window diagnostics.';

-- =============================================================================
-- 7. ROLLBACK GOVERNANCE & STEP-BY-STEP REVERSION PROCEDURES
-- =============================================================================
--
-- IMPORTANT SAFETY NOTICE:
-- AirCare enforces strict preservation of environmental data.
-- Under NO circumstances should rollback procedures automatically execute:
--   DELETE FROM air_quality_readings WHERE source_type = 'archived_forecast';
-- Ingested historical observations represent computational and scientific assets.
--
-- BACKUP TABLE SYNCHRONIZATION CAVEAT:
-- If an archival backup table `air_quality_readings_archived_backup` is created,
-- it represents a STATIC point-in-time snapshot. It is NOT a live materialized view
-- and will NOT be automatically refreshed, synced, or updated with future inserts.
--
-- SCENARIO A: PRE-INGESTION ROLLBACK (Safe immediately after applying migration
--             when NO 'archived_forecast' records exist):
--
--   -- 1. Drop newly created index
--   DROP INDEX IF EXISTS idx_readings_source_type_observed;
--
--   -- 2. Drop newly added meteorological and rolling columns
--   ALTER TABLE air_quality_readings
--       DROP COLUMN IF EXISTS temperature_c,
--       DROP COLUMN IF EXISTS relative_humidity_pct,
--       DROP COLUMN IF EXISTS wind_speed_10m_ms,
--       DROP COLUMN IF EXISTS boundary_layer_height_m,
--       DROP COLUMN IF EXISTS ventilation_coefficient_m2s,
--       DROP COLUMN IF EXISTS rolling_24h_pm2_5,
--       DROP COLUMN IF EXISTS rolling_24h_pm10,
--       DROP COLUMN IF EXISTS rolling_24h_no2,
--       DROP COLUMN IF EXISTS rolling_24h_so2,
--       DROP COLUMN IF EXISTS rolling_8h_co,
--       DROP COLUMN IF EXISTS rolling_8h_o3,
--       DROP COLUMN IF EXISTS derived_rolling_aqi,
--       DROP COLUMN IF EXISTS derived_rolling_category;
--
--   -- 3. Restore original source_type CHECK constraint
--   ALTER TABLE air_quality_readings DROP CONSTRAINT IF EXISTS air_quality_readings_source_type_check;
--   ALTER TABLE air_quality_readings ADD CONSTRAINT air_quality_readings_source_type_check
--       CHECK (source_type IN ('atmospheric_model', 'physical_station'));
--
--   -- 4. Restore NOT NULL constraints (verify no NULLs exist in live rows first)
--   ALTER TABLE air_quality_readings
--       ALTER COLUMN estimated_aqi SET NOT NULL,
--       ALTER COLUMN aqi_category SET NOT NULL,
--       ALTER COLUMN dominant_pollutant SET NOT NULL;
--
--
-- SCENARIO B: POST-INGESTION ROLLBACK LIMITATIONS & SAFE ISOLATION:
--
--   If historical records with source_type = 'archived_forecast' have ALREADY been inserted:
--   1. Limitation: Attempting to re-apply the CHECK constraint `source_type IN ('atmospheric_model', 'physical_station')`
--      will FAIL immediately with a check_violation error (PostgreSQL error code 23514) because rows with
--      source_type = 'archived_forecast' already exist.
--   2. Limitation: Executing `DROP COLUMN temperature_c`, `DROP COLUMN rolling_24h_pm2_5`, etc., will
--      permanently destroy all collected meteorological and rolling average records.
--   3. Required Safe Procedure:
--      a) Export or backup historical data to an isolated table prior to any structural modifications:
--         CREATE TABLE IF NOT EXISTS air_quality_readings_archived_backup AS
--             SELECT * FROM air_quality_readings WHERE source_type = 'archived_forecast';
--         (Note: air_quality_readings_archived_backup is a static point-in-time snapshot and does not auto-refresh).
--      b) If complete removal of archived data is explicitly authorized by the project lead:
--         -- Manual, explicit deletion step only after backup verification:
--         -- DELETE FROM air_quality_readings WHERE source_type = 'archived_forecast';
--      c) Only after all 'archived_forecast' rows are removed can Scenario A steps be executed.
--      d) If data preservation is desired while disabling schema extensions, simply retain the columns
--         (they remain fully backwards-compatible and live collector rows leave them as NULL).
