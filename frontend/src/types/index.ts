// AirCare Platform TypeScript Type Definitions

export type PageId = 'today' | 'past' | 'compare' | 'forecast';

export type CpcbCategory = 'Good' | 'Satisfactory' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe';

export interface ForecastDailyItem {
  day_index: number;
  target_date: string;
  predicted_aqi: number;
  predicted_category: CpcbCategory;
  dominant_pollutant: string;
  uncertainty_range: [number, number];
  change_from_latest: number;
  direct_aqi_prediction: number;
  predicted_pollutants: Record<string, number | null>;
  cpcb_sub_indices: Record<string, number | null>;
  is_cpcb_compliant: boolean;
}

export interface ForecastInsights {
  trend_direction: string;
  trend_sentiment: 'positive' | 'neutral' | 'negative';
  predicted_dominant_pollutant: string;
  highest_predicted_day: {
    date: string;
    aqi: number;
    category: CpcbCategory;
  };
  lowest_predicted_day: {
    date: string;
    aqi: number;
    category: CpcbCategory;
  };
  largest_pollutant_shift: {
    pollutant: string;
    magnitude: number;
  };
}

export interface CityForecastData {
  city: string;
  latest_observation_date: string;
  forecast_generation_time: string;
  model_name: string;
  model_version: string;
  input_source: string;
  latest_observed_aqi: number;
  latest_observed_category: CpcbCategory;
  latest_observed_pollutants: Record<string, number | null>;
  predicted_pollutants_timeline: Record<string, {
    point: number[];
    q10: number[];
    q90: number[];
  } | null>;
  daily_forecasts: ForecastDailyItem[];
  insights: ForecastInsights;
  chart_history: {
    date: string;
    aqi: number;
    category: CpcbCategory;
    is_forecast: boolean;
  }[];
  supported_horizons: string[];
}

export interface ModelBenchmarkSummary {
  mae: number;
  rmse: number;
  r2: number;
  severe_recall: number;
  sample_count: number;
}

export interface PollutantSubIndex {
  name: string;
  code: 'pm25' | 'pm10' | 'no2' | 'so2' | 'co' | 'o3' | 'nh3';
  concentration: number | null;
  unit: string;
  subIndex: number | null;
  category: CpcbCategory | null;
  averagingPeriod: string;
  cpcbStandard: string;
  isDominant: boolean;
  isValid: boolean;
  calculationDetails: string;
}

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
  dominantPollutant: string | null;
  category: string;
}

export interface StationSnapshotCity {
  city: string;
  stationCount: number;
  avgAqi: number | null;
  dominantPollutant: string | null;
  stations: StationData[];
}

export interface HealthAdvice {
  healthAdvice: string;
  activityAdvice: string;
}

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
  o3: number | null;
}

export interface PeriodStats {
  totalDays: number;
  recordedDays: number;
  missingDays: number;
  completenessPct: number;
  avgAqi: number | null;
  minAqi: number | null;
  minAqiDate: string | null;
  maxAqi: number | null;
  maxAqiDate: string | null;
  categoryBreakdown: Record<string, number>;
  dominantPollutant: string;
  severeDaysCount: number;
  inconsistentCount: number;
}

export interface MonthlyTrend {
  month: string; // 'YYYY-MM'
  monthLabel: string; // 'Jan 2024'
  avgAqi: number | null;
  minAqi: number | null;
  maxAqi: number | null;
  recordedDays: number;
  totalDays: number;
  completenessPct: number;
  category: CpcbCategory | 'No Data';
}

export interface YearOverYearStat {
  year: number;
  avgAqi: number | null;
  validDays: number;
  totalDays: number;
  completenessPct: number;
  severeDays: number;
  goodSatisfactoryDays: number;
  category: CpcbCategory | 'No Data';
}

export interface CityRanking {
  rank: number;
  city: string;
  key: string;
  avgAqi: number;
  category: CpcbCategory;
  validRecords: number;
  totalRecords: number;
  coveragePct: number;
  isCoverageEligible: boolean; // >= 70% coverage
}

