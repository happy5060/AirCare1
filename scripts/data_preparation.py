"""
AirCare Historical & Operational Data Preparation Module
Prepares chronological daily time series for TimesFM forecasting and backtesting.
Handles missing dates, gap filling, source demarcation, and city filtering.
"""

import os
import json
import urllib.request
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple

try:
    from dotenv import load_dotenv
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    load_dotenv(os.path.join(root_dir, '.env'))
    load_dotenv(os.path.join(root_dir, 'frontend', '.env'))
except ImportError:
    pass

POLLUTANTS = ['pm2_5', 'pm10', 'no2', 'so2', 'co', 'o3']

# 10 Primary Tracked Cities in AirCare
PRIMARY_CITIES = [
    'Delhi', 'Mumbai', 'Bengaluru', 'Kolkata', 'Chennai',
    'Hyderabad', 'Ahmedabad', 'Pune', 'Jaipur', 'Lucknow'
]

def load_historical_city_data(city: str) -> pd.DataFrame:
    """
    Loads historical daily records for a city from cleaned_city_day.csv
    and cleaned_cpcb_aqi_bulletins.csv.
    """
    df_city_day = None
    city_day_path = os.path.join(os.path.dirname(__file__), '..', 'processed_data', 'cleaned_city_day.csv')
    if os.path.exists(city_day_path):
        df_all = pd.read_csv(city_day_path, low_memory=False)
        city_rows = df_all[df_all['city'].str.lower() == city.lower()].copy()
        if not city_rows.empty:
            city_rows['date'] = pd.to_datetime(city_rows['date'])
            city_rows = city_rows.sort_values('date').drop_duplicates(subset=['date'])
            df_city_day = city_rows

    bulletin_path = os.path.join(os.path.dirname(__file__), '..', 'processed_data', 'cleaned_cpcb_aqi_bulletins.csv')
    df_bulletin = None
    if os.path.exists(bulletin_path):
        df_b_all = pd.read_csv(bulletin_path, low_memory=False)
        b_rows = df_b_all[df_b_all['city'].str.lower() == city.lower()].copy()
        if not b_rows.empty:
            b_rows['date'] = pd.to_datetime(b_rows['date'])
            b_rows = b_rows.sort_values('date').drop_duplicates(subset=['date'])
            df_bulletin = b_rows

    if df_city_day is not None and not df_city_day.empty:
        # Reindex to full daily range to prevent timestamp jumps
        full_idx = pd.date_range(start=df_city_day['date'].min(), end=df_city_day['date'].max(), freq='D')
        df_city_day = df_city_day.set_index('date').reindex(full_idx)
        df_city_day.index.name = 'date'
        df_city_day['city'] = city
        df_city_day = df_city_day.reset_index()

        # Forward fill small gaps (up to 3 consecutive missing days)
        for p in POLLUTANTS + ['aqi']:
            if p in df_city_day.columns:
                df_city_day[p] = df_city_day[p].interpolate(method='linear', limit=3)
        return df_city_day

    if df_bulletin is not None and not df_bulletin.empty:
        full_idx = pd.date_range(start=df_bulletin['date'].min(), end=df_bulletin['date'].max(), freq='D')
        df_bulletin = df_bulletin.set_index('date').reindex(full_idx)
        df_bulletin.index.name = 'date'
        df_bulletin['city'] = city
        df_bulletin = df_bulletin.reset_index()
        df_bulletin['aqi'] = df_bulletin['aqi'].interpolate(method='linear', limit=3)
        return df_bulletin

    return pd.DataFrame()

def fetch_latest_supabase_readings(city: str, limit: int = 40) -> pd.DataFrame:
    """
    Fetches the latest recorded readings from Supabase air_quality_readings table.
    Returns DataFrame indexed by observed_at date.
    """
    supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL") or "https://mxzkdikylyvhxrtxucxi.supabase.co"
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")

    if not key:
        return pd.DataFrame()

    url = f"{supabase_url}/rest/v1/air_quality_readings?city=eq.{city}&order=observed_at.desc&limit={limit}"
    req = urllib.request.Request(
        url,
        headers={"apikey": key, "Authorization": f"Bearer {key}"}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if not data:
                return pd.DataFrame()
            df = pd.DataFrame(data)
            df['date'] = pd.to_datetime(df['observed_at'])
            df = df.sort_values('date')
            return df
    except Exception as e:
        print(f"[DataPreparation] Warning: Could not query Supabase for {city}: {e}")
        return pd.DataFrame()

def prepare_forecasting_context(city: str, context_len: int = 64) -> Dict[str, Any]:
    """
    Constructs the latest valid historical context for a city.
    Combines historical CPCB telemetry with recent Supabase records where available.
    Returns:
      {
        'city': city,
        'latest_date': 'YYYY-MM-DD',
        'source': '...',
        'pollutants': {
            'pm2_5': np.ndarray,
            'pm10': np.ndarray,
            ...
        },
        'aqi': np.ndarray,
        'valid': bool
      }
    """
    # 1. First check recent Supabase records
    df_sb = fetch_latest_supabase_readings(city, limit= context_len * 8) # 3-hourly readings
    if not df_sb.empty:
        # Group 3-hourly or hourly readings by calendar date (daily mean)
        df_sb['day'] = df_sb['date'].dt.date
        daily_sb = df_sb.groupby('day')[POLLUTANTS + ['estimated_aqi']].mean().reset_index()
        daily_sb = daily_sb.rename(columns={'estimated_aqi': 'aqi', 'day': 'date'})
        daily_sb['date'] = pd.to_datetime(daily_sb['date'])
        daily_sb = daily_sb.sort_values('date')

        if len(daily_sb) >= 3:
            latest_row = daily_sb.iloc[-1]
            pollutant_series = {}
            for p in POLLUTANTS:
                s = daily_sb[p].dropna().values
                if len(s) > 0:
                    pollutant_series[p] = s[-context_len:]
                else:
                    pollutant_series[p] = np.array([])
            aqi_s = daily_sb['aqi'].dropna().values
            return {
                'city': city,
                'latest_date': str(latest_row['date'].date()),
                'source': 'supabase_recent_atmospheric',
                'pollutants': pollutant_series,
                'aqi': aqi_s[-context_len:] if len(aqi_s) > 0 else np.array([]),
                'valid': True
            }

    # 2. Fall back to historical CPCB dataset
    df_hist = load_historical_city_data(city)
    if df_hist.empty:
        return {'city': city, 'valid': False, 'error': f'No historical data available for {city}'}

    # Drop trailing NaNs in AQI
    valid_hist = df_hist.dropna(subset=['aqi']).copy()
    if valid_hist.empty or len(valid_hist) < 10:
        return {'city': city, 'valid': False, 'error': f'Insufficient valid historical observations for {city}'}

    tail = valid_hist.tail(context_len)
    latest_date_str = str(tail.iloc[-1]['date'].date())

    pollutant_series = {}
    for p in POLLUTANTS:
        if p in tail.columns:
            s = tail[p].ffill().bfill().values
            pollutant_series[p] = s
        else:
            pollutant_series[p] = np.array([])

    aqi_s = tail['aqi'].ffill().bfill().values

    return {
        'city': city,
        'latest_date': latest_date_str,
        'source': 'cpcb_historical_archive',
        'pollutants': pollutant_series,
        'aqi': aqi_s,
        'valid': True
    }

