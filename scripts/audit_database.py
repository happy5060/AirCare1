"""
AirCare Database & Data Quality Audit Script
Queries live Supabase instance and checks schema, columns, values,
categories, timestamps, and pollutant distributions.
"""

import json
import urllib.request
import urllib.error
from datetime import datetime

SUPABASE_URL = "https://mxzkdikylyvhxrtxucxi.supabase.co"
PUBLISHABLE_KEY = "sb_publishable_TDut69tl9qu5qEHrapjAlQ_xKpFzSmT"

def run_audit():
    endpoint = f"{SUPABASE_URL}/rest/v1/air_quality_readings?select=*&order=observed_at.desc"
    req = urllib.request.Request(
        endpoint,
        headers={
            "apikey": PUBLISHABLE_KEY,
            "Authorization": f"Bearer {PUBLISHABLE_KEY}",
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            records = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"Failed to fetch records: {e}")
        return

    print("=" * 70)
    print(" AIRCARE LIVE SUPABASE DATA QUALITY AUDIT REPORT")
    print("=" * 70)
    print(f"Total Stored Records: {len(records)}")

    if not records:
        print("No records found in table air_quality_readings.")
        return

    # 1. Cities
    cities = [r["city"] for r in records]
    unique_cities = sorted(list(set(cities)))
    print(f"Unique Cities ({len(unique_cities)}): {', '.join(unique_cities)}")

    # 2. Timestamps
    observed_timestamps = [r["observed_at"] for r in records if r.get("observed_at")]
    fetched_timestamps = [r["fetched_at"] for r in records if r.get("fetched_at")]
    observed_timestamps.sort()
    print(f"Oldest Observed At: {observed_timestamps[0]}")
    print(f"Latest Observed At: {observed_timestamps[-1]}")
    if fetched_timestamps:
        fetched_timestamps.sort()
        print(f"Latest Fetched At : {fetched_timestamps[-1]}")

    # 3. Source and classification
    sources = set(r.get("source") for r in records)
    source_types = set(r.get("source_type") for r in records)
    print(f"Sources: {sources}")
    print(f"Source Types: {source_types}")

    # 4. Data Quality Check
    print("\n--- Detailed Record Analysis ---")
    missing_fields_count = {}
    invalid_aqi_count = 0
    cat_inconsistencies = 0
    pollutant_stats = {
        "pm2_5": [],
        "pm10": [],
        "no2": [],
        "so2": [],
        "co": [],
        "o3": []
    }

    # Expected CPCB Category mapper
    def cpcb_cat(aqi):
        if aqi <= 50: return "Good"
        if aqi <= 100: return "Satisfactory"
        if aqi <= 200: return "Moderate"
        if aqi <= 300: return "Poor"
        if aqi <= 400: return "Very Poor"
        return "Severe"

    for idx, r in enumerate(records, 1):
        city = r.get("city")
        aqi = r.get("estimated_aqi")
        cat = r.get("aqi_category")
        dom = r.get("dominant_pollutant")
        obs = r.get("observed_at")

        # AQI validity
        if aqi is None or aqi < 0 or aqi > 500:
            invalid_aqi_count += 1
            print(f"[!] Invalid AQI for {city}: {aqi}")

        # Category consistency
        expected_cat = cpcb_cat(aqi)
        if cat != expected_cat:
            cat_inconsistencies += 1
            print(f"[!] Category mismatch for {city}: AQI={aqi}, stored='{cat}', expected='{expected_cat}'")

        # Pollutant collection
        for p in pollutant_stats:
            val = r.get(p)
            if val is None:
                missing_fields_count[p] = missing_fields_count.get(p, 0) + 1
            else:
                pollutant_stats[p].append(float(val))

        print(f"{idx:02d}. {city:<12} | AQI: {aqi:<3} ({cat:<12}) | Dominant: {dom:<6} | Observed: {obs}")
        print(f"    PM2.5: {r.get('pm2_5')} µg/m³, PM10: {r.get('pm10')} µg/m³, NO2: {r.get('no2')} µg/m³, SO2: {r.get('so2')} µg/m³, CO: {r.get('co')} mg/m³, O3: {r.get('o3')} µg/m³")

    # 5. Duplicate Check
    unique_keys = set()
    duplicates = []
    for r in records:
        key = (r.get("city"), r.get("source"), r.get("observed_at"))
        if key in unique_keys:
            duplicates.append(key)
        else:
            unique_keys.add(key)

    print("\n--- Summary Audit Metrics ---")
    print(f"Total Duplicate Rows: {len(duplicates)}")
    print(f"Invalid AQI Rows: {invalid_aqi_count}")
    print(f"Category Inconsistencies: {cat_inconsistencies}")
    print(f"Missing Pollutant Values: {missing_fields_count if missing_fields_count else 'None (0 missing across all rows)'}")

    print("\n--- Pollutant Concentration Statistics ---")
    for p, vals in pollutant_stats.items():
        if vals:
            unit = "mg/m³" if p == "co" else "µg/m³"
            print(f"  {p.upper():<6}: min={min(vals):.2f}, max={max(vals):.2f}, mean={sum(vals)/len(vals):.2f} {unit} (n={len(vals)})")

    # 6. Metadata inspection
    print("\n--- Metadata Sample ---")
    if records and "model_or_source_metadata" in records[0]:
        print(json.dumps(records[0]["model_or_source_metadata"], indent=2))

if __name__ == "__main__":
    run_audit()
