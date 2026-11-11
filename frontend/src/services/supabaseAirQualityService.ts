// Supabase Air Quality Data Service
// Connects AirCare frontend views to the persistent Supabase air_quality_readings table.
// Provides graceful fallback to Open-Meteo direct API when Supabase is offline or unconfigured.

import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import type { AirQualityReadingRow, DatabaseDiagnosticsInfo } from '../types/supabase';

/**
 * Queries the most recently stored observation for a city from Supabase.
 * Returns null if Supabase is unconfigured, empty, or unreachable.
 */
export async function fetchLatestCityReadingFromSupabase(
  cityName: string
): Promise<AirQualityReadingRow | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('air_quality_readings')
      .select('*')
      .eq('city', cityName)
      .order('observed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn(`[AirCare Supabase] Query error for ${cityName}:`, error.message);
      return null;
    }

    return (data as AirQualityReadingRow) || null;
  } catch (err) {
    console.warn(`[AirCare Supabase] Unexpected network failure:`, err);
    return null;
  }
}

/**
 * Queries the recent time-series observations for a city from Supabase.
 */
export async function fetchRecentCityReadingsFromSupabase(
  cityName: string,
  limitCount: number = 24
): Promise<AirQualityReadingRow[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('air_quality_readings')
      .select('*')
      .eq('city', cityName)
      .order('observed_at', { ascending: false })
      .limit(limitCount);

    if (error) {
      console.warn(`[AirCare Supabase] Query error for ${cityName} history:`, error.message);
      return [];
    }

    return (data as AirQualityReadingRow[]) || [];
  } catch (err) {
    console.warn(`[AirCare Supabase] Failed to fetch city history:`, err);
    return [];
  }
}

/**
 * Diagnostics probe: Inspects connection health, row counts, latest collection, and city coverage.
 * Guaranteed zero credential leaks.
 */
export async function fetchDatabaseDiagnostics(): Promise<DatabaseDiagnosticsInfo> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      connected: false,
      readingsCount: 0,
      citiesCoveredCount: 0,
      latestTimestamp: null,
      latestSource: null,
      latestSourceType: null,
      citiesWithData: [],
      missingPollutantCount: 0,
      errorMessage: 'Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY) are not set.',
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      configured: false,
      connected: false,
      readingsCount: 0,
      citiesCoveredCount: 0,
      latestTimestamp: null,
      latestSource: null,
      latestSourceType: null,
      citiesWithData: [],
      missingPollutantCount: 0,
      errorMessage: 'Supabase client failed to initialize.',
    };
  }

  try {
    // 1. Check connectivity and total count
    const { count, error: countError } = await supabase
      .from('air_quality_readings')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return {
        configured: true,
        connected: false,
        readingsCount: 0,
        citiesCoveredCount: 0,
        latestTimestamp: null,
        latestSource: null,
        latestSourceType: null,
        citiesWithData: [],
        missingPollutantCount: 0,
        errorMessage: countError.message,
      };
    }

    // 2. Fetch sample of recent readings to inspect latest timestamp, sources, and city coverage
    const { data: recentSample, error: sampleError } = await supabase
      .from('air_quality_readings')
      .select('city, observed_at, source, source_type, pm2_5, pm10, no2, so2, co, o3')
      .order('observed_at', { ascending: false })
      .limit(50);

    if (sampleError) {
      return {
        configured: true,
        connected: true,
        readingsCount: count ?? 0,
        citiesCoveredCount: 0,
        latestTimestamp: null,
        latestSource: null,
        latestSourceType: null,
        citiesWithData: [],
        missingPollutantCount: 0,
        errorMessage: sampleError.message,
      };
    }

    const citiesSet = new Set<string>();
    let missingPollutantRows = 0;
    let latestTs: string | null = null;
    let latestSrc: string | null = null;
    let latestType: 'atmospheric_model' | 'physical_station' | null = null;

    if (recentSample && recentSample.length > 0) {
      latestTs = recentSample[0].observed_at;
      latestSrc = recentSample[0].source || 'open-meteo';
      latestType = recentSample[0].source_type || 'atmospheric_model';

      for (const row of recentSample) {
        if (row.city) citiesSet.add(row.city);
        if (
          row.pm2_5 === null ||
          row.pm10 === null ||
          row.no2 === null ||
          row.so2 === null ||
          row.o3 === null ||
          row.co === null
        ) {
          missingPollutantRows++;
        }
      }
    }

    const citiesList = Array.from(citiesSet).sort();

    return {
      configured: true,
      connected: true,
      readingsCount: count ?? 0,
      citiesCoveredCount: citiesList.length,
      latestTimestamp: latestTs,
      latestSource: latestSrc,
      latestSourceType: latestType,
      citiesWithData: citiesList,
      missingPollutantCount: missingPollutantRows,
    };
  } catch (err) {
    return {
      configured: true,
      connected: false,
      readingsCount: 0,
      citiesCoveredCount: 0,
      latestTimestamp: null,
      latestSource: null,
      latestSourceType: null,
      citiesWithData: [],
      missingPollutantCount: 0,
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}
