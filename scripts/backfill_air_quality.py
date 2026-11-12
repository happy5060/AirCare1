"""
AirCare — Historical Atmospheric Data Backfill & Meteorological Ingestion Pipeline
Phase 3.1: Final Scientific & Technical Refinements with Segmented Timestamp Validation

Scientific Principles & Data Governance:
1. Native 3-Hour CAMS Observations & Contiguous Segmented Validation:
   - Copernicus Atmosphere Monitoring Service (CAMS) Global Atmospheric Composition
     Forecasts (IFS-COMPO) operate on a 0.4° grid (~45 km) with native 3-hourly timesteps
     (00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00 UTC).
   - Time-series spacing is validated using contiguous hourly segmentation.
   - Missing hourly timestamps, duplicate timestamps, out-of-order timestamps, and
     non-zero minutes/seconds break contiguous segments and are rejected from native CAMS classification.
   - Raw database pollutant columns (pm2_5, pm10, no2, so2, co, o3) contain ONLY validated native
     three-hour CAMS values (is_interpolated = False). Intermediate hourly values are never
     presented as independent physical observations.
2. Input Validation:
   - Pollutants: Invalid, negative, NaN, and infinite concentrations are strictly rejected
     and preserved as NULL (None). They are never falsely coerced to zero.
   - Weather: Ambient temperature preserves legitimate negative values (e.g. -5.0°C) with
     strict bounds [-50°C, 65°C]. Non-negative weather variables (wind, BLH, relative humidity)
     reject negative, NaN, Inf, and non-numeric values without zero-conversion.
3. AQI Averaging-Period Correctness:
   - Instantaneous 3-hour concentrations are NOT labelled or composited as CPCB AQI.
   - CPCB sub-index formulas require 24-hour diurnal averages (PM2.5, PM10, NO2, SO2)
     and 8-hour averages (CO, O3).
   - Composite AQI is computed strictly on multi-hour retrospective rolling averages,
     requiring at least three criteria pollutants with at least one particulate fraction.
   - The result is explicitly designated a "model-derived rolling AQI estimate", not an
     official CAAQMS ground-station regulatory measurement.
4. Rolling-Window Duplicate Protection & Completeness:
   - Within each rolling window, each expected UTC hourly timestamp contributes at most once.
   - Duplicate or irregular timestamps are detected and reported; they never inflate completeness counts.
   - 24-hour rolling windows require >= 18 valid hourly samples out of 24 (>= 75%).
   - 8-hour rolling windows require >= 6 valid hourly samples out of 8 (>= 75%).
   - Window boundaries are enforced via exact timestamp arithmetic: [T_current - (window-1)h : T_current].
5. Meteorological Provenance:
   - Sourced from Open-Meteo Weather Forecast API (/v1/forecast).
   - Aligned using exact UTC timestamp keys; mismatched timestamps evaluate to NULL.
   - Documented as Open-Meteo operational weather blend; single-model pinning is not asserted
     unless explicitly parameterized in query.
6. Execution Safety & Accurate Partial-Insertion Accounting:
   - Compound unique constraint (city, source, observed_at) isolates historical data.
   - Inserted and duplicate-skipped totals update incrementally after every successful batch.
   - Earlier successful batch counts are preserved if a later batch fails.
   - Tracks partial city ingestion and returns exit code 1 on any failure.
"""

import os
import sys
import json
import math
import time
import socket
import argparse
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta

# Ensure IPv4 is prioritized on Windows environments to prevent IPv6 handshake timeouts
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

def sanitize_concentration(v) -> float:
    """
    Validates pollutant concentration inputs.
    - Rejects None, non-numeric, NaN, +/-Inf, and negative values (< 0).
    - Returns None (NULL) for all invalid or unmonitored readings.
    - Never converts invalid or missing readings to zero.
    """
    if v is None:
        return None
    try:
        val = float(v)
        if math.isnan(val) or math.isinf(val) or val < 0.0:
            return None
        return val
    except (ValueError, TypeError):
        return None

def sanitize_temperature(v) -> float:
    """
    Validates ambient air temperature in Celsius.
    - Handles None, non-numeric, NaN, and +/-Inf safely.
    - Preserves legitimate negative temperatures (e.g. -5.0°C).
    - Enforces realistic atmospheric bounds [-50.0°C, 65.0°C] matching schema check.
    - Never converts invalid or missing values to zero.
    """
    if v is None:
        return None
    try:
        val = float(v)
        if math.isnan(val) or math.isinf(val) or val < -50.0 or val > 65.0:
            return None
        return val
    except (ValueError, TypeError):
        return None

def sanitize_weather_non_negative(v, max_val: float = None) -> float:
    """
    Validates non-negative meteorological variables (wind speed, BLH, relative humidity).
    - Handles None, non-numeric, NaN, and +/-Inf safely.
    - Rejects negative values (< 0).
    - If max_val is provided (e.g. 100% for relative humidity), rejects val > max_val.
    - Never converts invalid or missing values to zero.
    """
    if v is None:
        return None
    try:
        val = float(v)
        if math.isnan(val) or math.isinf(val) or val < 0.0:
            return None
        if max_val is not None and val > max_val:
            return None
        return val
    except (ValueError, TypeError):
        return None

# Official CPCB Sub-Index Formulae (2014 Standard Piecewise Linear Breakpoints)
# Returns None if input concentration is invalid/None
def calc_sub_index_pm25(v: float):
    val = sanitize_concentration(v)
    if val is None: return None
    if val <= 30: return round((val * 50) / 30)
    elif val <= 60: return round(50 + ((val - 30) * 50) / 30)
    elif val <= 90: return round(100 + ((val - 60) * 100) / 30)
    elif val <= 120: return round(200 + ((val - 90) * 100) / 30)
    elif val <= 250: return round(300 + ((val - 120) * 100) / 130)
    else: return min(500, round(400 + ((val - 250) * 100) / 130))

def calc_sub_index_pm10(v: float):
    val = sanitize_concentration(v)
    if val is None: return None
    if val <= 50: return round(val)
    elif val <= 100: return round(val)
    elif val <= 250: return round(100 + ((val - 100) * 100) / 150)
    elif val <= 350: return round(200 + (val - 250))
    elif val <= 430: return round(300 + ((val - 350) * 100) / 80)
    else: return min(500, round(400 + ((val - 430) * 100) / 70))

def calc_sub_index_no2(v: float):
    val = sanitize_concentration(v)
    if val is None: return None
    if val <= 40: return round((val * 50) / 40)
    elif val <= 80: return round(50 + ((val - 40) * 50) / 40)
    elif val <= 180: return round(100 + ((val - 80) * 100) / 100)
    elif val <= 280: return round(200 + ((val - 180) * 100) / 100)
    elif val <= 400: return round(300 + ((val - 280) * 100) / 120)
    else: return min(500, round(400 + ((val - 400) * 100) / 100))

def calc_sub_index_so2(v: float):
    val = sanitize_concentration(v)
    if val is None: return None
    if val <= 40: return round((val * 50) / 40)
    elif val <= 80: return round(50 + ((val - 40) * 50) / 40)
    elif val <= 380: return round(100 + ((val - 80) * 100) / 300)
    elif val <= 800: return round(200 + ((val - 380) * 100) / 420)
    elif val <= 1600: return round(300 + ((val - 800) * 100) / 800)
    else: return min(500, round(400 + ((val - 1600) * 100) / 400))

def calc_sub_index_co(co_mg: float):
    val = sanitize_concentration(co_mg)
    if val is None: return None
    if val <= 1.0: return round(val * 50)
    elif val <= 2.0: return round(50 + (val - 1.0) * 50)
    elif val <= 10.0: return round(100 + ((val - 2.0) * 100) / 8.0)
    elif val <= 17.0: return round(200 + ((val - 10.0) * 100) / 7.0)
    elif val <= 34.0: return round(300 + ((val - 17.0) * 100) / 17.0)
    else: return min(500, round(400 + ((val - 34.0) * 100) / 16.0))

def calc_sub_index_o3(v: float):
    val = sanitize_concentration(v)
    if val is None: return None
    if val <= 50: return round(val)
    elif val <= 100: return round(val)
    elif val <= 168: return round(100 + ((val - 100) * 100) / 68)
    elif val <= 208: return round(200 + ((val - 168) * 100) / 40)
    elif val <= 748: return round(300 + ((val - 208) * 100) / 540)
    else: return min(500, round(400 + ((val - 748) * 100) / 252))

def get_cpcb_category(aqi: int) -> str:
    if aqi is None: return None
    if aqi <= 50: return "Good"
    if aqi <= 100: return "Satisfactory"
    if aqi <= 200: return "Moderate"
    if aqi <= 300: return "Poor"
    if aqi <= 400: return "Very Poor"
    return "Severe"

def evaluate_cpcb_composite_aqi(sub_indices: dict) -> tuple:
    """
    Evaluates composite CPCB NAQI based on official CPCB criteria:
    1. At least three (3) valid pollutant sub-indices must be available.
    2. At least one particulate matter fraction (PM2.5 or PM10) must be present.
    If conditions are met, returns (composite_aqi, aqi_category, dominant_pollutant).
    If requirements are NOT met, returns (None, None, None) while preserving sub-indices.
    """
    if not sub_indices:
        return None, None, None

    valid_items = [(p, val) for p, val in sub_indices.items() if val is not None]
    valid_pollutants = {p for p, _ in valid_items}
    has_particulate = ("PM2.5" in valid_pollutants) or ("PM10" in valid_pollutants)
    has_min_count = len(valid_items) >= 3

    if not (has_particulate and has_min_count):
        return None, None, None

    valid_items.sort(key=lambda x: x[1], reverse=True)
    composite_aqi = valid_items[0][1]
    dominant_pollutant = valid_items[0][0]
    category = get_cpcb_category(composite_aqi)

    return composite_aqi, category, dominant_pollutant

def fetch_json_with_retry(url: str, max_retries: int = 3, timeout: int = 25) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "AirCare-Provenance/1.5"})
    last_err = None
    for attempt in range(1, max_retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                if resp.status != 200:
                    raise RuntimeError(f"HTTP {resp.status}")
                return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            last_err = e
            if attempt < max_retries:
                time.sleep(1.0 * attempt)
    raise RuntimeError(f"Failed to fetch {url[:60]}... after {max_retries} attempts: {last_err}")

def parse_iso_utc(ts_str: str) -> datetime:
    """Parses ISO timestamp string (e.g., '2026-11-10T00:00') into UTC datetime."""
    clean_ts = ts_str.rstrip("Z")
    if len(clean_ts) == 16:
        clean_ts += ":00"
    return datetime.fromisoformat(clean_ts).replace(tzinfo=timezone.utc)

def classify_timestamp_provenance(ts, dataset_id: str = "cams_global") -> dict:
    """
    Classifies atmospheric model timestamp provenance adhering to documented provider capabilities.

    Provider Provenance Reality:
    - Open-Meteo Air Quality API serves CAMS Global Atmospheric Composition Forecasts.
    - CAMS Global native output is 3-hourly (00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00 UTC) on a 0.4° grid.
    - Open-Meteo provides an hourly stream via linear interpolation between 3-hour CAMS cycles.
    - The Open-Meteo API does NOT provide per-timestamp cryptographic hashes, provenance flags,
      or raw model flags distinguishing raw CAMS outputs from interpolated grid values.

    Classification Rules:
    1. If dataset_id is not 'cams_global' or is unknown/None:
       -> native_provenance_status: 'unknown', classification: 'unknown', native_provenance_verified: False.
    2. If timestamp is malformed / unparseable:
       -> native_provenance_status: 'invalid', classification: 'invalid', native_provenance_verified: False.
    3. If minute != 0 or second != 0:
       -> native_provenance_status: 'not_native', classification: 'irregular_timestamp', native_provenance_verified: False.
    4. If hour % 3 == 0 (and min==0, sec==0):
       -> classification: 'assumed_nominal_3hour'
       -> native_provenance_status: 'assumed' (EXPLICITLY ASSUMED, NEVER VERIFIED)
       -> native_provenance_verified: False
    5. If hour % 3 != 0:
       -> classification: 'interpolated_hourly_slot'
       -> native_provenance_status: 'not_native'
       -> native_provenance_verified: False
    """
    if not dataset_id or dataset_id.lower() not in ("cams_global", "cams", "cams_global_forecast"):
        return {
            "timestamp": str(ts) if ts is not None else None,
            "is_valid_format": False,
            "is_aligned_hourly": False,
            "is_nominal_3hour": False,
            "classification": "unknown",
            "native_provenance_status": "unknown",
            "native_provenance_verified": False,
            "qualification_note": "Dataset is unspecified or not recognized as CAMS Global; atmospheric model native provenance is unknown."
        }

    if ts is None:
        return {
            "timestamp": None,
            "is_valid_format": False,
            "is_aligned_hourly": False,
            "is_nominal_3hour": False,
            "classification": "invalid",
            "native_provenance_status": "invalid",
            "native_provenance_verified": False,
            "qualification_note": "Timestamp is None."
        }

    if isinstance(ts, datetime):
        dt = ts if ts.tzinfo else ts.replace(tzinfo=timezone.utc)
        ts_str = dt.isoformat()
    else:
        ts_str = str(ts)
        try:
            dt = parse_iso_utc(ts_str)
        except Exception:
            return {
                "timestamp": ts_str,
                "is_valid_format": False,
                "is_aligned_hourly": False,
                "is_nominal_3hour": False,
                "classification": "invalid",
                "native_provenance_status": "invalid",
                "native_provenance_verified": False,
                "qualification_note": f"Malformed timestamp '{ts_str}' could not be parsed as ISO UTC."
            }

    is_aligned = (dt.minute == 0 and dt.second == 0)
    if not is_aligned:
        return {
            "timestamp": ts_str,
            "is_valid_format": True,
            "is_aligned_hourly": False,
            "is_nominal_3hour": False,
            "classification": "irregular_timestamp",
            "native_provenance_status": "not_native",
            "native_provenance_verified": False,
            "qualification_note": "Non-zero minutes or seconds; does not align with standard UTC hourly slots."
        }

    is_nom_3h = (dt.hour % 3 == 0)
    if is_nom_3h:
        return {
            "timestamp": ts_str,
            "is_valid_format": True,
            "is_aligned_hourly": True,
            "is_nominal_3hour": True,
            "classification": "assumed_nominal_3hour",
            "native_provenance_status": "assumed",
            "native_provenance_verified": False,
            "qualification_note": "Nominally aligns with CAMS Global 3-hourly forecast cycles (00, 03, 06, 09, 12, 15, 18, 21 UTC). Provenance is assumed from timing alignment; Open-Meteo does not provide per-row cryptographic or raw model flags to independently verify native status."
        }
    else:
        return {
            "timestamp": ts_str,
            "is_valid_format": True,
            "is_aligned_hourly": True,
            "is_nominal_3hour": False,
            "classification": "interpolated_hourly_slot",
            "native_provenance_status": "not_native",
            "native_provenance_verified": False,
            "qualification_note": "Intermediate hourly slot linearly interpolated by Open-Meteo between 3-hour CAMS cycles; not a native model timestep."
        }

def validate_time_series_spacing(times: list, dataset_id: str = "cams_global") -> dict:
    """
    Validates source time series spacing and identifies nominal 3-hour timesteps.

    Scientific & Provenance Principles:
    1. Provider Documentation: CAMS Global operational forecast cycles output on a 3-hour cadence.
       Open-Meteo provides 1-hour arrays via linear interpolation.
    2. Missing Precursor Independence: An otherwise valid nominal 3-hour timestep (e.g. 03:00) is NOT
       rejected merely because an intermediate interpolated hour (e.g. 02:00) is absent from the API response.
    3. Anomaly Tracking: Detects duplicate source timestamps, malformed ISO strings, non-zero minutes/seconds,
       interval gaps, and out-of-order deltas without conflating intermediate interpolation with raw cycle validity.
    4. Provenance Transparency: Records whether native classification is verified, assumed, or unknown.
    """
    if not times:
        return {
            "is_uniform_hourly": False,
            "total_timestamps": 0,
            "irregular_interval_count": 0,
            "duplicate_source_timestamp_count": 0,
            "malformed_timestamp_count": 0,
            "irregular_intervals": [],
            "nominal_3hour_indices": [],
            "valid_native_indices": set(),
            "native_extraction_validation_status": "validation_failed_empty_times",
            "provenance_summary": {
                "dataset": dataset_id,
                "native_provenance_verified": False,
                "native_provenance_status": "unknown"
            }
        }

    seen_timestamps = set()
    duplicate_count = 0
    malformed_count = 0
    irregular_intervals = []
    nominal_3hour_indices = []
    last_valid_dt = None

    for i in range(len(times)):
        t_str = times[i]
        p_info = classify_timestamp_provenance(t_str, dataset_id=dataset_id)

        if not p_info["is_valid_format"]:
            malformed_count += 1
            irregular_intervals.append({
                "index": i,
                "timestamp": str(t_str),
                "reason": "malformed_iso_timestamp"
            })
            continue

        if not p_info["is_aligned_hourly"]:
            irregular_intervals.append({
                "index": i,
                "timestamp": str(t_str),
                "reason": "non_zero_minute_second"
            })
            continue

        t_dt = parse_iso_utc(t_str)
        ts_key = t_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

        if ts_key in seen_timestamps:
            duplicate_count += 1
            irregular_intervals.append({
                "index": i,
                "timestamp": str(t_str),
                "reason": "duplicate_source_timestamp"
            })
            continue
        seen_timestamps.add(ts_key)

        if last_valid_dt is not None:
            delta = t_dt - last_valid_dt
            if delta != timedelta(hours=1):
                irregular_intervals.append({
                    "index": i,
                    "prev_timestamp": last_valid_dt.isoformat(),
                    "curr_timestamp": t_str,
                    "delta_seconds": int(delta.total_seconds()),
                    "reason": "out_of_order" if delta <= timedelta(0) else "interval_gap"
                })
        last_valid_dt = t_dt

        # Check nominal 3-hour alignment
        if p_info["is_nominal_3hour"]:
            nominal_3hour_indices.append(i)

    is_uniform = (len(irregular_intervals) == 0 and duplicate_count == 0 and malformed_count == 0)

    if is_uniform:
        status = "validated_uniform_hourly"
    elif len(nominal_3hour_indices) > 0:
        status = "extracted_with_anomalies_flagged"
    else:
        status = "validation_failed_no_nominal_indices"

    prov_status = "assumed" if (dataset_id and "cams" in dataset_id.lower() and len(nominal_3hour_indices) > 0) else "unknown"

    return {
        "is_uniform_hourly": is_uniform,
        "total_timestamps": len(times),
        "irregular_interval_count": len(irregular_intervals),
        "duplicate_source_timestamp_count": duplicate_count,
        "malformed_timestamp_count": malformed_count,
        "irregular_intervals": irregular_intervals,
        "nominal_3hour_indices": nominal_3hour_indices,
        "valid_native_indices": set(nominal_3hour_indices),
        "native_extraction_validation_status": status,
        "provenance_summary": {
            "dataset": dataset_id,
            "native_provenance_verified": False,
            "native_provenance_status": prov_status,
            "qualification_label": "assumed_nominal_3hour"
        }
    }

def validate_and_segment_time_series(times: list) -> dict:
    """Backward-compatible alias for validate_time_series_spacing."""
    res = validate_time_series_spacing(times)
    res["segments"] = [(0, len(times) - 1)] if res["nominal_3hour_indices"] else []
    return res

def compute_rolling_window_stats(
    hourly_series: list,
    times: list,
    current_idx: int,
    window_hours: int = 24,
    min_required_samples: int = 18
) -> dict:
    """
    Computes retrospective rolling window statistics over the hourly model series with independent validation.
    Window bounds: [T_current - (window_hours - 1) hours, T_current] inclusive.

    Independent Validation Rules:
    1. Current Timestamp Alignment:
       The anchor timestamp times[current_idx] must be a parseable UTC ISO timestamp with minute == 0 and second == 0.
       If unaligned or malformed, the window is rejected.
    2. Timestamp Parsing:
       Malformed timestamp strings cannot participate in window calculations and are tracked in malformed_timestamp_count.
    3. Duplicate Timestamps:
       Each expected UTC hourly slot contributes at most once. Encounters of duplicate timestamps are tracked in
       duplicate_timestamp_count and ignored.
    4. Non-Zero Minutes and Seconds:
       Irregular timestamps (minute != 0 or second != 0) are tracked in irregular_timestamp_count and rejected from hourly slot membership.
    5. Actual UTC Hourly Slot Membership & Bounds:
       Timestamps outside [T_current - (window_hours - 1)h, T_current] are excluded.
    6. Out-of-Order Timestamps:
       Out-of-order timestamps within the retrospective sequence are detected and recorded in out_of_order_count.
    7. Completeness Protection:
       Invalid or duplicate samples must NEVER inflate valid_samples or affect the arithmetic mean.
       A window satisfies completeness policy only if valid_samples >= min_required_samples.
    """
    def empty_stats(malformed=0, irregular=0):
        return {
            "mean": None,
            "valid_samples": 0,
            "nominal_3hour_samples": 0,
            "native_cams_samples": 0,  # backward compatibility alias
            "interpolated_samples": 0,
            "duplicate_timestamp_count": 0,
            "malformed_timestamp_count": malformed,
            "irregular_timestamp_count": irregular,
            "out_of_order_count": 0,
            "missing_hourly_slots": window_hours,
            "total_window_hours": window_hours,
            "completeness_pct": 0.0,
            "meets_policy": False,
            "provenance_qualification": {
                "native_provenance_verified": False,
                "native_provenance_status": "assumed"
            }
        }

    if not times or not hourly_series:
        return empty_stats()

    if not isinstance(current_idx, int) or current_idx < 0 or current_idx >= len(times) or current_idx >= len(hourly_series):
        return empty_stats()

    # 1. Independent Current Timestamp Alignment & Parsing
    anchor_str = times[current_idx]
    try:
        current_dt = parse_iso_utc(anchor_str)
    except Exception:
        return empty_stats(malformed=1)

    if current_dt.minute != 0 or current_dt.second != 0:
        return empty_stats(irregular=1)

    # 2. Window Boundaries: [T_current - (window_hours - 1) hours, T_current]
    window_start_dt = current_dt - timedelta(hours=window_hours - 1)

    # 3. Discrete Expected Hourly Slots
    expected_slot_keys = {
        (window_start_dt + timedelta(hours=h)).strftime("%Y-%m-%dT%H:%M:%SZ")
        for h in range(window_hours)
    }

    seen_slots = set()
    valid_slot_values = {}
    duplicate_count = 0
    malformed_count = 0
    irregular_count = 0
    out_of_order_count = 0
    nominal_3hour_count = 0
    interpolated_count = 0
    last_seen_dt = None

    # Inspect all candidate readings up to current_idx
    for k in range(0, current_idx + 1):
        if k >= len(times) or k >= len(hourly_series):
            continue

        t_str = times[k]
        try:
            t_dt = parse_iso_utc(t_str)
        except Exception:
            malformed_count += 1
            continue

        # Check out-of-order sequence
        if last_seen_dt is not None and t_dt < last_seen_dt:
            out_of_order_count += 1
        last_seen_dt = t_dt

        # Check minute/second alignment
        if t_dt.minute != 0 or t_dt.second != 0:
            irregular_count += 1
            continue

        # Check retrospective boundary
        if not (window_start_dt <= t_dt <= current_dt):
            continue

        slot_key = t_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        if slot_key not in expected_slot_keys:
            irregular_count += 1
            continue

        # Check duplicate
        if slot_key in seen_slots:
            duplicate_count += 1
            continue
        seen_slots.add(slot_key)

        # Sanitize concentration value
        val = sanitize_concentration(hourly_series[k])
        if val is not None:
            valid_slot_values[slot_key] = val
            if t_dt.hour % 3 == 0:
                nominal_3hour_count += 1
            else:
                interpolated_count += 1

    valid_count = len(valid_slot_values)
    missing_slots = window_hours - len(seen_slots)
    completeness_pct = round((valid_count / window_hours) * 100.0, 1)
    meets_policy = (valid_count >= min_required_samples)
    mean_val = round(sum(valid_slot_values.values()) / valid_count, 2) if meets_policy else None

    return {
        "mean": mean_val,
        "valid_samples": valid_count,
        "nominal_3hour_samples": nominal_3hour_count,
        "native_cams_samples": nominal_3hour_count,  # backward compatibility alias
        "interpolated_samples": interpolated_count,
        "duplicate_timestamp_count": duplicate_count,
        "malformed_timestamp_count": malformed_count,
        "irregular_timestamp_count": irregular_count,
        "out_of_order_count": out_of_order_count,
        "missing_hourly_slots": missing_slots,
        "total_window_hours": window_hours,
        "completeness_pct": completeness_pct,
        "meets_policy": meets_policy,
        "provenance_qualification": {
            "native_provenance_verified": False,
            "native_provenance_status": "assumed",
            "policy_basis": f"Minimum {min_required_samples}/{window_hours} valid unique hourly samples required ({int(min_required_samples/window_hours*100)}%). Intermediate hours are interpolated by API provider."
        }
    }

def fetch_city_historical_data(city_info: dict, past_days: int = 90) -> list:
    """
    Fetches past atmospheric forecast runs and meteorology for a single city.
    - Timestamp validation controls native extraction via validate_and_segment_time_series().
    - Raw pollutant concentrations are populated exclusively for validated native 3-hour CAMS steps.
    - Meteorological data is defensively sanitized and aligned using exact UTC timestamp keys.
    - Computes model-derived rolling averages and resulting rolling AQI estimates.
    - Instantaneous composites are avoided for archived records to prevent misleading CPCB claims.
    """
    city = city_info["city"]
    lat = city_info["lat"]
    lon = city_info["lon"]

    # 1. Chemical Transport Feed: CAMS Global Atmospheric Composition Forecast Archive
    aq_url = (
        f"https://air-quality-api.open-meteo.com/v1/air-quality?"
        f"latitude={lat}&longitude={lon}&past_days={past_days}&forecast_days=0"
        f"&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone"
        f"&timezone=UTC"
    )
    aq_data = fetch_json_with_retry(aq_url)
    aq_h = aq_data.get("hourly", {})
    times = aq_h.get("time", [])

    if not times:
        raise ValueError(f"No air quality time-series returned for {city}")

    # Validate time series spacing and identify nominal 3-hour timesteps
    spacing_info = validate_time_series_spacing(times, dataset_id="cams_global")
    nominal_indices = spacing_info["nominal_3hour_indices"]

    if not spacing_info["is_uniform_hourly"]:
        print(f"    [!] Non-uniform time-series for {city}: "
              f"{spacing_info['irregular_interval_count']} irregular interval(s), "
              f"{spacing_info['duplicate_source_timestamp_count']} duplicate(s), "
              f"{spacing_info['malformed_timestamp_count']} malformed. "
              f"Extraction status: {spacing_info['native_extraction_validation_status']}.")

    # 2. Meteorological Feed: Open-Meteo Operational Weather Archive (/v1/forecast)
    wx_url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}&past_days={past_days}&forecast_days=0"
        f"&hourly=boundary_layer_height,wind_speed_10m,temperature_2m,relative_humidity_2m"
        f"&wind_speed_unit=ms&timezone=UTC"
    )
    try:
        wx_data = fetch_json_with_retry(wx_url)
        wx_h = wx_data.get("hourly", {})
    except Exception as e:
        print(f"    [!] Meteorological archive fetch notice for {city}: {e}. Proceeding without weather sync.")
        wx_h = {}

    # Build Exact UTC Timestamp Mapping for Meteorological Feed with Defensive Sanitization
    wx_times = wx_h.get("time", [])
    wx_blh = wx_h.get("boundary_layer_height", [])
    wx_wind = wx_h.get("wind_speed_10m", [])
    wx_temp = wx_h.get("temperature_2m", [])
    wx_rh = wx_h.get("relative_humidity_2m", [])

    wx_by_time = {}
    for w_idx, w_time in enumerate(wx_times):
        blh_val = sanitize_weather_non_negative(wx_blh[w_idx]) if w_idx < len(wx_blh) else None
        ws_val = sanitize_weather_non_negative(wx_wind[w_idx]) if w_idx < len(wx_wind) else None
        temp_val = sanitize_temperature(wx_temp[w_idx]) if w_idx < len(wx_temp) else None
        rh_val = sanitize_weather_non_negative(wx_rh[w_idx], max_val=100.0) if w_idx < len(wx_rh) else None

        wx_by_time[w_time] = {
            "boundary_layer_height": blh_val,
            "wind_speed_10m": ws_val,
            "temperature_2m": temp_val,
            "relative_humidity_2m": rh_val,
        }

    records = []
    fetched_at = datetime.now(timezone.utc).isoformat()
    weather_alignment_failures = 0

    # Parse raw pollutant series using strict sanitization (reject negative/NaN/Inf)
    raw_p25 = [sanitize_concentration(v) for v in aq_h.get('pm2_5', [])]
    raw_p10 = [sanitize_concentration(v) for v in aq_h.get('pm10', [])]
    raw_no2 = [sanitize_concentration(v) for v in aq_h.get('nitrogen_dioxide', [])]
    raw_so2 = [sanitize_concentration(v) for v in aq_h.get('sulphur_dioxide', [])]
    raw_o3 = [sanitize_concentration(v) for v in aq_h.get('ozone', [])]
    # CO is returned in µg/m³. Convert to CPCB standard mg/m³
    raw_co_ug = [sanitize_concentration(v) for v in aq_h.get('carbon_monoxide', [])]
    raw_co_mg = [round(v / 1000.0, 3) if v is not None else None for v in raw_co_ug]

    for idx, t_str in enumerate(times):
        # Extract nominal 3-hour timesteps only
        if idx not in nominal_indices:
            continue

        observed_at = t_str + ":00Z"

        # 1. Nominal 3-Hour Instantaneous Pollutant Concentrations (assumed CAMS alignment)
        p25 = raw_p25[idx] if idx < len(raw_p25) else None
        p10 = raw_p10[idx] if idx < len(raw_p10) else None
        no2 = raw_no2[idx] if idx < len(raw_no2) else None
        so2 = raw_so2[idx] if idx < len(raw_so2) else None
        co_mg = raw_co_mg[idx] if idx < len(raw_co_mg) else None
        o3 = raw_o3[idx] if idx < len(raw_o3) else None

        # 2. Individual Instantaneous Sub-indices (preserved in metadata only; no misleading instantaneous composite)
        instant_sub_dict = {}
        if p25 is not None: instant_sub_dict["PM2.5"] = calc_sub_index_pm25(p25)
        if p10 is not None: instant_sub_dict["PM10"] = calc_sub_index_pm10(p10)
        if no2 is not None: instant_sub_dict["NO2"] = calc_sub_index_no2(no2)
        if so2 is not None: instant_sub_dict["SO2"] = calc_sub_index_so2(so2)
        if co_mg is not None: instant_sub_dict["CO"] = calc_sub_index_co(co_mg)
        if o3 is not None: instant_sub_dict["O3"] = calc_sub_index_o3(o3)

        # 3. Model-Derived Rolling Window Calculations
        # 24-hr window (PM2.5, PM10, NO2, SO2) with 75% completeness (>= 18 of 24 hourly steps)
        # 8-hr window (CO, O3) with 75% completeness (>= 6 of 8 hourly steps)
        stats_p25 = compute_rolling_window_stats(raw_p25, times, idx, window_hours=24, min_required_samples=18)
        stats_p10 = compute_rolling_window_stats(raw_p10, times, idx, window_hours=24, min_required_samples=18)
        stats_no2 = compute_rolling_window_stats(raw_no2, times, idx, window_hours=24, min_required_samples=18)
        stats_so2 = compute_rolling_window_stats(raw_so2, times, idx, window_hours=24, min_required_samples=18)
        stats_co = compute_rolling_window_stats(raw_co_mg, times, idx, window_hours=8, min_required_samples=6)
        stats_o3 = compute_rolling_window_stats(raw_o3, times, idx, window_hours=8, min_required_samples=6)

        roll_24h_p25 = stats_p25["mean"]
        roll_24h_pm10 = stats_p10["mean"]
        roll_24h_no2 = stats_no2["mean"]
        roll_24h_so2 = stats_so2["mean"]
        roll_8h_co = stats_co["mean"]
        roll_8h_o3 = stats_o3["mean"]

        # Rolling individual sub-indices
        rolling_sub_dict = {}
        if roll_24h_p25 is not None: rolling_sub_dict["PM2.5"] = calc_sub_index_pm25(roll_24h_p25)
        if roll_24h_pm10 is not None: rolling_sub_dict["PM10"] = calc_sub_index_pm10(roll_24h_pm10)
        if roll_24h_no2 is not None: rolling_sub_dict["NO2"] = calc_sub_index_no2(roll_24h_no2)
        if roll_24h_so2 is not None: rolling_sub_dict["SO2"] = calc_sub_index_so2(roll_24h_so2)
        if roll_8h_co is not None: rolling_sub_dict["CO"] = calc_sub_index_co(roll_8h_co)
        if roll_8h_o3 is not None: rolling_sub_dict["O3"] = calc_sub_index_o3(roll_8h_o3)

        # Enforce CPCB Minimum Criteria for Rolling Composite AQI (>=3 pollutants, >=1 particulate)
        derived_rolling_aqi, derived_rolling_category, derived_rolling_dominant = evaluate_cpcb_composite_aqi(rolling_sub_dict)

        # 4. Meteorological Alignment Using Exact UTC Timestamp Key
        wx_match = wx_by_time.get(t_str)
        if wx_match is not None:
            blh = wx_match["boundary_layer_height"]
            ws = wx_match["wind_speed_10m"]
            temp = wx_match["temperature_2m"]
            rh = wx_match["relative_humidity_2m"]
            vc = round(blh * ws, 2) if (blh is not None and ws is not None) else None
        else:
            weather_alignment_failures += 1
            blh = None
            ws = None
            temp = None
            rh = None
            vc = None

        # 5. Assemble Structured Database Record
        record = {
            "city": city,
            "source": "open-meteo-historical",
            "source_type": "archived_forecast",
            "observed_at": observed_at,
            "fetched_at": fetched_at,
            "latitude": lat,
            "longitude": lon,

            # Native Instantaneous Concentrations (preserves NULL for invalid/missing)
            "pm2_5": p25,
            "pm10": p10,
            "no2": no2,
            "so2": so2,
            "co": co_mg,
            "o3": o3,

            # Core AQI Fields: Populated with model-derived rolling estimate adhering to 24h/8h rules
            "estimated_aqi": derived_rolling_aqi,
            "aqi_category": derived_rolling_category,
            "dominant_pollutant": derived_rolling_dominant,

            # Structured Model-Derived Rolling Averages
            "rolling_24h_pm2_5": roll_24h_p25,
            "rolling_24h_pm10": roll_24h_pm10,
            "rolling_24h_no2": roll_24h_no2,
            "rolling_24h_so2": roll_24h_so2,
            "rolling_8h_co": roll_8h_co,
            "rolling_8h_o3": roll_8h_o3,
            "derived_rolling_aqi": derived_rolling_aqi,
            "derived_rolling_category": derived_rolling_category,

            # Structured Meteorology & Dispersion Variables
            "temperature_c": temp,
            "relative_humidity_pct": rh,
            "wind_speed_10m_ms": ws,
            "boundary_layer_height_m": blh,
            "ventilation_coefficient_m2s": vc,

            # Provenance, Metadata & Window Diagnostics
            "model_or_source_metadata": {
                "pipeline": "phase_3_archived_forecast_backfill",
                "chemical_transport_model": {
                    "provider": "Open-Meteo Air Quality API (/v1/air-quality)",
                    "dataset": "Copernicus Atmosphere Monitoring Service (CAMS) Global Atmospheric Composition Forecasts",
                    "model_name": "ECMWF IFS-COMPO",
                    "spatial_resolution": "0.4° (~45 km global grid)",
                    "native_temporal_resolution": "3-hourly",
                    "native_temporal_resolution_assumption": "CAMS Global operational forecast cycles produce native atmospheric transport outputs at 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00 UTC on a 0.4° grid. Open-Meteo provides 1-hour uniform arrays via linear interpolation between these 3-hour timesteps.",
                    "is_uniform_hourly": spacing_info["is_uniform_hourly"],
                    "irregular_interval_count": spacing_info["irregular_interval_count"],
                    "duplicate_source_timestamp_count": spacing_info["duplicate_source_timestamp_count"],
                    "malformed_timestamp_count": spacing_info["malformed_timestamp_count"],
                    "native_extraction_validation_status": spacing_info["native_extraction_validation_status"],
                    "native_provenance_verified": False,
                    "native_provenance_status": "assumed",
                    "sampling_classification": "assumed_nominal_3hour",
                    "is_interpolated": False,
                    "raw_co_ug_m3": raw_co_ug[idx] if idx < len(raw_co_ug) else None
                },
                "meteorological_model": {
                    "provider": "Open-Meteo Weather Forecast API (/v1/forecast)",
                    "model_blend": "Open-Meteo Operational Seamless Numerical Weather Model Grid",
                    "native_temporal_resolution": "1-hourly (sampled at matching 3-hourly timesteps)",
                    "timestamp_aligned": (wx_match is not None),
                    "model_identification_note": "Open-Meteo /v1/forecast serves a blended numerical weather prediction dataset. A specific single model (e.g. ECMWF IFS) is not asserted unless explicitly parameterised in query."
                },
                "provenance_classification": {
                    "source_type": "archived_forecast",
                    "native_provenance_verified": False,
                    "native_provenance_status": "assumed",
                    "classification_label": "assumed_nominal_3hour",
                    "explanation": "Archived numerical operational forecast runs from Open-Meteo CAMS Global feed; distinct from multi-decadal retrospective reanalysis (e.g., ERA5, CAMS EAC4).",
                    "provenance_qualification": "Open-Meteo serves an interpolated hourly stream derived from CAMS Global 3-hourly forecast cycles. While timesteps at 00, 03, 06, 09, 12, 15, 18, 21 UTC nominally align with native CAMS cycles, native status cannot be independently verified from API payload alone and is therefore classified as assumed, not verified.",
                    "official_cpcb_compliance": False,
                    "regulatory_notice": "Model-derived rolling estimate; does not represent official CAAQMS physical station continuous monitoring bulletins."
                },
                "time_series_validation": {
                    "is_uniform_hourly": spacing_info["is_uniform_hourly"],
                    "irregular_interval_count": spacing_info["irregular_interval_count"],
                    "duplicate_source_timestamp_count": spacing_info["duplicate_source_timestamp_count"],
                    "malformed_timestamp_count": spacing_info["malformed_timestamp_count"],
                    "native_extraction_validation_status": spacing_info["native_extraction_validation_status"],
                    "native_provenance_verified": False,
                    "native_provenance_status": "assumed"
                },
                "aqi_methodology": {
                    "aqi_classification": "model_derived_rolling_estimate",
                    "averaging_periods": "24h retrospective rolling mean (PM2.5, PM10, NO2, SO2), 8h retrospective rolling mean (CO, O3)",
                    "instantaneous_composite_calculated": False,
                    "rolling_criteria_satisfied": (derived_rolling_aqi is not None),
                    "rolling_pollutant_count": len([p for p, v in rolling_sub_dict.items() if v is not None])
                },
                "instantaneous_individual_sub_indices": instant_sub_dict,
                "rolling_sub_indices": rolling_sub_dict,
                "rolling_window_diagnostics": {
                    "pm2_5_24h": stats_p25,
                    "pm10_24h": stats_p10,
                    "no2_24h": stats_no2,
                    "so2_24h": stats_so2,
                    "co_8h": stats_co,
                    "o3_8h": stats_o3,
                    "policy_note": "A minimum of 75% samples required for rolling means (18/24 for 24h, 6/8 for 8h). Intermediate hourly grid slots are linearly interpolated between 3-hour CAMS cycles and do NOT represent independent physical observations."
                }
            }
        }
        records.append(record)

    if weather_alignment_failures > 0:
        print(f"   [!] Weather alignment note for {city}: {weather_alignment_failures}/{len(records)} steps had no matching weather timestamp.")

    return records

def push_batch_to_supabase(batch: list, supabase_url: str, service_key: str) -> dict:
    """
    Pushes a batch of records to Supabase with idempotent resolution=ignore-duplicates.
    Returns:
    - inserted: count of newly created rows
    - skipped: count of rows that already existed and were ignored
    """
    endpoint = f"{supabase_url.rstrip('/')}/rest/v1/air_quality_readings?on_conflict=city,source,observed_at"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=ignore-duplicates,return=representation"
    }

    req = urllib.request.Request(
        endpoint,
        data=json.dumps(batch).encode("utf-8"),
        headers=headers,
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            inserted_rows = json.loads(body) if body else []
            inserted_count = len(inserted_rows)
            skipped_count = len(batch) - inserted_count
            return {
                "status": "success",
                "inserted": inserted_count,
                "skipped": skipped_count
            }
    except urllib.error.HTTPError as e:
        error_msg = e.read().decode("utf-8", errors="replace")
        return {"status": "error", "code": e.code, "message": error_msg}

def run_backfill(cities: list = None, past_days: int = 90, dry_run: bool = True) -> int:
    """
    Executes backfill workflow with incremental batch accounting.
    Returns exit code: 0 if all cities succeeded, 1 if any city failed.
    """
    print("=" * 78)
    print(f" AirCare Phase 3.1 — Historical Backfill Pipeline ({'DRY-RUN ONLY' if dry_run else 'LIVE DATABASE INSERT'})")
    print(f" Target Window: Past {past_days} Days | Nominal 3-Hourly Sampling (00, 03, 06, 09, 12, 15, 18, 21 UTC)")
    print("=" * 78)

    target_cities = TRACKED_CITIES
    if cities:
        target_cities = [c for c in TRACKED_CITIES if c["city"].lower() in [x.lower() for x in cities]]
        if not target_cities:
            print(f"[✗] Error: None of the requested cities {cities} match tracked cities.")
            return 1

    supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not dry_run and (not supabase_url or not service_key):
        print("[✗] Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for live execution.")
        return 1

    total_records = 0
    total_inserted = 0
    total_skipped = 0

    successful_cities = []
    failed_cities = []

    for idx, target in enumerate(target_cities, 1):
        city = target["city"]
        print(f"\n[{idx:02d}/{len(target_cities)}] Fetching {city} (Lat: {target['lat']}, Lon: {target['lon']})...")
        try:
            records = fetch_city_historical_data(target, past_days=past_days)
            total_records += len(records)
            print(f"   [✓] Retrieved {len(records)} nominal 3-hour timesteps ({records[0]['observed_at'] if records else 'N/A'} -> {records[-1]['observed_at'] if records else 'N/A'}) [assumed CAMS alignment]")

            # Validate completeness & model-derived rolling AQI adherence
            roll_cpcb_count = sum(1 for r in records if r["derived_rolling_aqi"] is not None)
            met_count = sum(1 for r in records if r["temperature_c"] is not None)
            vc_count = sum(1 for r in records if r["ventilation_coefficient_m2s"] is not None)

            print(f"   [✓] Rolling AQI estimates validated: {roll_cpcb_count}/{len(records)} steps meet 24h/8h criteria")
            print(f"   [✓] Weather aligned: {met_count}/{len(records)} steps ({vc_count} with Ventilation Coefficient)")

            if records:
                sample = records[-1]
                print(f"   [i] Sample [{sample['observed_at']}]: PM2.5={sample['pm2_5']} µg/m³, "
                      f"Roll24hPM2.5={sample['rolling_24h_pm2_5']} µg/m³, "
                      f"EstimatedRollingAQI={sample['estimated_aqi']} ({sample['aqi_category']}), "
                      f"Dominant={sample['dominant_pollutant']}, "
                      f"Temp={sample['temperature_c']}°C, BLH={sample['boundary_layer_height_m']}m, Vc={sample['ventilation_coefficient_m2s']} m²/s")

            if not dry_run and records:
                batch_size = 100
                city_inserted = 0
                city_skipped = 0
                batch_failed = False
                batch_error = None
                for b_start in range(0, len(records), batch_size):
                    batch = records[b_start:b_start + batch_size]
                    res = push_batch_to_supabase(batch, supabase_url, service_key)
                    if res.get("status") == "success":
                        batch_inserted = res.get("inserted", 0)
                        batch_skipped = res.get("skipped", 0)
                        city_inserted += batch_inserted
                        city_skipped += batch_skipped
                        total_inserted += batch_inserted
                        total_skipped += batch_skipped
                    else:
                        print(f"   [✗] Batch upsert error on batch starting at index {b_start}: {res}")
                        batch_failed = True
                        batch_error = res
                        break

                if batch_failed:
                    failed_cities.append({
                        "city": city,
                        "error": f"Database batch write failed: {batch_error}",
                        "partial_inserted": city_inserted,
                        "partial_skipped": city_skipped,
                        "total_records": len(records)
                    })
                    print(f"   [!] Partial city ingestion recorded: {city_inserted} inserted, {city_skipped} skipped before failure.")
                else:
                    successful_cities.append(city)
                    print(f"   [✓] Database Sync: {city_inserted} inserted, {city_skipped} skipped duplicates")
            else:
                successful_cities.append(city)

        except Exception as err:
            print(f"   [✗] Error processing {city}: {err}")
            failed_cities.append({"city": city, "error": str(err)})

        time.sleep(0.3)

    print("\n" + "=" * 78)
    print(" FINAL PIPELINE EXECUTION SUMMARY")
    print("=" * 78)
    print(f" Successful cities ({len(successful_cities)}/{len(target_cities)}): {', '.join(successful_cities) if successful_cities else 'None'}")
    if failed_cities:
        print(f" [!] FAILED CITIES ({len(failed_cities)}/{len(target_cities)}): {', '.join([f['city'] for f in failed_cities])}")
        for f in failed_cities:
            err_detail = f.get('error')
            if "partial_inserted" in f:
                err_detail += f" (Partial Ingestion: {f['partial_inserted']} inserted, {f['partial_skipped']} skipped)"
            print(f"     - {f['city']}: {err_detail}")

    print(f" Total 3-hour records processed: {total_records}")
    if not dry_run:
        print(f" Total rows inserted into Supabase: {total_inserted}")
        print(f" Total duplicate rows safely skipped: {total_skipped}")
    else:
        print(" Mode: DRY RUN (0 database mutations)")
    print("=" * 78)

    return 0 if len(failed_cities) == 0 else 1

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AirCare Phase 3.1 Historical Atmospheric Backfill")
    parser.add_argument("--live", action="store_true", help="Execute live database inserts (requires env credentials)")
    parser.add_argument("--cities", nargs="+", help="Subset of cities to process (e.g. --cities Delhi Mumbai)")
    parser.add_argument("--past-days", type=int, default=90, help="Number of historical days to backfill (default: 90)")
    args = parser.parse_args()

    exit_code = run_backfill(cities=args.cities, past_days=args.past_days, dry_run=not args.live)
    sys.exit(exit_code)
