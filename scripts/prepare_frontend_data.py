"""
Prepares optimized JSON data caches for the AirCare frontend.
Source datasets:
- processed_data/cleaned_cpcb_aqi_bulletins.csv (471,015 records, 297 cities, 2015-2025)
- processed_data/cleaned_city_day.csv (29,531 records, 26 cities, 2015-2020)

Output destination:
- frontend/public/data/
"""

import os
import json
import time
import pandas as pd
import numpy as np

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if not os.path.exists(os.path.join(BASE_DIR, "processed_data")):
    BASE_DIR = r"e:\minor project"
PROCESSED_DIR = os.path.join(BASE_DIR, "processed_data")
OUTPUT_DIR = os.path.join(BASE_DIR, "frontend", "public", "data")

BULLETINS_PATH = os.path.join(PROCESSED_DIR, "cleaned_cpcb_aqi_bulletins.csv")
CITY_DAY_PATH = os.path.join(PROCESSED_DIR, "cleaned_city_day.csv")

def prepare_data():
    t0 = time.time()
    print("=" * 70)
    print("PREPARING FRONTEND DATA CACHES FROM PROCESSED DATASETS")
    print("=" * 70)

    os.makedirs(os.path.join(OUTPUT_DIR, "bulletins"), exist_ok=True)
    os.makedirs(os.path.join(OUTPUT_DIR, "city_day"), exist_ok=True)

    # ---------------------------------------------------------
    # 1. Process Historical CPCB Daily Bulletins (2015-2025)
    # ---------------------------------------------------------
    print(f"\n[1/2] Loading {BULLETINS_PATH}...")
    df_bulletin = pd.read_csv(BULLETINS_PATH, low_memory=False)
    print(f"Loaded {len(df_bulletin):,} rows across {df_bulletin['city'].nunique()} cities.")

    bulletins_index = []
    bulletin_grouped = df_bulletin.groupby('city')

    for city_name, group in bulletin_grouped:
        # Sort by date
        group_sorted = group.sort_values('date')
        
        # Prepare records array
        records = []
        for _, row in group_sorted.iterrows():
            aqi_val = None if pd.isna(row['aqi']) else int(round(row['aqi']))
            records.append({
                "d": str(row['date']),
                "aqi": aqi_val,
                "cat": str(row['aqi_category']) if pd.notna(row['aqi_category']) else None,
                "poll": str(row['prominent_pollutant']) if pd.notna(row['prominent_pollutant']) else "Unspecified",
                "stn": int(row['station_count']) if pd.notna(row['station_count']) else 1,
                "incon": bool(row['is_category_inconsistent']) if 'is_category_inconsistent' in row and pd.notna(row['is_category_inconsistent']) else False
            })

        valid_aqis = [r['aqi'] for r in records if r['aqi'] is not None]
        avg_aqi = round(float(np.mean(valid_aqis)), 1) if valid_aqis else None
        max_aqi = int(np.max(valid_aqis)) if valid_aqis else None
        min_aqi = int(np.min(valid_aqis)) if valid_aqis else None

        city_data = {
            "city": city_name,
            "min_date": str(group_sorted['date'].min()),
            "max_date": str(group_sorted['date'].max()),
            "total_records": len(records),
            "valid_aqi_records": len(valid_aqis),
            "avg_aqi": avg_aqi,
            "max_aqi": max_aqi,
            "min_aqi": min_aqi,
            "records": records
        }

        # Save city file
        # Sanitize filename for safe filesystem storage
        safe_name = city_name.replace(" ", "_")
        city_file = os.path.join(OUTPUT_DIR, "bulletins", f"{safe_name}.json")
        with open(city_file, "w", encoding="utf-8") as f:
            json.dump(city_data, f, separators=(',', ':'))

        bulletins_index.append({
            "city": city_name,
            "key": safe_name,
            "min_date": city_data["min_date"],
            "max_date": city_data["max_date"],
            "total_records": city_data["total_records"],
            "valid_records": city_data["valid_aqi_records"],
            "avg_aqi": avg_aqi,
            "max_aqi": max_aqi
        })

    # Sort index by total records descending (Delhi, etc. at top)
    bulletins_index.sort(key=lambda x: x['total_records'], reverse=True)
    index_file = os.path.join(OUTPUT_DIR, "bulletins_index.json")
    with open(index_file, "w", encoding="utf-8") as f:
        json.dump(bulletins_index, f, separators=(',', ':'))
    print(f"Saved {len(bulletins_index)} city files and index to frontend/public/data/bulletins/")

    # ---------------------------------------------------------
    # 2. Process City-Day Ambient Pollutants (2015-2020)
    # ---------------------------------------------------------
    print(f"\n[2/2] Loading {CITY_DAY_PATH}...")
    df_cityday = pd.read_csv(CITY_DAY_PATH)
    print(f"Loaded {len(df_cityday):,} rows across {df_cityday['city'].nunique()} cities.")

    cityday_index = []
    cityday_grouped = df_cityday.groupby('city')

    for city_name, group in cityday_grouped:
        group_sorted = group.sort_values('date')
        records = []
        for _, row in group_sorted.iterrows():
            aqi_val = None if pd.isna(row['aqi']) else int(round(row['aqi']))
            pm25_val = None if pd.isna(row['pm2_5']) else round(float(row['pm2_5']), 1)
            pm10_val = None if pd.isna(row['pm10']) else round(float(row['pm10']), 1)
            no2_val = None if pd.isna(row['no2']) else round(float(row['no2']), 1)
            so2_val = None if pd.isna(row['so2']) else round(float(row['so2']), 1)
            co_val = None if pd.isna(row['co']) else round(float(row['co']), 2)

            records.append({
                "d": str(row['date']),
                "aqi": aqi_val,
                "cat": str(row['aqi_bucket']) if pd.notna(row['aqi_bucket']) else None,
                "pm25": pm25_val,
                "pm10": pm10_val,
                "no2": no2_val,
                "so2": so2_val,
                "co": co_val,
                "flag_aqi_500": bool(row.get('flag_aqi_above_500', False)),
                "flag_pm10_cap": bool(row.get('flag_pm10_sensor_cap', False)),
                "flag_pm25_ext": bool(row.get('flag_pm25_extreme', False)),
                "flag_co_ext": bool(row.get('flag_co_extreme', False))
            })

        valid_aqis = [r['aqi'] for r in records if r['aqi'] is not None]
        avg_aqi = round(float(np.mean(valid_aqis)), 1) if valid_aqis else None

        city_data = {
            "city": city_name,
            "min_date": str(group_sorted['date'].min()),
            "max_date": str(group_sorted['date'].max()),
            "total_records": len(records),
            "valid_aqi_records": len(valid_aqis),
            "avg_aqi": avg_aqi,
            "records": records
        }

        safe_name = city_name.replace(" ", "_")
        city_file = os.path.join(OUTPUT_DIR, "city_day", f"{safe_name}.json")
        with open(city_file, "w", encoding="utf-8") as f:
            json.dump(city_data, f, separators=(',', ':'))

        cityday_index.append({
            "city": city_name,
            "key": safe_name,
            "min_date": city_data["min_date"],
            "max_date": city_data["max_date"],
            "total_records": city_data["total_records"],
            "avg_aqi": avg_aqi
        })

    cityday_index.sort(key=lambda x: x['total_records'], reverse=True)
    index_file_cd = os.path.join(OUTPUT_DIR, "city_day_index.json")
    with open(index_file_cd, "w", encoding="utf-8") as f:
        json.dump(cityday_index, f, separators=(',', ':'))
    print(f"Saved {len(cityday_index)} city files and index to frontend/public/data/city_day/")

    print(f"\n[OK] Completed all caches in {time.time()-t0:.2f} seconds!")

if __name__ == "__main__":
    prepare_data()
