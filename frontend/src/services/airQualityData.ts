import type {
  MonthlyTrend,
  YearOverYearStat,
  CityRanking,
  CpcbCategory,
} from '../types';

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

// =========================================================================
// Advanced Historical Analytics Functions (Phase 5 & 6)
// =========================================================================

/**
 * Calculates monthly aggregations (average, min, max, completeness %) for a selected year or entire record.
 */
export function calculateMonthlyTrends(
  records: BulletinRecord[],
  yearFilter?: number
): MonthlyTrend[] {
  const filtered = yearFilter
    ? records.filter((r) => r.d.startsWith(String(yearFilter)))
    : records;

  const monthMap: Record<string, { validAqi: number[]; minAqi: number; maxAqi: number; dates: Set<string> }> = {};

  for (const r of filtered) {
    const monthKey = r.d.slice(0, 7); // 'YYYY-MM'
    if (!monthMap[monthKey]) {
      monthMap[monthKey] = {
        validAqi: [],
        minAqi: Infinity,
        maxAqi: -Infinity,
        dates: new Set(),
      };
    }
    monthMap[monthKey].dates.add(r.d);

    if (r.aqi !== null && !isNaN(r.aqi)) {
      monthMap[monthKey].validAqi.push(r.aqi);
      if (r.aqi < monthMap[monthKey].minAqi) monthMap[monthKey].minAqi = r.aqi;
      if (r.aqi > monthMap[monthKey].maxAqi) monthMap[monthKey].maxAqi = r.aqi;
    }
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return Object.keys(monthMap)
    .sort()
    .map((monthKey) => {
      const data = monthMap[monthKey];
      const [yr, mo] = monthKey.split('-').map(Number);
      const totalDaysInMonth = new Date(yr, mo, 0).getDate();
      const recordedDays = data.validAqi.length;

      const avgAqi =
        recordedDays > 0
          ? Math.round((data.validAqi.reduce((a, b) => a + b, 0) / recordedDays) * 10) / 10
          : null;

      const monthLabel = `${monthNames[mo - 1]} ${yr}`;
      const category = (avgAqi !== null ? getExpectedCategory(avgAqi) : 'No Data') as CpcbCategory | 'No Data';

      return {
        month: monthKey,
        monthLabel,
        avgAqi,
        minAqi: data.minAqi !== Infinity ? data.minAqi : null,
        maxAqi: data.maxAqi !== -Infinity ? data.maxAqi : null,
        recordedDays,
        totalDays: totalDaysInMonth,
        completenessPct: Math.round((recordedDays / totalDaysInMonth) * 1000) / 10,
        category,
      };
    });
}

/**
 * Calculates Year-over-Year (YoY) metrics for a city, optionally scoped to a particular month (e.g., November smog season).
 */
export function calculateYearOverYear(
  records: BulletinRecord[],
  targetMonth?: number // 1 to 12 (e.g. 11 for November)
): YearOverYearStat[] {
  const filtered = targetMonth
    ? records.filter((r) => {
        const mo = parseInt(r.d.slice(5, 7), 10);
        return mo === targetMonth;
      })
    : records;

  const yearMap: Record<string, { validAqi: number[]; severeCount: number; cleanCount: number; dates: Set<string> }> = {};

  for (const r of filtered) {
    const yr = r.d.slice(0, 4);
    if (!yearMap[yr]) {
      yearMap[yr] = {
        validAqi: [],
        severeCount: 0,
        cleanCount: 0,
        dates: new Set(),
      };
    }
    yearMap[yr].dates.add(r.d);

    if (r.aqi !== null && !isNaN(r.aqi)) {
      yearMap[yr].validAqi.push(r.aqi);
      if (r.aqi > 400) yearMap[yr].severeCount++;
      if (r.aqi <= 100) yearMap[yr].cleanCount++;
    }
  }

  return Object.keys(yearMap)
    .sort()
    .map((yrStr) => {
      const yr = parseInt(yrStr, 10);
      const data = yearMap[yrStr];
      const validDays = data.validAqi.length;
      const totalExpectedDays = targetMonth ? new Date(yr, targetMonth, 0).getDate() : 365;

      const avgAqi =
        validDays > 0
          ? Math.round((data.validAqi.reduce((a, b) => a + b, 0) / validDays) * 10) / 10
          : null;

      const category = (avgAqi !== null ? getExpectedCategory(avgAqi) : 'No Data') as CpcbCategory | 'No Data';

      return {
        year: yr,
        avgAqi,
        validDays,
        totalDays: totalExpectedDays,
        completenessPct: Math.round((validDays / totalExpectedDays) * 1000) / 10,
        severeDays: data.severeCount,
        goodSatisfactoryDays: data.cleanCount,
        category,
      };
    });
}

/**
 * Calculates city rankings with data-coverage eligibility threshold (default: >= 70% coverage).
 */
export function calculateCityRankings(
  cities: BulletinCityMeta[],
  minCoveragePct = 70
): CityRanking[] {
  const withCoverage = cities.map((c) => {
    const coverage = c.total_records > 0 ? (c.valid_records / c.total_records) * 100 : 0;
    return {
      city: c.city,
      key: c.key,
      avgAqi: Math.round(c.avg_aqi * 10) / 10,
      category: getExpectedCategory(c.avg_aqi) as CpcbCategory,
      validRecords: c.valid_records,
      totalRecords: c.total_records,
      coveragePct: Math.round(coverage * 10) / 10,
      isCoverageEligible: coverage >= minCoveragePct,
    };
  });

  // Sort by average AQI ascending (cleanest first)
  withCoverage.sort((a, b) => a.avgAqi - b.avgAqi);

  return withCoverage.map((item, idx) => ({
    rank: idx + 1,
    ...item,
  }));
}

/**
 * Generates RFC 4180 compliant CSV string from historical records for client-side download.
 */
export function generateHistoricalCsv(records: BulletinRecord[], cityName: string): string {
  const headers = [
    'Date',
    'City',
    'CPCB_AQI',
    'Category',
    'Prominent_Pollutant',
    'Reporting_Stations',
    'Category_Shift_Flag',
  ];

  const rows = records.map((r) => {
    const safePoll = r.poll ? `"${r.poll.replace(/"/g, '""')}"` : '""';
    const aqiStr = r.aqi !== null ? String(r.aqi) : '';
    const inconStr = r.incon ? 'TRUE' : 'FALSE';
    return `${r.d},"${cityName.replace(/"/g, '""')}",${aqiStr},"${r.cat}",${safePoll},${r.stn},${inconStr}`;
  });

  return [headers.join(','), ...rows].join('\r\n');
}
