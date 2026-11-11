// Supabase Database TypeScript Definitions for AirCare

export type SourceType = 'atmospheric_model' | 'physical_station';

export type CpcbCategory = 'Good' | 'Satisfactory' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe';

export interface AirQualityReadingRow {
  id: string;
  city: string;
  source: string;
  source_type: SourceType;
  observed_at: string; // ISO 8601 UTC
  fetched_at: string;
  latitude: number;
  longitude: number;
  pm2_5: number | null;
  pm10: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null; // in mg/m³
  o3: number | null;
  estimated_aqi: number;
  aqi_category: CpcbCategory;
  dominant_pollutant: string;
  model_or_source_metadata: {
    provider?: string;
    model?: string;
    grid_resolution_km?: number;
    raw_co_ug_m3?: number | null;
    units?: Record<string, string>;
    sub_indices?: Record<string, number>;
    collected_by?: string;
    [key: string]: unknown;
  };
}

export interface AqiPredictionRow {
  id: string;
  city: string;
  model_name: string;
  model_version: string;
  generated_at: string;
  target_time: string;
  forecast_horizon: string;
  predicted_pollutants: Record<string, number>;
  predicted_aqi: number;
  prediction_metadata: Record<string, unknown>;
}

export interface PredictionEvaluationRow {
  id: string;
  prediction_id: string;
  observation_id: string | null;
  evaluated_at: string;
  error_metrics: {
    mae?: number;
    rmse?: number;
    mape?: number;
    category_match?: boolean;
    [key: string]: unknown;
  };
  evaluation_metadata: Record<string, unknown>;
}

export interface DatabaseDiagnosticsInfo {
  configured: boolean;
  connected: boolean;
  readingsCount: number;
  citiesCoveredCount: number;
  latestTimestamp: string | null;
  latestSource: string | null;
  latestSourceType: SourceType | null;
  citiesWithData: string[];
  missingPollutantCount: number;
  errorMessage?: string;
}
