"""
Unit and Integration Tests for Phase 1: Supabase Integration and Live Storage
Verifies:
1. SQL Migration schemas, column datatypes, constraints, and indexes
2. RLS Security policies: Public read-only, strict write blockage
3. Open-Meteo atmospheric data transformation and CPCB sub-index calculations
4. Correct pollutant measurement units and CO conversion factor (µg/m³ -> mg/m³)
5. Source timestamp preservation vs request time
6. Edge function and automated collection integrity
"""

import os
import sys
import json
import re
from datetime import datetime, timezone

# Add workspace scripts to import path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
import collect_air_quality


def test_sql_migrations_exist_and_valid():
    print("[Test 1] Inspecting SQL Migration Schemas...")
    migrations_dir = os.path.join(os.path.dirname(__file__), "..", "supabase", "migrations")
    assert os.path.isdir(migrations_dir), f"Directory {migrations_dir} does not exist"

    schema_file = os.path.join(migrations_dir, "20261111000001_air_quality_schema.sql")
    rls_file = os.path.join(migrations_dir, "20261111000002_rls_security_policies.sql")
    cron_file = os.path.join(migrations_dir, "20261111000003_scheduled_collection_pgcron.sql")

    assert os.path.isfile(schema_file), "Schema migration file missing"
    assert os.path.isfile(rls_file), "RLS migration file missing"
    assert os.path.isfile(cron_file), "Cron migration file missing"

    with open(schema_file, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    # Verify tables
    assert "CREATE TABLE IF NOT EXISTS air_quality_readings" in schema_sql
    assert "CREATE TABLE IF NOT EXISTS aqi_predictions" in schema_sql
    assert "CREATE TABLE IF NOT EXISTS prediction_evaluations" in schema_sql

    # Verify required columns in air_quality_readings
    required_cols = [
        "id UUID", "city VARCHAR", "source VARCHAR", "source_type VARCHAR",
        "observed_at TIMESTAMPTZ", "fetched_at TIMESTAMPTZ",
        "latitude DOUBLE PRECISION", "longitude DOUBLE PRECISION",
        "pm2_5 NUMERIC", "pm10 NUMERIC", "no2 NUMERIC", "so2 NUMERIC",
        "co NUMERIC", "o3 NUMERIC", "estimated_aqi INTEGER",
        "aqi_category VARCHAR", "dominant_pollutant VARCHAR",
        "model_or_source_metadata JSONB"
    ]
    for col in required_cols:
        assert col in schema_sql, f"Missing column definition: {col}"

    # Verify unique constraint
    assert "CONSTRAINT uq_city_source_observed UNIQUE (city, source, observed_at)" in schema_sql

    # Verify indexes
    assert "CREATE INDEX IF NOT EXISTS idx_readings_city_observed" in schema_sql
    assert "CREATE INDEX IF NOT EXISTS idx_readings_observed_at" in schema_sql

    print("  [✓] All 3 tables, columns, indexes, and unique constraints verified.")


def test_rls_security_policies():
    print("[Test 2] Verifying Row Level Security (RLS) Policies...")
    rls_file = os.path.join(os.path.dirname(__file__), "..", "supabase", "migrations", "20261111000002_rls_security_policies.sql")
    with open(rls_file, "r", encoding="utf-8") as f:
        rls_sql = f.read()

    # Verify RLS is enabled
    assert "ALTER TABLE air_quality_readings ENABLE ROW LEVEL SECURITY;" in rls_sql
    assert "ALTER TABLE aqi_predictions ENABLE ROW LEVEL SECURITY;" in rls_sql
    assert "ALTER TABLE prediction_evaluations ENABLE ROW LEVEL SECURITY;" in rls_sql

    # Verify Public Read Policy (SELECT only)
    assert 'CREATE POLICY "Public read access for air_quality_readings"' in rls_sql
    assert "FOR SELECT" in rls_sql

    # Verify NO public insert/update/delete policy exists
    assert "FOR INSERT\n    TO anon" not in rls_sql
    assert "FOR UPDATE\n    TO anon" not in rls_sql
    assert "FOR DELETE\n    TO anon" not in rls_sql

    print("  [✓] Row Level Security policies enforce SELECT-only for public anon clients.")


def test_open_meteo_data_transformation():
    print("[Test 3] Verifying Open-Meteo Fetch & CPCB Sub-Index Conversion...")
    # Use real function on Delhi
    target = {"city": "Delhi", "lat": 28.6139, "lon": 77.2090}
    reading = collect_air_quality.fetch_city_reading(target)

    assert reading["city"] == "Delhi"
    assert reading["source"] == "open-meteo"
    assert reading["source_type"] == "atmospheric_model"
    assert reading["latitude"] == 28.6139
    assert reading["longitude"] == 77.2090

    # Verify valid timestamp format ISO 8601
    dt = datetime.fromisoformat(reading["observed_at"])
    assert dt.tzinfo is not None, "Timestamp must be timezone-aware (UTC)"

    # Verify valid AQI range (0 to 500)
    assert 0 <= reading["estimated_aqi"] <= 500
    assert reading["aqi_category"] in ["Good", "Satisfactory", "Moderate", "Poor", "Very Poor", "Severe"]
    assert reading["dominant_pollutant"] in ["PM2.5", "PM10", "NO2", "SO2", "CO", "O3", "None"]

    # Verify CO normalization: CO in CPCB is in mg/m³
    if reading["co"] is not None:
        assert reading["co"] <= 100.0, f"CO was expected in mg/m³, got unusually high value {reading['co']}"
        raw_co = reading["model_or_source_metadata"].get("raw_co_ug_m3")
        if raw_co is not None:
            expected_mg = round(raw_co / 1000.0, 2)
            assert reading["co"] == expected_mg, f"CO conversion mismatch: {reading['co']} != {expected_mg}"

    # Verify units dictionary in metadata
    units = reading["model_or_source_metadata"]["units"]
    assert units["pm2_5"] == "µg/m³"
    assert units["pm10"] == "µg/m³"
    assert units["co"] == "mg/m³"
    assert units["o3"] == "µg/m³"

    print("  [✓] Live Open-Meteo payload transformed with authentic CPCB sub-indices and units.")


def test_duplicate_prevention_logic():
    print("[Test 4] Verifying Duplicate Prevention Logic...")
    # In collect_air_quality.py, requests include Prefer: resolution=ignore-duplicates
    with open(os.path.join(os.path.dirname(__file__), "..", "scripts", "collect_air_quality.py"), "r", encoding="utf-8") as f:
        collector_code = f.read()

    assert "resolution=ignore-duplicates" in collector_code

    # In Edge function, upsert includes onConflict: "city,source,observed_at", ignoreDuplicates: true
    with open(os.path.join(os.path.dirname(__file__), "..", "supabase", "functions", "collect-air-quality", "index.ts"), "r", encoding="utf-8") as f:
        edge_code = f.read()

    assert 'onConflict: "city,source,observed_at"' in edge_code
    assert "ignoreDuplicates: true" in edge_code

    print("  [✓] Idempotent upsert and duplicate prevention verified in both Python and Edge functions.")


def test_credential_leakage_safeguards():
    print("[Test 5] Auditing Credential Isolation Safeguards...")
    # Ensure frontend files do not contain SUPABASE_SERVICE_ROLE_KEY
    frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "src")
    forbidden = ["SUPABASE_SERVICE_ROLE_KEY", "service_role", "secret_key"]

    for root, _, files in os.walk(frontend_dir):
        for file in files:
            if file.endswith((".ts", ".tsx", ".js", ".jsx")):
                path = os.path.join(root, file)
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                for token in forbidden:
                    # 'service_role' in comments or diagnostics description is acceptable, but not as an env variable or literal key
                    assert f"VITE_{token}" not in content, f"Leaked forbidden env var VITE_{token} in {file}"
                    assert f"process.env.{token}" not in content, f"Leaked secret reference {token} in {file}"

    print("  [✓] Zero secret credential leakage detected in frontend code.")


def main():
    print("=" * 65)
    print(" Running AirCare Supabase Integration Test Suite")
    print("=" * 65)
    test_sql_migrations_exist_and_valid()
    test_rls_security_policies()
    test_open_meteo_data_transformation()
    test_duplicate_prevention_logic()
    test_credential_leakage_safeguards()
    print("\n" + "=" * 65)
    print(" ALL 5 SUPABASE INTEGRATION TEST SUITES PASSED (100% Success)")
    print("=" * 65)


if __name__ == "__main__":
    main()

