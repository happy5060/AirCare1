"""
AirCare Operational Forecast Generation Pipeline
Loads Google TimesFM 2.5, generates multi-horizon predictions for Indian cities,
calculates derived CPCB NAQI, writes to Supabase aqi_predictions, and saves
frontend/public/data/forecasts.json for client-side rendering.
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import json
import urllib.request
import numpy as np
from datetime import datetime, timezone
from typing import Dict, Any, List

try:
    from dotenv import load_dotenv
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    load_dotenv(os.path.join(root_dir, '.env'))
    load_dotenv(os.path.join(root_dir, 'frontend', '.env'))
except ImportError:
    pass

from scripts.forecast_engine import ForecastEngine, POLLUTANTS
from scripts.data_preparation import prepare_forecasting_context, PRIMARY_CITIES
from scripts.cpcb_calculator import derive_cpcb_aqi, get_cpcb_category

SUPPORTED_CITIES = [
    'Delhi', 'Mumbai', 'Bengaluru', 'Kolkata', 'Chennai',
    'Hyderabad', 'Ahmedabad', 'Pune', 'Jaipur', 'Lucknow'
]

def push_predictions_to_supabase(city_forecasts: List[Dict[str, Any]]) -> int:
    """
    Inserts or updates forecasts in Supabase aqi_predictions table.
    Uses elevated service-role key for backend automation.
    """
    supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL") or "https://mxzkdikylyvhxrtxucxi.supabase.co"
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not service_key:
        print("[Supabase Sync] Warning: SUPABASE_SERVICE_ROLE_KEY not configured. Skipping database upsert.")
        return 0

    rows_to_insert = []
    for cf in city_forecasts:
        city = cf['city']
        gen_time = cf['forecast_generation_time']
        model_name = cf['model_name']
        model_version = cf['model_version']

        for df in cf['daily_forecasts']:
            horizon_str = f"{df['day_index']}d"
            row = {
                "city": city,
                "model_name": model_name,
                "model_version": model_version,
                "generated_at": gen_time,
                "target_time": df['target_date'] + "T10:30:00Z", # Standard 4:00 PM IST bulletin UTC target
                "forecast_horizon": horizon_str,
                "predicted_pollutants": {k: v for k, v in df['predicted_pollutants'].items() if v is not None},
                "predicted_aqi": int(df['predicted_aqi']),
                "prediction_metadata": {
                    "predicted_category": df['predicted_category'],
                    "dominant_pollutant": df['dominant_pollutant'],
                    "uncertainty_range": df['uncertainty_range'],
                    "change_from_latest": df['change_from_latest'],
                    "is_cpcb_compliant": df['is_cpcb_compliant'],
                    "direct_aqi_prediction": df['direct_aqi_prediction'],
                    "input_source": cf['input_source'],
                    "latest_observation_date": cf['latest_observation_date']
                }
            }
            rows_to_insert.append(row)

    if not rows_to_insert:
        return 0

    # Duplicate Prevention: Remove any existing forecasts for the same city and target_time
    # to guarantee idempotency on repeated pipeline executions
    for city in set(r['city'] for r in rows_to_insert):
        city_targets = [r['target_time'] for r in rows_to_insert if r['city'] == city]
        if city_targets:
            formatted_targets = ','.join(city_targets)
            del_url = f"{supabase_url}/rest/v1/aqi_predictions?city=eq.{city}&target_time=in.({formatted_targets})"
            del_req = urllib.request.Request(
                del_url,
                headers={
                    "apikey": service_key,
                    "Authorization": f"Bearer {service_key}",
                },
                method="DELETE"
            )
            try:
                with urllib.request.urlopen(del_req, timeout=10) as _:
                    pass
            except Exception as e:
                pass

    url = f"{supabase_url}/rest/v1/aqi_predictions"
    req = urllib.request.Request(
        url,
        data=json.dumps(rows_to_insert).encode('utf-8'),
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            inserted_count = len(data)
            print(f"[Supabase Sync] Successfully inserted {inserted_count} prediction rows into aqi_predictions!")
            return inserted_count
    except Exception as e:
        print(f"[Supabase Sync] Error inserting into aqi_predictions: {e}")
        return 0

def generate_all_forecasts() -> Dict[str, Any]:
    print("=" * 60)
    print("STARTING AIRCARE OPERATIONAL FORECAST GENERATION")
    print(f"Supported Cities: {SUPPORTED_CITIES}")
    print("=" * 60)

    engine = ForecastEngine()
    loaded = engine.load_model()
    if not loaded:
        print("[Pipeline] TimesFM weights not loaded. Using competitive baseline.")

    all_forecasts = {}
    forecast_list = []

    for city in SUPPORTED_CITIES:
        print(f"\nProcessing forecast for {city}...")
        context = prepare_forecasting_context(city, context_len=64)
        if not context.get('valid', False):
            print(f"  Warning: No valid context for {city}. Reason: {context.get('error')}")
            continue

        forecast = engine.generate_city_forecast(
            city=city,
            context=context,
            max_horizon=7,
            model_type="timesfm" if loaded else "xgboost"
        )
        all_forecasts[city] = forecast
        forecast_list.append(forecast)

        t_aqi = forecast['daily_forecasts'][0]['predicted_aqi']
        t_cat = forecast['daily_forecasts'][0]['predicted_category']
        t_dom = forecast['daily_forecasts'][0]['dominant_pollutant']
        print(f"  Done: Tomorrow AQI = {t_aqi} ({t_cat}, Dominant: {t_dom}) | 3-day = {forecast['daily_forecasts'][2]['predicted_aqi']} | 7-day = {forecast['daily_forecasts'][6]['predicted_aqi']}")

    output_payload = {
        "metadata": {
            "pipeline": "aircare_timesfm_forecasting",
            "model_name": engine.model_name if loaded else "XGBoost Baseline",
            "model_version": engine.model_version if loaded else "1.0",
            "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "supported_cities": list(all_forecasts.keys()),
            "horizons": ["tomorrow", "3_days", "7_days"],
            "status": "success",
            "city_count": len(all_forecasts)
        },
        "forecasts": all_forecasts
    }

    # 1. Save static JSON for frontend
    out_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public', 'data')
    os.makedirs(out_dir, exist_ok=True)
    json_path = os.path.join(out_dir, 'forecasts.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(output_payload, f, indent=2)
    print(f"\nSaved frontend forecast cache to {json_path}")

    # 2. Push to Supabase if credentials available
    inserted = push_predictions_to_supabase(forecast_list)

    print("\n" + "=" * 60)
    print("FORECAST GENERATION COMPLETE")
    print(f"Cities Processed: {len(all_forecasts)}")
    print(f"Database Rows Inserted: {inserted}")
    print("=" * 60)

    return output_payload

if __name__ == "__main__":
    generate_all_forecasts()
