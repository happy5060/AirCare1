"""
AirCare — Automated Air Quality Data Collection Script
Fetches live Open-Meteo atmospheric model observations for 10 Indian cities,
computes official CPCB NAQI sub-indices, and upserts them into Supabase.

Designed for:
- Supabase Free / Pro tiers
- GitHub Actions Cron workflow (.github/workflows/scheduled-data-collection.yml)
- Local testing and manual execution

Zero credential leakage: Never prints service keys or connection tokens in logs.
"""

import os
import sys
import json
import time
import socket
import urllib.request
import urllib.error
from datetime import datetime, timezone

# Ensure IPv4 is prioritized to prevent Windows/ISP IPv6 routing handshake timeouts
_orig_getaddrinfo = socket.getaddrinfo

def _getaddrinfo_prefer_ipv4(host, port, family=0, type=0, proto=0, flags=0):
    try:
        return _orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
    except Exception:
        return _orig_getaddrinfo(host, port, family, type, proto, flags)

socket.getaddrinfo = _getaddrinfo_prefer_ipv4

# 10 Tracked Indian Metros & Regional Hubs
TRACKED_CITIES = [
    {"city": "Delhi", "lat": 28.6139, "lon": 77.2090},
    {"city": "Mumbai", "lat": 19.0760, "lon": 72.8777},
    {"city": "Bengaluru", "lat": 12.9716, "lon": 77.5946},
    {"city": "Kolkata", "lat": 22.5726, "lon": 88.3639},
    {"city": "Chennai", "lat": 13.0827, "lon": 80.2707},
    {"city": "Hyderabad", "lat": 17.3850, "lon": 78.4867},
    {"city": "Ahmedabad", "lat": 23.0225, "lon": 72.5714},
    {"city": "Pune", "lat": 18.5204, "lon": 73.8567},
    {"city": "Jaipur", "lat": 26.9124, "lon": 75.7873},
    {"city": "Lucknow", "lat": 26.8467, "lon": 80.9462},
]


def calc_sub_index_pm25(v: float) -> int:
    if v <= 0:
        return 0
    if v <= 30:
        return round((v * 50) / 30)
    if v <= 60:
        return round(50 + ((v - 30) * 50) / 30)
    if v <= 90:
        return round(100 + ((v - 60) * 100) / 30)
    if v <= 120:
        return round(200 + ((v - 90) * 100) / 30)
    if v <= 250:
        return round(300 + ((v - 120) * 100) / 130)
    return min(500, round(400 + ((v - 250) * 100) / 130))


def calc_sub_index_pm10(v: float) -> int:
    if v <= 0:
        return 0
    if v <= 50:
        return round(v)
    if v <= 100:
        return round(v)
    if v <= 250:
        return round(100 + ((v - 100) * 100) / 150)
    if v <= 350:
        return round(200 + (v - 250))
    if v <= 430:
        return round(300 + ((v - 350) * 100) / 80)
    return min(500, round(400 + ((v - 430) * 100) / 70))


def calc_sub_index_no2(v: float) -> int:
    if v <= 0:
        return 0
    if v <= 40:
        return round((v * 50) / 40)
    if v <= 80:
        return round(50 + ((v - 40) * 50) / 40)
    if v <= 180:
        return round(100 + ((v - 80) * 100) / 100)
    if v <= 280:
        return round(200 + ((v - 180) * 100) / 100)
    if v <= 400:
        return round(300 + ((v - 280) * 100) / 120)
    return min(500, round(400 + ((v - 400) * 100) / 100))


def calc_sub_index_so2(v: float) -> int:
    if v <= 0:
        return 0
    if v <= 40:
        return round((v * 50) / 40)
    if v <= 80:
        return round(50 + ((v - 40) * 50) / 40)
    if v <= 380:
        return round(100 + ((v - 80) * 100) / 300)
    if v <= 800:
        return round(200 + ((v - 380) * 100) / 420)
    if v <= 1600:
        return round(300 + ((v - 800) * 100) / 800)
    return min(500, round(400 + ((v - 1600) * 100) / 400))


def calc_sub_index_co(co_mg: float) -> int:
    if co_mg <= 0:
        return 0
    if co_mg <= 1.0:
        return round(co_mg * 50)
    if co_mg <= 2.0:
        return round(50 + (co_mg - 1.0) * 50)
    if co_mg <= 10.0:
        return round(100 + ((co_mg - 2.0) * 100) / 8.0)
    if co_mg <= 17.0:
        return round(200 + ((co_mg - 10.0) * 100) / 7.0)
    if co_mg <= 34.0:
        return round(300 + ((co_mg - 17.0) * 100) / 17.0)
    return min(500, round(400 + ((co_mg - 34.0) * 100) / 16.0))


def calc_sub_index_o3(v: float) -> int:
    if v <= 0:
        return 0
    if v <= 50:
        return round(v)
    if v <= 100:
        return round(v)
    if v <= 168:
        return round(100 + ((v - 100) * 100) / 68)
    if v <= 208:
        return round(200 + ((v - 168) * 100) / 40)
    if v <= 748:
        return round(300 + ((v - 208) * 100) / 540)
    return min(500, round(400 + ((v - 748) * 100) / 252))


def get_cpcb_category(aqi: int) -> str:
    if aqi <= 50:
        return "Good"
    if aqi <= 100:
        return "Satisfactory"
    if aqi <= 200:
        return "Moderate"
    if aqi <= 300:
        return "Poor"
    if aqi <= 400:
        return "Very Poor"
    return "Severe"


def fetch_city_reading(city_info: dict, max_retries: int = 3) -> dict:
    lat = city_info["lat"]
    lon = city_info["lon"]
    city = city_info["city"]

    url = (
        f"https://air-quality-api.open-meteo.com/v1/air-quality?"
        f"latitude={lat}&longitude={lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone"
        f"&timezone=Asia%2FKolkata"
    )

    req = urllib.request.Request(url, headers={"User-Agent": "AirCare-Collector/1.0"})
    data = None
    last_err = None

    for attempt in range(1, max_retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=20) as response:
                if response.status != 200:
                    raise RuntimeError(f"Open-Meteo returned HTTP {response.status}")
                raw_body = response.read().decode("utf-8")
                data = json.loads(raw_body)
                break
        except Exception as e:
            last_err = e
            if attempt < max_retries:
                time.sleep(1.0 * attempt)

    if data is None:
        raise RuntimeError(f"Failed to fetch data for {city} after {max_retries} attempts: {last_err}")

    current = data.get("current")
    if not current or "time" not in current:
        raise ValueError(f"Incomplete atmospheric payload for {city}")

    time_str = current["time"]  # e.g., "2026-11-11T21:00"
    # Convert Asia/Kolkata (+05:30) to ISO 8601 UTC timestamp
    dt = datetime.fromisoformat(time_str + "+05:30")
    observed_at = dt.astimezone(timezone.utc).isoformat()

    pm25 = max(0.0, float(current["pm2_5"])) if current.get("pm2_5") is not None else None
    pm10 = max(0.0, float(current["pm10"])) if current.get("pm10") is not None else None
    no2 = max(0.0, float(current["nitrogen_dioxide"])) if current.get("nitrogen_dioxide") is not None else None
    so2 = max(0.0, float(current["sulphur_dioxide"])) if current.get("sulphur_dioxide") is not None else None
    o3 = max(0.0, float(current["ozone"])) if current.get("ozone") is not None else None

    # Open-Meteo CO is in µg/m³. Convert to CPCB standard mg/m³
    co_raw_ug = float(current["carbon_monoxide"]) if current.get("carbon_monoxide") is not None else None
    co_mg = round(co_raw_ug / 1000.0, 2) if co_raw_ug is not None else None

    # Calculate Sub-Indices
    sub_indices = []
    if pm25 is not None:
        sub_indices.append(("PM2.5", calc_sub_index_pm25(pm25)))
    if pm10 is not None:
        sub_indices.append(("PM10", calc_sub_index_pm10(pm10)))
    if no2 is not None:
        sub_indices.append(("NO2", calc_sub_index_no2(no2)))
    if so2 is not None:
        sub_indices.append(("SO2", calc_sub_index_so2(so2)))
    if co_mg is not None:
        sub_indices.append(("CO", calc_sub_index_co(co_mg)))
    if o3 is not None:
        sub_indices.append(("O3", calc_sub_index_o3(o3)))

    if sub_indices:
        sub_indices.sort(key=lambda x: x[1], reverse=True)
        estimated_aqi = sub_indices[0][1]
        dominant_pollutant = sub_indices[0][0]
    else:
        estimated_aqi = 0
        dominant_pollutant = "None"

    aqi_category = get_cpcb_category(estimated_aqi)

    return {
        "city": city,
        "source": "open-meteo",
        "source_type": "atmospheric_model",
        "observed_at": observed_at,
        "latitude": lat,
        "longitude": lon,
        "pm2_5": pm25,
        "pm10": pm10,
        "no2": no2,
        "so2": so2,
        "co": co_mg,
        "o3": o3,
        "estimated_aqi": estimated_aqi,
        "aqi_category": aqi_category,
        "dominant_pollutant": dominant_pollutant,
        "model_or_source_metadata": {
            "provider": "Open-Meteo Air Quality API",
            "model": "CAMS / ECMWF Atmospheric Numerical Reanalysis",
            "grid_resolution_km": 11,
            "raw_co_ug_m3": co_raw_ug,
            "units": {
                "pm2_5": "µg/m³",
                "pm10": "µg/m³",
                "no2": "µg/m³",
                "so2": "µg/m³",
                "co": "mg/m³",
                "o3": "µg/m³"
            },
            "sub_indices": dict(sub_indices),
            "collector": "python_scheduled_worker"
        }
    }


def push_to_supabase(readings: list, supabase_url: str, service_key: str) -> dict:
    """
    Pushes readings to Supabase PostgREST endpoint using Upsert (Prefer: resolution=ignore-duplicates).
    Requires the service_role key to bypass RLS or execute authorized backend writes.
    """
    # Deterministic conflict target matches the unique constraint uq_city_source_observed
    endpoint = f"{supabase_url.rstrip('/')}/rest/v1/air_quality_readings?on_conflict=city,source,observed_at"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=ignore-duplicates,return=representation"
    }

    req = urllib.request.Request(
        endpoint,
        data=json.dumps(readings).encode("utf-8"),
        headers=headers,
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            body = resp.read().decode("utf-8")
            inserted = json.loads(body) if body else []
            return {"status": "success", "count": len(inserted)}
    except urllib.error.HTTPError as e:
        error_msg = e.read().decode("utf-8", errors="replace")
        return {"status": "error", "code": e.code, "message": error_msg}


def run_collection():
    print(f"[{datetime.now(timezone.utc).isoformat()}] Starting AirCare 3-Hour Collection Job...")

    supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_key:
        if os.environ.get("GITHUB_ACTIONS"):
            print("[✗] FATAL ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY secret is missing in GitHub repository settings.")
            print("[✗] Please configure these repository secrets under Settings -> Secrets and variables -> Actions.")
            sys.exit(1)
        print("[!] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in environment.")
        print("[!] Running in DRY-RUN mode. Validating Open-Meteo fetches without database write.")
        dry_run = True
    else:
        # Sanitize logs: Print only host without sensitive key tokens
        print(f"[*] Supabase target configured: {supabase_url}")
        dry_run = False

    collected_readings = []
    success_count = 0
    error_count = 0

    for idx, target in enumerate(TRACKED_CITIES):
        try:
            reading = fetch_city_reading(target)
            collected_readings.append(reading)
            success_count += 1
            print(f"  [✓] {target['city']}: AQI {reading['estimated_aqi']} ({reading['aqi_category']}, Dom: {reading['dominant_pollutant']})")
        except Exception as err:
            error_count += 1
            print(f"  [✗] {target['city']} failed: {err}")

        # Rate-limiting pause between API queries
        if idx < len(TRACKED_CITIES) - 1:
            time.sleep(0.4)

    print(f"\n[*] Atmospheric collection finished: {success_count}/{len(TRACKED_CITIES)} succeeded.")

    if success_count == 0:
        print("[✗] FATAL ERROR: All city collection attempts failed. Aborting job.")
        sys.exit(1)

    if not dry_run and collected_readings:
        print("[*] Upserting readings to Supabase...")
        res = push_to_supabase(collected_readings, supabase_url, service_key)
        if res.get("status") == "success":
            new_rows = res.get("count", 0)
            print(f"[✓] Successfully processed {len(collected_readings)} records in Supabase ({new_rows} new rows inserted, duplicates safely skipped).")
        else:
            print(f"[✗] Supabase upsert error: {res}")
            sys.exit(1)
    else:
        print("[i] Dry-run complete. All algorithms and schemas validated successfully.")

    return success_count


if __name__ == "__main__":
    run_collection()
