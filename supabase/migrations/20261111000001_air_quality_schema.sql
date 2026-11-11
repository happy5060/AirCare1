-- =============================================================================
-- Migration: 20261111000001_air_quality_schema.sql
-- Description: Core Schema for AirCare Supabase Integration (Live Storage & ML)
-- Standards: CPCB NAQI (2014) Breakpoints & Open-Meteo Atmospheric Models
-- =============================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. Table: air_quality_readings
-- Stores persistent real-time observations and numerical atmospheric model
-- estimates for tracked Indian cities.
-- =============================================================================
CREATE TABLE IF NOT EXISTS air_quality_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city VARCHAR(100) NOT NULL,
    source VARCHAR(150) NOT NULL,
    source_type VARCHAR(50) NOT NULL DEFAULT 'atmospheric_model' 
        CHECK (source_type IN ('atmospheric_model', 'physical_station')),
    observed_at TIMESTAMPTZ NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    
    -- Criteria Pollutants (Preserved in standard CPCB reporting units)
    -- Particulate Matter (µg/m³)
    pm2_5 NUMERIC(8, 2) CHECK (pm2_5 IS NULL OR pm2_5 >= 0),
    pm10 NUMERIC(8, 2) CHECK (pm10 IS NULL OR pm10 >= 0),
    
    -- Gaseous Pollutants (µg/m³)
    no2 NUMERIC(8, 2) CHECK (no2 IS NULL OR no2 >= 0),
    so2 NUMERIC(8, 2) CHECK (so2 IS NULL OR so2 >= 0),
    o3 NUMERIC(8, 2) CHECK (o3 IS NULL OR o3 >= 0),
    
    -- Carbon Monoxide (Normalized to CPCB standard: mg/m³)
    -- Note: Open-Meteo returns CO in µg/m³. Conversion factor: mg/m³ = µg/m³ / 1000.0
    co NUMERIC(8, 2) CHECK (co IS NULL OR co >= 0),
    
    -- CPCB National Air Quality Index (NAQI) Computed Metrics
    estimated_aqi INTEGER NOT NULL CHECK (estimated_aqi >= 0 AND estimated_aqi <= 500),
    aqi_category VARCHAR(50) NOT NULL 
        CHECK (aqi_category IN ('Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor', 'Severe')),
    dominant_pollutant VARCHAR(50) NOT NULL,
    
    -- Comprehensive metadata (raw concentrations, sub-index breakdowns, unit dictionary)
    model_or_source_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Uniqueness constraint: prevents duplicate inserts for the same city, source, and observation timestamp
    CONSTRAINT uq_city_source_observed UNIQUE (city, source, observed_at)
);

-- Indexes for lightning-fast dashboard queries and time-series aggregations
CREATE INDEX IF NOT EXISTS idx_readings_city_observed 
    ON air_quality_readings (city, observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_readings_observed_at 
    ON air_quality_readings (observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_readings_source_type 
    ON air_quality_readings (source_type);

-- Comments for documentation & API reflection
COMMENT ON TABLE air_quality_readings IS 'Persistent storage for live air quality observations and numerical atmospheric model readings.';
COMMENT ON COLUMN air_quality_readings.observed_at IS 'Timestamp of the actual observation from the provider, converted to UTC TIMESTAMPTZ.';
COMMENT ON COLUMN air_quality_readings.co IS 'Carbon monoxide concentration normalized to CPCB reporting unit (mg/m³).';
COMMENT ON COLUMN air_quality_readings.source_type IS 'Distinguishes physical monitoring stations from numerical atmospheric reanalysis models.';

-- =============================================================================
-- 2. Table: aqi_predictions
-- Prepared schema for future machine learning forecasting models (Phase 2/3).
-- Supports multi-horizon forecasts (e.g., 24h, 48h, 72h).
-- =============================================================================
CREATE TABLE IF NOT EXISTS aqi_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city VARCHAR(100) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    target_time TIMESTAMPTZ NOT NULL,
    forecast_horizon VARCHAR(50) NOT NULL,
    predicted_pollutants JSONB NOT NULL DEFAULT '{}'::jsonb,
    predicted_aqi INTEGER NOT NULL CHECK (predicted_aqi >= 0 AND predicted_aqi <= 500),
    prediction_metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_predictions_city_target 
    ON aqi_predictions (city, target_time DESC);

CREATE INDEX IF NOT EXISTS idx_predictions_generated 
    ON aqi_predictions (generated_at DESC);

COMMENT ON TABLE aqi_predictions IS 'Future predictive model forecasts for air quality trajectories.';

-- =============================================================================
-- 3. Table: prediction_evaluations
-- Quantitative evaluation of forecast accuracy against ground truth observations.
-- =============================================================================
CREATE TABLE IF NOT EXISTS prediction_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id UUID NOT NULL REFERENCES aqi_predictions(id) ON DELETE CASCADE,
    observation_id UUID REFERENCES air_quality_readings(id) ON DELETE SET NULL,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    error_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    evaluation_metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_evaluations_prediction 
    ON prediction_evaluations (prediction_id);

CREATE INDEX IF NOT EXISTS idx_evaluations_observation 
    ON prediction_evaluations (observation_id);

COMMENT ON TABLE prediction_evaluations IS 'Evaluations linking predictions to observed ground truth metrics (MAE, RMSE, accuracy).';

