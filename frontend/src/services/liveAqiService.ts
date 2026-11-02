// Live AQI and Monitoring Station Service
// Connects genuine atmospheric APIs with CPCB National Air Quality Index (NAQI) sub-index formulas.

export interface LiveAqiReading {
  city: string;
  timestamp: string;
  aqi: number;
  category: 'Good' | 'Satisfactory' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe';
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
// Units: PM2.5, PM10, NO2, SO2, O3 in µg/m³; CO in mg/m³
// =========================================================================

export function calcCpcbSubIndexPM25(pm25: number): number {
  if (pm25 <= 0) return 0;
  if (pm25 <= 30) return Math.round((pm25 * 50) / 30);
  if (pm25 <= 60) return Math.round(50 + ((pm25 - 30) * 50) / 30);
  if (pm25 <= 90) return Math.round(100 + ((pm25 - 60) * 100) / 30);
  if (pm25 <= 120) return Math.round(200 + ((pm25 - 90) * 100) / 30);
  if (pm25 <= 250) return Math.round(300 + ((pm25 - 120) * 100) / 130);
  return Math.min(500, Math.round(400 + ((pm25 - 250) * 100) / 130));
}

export function calcCpcbSubIndexPM10(pm10: number): number {
  if (pm10 <= 0) return 0;
  if (pm10 <= 50) return Math.round(pm10);
  if (pm10 <= 100) return Math.round(pm10);
  if (pm10 <= 250) return Math.round(100 + ((pm10 - 100) * 100) / 150);
  if (pm10 <= 350) return Math.round(200 + (pm10 - 250));
  if (pm10 <= 430) return Math.round(300 + ((pm10 - 350) * 100) / 80);
  return Math.min(500, Math.round(400 + ((pm10 - 430) * 100) / 70));
}

export function calcCpcbSubIndexNO2(no2: number): number {
  if (no2 <= 0) return 0;
  if (no2 <= 40) return Math.round((no2 * 50) / 40);
  if (no2 <= 80) return Math.round(50 + ((no2 - 40) * 50) / 40);
  if (no2 <= 180) return Math.round(100 + ((no2 - 80) * 100) / 100);
  if (no2 <= 280) return Math.round(200 + ((no2 - 180) * 100) / 100);
  if (no2 <= 400) return Math.round(300 + ((no2 - 280) * 100) / 120);
  return Math.min(500, Math.round(400 + ((no2 - 400) * 100) / 100));
}

export function calcCpcbSubIndexSO2(so2: number): number {
  if (so2 <= 0) return 0;
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
  if (co_ug <= 0) return 0;
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
  if (o3 <= 0) return 0;
  if (o3 <= 50) return Math.round(o3);
  if (o3 <= 100) return Math.round(o3);
  if (o3 <= 168) return Math.round(100 + ((o3 - 100) * 100) / 68);
  if (o3 <= 208) return Math.round(200 + ((o3 - 168) * 100) / 40);
  if (o3 <= 748) return Math.round(300 + ((o3 - 208) * 100) / 540);
  return Math.min(500, Math.round(400 + ((o3 - 748) * 100) / 252));
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

  // Calculate CPCB sub-indices for all available pollutants
  const subindices: { name: string; val: number }[] = [];
  if (pm25 !== null) subindices.push({ name: 'PM2.5', val: calcCpcbSubIndexPM25(pm25) });
  if (pm10 !== null) subindices.push({ name: 'PM10', val: calcCpcbSubIndexPM10(pm10) });
  if (no2 !== null) subindices.push({ name: 'NO2', val: calcCpcbSubIndexNO2(no2) });
  if (so2 !== null) subindices.push({ name: 'SO2', val: calcCpcbSubIndexSO2(so2) });
  if (o3 !== null) subindices.push({ name: 'OZONE', val: calcCpcbSubIndexO3(o3) });
  if (co !== null) subindices.push({ name: 'CO', val: calcCpcbSubIndexCO(co) });

  // Official CPCB Minimum Pollutant Criteria:
  // Requires minimum of 3 criteria pollutants, of which at least one must be PM10 or PM2.5
  const hasParticulate = pm25 !== null || pm10 !== null;
  const validPollutantsCount = subindices.length;
  const isNaqiCompliant = hasParticulate && validPollutantsCount >= 3;

  let computedAqi = 0;
  let dominantPoll = 'None';
  let complianceNote = '';

  if (isNaqiCompliant) {
    subindices.sort((a, b) => b.val - a.val);
    computedAqi = subindices[0].val;
    dominantPoll = subindices[0].name;
    complianceNote = `Compliant with CPCB minimum criteria (${validPollutantsCount} criteria pollutants evaluated, including particulates).`;
  } else {
    complianceNote = `Insufficient pollutant data for official CPCB NAQI standard (requires at least 3 pollutants with PM2.5 or PM10; only ${validPollutantsCount} available).`;
    if (subindices.length > 0) {
      subindices.sort((a, b) => b.val - a.val);
      computedAqi = subindices[0].val;
      dominantPoll = subindices[0].name;
    }
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
  };

  liveReadingCache.set(normalizedKey, { timestamp: Date.now(), data: reading });
  return reading;
}
