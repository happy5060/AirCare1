-- =============================================================================
-- Migration: 20261111000002_rls_security_policies.sql
-- Description: Row Level Security (RLS) Policies for AirCare
-- Principles: Public Read-Only for Dashboards, Zero Anonymous Writes, Service-Role Writes
-- =============================================================================

-- 1. Enable Row Level Security on all tables
ALTER TABLE air_quality_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE aqi_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_evaluations ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2. Security Policies for: air_quality_readings
-- -----------------------------------------------------------------------------

-- Public Read Policy: Allow anyone (anon + authenticated) to query air quality readings
DROP POLICY IF EXISTS "Public read access for air_quality_readings" ON air_quality_readings;
CREATE POLICY "Public read access for air_quality_readings"
    ON air_quality_readings
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Explicitly ensure that anon and authenticated roles CANNOT INSERT
-- (PostgreSQL RLS default denies any action not covered by a policy, but we document it)
-- Only service_role (which bypasses RLS in Supabase) or authorized backend roles can write.

-- -----------------------------------------------------------------------------
-- 3. Security Policies for: aqi_predictions
-- -----------------------------------------------------------------------------

-- Public Read Policy: Allow anyone to view published predictions on dashboards
DROP POLICY IF EXISTS "Public read access for aqi_predictions" ON aqi_predictions;
CREATE POLICY "Public read access for aqi_predictions"
    ON aqi_predictions
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- -----------------------------------------------------------------------------
-- 4. Security Policies for: prediction_evaluations
-- -----------------------------------------------------------------------------

-- Public Read Policy: Allow transparent audit of model evaluation metrics
DROP POLICY IF EXISTS "Public read access for prediction_evaluations" ON prediction_evaluations;
CREATE POLICY "Public read access for prediction_evaluations"
    ON prediction_evaluations
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- -----------------------------------------------------------------------------
-- Optional: Explicit policy for service_role if RLS bypass is ever disabled
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Service role write access for air_quality_readings" ON air_quality_readings;
CREATE POLICY "Service role write access for air_quality_readings"
    ON air_quality_readings
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role write access for aqi_predictions" ON aqi_predictions;
CREATE POLICY "Service role write access for aqi_predictions"
    ON aqi_predictions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role write access for prediction_evaluations" ON prediction_evaluations;
CREATE POLICY "Service role write access for prediction_evaluations"
    ON prediction_evaluations
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

