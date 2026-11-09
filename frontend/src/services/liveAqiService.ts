// Live AQI and Monitoring Station Service
// Connects genuine atmospheric APIs with CPCB National Air Quality Index (NAQI) sub-index formulas.

import type { CpcbCategory, PollutantSubIndex } from '../types';

export interface LiveAqiReading {
  city: string;
  timestamp: string;
  aqi: number;
  category: CpcbCategory;
  prominentPollutant: string;
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  so2: number | null;
  o3: number | null;
  co: number | null;
  healthAdvice: string;
  activityAdvice: string;
  source: string;
  isNaqiCompliant: boolean;
  complianceNote: string;
  methodologyNote: string;
  hourlyTrend: { time: string; aqi: number }[];
  pollutantBreakdown: PollutantSubIndex[];
}

export interface StationData {
  name: string;
  lat: number | null;
  lon: number | null;
  active: boolean;
  aqi: number | null;
  dominant: string;
  pollutants: Record<string, number>;
}

export interface StationSnapshotCity {
  city: string;
  state: string;
  station_count: number;
  city_avg_aqi: number | null;
  snapshot_timestamp: string;
  stations: StationData[];
}

// Default Coordinates for Indian Metros and Capitals (fallback if not in snapshot)
export const DEFAULT_CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  Delhi: { lat: 28.6139, lon: 77.2090 },
  'Delhi NCR': { lat: 28.6139, lon: 77.2090 },
  Mumbai: { lat: 19.0760, lon: 72.8777 },
  Bengaluru: { lat: 12.9716, lon: 77.5946 },
  Kolkata: { lat: 22.5726, lon: 88.3639 },
  Chennai: { lat: 13.0827, lon: 80.2707 },
  Hyderabad: { lat: 17.3850, lon: 78.4867 },
  Ahmedabad: { lat: 23.0225, lon: 72.5714 },
  Pune: { lat: 18.5204, lon: 73.8567 },
  Jaipur: { lat: 26.9124, lon: 75.7873 },
  Lucknow: { lat: 26.8467, lon: 80.9462 },
  Patna: { lat: 25.5941, lon: 85.1376 },
  Amritsar: { lat: 31.6340, lon: 74.8723 },
  Chandigarh: { lat: 30.7333, lon: 76.7794 },
  Bhopal: { lat: 23.2599, lon: 77.4126 },
  Indore: { lat: 22.7196, lon: 75.8577 },
  Surat: { lat: 21.1702, lon: 72.8311 },
  Nagpur: { lat: 21.1458, lon: 79.0882 },
  Visakhapatnam: { lat: 17.6868, lon: 83.2185 },
  Bhubaneswar: { lat: 20.2961, lon: 85.8245 },
  Guwahati: { lat: 26.1445, lon: 91.7362 },
  Srinagar: { lat: 34.0837, lon: 74.7973 },
  Dehradun: { lat: 30.3165, lon: 78.0322 },
  Ranchi: { lat: 23.3441, lon: 85.3096 },
  Raipur: { lat: 21.2514, lon: 81.6296 },
  Shimla: { lat: 31.1048, lon: 77.1734 },
  Kochi: { lat: 9.9312, lon: 76.2673 },
  Thiruvananthapuram: { lat: 8.5241, lon: 76.9366 },
};

// =========================================================================
// Official CPCB Sub-Index Formulae (CPCB National Air Quality Index, 2014)
// Units: PM2.5, PM10, NO2, SO2, O3, NH3 in µg/m³; CO in mg/m³
// All functions validate input and handle negative, NaN, non-finite values.
// =========================================================================

export function calcCpcbSubIndexPM25(pm25: number): number {
  if (pm25 <= 0 || isNaN(pm25) || !isFinite(pm25)) return 0;
  if (pm25 <= 30) return Math.round((pm25 * 50) / 30);
  if (pm25 <= 60) return Math.round(50 + ((pm25 - 30) * 50) / 30);
  if (pm25 <= 90) return Math.round(100 + ((pm25 - 60) * 100) / 30);
  if (pm25 <= 120) return Math.round(200 + ((pm25 - 90) * 100) / 30);
  if (pm25 <= 250) return Math.round(300 + ((pm25 - 120) * 100) / 130);
  return Math.min(500, Math.round(400 + ((pm25 - 250) * 100) / 130));
}

export function calcCpcbSubIndexPM10(pm10: number): number {
  if (pm10 <= 0 || isNaN(pm10) || !isFinite(pm10)) return 0;
  if (pm10 <= 50) return Math.round(pm10);
  if (pm10 <= 100) return Math.round(pm10);
  if (pm10 <= 250) return Math.round(100 + ((pm10 - 100) * 100) / 150);
  if (pm10 <= 350) return Math.round(200 + (pm10 - 250));
  if (pm10 <= 430) return Math.round(300 + ((pm10 - 350) * 100) / 80);
  return Math.min(500, Math.round(400 + ((pm10 - 430) * 100) / 70));
}

export function calcCpcbSubIndexNO2(no2: number): number {
  if (no2 <= 0 || isNaN(no2) || !isFinite(no2)) return 0;
  if (no2 <= 40) return Math.round((no2 * 50) / 40);
  if (no2 <= 80) return Math.round(50 + ((no2 - 40) * 50) / 40);
  if (no2 <= 180) return Math.round(100 + ((no2 - 80) * 100) / 100);
  if (no2 <= 280) return Math.round(200 + ((no2 - 180) * 100) / 100);
  if (no2 <= 400) return Math.round(300 + ((no2 - 280) * 100) / 120);
  return Math.min(500, Math.round(400 + ((no2 - 400) * 100) / 100));
}

export function calcCpcbSubIndexSO2(so2: number): number {
  if (so2 <= 0 || isNaN(so2) || !isFinite(so2)) return 0;
  if (so2 <= 40) return Math.round((so2 * 50) / 40);
  if (so2 <= 80) return Math.round(50 + ((so2 - 40) * 50) / 40);
  if (so2 <= 380) return Math.round(100 + ((so2 - 80) * 100) / 300);
  if (so2 <= 800) return Math.round(200 + ((so2 - 380) * 100) / 420);
  if (so2 <= 1600) return Math.round(300 + ((so2 - 800) * 100) / 800);
  return Math.min(500, Math.round(400 + ((so2 - 1600) * 100) / 400));
}

// CPCB Carbon Monoxide (8-hr avg) in mg/m³
// Open-Meteo returns CO in µg/m³; we convert to mg/m³ by dividing by 1000
export function calcCpcbSubIndexCO(co_ug: number): number {
  if (co_ug <= 0 || isNaN(co_ug) || !isFinite(co_ug)) return 0;
  const co_mg = co_ug / 1000.0;
  if (co_mg <= 1.0) return Math.round(co_mg * 50);
  if (co_mg <= 2.0) return Math.round(50 + (co_mg - 1.0) * 50);
  if (co_mg <= 10.0) return Math.round(100 + ((co_mg - 2.0) * 100) / 8.0);
  if (co_mg <= 17.0) return Math.round(200 + ((co_mg - 10.0) * 100) / 7.0);
  if (co_mg <= 34.0) return Math.round(300 + ((co_mg - 17.0) * 100) / 17.0);
  return Math.min(500, Math.round(400 + ((co_mg - 34.0) * 100) / 16.0));
}

// CPCB Ozone (8-hr avg) in µg/m³
export function calcCpcbSubIndexO3(o3: number): number {
  if (o3 <= 0 || isNaN(o3) || !isFinite(o3)) return 0;
  if (o3 <= 50) return Math.round(o3);
  if (o3 <= 100) return Math.round(o3);
  if (o3 <= 168) return Math.round(100 + ((o3 - 100) * 100) / 68);
  if (o3 <= 208) return Math.round(200 + ((o3 - 168) * 100) / 40);
  if (o3 <= 748) return Math.round(300 + ((o3 - 208) * 100) / 540);
  return Math.min(500, Math.round(400 + ((o3 - 748) * 100) / 252));
}

// CPCB Ammonia NH3 (24-hr avg) in µg/m³
export function calcCpcbSubIndexNH3(nh3: number): number {
  if (nh3 <= 0 || isNaN(nh3) || !isFinite(nh3)) return 0;
  if (nh3 <= 200) return Math.round((nh3 * 50) / 200);
  if (nh3 <= 400) return Math.round(50 + ((nh3 - 200) * 50) / 200);
  if (nh3 <= 800) return Math.round(100 + ((nh3 - 400) * 100) / 400);
  if (nh3 <= 1200) return Math.round(200 + ((nh3 - 800) * 100) / 400);
  if (nh3 <= 1800) return Math.round(300 + ((nh3 - 1200) * 100) / 600);
  return Math.min(500, Math.round(400 + ((nh3 - 1800) * 100) / 600));
}

// Helper to construct transparent sub-index breakdown for all evaluated pollutants
export function buildPollutantBreakdown(data: {
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  so2: number | null;
  o3: number | null;
  co: number | null; // in ug/m3
}): PollutantSubIndex[] {
  const list: PollutantSubIndex[] = [];

  const addPollutant = (
    name: string,
    code: 'pm25' | 'pm10' | 'no2' | 'so2' | 'co' | 'o3',
    rawConcentration: number | null,
    displayConcentration: number | null,
    unit: string,
    averagingPeriod: string,
    cpcbStandard: string,
    calcFn: (val: number) => number,
    formatStep: (val: number, subIndex: number) => string
  ) => {
    const isValid =
      rawConcentration !== null &&
      rawConcentration !== undefined &&
      !isNaN(rawConcentration) &&
      isFinite(rawConcentration) &&
      rawConcentration >= 0;

    if (!isValid) {
      list.push({
        name,
        code,
        concentration: null,
        unit,
        subIndex: null,
        category: null,
        averagingPeriod,
        cpcbStandard,
        isDominant: false,
        isValid: false,
        calculationDetails:
          rawConcentration !== null && rawConcentration !== undefined && rawConcentration < 0
            ? 'Negative measurement rejected as sensor artifact'
            : 'Measurement unavailable',
      });
      return;
    }

    const sub = calcFn(rawConcentration);
    const cat = getCpcbCategory(sub);
    const step = formatStep(displayConcentration ?? rawConcentration, sub);

    list.push({
      name,
      code,
      concentration: displayConcentration ?? rawConcentration,
      unit,
      subIndex: sub,
      category: cat,
      averagingPeriod,
      cpcbStandard,
      isDominant: false,
      isValid: true,
      calculationDetails: step,
    });
  };

  // PM2.5 (24-hr avg, limit 60 µg/m³)
  addPollutant(
    'PM2.5 (Fine Particles)',
    'pm25',
    data.pm25,
    data.pm25,
    'µg/m³',
    '24-hour',
    '60 µg/m³',
    calcCpcbSubIndexPM25,
    (c, s) => {
      if (c <= 30) return `Linear interpolation: (${c} × 50) / 30 = ${s}`;
      if (c <= 60) return `Linear interpolation: 50 + [(${c} - 30) × 50 / 30] = ${s}`;
      if (c <= 90) return `Linear interpolation: 100 + [(${c} - 60) × 100 / 30] = ${s}`;
      if (c <= 120) return `Linear interpolation: 200 + [(${c} - 90) × 100 / 30] = ${s}`;
      if (c <= 250) return `Linear interpolation: 300 + [(${c} - 120) × 100 / 130] = ${s}`;
      return `Linear interpolation: min(500, 400 + [(${c} - 250) × 100 / 130]) = ${s}`;
    }
  );

  // PM10 (24-hr avg, limit 100 µg/m³)
  addPollutant(
    'PM10 (Coarse Dust)',
    'pm10',
    data.pm10,
    data.pm10,
    'µg/m³',
    '24-hour',
    '100 µg/m³',
    calcCpcbSubIndexPM10,
    (c, s) => {
      if (c <= 50) return `Direct 1:1 scale: ${c} = ${s}`;
      if (c <= 100) return `Direct 1:1 scale: ${c} = ${s}`;
      if (c <= 250) return `Linear interpolation: 100 + [(${c} - 100) × 100 / 150] = ${s}`;
      if (c <= 350) return `Linear interpolation: 200 + (${c} - 250) = ${s}`;
      if (c <= 430) return `Linear interpolation: 300 + [(${c} - 350) × 100 / 80] = ${s}`;
      return `Linear interpolation: min(500, 400 + [(${c} - 430) × 100 / 70]) = ${s}`;
    }
  );

  // NO2 (24-hr avg, limit 80 µg/m³)
  addPollutant(
    'NO2 (Nitrogen Dioxide)',
    'no2',
    data.no2,
    data.no2,
    'µg/m³',
    '24-hour',
    '80 µg/m³',
    calcCpcbSubIndexNO2,
    (c, s) => {
      if (c <= 40) return `Linear interpolation: (${c} × 50) / 40 = ${s}`;
      if (c <= 80) return `Linear interpolation: 50 + [(${c} - 40) × 50 / 40] = ${s}`;
      if (c <= 180) return `Linear interpolation: 100 + [(${c} - 80) × 100 / 100] = ${s}`;
      if (c <= 280) return `Linear interpolation: 200 + [(${c} - 180) × 100 / 100] = ${s}`;
      if (c <= 400) return `Linear interpolation: 300 + [(${c} - 280) × 100 / 120] = ${s}`;
      return `Linear interpolation: min(500, 400 + [(${c} - 400) × 100 / 100]) = ${s}`;
    }
  );

  // SO2 (24-hr avg, limit 80 µg/m³)
  addPollutant(
    'SO2 (Sulphur Dioxide)',
    'so2',
    data.so2,
    data.so2,
    'µg/m³',
    '24-hour',
    '80 µg/m³',
    calcCpcbSubIndexSO2,
    (c, s) => {
      if (c <= 40) return `Linear interpolation: (${c} × 50) / 40 = ${s}`;
      if (c <= 80) return `Linear interpolation: 50 + [(${c} - 40) × 50 / 40] = ${s}`;
      if (c <= 380) return `Linear interpolation: 100 + [(${c} - 80) × 100 / 300] = ${s}`;
      if (c <= 800) return `Linear interpolation: 200 + [(${c} - 380) × 100 / 420] = ${s}`;
      if (c <= 1600) return `Linear interpolation: 300 + [(${c} - 800) × 100 / 800] = ${s}`;
      return `Linear interpolation: min(500, 400 + [(${c} - 1600) × 100 / 400]) = ${s}`;
    }
  );

  // CO (8-hr avg, limit 2.0 mg/m³)
  const coMg = data.co !== null ? Math.round((data.co / 1000) * 100) / 100 : null;
  addPollutant(
    'CO (Carbon Monoxide)',
    'co',
    data.co,
    coMg,
    'mg/m³',
    '8-hour',
    '2.0 mg/m³',
    calcCpcbSubIndexCO,
    (c, s) => {
      if (c <= 1.0) return `Linear interpolation: ${c} × 50 = ${s}`;
      if (c <= 2.0) return `Linear interpolation: 50 + [(${c} - 1.0) × 50] = ${s}`;
      if (c <= 10.0) return `Linear interpolation: 100 + [(${c} - 2.0) × 100 / 8] = ${s}`;
      if (c <= 17.0) return `Linear interpolation: 200 + [(${c} - 10.0) × 100 / 7] = ${s}`;
      if (c <= 34.0) return `Linear interpolation: 300 + [(${c} - 17.0) × 100 / 17] = ${s}`;
      return `Linear interpolation: min(500, 400 + [(${c} - 34.0) × 100 / 16]) = ${s}`;
    }
  );

  // Ozone (8-hr avg, limit 100 µg/m³)
  addPollutant(
    'O3 (Ground Ozone)',
    'o3',
    data.o3,
    data.o3,
    'µg/m³',
    '8-hour',
    '100 µg/m³',
    calcCpcbSubIndexO3,
    (c, s) => {
      if (c <= 50) return `Direct 1:1 scale: ${c} = ${s}`;
      if (c <= 100) return `Direct 1:1 scale: ${c} = ${s}`;
      if (c <= 168) return `Linear interpolation: 100 + [(${c} - 100) × 100 / 68] = ${s}`;
      if (c <= 208) return `Linear interpolation: 200 + [(${c} - 168) × 100 / 40] = ${s}`;
      if (c <= 748) return `Linear interpolation: 300 + [(${c} - 208) × 100 / 540] = ${s}`;
      return `Linear interpolation: min(500, 400 + [(${c} - 748) × 100 / 252]) = ${s}`;
    }
  );

  // Mark dominant pollutant: maximum valid subIndex
  let maxSub = -1;
  let dominantIdx = -1;
  list.forEach((item, idx) => {
    if (item.isValid && item.subIndex !== null && item.subIndex > maxSub) {
      maxSub = item.subIndex;
      dominantIdx = idx;
    }
  });

  if (dominantIdx !== -1 && maxSub > 0) {
    list[dominantIdx].isDominant = true;
  }

  return list;
}

export function getCpcbCategory(aqi: number): 'Good' | 'Satisfactory' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe' {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

export function getHealthAdvice(cat: string): { health: string; activity: string } {
  switch (cat) {
    case 'Good':
      return {
        health: 'Minimal health impact. Air quality is clean and poses little or no risk to public health.',
        activity: 'Ideal conditions for all outdoor activities, morning workouts, and sports.',
      };
    case 'Satisfactory':
      return {
        health: 'Minor breathing discomfort may occur only to unusually sensitive individuals.',
        activity: 'Great conditions for normal outdoor activities. Atmospheric ventilation is favorable.',
      };
    case 'Moderate':
      return {
        health: 'Breathing discomfort to people with lung disease (such as asthma) and heart conditions.',
        activity: 'Sensitive individuals should reduce prolonged or heavy outdoor physical exertion.',
      };
    case 'Poor':
      return {
        health: 'Breathing discomfort to most people on prolonged exposure. Significant risk for people with heart or lung disease.',
        activity: 'Sensitive groups should avoid strenuous outdoor activities. Consider wearing a filtration mask outdoors.',
      };
    case 'Very Poor':
      return {
        health: 'Respiratory illness likely on prolonged exposure. Serious risk for children, elderly, and those with pre-existing conditions.',
        activity: 'Avoid outdoor exercise and morning walks. Keep windows closed and run an air purifier indoors if available.',
      };
    case 'Severe':
      return {
        health: 'Severe respiratory effects on healthy people; serious health impacts on those with lung/heart diseases. Light work may trigger shortness of breath.',
        activity: 'Remain indoors as much as possible. Avoid all outdoor physical exertion. Wear an N95/FFP2 mask if commuting.',
      };
    default:
      return {
        health: 'Maintain normal caution.',
        activity: 'Follow general health guidelines.',
      };
  }
}

// In-memory cache for live readings and station snapshot
let snapshotCache: Record<string, StationSnapshotCity> | null = null;
const liveReadingCache: Map<string, { timestamp: number; data: LiveAqiReading }> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

export async function fetchStationSnapshot(): Promise<Record<string, StationSnapshotCity>> {
  if (snapshotCache) return snapshotCache;
  try {
    const res = await fetch('/data/station_snapshot.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: Record<string, StationSnapshotCity> = await res.json();
    snapshotCache = data;
    return data;
  } catch (err) {
    console.error('Failed to load station snapshot:', err);
    return {};
  }
}

export async function fetchLiveAqi(cityName: string, lat?: number, lon?: number): Promise<LiveAqiReading> {
  const normalizedKey = cityName.trim();
  const cached = liveReadingCache.get(normalizedKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // 1. Resolve coordinates
  let latitude = lat;
  let longitude = lon;

  if (latitude === undefined || longitude === undefined) {
    const defaultCoord = DEFAULT_CITY_COORDINATES[normalizedKey] || DEFAULT_CITY_COORDINATES[normalizedKey.replace(' NCR', '')];
    if (defaultCoord) {
      latitude = defaultCoord.lat;
      longitude = defaultCoord.lon;
    } else {
      const snapshot = await fetchStationSnapshot();
      const citySnap = snapshot[normalizedKey] || snapshot[normalizedKey.replace(' NCR', '')];
      if (citySnap && citySnap.stations.length > 0 && citySnap.stations[0].lat && citySnap.stations[0].lon) {
        latitude = citySnap.stations[0].lat;
        longitude = citySnap.stations[0].lon;
      }
    }
  }

  if (latitude === undefined || longitude === undefined) {
    throw new Error(`Coordinates not found for city: ${cityName}. Cannot query atmospheric model.`);
  }

  // 2. Optional WAQI Public Token Query
  // Note: VITE_* variables are compiled into the client-side bundle and are public tokens.
  const waqiApiKey = import.meta.env?.VITE_WAQI_API_KEY;
  if (waqiApiKey && waqiApiKey !== 'YOUR_WAQI_API_KEY_HERE') {
    try {
      const waqiRes = await fetch(
        `https://api.waqi.info/feed/geo:${latitude};${longitude}/?token=${waqiApiKey}`
      );
      if (waqiRes.ok) {
        const waqiJson = await waqiRes.json();
        if (waqiJson.status === 'ok') {
          const d = waqiJson.data;
          const aqi = d.aqi;
          const cat = getCpcbCategory(aqi);
          const advice = getHealthAdvice(cat);

          // Timestamp: Strictly use data time from API
          const dataTime = d.time.iso
            ? new Date(d.time.iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST'
            : d.time.s
            ? d.time.s + ' IST'
            : 'Timestamp Unavailable';

          const reading: LiveAqiReading = {
            city: cityName,
            timestamp: dataTime,
            aqi,
            category: cat,
            prominentPollutant: (d.dominentpol || 'PM2.5').toUpperCase(),
            pm25: d.iaqi?.pm25?.v || null,
            pm10: d.iaqi?.pm10?.v || null,
            no2: d.iaqi?.no2?.v || null,
            so2: d.iaqi?.so2?.v || null,
            o3: d.iaqi?.o3?.v || null,
            co: d.iaqi?.co?.v || null,
            healthAdvice: advice.health,
            activityAdvice: advice.activity,
            source: `WAQI Public Station Feed (${d.attributions?.[0]?.name || 'CPCB Ground CAAQMS'})`,
            isNaqiCompliant: true,
            complianceNote: 'Aggregated ground monitoring station feed.',
            methodologyNote: 'Reported directly by monitoring stations through the World Air Quality Index project.',
            hourlyTrend: [],
            pollutantBreakdown: buildPollutantBreakdown({
              pm25: d.iaqi?.pm25?.v || null,
              pm10: d.iaqi?.pm10?.v || null,
              no2: d.iaqi?.no2?.v || null,
              so2: d.iaqi?.so2?.v || null,
              o3: d.iaqi?.o3?.v || null,
              co: d.iaqi?.co?.v || null,
            }),
          };
          liveReadingCache.set(normalizedKey, { timestamp: Date.now(), data: reading });
          return reading;
        }
      }
    } catch (e) {
      console.warn('WAQI API query failed, falling back to Open-Meteo Atmospheric Feed:', e);
    }
  }

  // 3. Query Open-Meteo Air Quality API (Atmospheric Numerical Model)
  const apiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&hourly=pm10,pm2_5,nitrogen_dioxide,ozone&timezone=Asia%2FKolkata&past_days=1&forecast_days=1`;

  const res = await fetch(apiUrl);
  if (!res.ok) {
    throw new Error(`Open-Meteo Air Quality API returned HTTP status ${res.status}`);
  }

  const data = await res.json();
  const current = data.current;
  if (!current) {
    throw new Error('No current atmospheric data returned by Open-Meteo API');
  }

  const pm25 = current.pm2_5 !== undefined && current.pm2_5 !== null ? Math.round(current.pm2_5 * 10) / 10 : null;
  const pm10 = current.pm10 !== undefined && current.pm10 !== null ? Math.round(current.pm10 * 10) / 10 : null;
  const no2 = current.nitrogen_dioxide !== undefined && current.nitrogen_dioxide !== null ? Math.round(current.nitrogen_dioxide * 10) / 10 : null;
  const so2 = current.sulphur_dioxide !== undefined && current.sulphur_dioxide !== null ? Math.round(current.sulphur_dioxide * 10) / 10 : null;
  const o3 = current.ozone !== undefined && current.ozone !== null ? Math.round(current.ozone * 10) / 10 : null;
  const co = current.carbon_monoxide !== undefined && current.carbon_monoxide !== null ? Math.round(current.carbon_monoxide * 10) / 10 : null;

  // Build complete transparent pollutant breakdown with step-by-step formulas
  const pollutantBreakdown = buildPollutantBreakdown({
    pm25,
    pm10,
    no2,
    so2,
    o3,
    co,
  });

  // Official CPCB Minimum Pollutant Criteria:
  // Requires minimum of 3 criteria pollutants, of which at least one must be PM10 or PM2.5
  const validPollutants = pollutantBreakdown.filter((p) => p.isValid && p.subIndex !== null);
  const hasParticulate = pollutantBreakdown.some(
    (p) => (p.code === 'pm25' || p.code === 'pm10') && p.isValid && p.subIndex !== null
  );
  const validPollutantsCount = validPollutants.length;
  const isNaqiCompliant = hasParticulate && validPollutantsCount >= 3;

  let computedAqi = 0;
  let dominantPoll = 'None';
  let complianceNote = '';

  const dominantItem = pollutantBreakdown.find((p) => p.isDominant);
  if (dominantItem && dominantItem.subIndex !== null) {
    computedAqi = dominantItem.subIndex;
    dominantPoll = dominantItem.name.split(' ')[0]; // E.g. "PM2.5", "O3", "PM10"
  } else if (validPollutants.length > 0) {
    const sorted = [...validPollutants].sort((a, b) => (b.subIndex ?? 0) - (a.subIndex ?? 0));
    computedAqi = sorted[0].subIndex ?? 0;
    dominantPoll = sorted[0].name.split(' ')[0];
  }

  if (isNaqiCompliant) {
    complianceNote = `Compliant with CPCB minimum criteria (${validPollutantsCount} criteria pollutants evaluated, including particulate fraction).`;
  } else {
    complianceNote = `Insufficient pollutant coverage for official CPCB NAQI standard (requires at least 3 pollutants with PM2.5 or PM10; only ${validPollutantsCount} available).`;
  }

  const category = getCpcbCategory(computedAqi);
  const advice = getHealthAdvice(category);

  // Parse Hourly Trend for past 24 hours
  const hourlyTrend: { time: string; aqi: number }[] = [];
  if (data.hourly && data.hourly.time && data.hourly.pm2_5) {
    const times: string[] = data.hourly.time;
    const pm25s: number[] = data.hourly.pm2_5;
    const pm10s: number[] = data.hourly.pm10 || [];
    const o3s: number[] = data.hourly.ozone || [];

    const currTimeStr = current.time;
    let currIdx = times.indexOf(currTimeStr);
    if (currIdx === -1) currIdx = times.length - 1;

    const startIdx = Math.max(0, currIdx - 23);
    for (let i = startIdx; i <= currIdx; i++) {
      const p25 = pm25s[i] || 0;
      const p10 = pm10s[i] || 0;
      const ozone = o3s[i] || 0;
      const aqiVal = Math.max(
        calcCpcbSubIndexPM25(p25),
        calcCpcbSubIndexPM10(p10),
        calcCpcbSubIndexO3(ozone)
      );
      const hourLabel = times[i].slice(11, 16);
      hourlyTrend.push({ time: hourLabel, aqi: aqiVal });
    }
  }

  // Strict Timestamp Handling: Never substitute request time if API data time is missing
  const formattedTime = current.time
    ? current.time.replace('T', ' ') + ' IST'
    : 'Timestamp Unavailable';

  const reading: LiveAqiReading = {
    city: cityName,
    timestamp: formattedTime,
    aqi: computedAqi,
    category,
    prominentPollutant: dominantPoll,
    pm25,
    pm10,
    no2,
    so2,
    o3,
    co,
    healthAdvice: advice.health,
    activityAdvice: advice.activity,
    source: 'Open-Meteo High-Resolution Atmospheric Model (CAMS / ECMWF)',
    isNaqiCompliant,
    complianceNote,
    methodologyNote:
      'Calculated from 1-hour instantaneous atmospheric model concentrations using CPCB sub-index breakpoints. Note that official CPCB daily bulletins require 24-hour diurnal averages for PM/NO2/SO2 and 8-hour averages for CO/O3 from ground CAAQMS stations.',
    hourlyTrend,
    pollutantBreakdown,
  };

  liveReadingCache.set(normalizedKey, { timestamp: Date.now(), data: reading });
  return reading;
}
