import json
import urllib.request
from datetime import datetime, timezone

def calc_pm25(v):
    if v <= 0: return 0
    if v <= 30: return round((v * 50) / 30)
    if v <= 60: return round(50 + ((v - 30) * 50) / 30)
    if v <= 90: return round(100 + ((v - 60) * 100) / 30)
    if v <= 120: return round(200 + ((v - 90) * 100) / 30)
    if v <= 250: return round(300 + ((v - 120) * 100) / 130)
    return min(500, round(400 + ((v - 250) * 100) / 130))

def calc_pm10(v):
    if v <= 0: return 0
    if v <= 50: return round(v)
    if v <= 100: return round(v)
    if v <= 250: return round(100 + ((v - 100) * 100) / 150)
    if v <= 350: return round(200 + (v - 250))
    if v <= 430: return round(300 + ((v - 350) * 100) / 80)
    return min(500, round(400 + ((v - 430) * 100) / 70))

def calc_no2(v):
    if v <= 0: return 0
    if v <= 40: return round((v * 50) / 40)
    if v <= 80: return round(50 + ((v - 40) * 50) / 40)
    if v <= 180: return round(100 + ((v - 80) * 100) / 100)
    if v <= 280: return round(200 + ((v - 180) * 100) / 100)
    if v <= 400: return round(300 + ((v - 280) * 100) / 120)
    return min(500, round(400 + ((v - 400) * 100) / 100))

def calc_so2(v):
    if v <= 0: return 0
    if v <= 40: return round((v * 50) / 40)
    if v <= 80: return round(50 + ((v - 40) * 50) / 40)
    if v <= 380: return round(100 + ((v - 80) * 100) / 300)
    if v <= 800: return round(200 + ((v - 380) * 100) / 420)
    if v <= 1600: return round(300 + ((v - 800) * 100) / 800)
    return min(500, round(400 + ((v - 1600) * 100) / 400))

def calc_co(co_mg):
    if co_mg <= 0: return 0
    if co_mg <= 1.0: return round(co_mg * 50)
    if co_mg <= 2.0: return round(50 + (co_mg - 1.0) * 50)
    if co_mg <= 10.0: return round(100 + ((co_mg - 2.0) * 100) / 8.0)
    if co_mg <= 17.0: return round(200 + ((co_mg - 10.0) * 100) / 7.0)
    if co_mg <= 34.0: return round(300 + ((co_mg - 17.0) * 100) / 17.0)
    return min(500, round(400 + ((co_mg - 34.0) * 100) / 16.0))

def calc_o3(v):
    if v <= 0: return 0
    if v <= 50: return round(v)
    if v <= 100: return round(v)
    if v <= 168: return round(100 + ((v - 100) * 100) / 68)
    if v <= 208: return round(200 + ((v - 168) * 100) / 40)
    if v <= 748: return round(300 + ((v - 208) * 100) / 540)
    return min(500, round(400 + ((v - 748) * 100) / 252))

def get_cat(aqi):
    if aqi <= 50: return 'Good'
    if aqi <= 100: return 'Satisfactory'
    if aqi <= 200: return 'Moderate'
    if aqi <= 300: return 'Poor'
    if aqi <= 400: return 'Very Poor'
    return 'Severe'

# Query 3 days of air quality and meteorology for Delhi
aq_url = (
    'https://air-quality-api.open-meteo.com/v1/air-quality?'
    'latitude=28.6139&longitude=77.2090&past_days=3&forecast_days=0'
    '&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone'
    '&timezone=UTC'
)

weather_url = (
    'https://api.open-meteo.com/v1/forecast?'
    'latitude=28.6139&longitude=77.2090&past_days=3&forecast_days=0'
    '&hourly=boundary_layer_height,wind_speed_10m,temperature_2m,relative_humidity_2m'
    '&wind_speed_unit=ms&timezone=UTC'
)

with urllib.request.urlopen(urllib.request.Request(aq_url, headers={'User-Agent': 'AirCare/1.0'})) as r:
    aq_data = json.loads(r.read().decode('utf-8'))

with urllib.request.urlopen(urllib.request.Request(weather_url, headers={'User-Agent': 'AirCare/1.0'})) as r:
    wx_data = json.loads(r.read().decode('utf-8'))

aq_h = aq_data['hourly']
wx_h = wx_data['hourly']
times = aq_h['time']

# Filter to 3-hour interval (00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00 UTC)
three_hour_indices = [i for i, t in enumerate(times) if int(t[11:13]) % 3 == 0]
print(f"Total hourly steps available: {len(times)}")
print(f"Downsampled 3-hour steps: {len(three_hour_indices)}")
print("-" * 75)

for idx in three_hour_indices[:8]:
    t_iso = times[idx] + ":00Z"
    p25 = aq_h['pm2_5'][idx]
    p10 = aq_h['pm10'][idx]
    no2 = aq_h['nitrogen_dioxide'][idx]
    so2 = aq_h['sulphur_dioxide'][idx]
    co_raw = aq_h['carbon_monoxide'][idx]
    co_mg = round(co_raw / 1000.0, 2) if co_raw is not None else None
    o3 = aq_h['ozone'][idx]

    sub = [
        ('PM2.5', calc_pm25(p25)),
        ('PM10', calc_pm10(p10)),
        ('NO2', calc_no2(no2)),
        ('SO2', calc_so2(so2)),
        ('CO', calc_co(co_mg)),
        ('O3', calc_o3(o3))
    ]
    sub.sort(key=lambda x: x[1], reverse=True)
    aqi = sub[0][1]
    dom = sub[0][0]
    cat = get_cat(aqi)

    blh = wx_h['boundary_layer_height'][idx] if idx < len(wx_h['boundary_layer_height']) else None
    ws = wx_h['wind_speed_10m'][idx] if idx < len(wx_h['wind_speed_10m']) else None
    temp = wx_h['temperature_2m'][idx] if idx < len(wx_h['temperature_2m']) else None
    rh = wx_h['relative_humidity_2m'][idx] if idx < len(wx_h['relative_humidity_2m']) else None
    vc = round(blh * ws, 2) if (blh is not None and ws is not None) else None

    print(f"Time: {t_iso} | AQI: {aqi:<3} ({cat:<12}) | Dominant: {dom:<5} | PM2.5: {p25} µg/m³")
    print(f"   Weather: Temp={temp}°C, RH={rh}%, Wind={ws} m/s, BLH={blh} m -> Vc={vc} m²/s")
