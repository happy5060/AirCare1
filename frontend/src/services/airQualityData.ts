export interface BulletinCityMeta {
  city: string;
  key: string;
  min_date: string;
  max_date: string;
  total_records: number;
  valid_records: number;
  avg_aqi: number;
  max_aqi: number;
}

export interface BulletinRecord {
  d: string;          // Date 'YYYY-MM-DD'
  aqi: number | null; // CPCB AQI value (null if missing)
  cat: string;        // Recorded CPCB Category
  poll: string;       // Prominent Pollutant(s)
  stn: number;        // Active reporting stations count
  incon: boolean;     // Whether category shifted from strict mathematical boundary
}

export interface CityDayCityMeta {
  city: string;
  key: string;
  min_date: string;
  max_date: string;
  total_records: number;
  avg_aqi: number;
}

export interface CityDayRecord {
  d: string;
  aqi: number | null;
  cat: string;
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
  flag_aqi_500: boolean;
  flag_pm10_cap: boolean;
  flag_pm25_ext: boolean;
  flag_co_ext: boolean;
}

// In-memory cache to prevent redundant network fetches
const bulletinCityCache: Map<string, { city: string; records: BulletinRecord[] }> = new Map();
const cityDayCityCache: Map<string, { city: string; records: CityDayRecord[] }> = new Map();
let bulletinIndexCache: BulletinCityMeta[] | null = null;
let cityDayIndexCache: CityDayCityMeta[] | null = null;

export async function fetchBulletinIndex(): Promise<BulletinCityMeta[]> {
  if (bulletinIndexCache) return bulletinIndexCache;
  try {
    const res = await fetch('/data/bulletins_index.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: BulletinCityMeta[] = await res.json();
    bulletinIndexCache = data;
    return data;
  } catch (err) {
    console.error('Failed to load bulletin index:', err);
    return [];
  }
}

export async function fetchCityBulletin(cityKey: string): Promise<BulletinRecord[]> {
  if (bulletinCityCache.has(cityKey)) {
    return bulletinCityCache.get(cityKey)!.records;
  }
  try {
    const res = await fetch(`/data/bulletins/${cityKey}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    bulletinCityCache.set(cityKey, data);
    return data.records;
  } catch (err) {
    console.error(`Failed to load bulletin data for ${cityKey}:`, err);
    return [];
  }
}

export async function fetchCityDayIndex(): Promise<CityDayCityMeta[]> {
  if (cityDayIndexCache) return cityDayIndexCache;
  try {
    const res = await fetch('/data/city_day_index.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: CityDayCityMeta[] = await res.json();
    cityDayIndexCache = data;
    return data;
  } catch (err) {
    console.error('Failed to load city_day index:', err);
    return [];
  }
}

export async function fetchCityDay(cityKey: string): Promise<CityDayRecord[]> {
  if (cityDayCityCache.has(cityKey)) {
    return cityDayCityCache.get(cityKey)!.records;
  }
  try {
    const res = await fetch(`/data/city_day/${cityKey}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    cityDayCityCache.set(cityKey, data);
    return data.records;
  } catch (err) {
    console.error(`Failed to load city_day data for ${cityKey}:`, err);
    return [];
  }
}

export function getExpectedCategory(aqi: number | null): string {
  if (aqi === null || aqi === undefined || isNaN(aqi)) return 'No Data';
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

export function getCategoryColor(category: string): { text: string; bg: string; border: string; hex: string } {
  switch (category) {
    case 'Good':
      return { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', hex: '#10B981' };
    case 'Satisfactory':
      return { text: 'text-teal-400', bg: 'bg-teal-500/15', border: 'border-teal-500/30', hex: '#14B8A6' };
    case 'Moderate':
      return { text: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', hex: '#EAB308' };
    case 'Poor':
      return { text: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30', hex: '#F97316' };
    case 'Very Poor':
      return { text: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30', hex: '#EF4444' };
    case 'Severe':
      return { text: 'text-rose-500', bg: 'bg-rose-500/20', border: 'border-rose-500/40', hex: '#BE123C' };
    default:
      return { text: 'text-slate-400', bg: 'bg-slate-500/15', border: 'border-slate-500/30', hex: '#64748B' };
  }
}

export interface PeriodStats {
  startDate: string;
  endDate: string;
  totalCalendarDays: number;
  availableDays: number;
  missingDaysCount: number;
  missingDates: string[];
  completenessPercent: number;
  periodAverage: number | null;
  periodCategory: string;
  peakRecord: BulletinRecord | null;
  cleanestRecord: BulletinRecord | null;
  categoryDistribution: Record<string, number>;
  inconsistentRecords: BulletinRecord[];
  dominantPollutants: { pollutant: string; count: number }[];
  recordsInRange: BulletinRecord[];
}

export function calculatePeriodStats(
  records: BulletinRecord[],
  startDate: string,
  endDate: string
): PeriodStats {
  // Ensure chronologically sorted
  const start = startDate <= endDate ? startDate : endDate;
  const end = startDate <= endDate ? endDate : startDate;

  // Filter records within date range
  const inRange = records.filter((r) => r.d >= start && r.d <= end);

  // Generate all expected dates between start and end
  const expectedDates: string[] = [];
  const curr = new Date(start + 'T00:00:00Z');
  const last = new Date(end + 'T00:00:00Z');
  while (curr <= last) {
    expectedDates.push(curr.toISOString().split('T')[0]);
    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  const recordedDateSet = new Set(inRange.map((r) => r.d));
  const missingDates = expectedDates.filter((d) => !recordedDateSet.has(d));

  // Valid AQI records only (never treat null as 0)
  const validRecords = inRange.filter((r) => r.aqi !== null && !isNaN(r.aqi));

  let sumAqi = 0;
  let peakRecord: BulletinRecord | null = null;
  let cleanestRecord: BulletinRecord | null = null;
  const categoryDistribution: Record<string, number> = {
    Good: 0,
    Satisfactory: 0,
    Moderate: 0,
    Poor: 0,
    'Very Poor': 0,
    Severe: 0,
  };
  const pollCounts: Record<string, number> = {};
  const inconsistentRecords: BulletinRecord[] = [];

  for (const r of validRecords) {
    const aqi = r.aqi!;
    sumAqi += aqi;

    if (!peakRecord || aqi > peakRecord.aqi!) {
      peakRecord = r;
    }
    if (!cleanestRecord || aqi < cleanestRecord.aqi!) {
      cleanestRecord = r;
    }

    if (categoryDistribution[r.cat] !== undefined) {
      categoryDistribution[r.cat]++;
    } else {
      categoryDistribution[r.cat] = 1;
    }

    if (r.poll) {
      const parts = r.poll.split(',').map((p) => p.trim());
      for (const p of parts) {
        if (p) pollCounts[p] = (pollCounts[p] || 0) + 1;
      }
    }

    if (r.incon) {
      inconsistentRecords.push(r);
    }
  }

  const availableDays = validRecords.length;
  const totalCalendarDays = expectedDates.length;
  const completenessPercent =
    totalCalendarDays > 0 ? Math.round((availableDays / totalCalendarDays) * 1000) / 10 : 0;
  const periodAverage =
    availableDays > 0 ? Math.round((sumAqi / availableDays) * 10) / 10 : null;
  const periodCategory = getExpectedCategory(periodAverage);

  const dominantPollutants = Object.entries(pollCounts)
    .map(([pollutant, count]) => ({ pollutant, count }))
    .sort((a, b) => b.count - a.count);

  return {
    startDate: start,
    endDate: end,
    totalCalendarDays,
    availableDays,
    missingDaysCount: missingDates.length,
    missingDates,
    completenessPercent,
    periodAverage,
    periodCategory,
    peakRecord,
    cleanestRecord,
    categoryDistribution,
    inconsistentRecords,
    dominantPollutants,
    recordsInRange: inRange,
  };
}
