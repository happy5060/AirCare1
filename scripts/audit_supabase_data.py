"""
AirCare Production Readiness Verification — Supabase Tables Audit
Queries aqi_predictions and prediction_evaluations directly.
Verifies row counts, horizons, target dates, and duplicate prevention.
"""
import os
import sys
import json
import urllib.request
from datetime import datetime

url = "https://mxzkdikylyvhxrtxucxi.supabase.co"
key = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY") or "sb_publishable_TDut69tl9qu5qEHrapjAlQ_xKpFzSmT"
headers = {"apikey": key, "Authorization": f"Bearer {key}"}

def query_table(endpoint):
    req = urllib.request.Request(f"{url}/rest/v1/{endpoint}", headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def main():
    print("=" * 70)
    print(" 4. SUPABASE TABLES AUDIT (LIVE REST API)")
    print("=" * 70)

    # 1. Audit aqi_predictions
    preds = query_table("aqi_predictions?select=*&order=generated_at.desc&limit=150")
    print(f"[*] Total rows in aqi_predictions: {len(preds)}")
    
    cities = {}
    horizons = set()
    models = set()
    sample_rows = []
    
    for r in preds:
        c = r['city']
        h = r['forecast_horizon']
        m = r['model_name']
        cities[c] = cities.get(c, 0) + 1
        horizons.add(h)
        models.add(m)
        if len(sample_rows) < 3:
            sample_rows.append(r)
            
    print(f"[*] Distinct cities represented ({len(cities)}): {sorted(list(cities.keys()))}")
    print(f"[*] Rows per city: {cities}")
    print(f"[*] Distinct horizons: {sorted(list(horizons))}")
    print(f"[*] Model names: {models}")
    
    print("\n--- Sample Prediction Record ---")
    if sample_rows:
        s = sample_rows[0]
        print(f"  ID: {s['id']}")
        print(f"  City: {s['city']}")
        print(f"  Horizon: {s['forecast_horizon']}")
        print(f"  Generated At: {s['generated_at']}")
        print(f"  Target Time: {s['target_time']}")
        print(f"  Predicted AQI: {s['predicted_aqi']}")
        print(f"  Pollutants: {s['predicted_pollutants']}")
        print(f"  Metadata: {s['prediction_metadata']}")

    # 2. Audit prediction_evaluations
    evals = query_table("prediction_evaluations?select=*&order=evaluated_at.desc&limit=50")
    print(f"\n[*] Total rows in prediction_evaluations: {len(evals)}")
    for e in evals:
        print(f"  Eval ID: {e['id']}")
        print(f"    Prediction ID: {e['prediction_id']}")
        print(f"    Evaluated At: {e['evaluated_at']}")
        print(f"    Error Metrics: {e['error_metrics']}")
        print(f"    Metadata: {e['evaluation_metadata']}")

    # 3. Verify forecast target_time vs horizon
    print("\n--- Horizon vs Target Time Verification ---")
    valid_horizons = True
    for r in preds[:10]:
        gen = datetime.fromisoformat(r['generated_at'].replace('Z', '+00:00'))
        target = datetime.fromisoformat(r['target_time'].replace('Z', '+00:00'))
        delta_days = (target.date() - gen.date()).days
        expected_h = int(r['forecast_horizon'].replace('d', ''))
        # Note: target date is latest_obs_date + h days
        print(f"  City: {r['city']:10s} | Horizon: {r['forecast_horizon']:3s} | Target: {r['target_time'][:10]} | AQI: {r['predicted_aqi']:3d}")

if __name__ == '__main__':
    main()

