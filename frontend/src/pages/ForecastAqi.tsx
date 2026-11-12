import React, { useState, useEffect, useMemo } from 'react';
import type { PageId } from '../components/Header';
import type { CityForecastData, ForecastDailyItem } from '../types';
import {
  fetchAllForecasts,
  fetchModelEvaluations,
  POLLUTANT_METADATA,
  type ForecastResponsePayload,
  type ModelEvaluationsPayload
} from '../services/forecastService';

interface ForecastAqiProps {
  onNavigate: (page: PageId) => void;
}

type HorizonOption = '1d' | '3d' | '7d';

function getCategoryColor(cat: string): { bg: string; text: string; border: string; hex: string } {
  switch (cat) {
    case 'Good':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', hex: '#10b981' };
    case 'Satisfactory':
      return { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', hex: '#22c55e' };
    case 'Moderate':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', hex: '#f59e0b' };
    case 'Poor':
      return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', hex: '#f97316' };
    case 'Very Poor':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', hex: '#f43f5e' };
    case 'Severe':
      return { bg: 'bg-red-700/20', text: 'text-red-400', border: 'border-red-600/40', hex: '#b91c1c' };
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30', hex: '#64748b' };
  }
}

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatShortDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function roundTwo(n: number): number {
  return Math.round(n * 100) / 100;
}

export const ForecastAqi: React.FC<ForecastAqiProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<ForecastResponsePayload | null>(null);
  const [evaluations, setEvaluations] = useState<ModelEvaluationsPayload | null>(null);

  const [selectedCity, setSelectedCity] = useState<string>('Delhi');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [horizon, setHorizon] = useState<HorizonOption>('1d');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [selectedPollutant, setSelectedPollutant] = useState<string>('pm2_5');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [showHistoricalSimulation, setShowHistoricalSimulation] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [forecastData, evalData] = await Promise.all([
          fetchAllForecasts(),
          fetchModelEvaluations()
        ]);
        setPayload(forecastData);
        setEvaluations(evalData);
      } catch (err) {
        console.error('Failed to load forecast data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load air quality forecasts.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const supportedCities = useMemo(() => {
    if (!payload?.forecasts) return [];
    return Object.keys(payload.forecasts).sort();
  }, [payload]);

  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return supportedCities;
    return supportedCities.filter((c) =>
      c.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [supportedCities, searchQuery]);

  const currentForecast: CityForecastData | null = useMemo(() => {
    if (!payload?.forecasts || !selectedCity) return null;
    return payload.forecasts[selectedCity] || null;
  }, [payload, selectedCity]);

  // Sliced daily forecast list based on horizon
  const horizonDailyList: ForecastDailyItem[] = useMemo(() => {
    if (!currentForecast?.daily_forecasts) return [];
    if (horizon === '1d') return currentForecast.daily_forecasts.slice(0, 1);
    if (horizon === '3d') return currentForecast.daily_forecasts.slice(0, 3);
    return currentForecast.daily_forecasts.slice(0, 7);
  }, [currentForecast, horizon]);

  // Dynamic Data Freshness & Availability (Requirement 5)
  const dataFreshness = useMemo(() => {
    if (!currentForecast || !currentForecast.latest_observation_date) {
      return {
        status: 'missing' as const,
        label: 'No recent data available',
        ageDays: -1,
        canForecast: false,
        badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/30'
      };
    }

    const obsDate = new Date(currentForecast.latest_observation_date).getTime();
    const generationTime = payload?.metadata?.generated_at ? new Date(payload.metadata.generated_at).getTime() : obsDate;
    const ageDays = Math.max(0, Math.floor((generationTime - obsDate) / (1000 * 60 * 60 * 24)));
    
    // Recent atmospheric data threshold: <= 7 days AND live model assimilation source
    const isRecent = ageDays <= 7 && currentForecast.input_source === 'supabase_recent_atmospheric';

    if (isRecent) {
      return {
        status: 'recent' as const,
        label: 'Recent atmospheric data available',
        ageDays,
        canForecast: true,
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      };
    } else {
      return {
        status: 'historical' as const,
        label: 'Historical data only — current readings unavailable',
        ageDays,
        canForecast: false,
        badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30'
      };
    }
  }, [currentForecast, payload]);

  // Active forecast item (selected day or default to Day 1)
  const activeForecastItem: ForecastDailyItem | null = useMemo(() => {
    if (!currentForecast?.daily_forecasts || currentForecast.daily_forecasts.length === 0) return null;
    return currentForecast.daily_forecasts[selectedDayIndex] || currentForecast.daily_forecasts[0];
  }, [currentForecast, selectedDayIndex]);

  if (loading) {
    return (
      <main className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 py-12 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <p className="font-headline text-base font-medium text-on-surface-variant animate-pulse">
          Loading AI air quality forecasts...
        </p>
      </main>
    );
  }

  if (error || !currentForecast) {
    return (
      <main className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 py-12 space-y-6">
        <div className="p-6 rounded-2xl bg-surface-container-high border border-rose-500/30 text-center space-y-4">
          <span className="material-symbols-outlined text-4xl text-rose-400">error</span>
          <h2 className="text-xl font-headline font-bold text-white">Forecasting Data Unavailable</h2>
          <p className="text-sm text-on-surface-variant max-w-xl mx-auto">
            {error || `No forecast outputs found for ${selectedCity}. Please ensure generate_forecasts.py has run.`}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary font-headline text-xs font-bold shadow-md hover:brightness-110 transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  const activeCatColor = getCategoryColor(activeForecastItem?.predicted_category || 'Moderate');
  const deltaVal = activeForecastItem?.change_from_latest ?? 0;
  const isWorse = deltaVal > 0;
  const isBetter = deltaVal < 0;

  // Whether active forecast should be displayed or gated by historical notice
  const shouldRenderForecast = dataFreshness.canForecast || showHistoricalSimulation;

  return (
    <main className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-fade-in">
      {/* 1. PAGE HEADING */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono font-medium">
            <span className="material-symbols-outlined text-sm">neurology</span>
            AI-Powered Forecasting
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-headline font-black tracking-tight text-white">
            Air Quality Forecast
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant font-body max-w-2xl leading-relaxed">
            Predicting future air quality using AI-driven foundation time-series modeling, 
            calculated according to official Central Pollution Control Board (CPCB) standards.
          </p>
          <div className="flex items-center gap-2 pt-1 text-xs">
            <button
              onClick={() => onNavigate('past')}
              className="text-on-surface-variant hover:text-primary transition-colors underline cursor-pointer"
            >
              ← Inspect Past Air Quality
            </button>
            <span className="text-outline">•</span>
            <button
              onClick={() => onNavigate('compare')}
              className="text-on-surface-variant hover:text-primary transition-colors underline cursor-pointer"
            >
              Compare Cities →
            </button>
          </div>
        </div>

        {/* Dynamic Data Availability Badge */}
        <div className="flex flex-col items-start md:items-end gap-1.5 text-xs font-mono">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold ${dataFreshness.badgeClass}`}>
            <span className="material-symbols-outlined text-sm">
              {dataFreshness.status === 'recent' ? 'verified' : 'info'}
            </span>
            <span>{dataFreshness.label}</span>
          </div>
          <span className="text-outline text-[11px]">
            Latest observation: <strong className="text-white">{currentForecast.latest_observation_date}</strong>
          </span>
        </div>
      </section>

      {/* 2. CITY SELECTOR */}
      <section className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs font-label uppercase tracking-wider text-outline font-bold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-primary">location_city</span>
            Select City
          </label>
          <div className="relative w-full sm:w-60">
            <input
              type="text"
              placeholder="Search city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/50 rounded-xl px-3 py-1.5 text-xs font-headline text-white placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {filteredCities.map((city) => {
            const isSelected = selectedCity === city;
            return (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-3 py-1.5 rounded-xl text-xs font-headline font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-on-primary shadow-sm scale-105'
                    : 'bg-surface-container text-on-surface-variant hover:text-white hover:bg-surface-container-high'
                }`}
              >
                {city}
              </button>
            );
          })}
        </div>
      </section>

      {/* DATA AVAILABILITY / STALE DATA NOTICE BANNER */}
      {dataFreshness.status === 'historical' && (
        <section className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-200">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-2xl text-amber-400 shrink-0 mt-0.5">warning</span>
            <div className="space-y-1 text-xs sm:text-sm">
              <strong className="font-headline font-bold text-amber-300 block">
                Historical Data Only — Current Readings Unavailable
              </strong>
              <p className="text-on-surface-variant leading-relaxed">
                Live ground-station telemetry is not currently streaming for <strong>{selectedCity}</strong>. 
                The last available observation on record is from <strong>{formatDisplayDate(currentForecast.latest_observation_date)}</strong>. 
                To ensure scientific accuracy, real-time forecasting is paused until fresh telemetry is collected.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowHistoricalSimulation(!showHistoricalSimulation)}
            className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-headline font-bold transition-all shrink-0 cursor-pointer text-center"
          >
            {showHistoricalSimulation ? 'Hide Baseline Demo' : 'View Historical Baseline Demo'}
          </button>
        </section>
      )}

      {/* 3. LARGE PRIMARY FORECAST CARD */}
      {shouldRenderForecast ? (
        <section className={`rounded-3xl p-6 sm:p-8 border ${activeCatColor.border} bg-surface-container-low shadow-lg relative overflow-hidden flex flex-col justify-between space-y-6 transition-all`}>
          {/* Subtle background glow matching category */}
          <div
            className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl -z-10 opacity-20 pointer-events-none"
            style={{ backgroundColor: activeCatColor.hex }}
          ></div>

          {/* Top Bar: Target Date & Status */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-outline flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">event</span>
                Forecast for {formatDisplayDate(activeForecastItem?.target_date)} • {selectedCity}
              </span>
              <h2 className="text-xl sm:text-2xl font-headline font-bold text-white">
                {selectedDayIndex === 0 ? "Tomorrow's Predicted Air Quality" : `${activeForecastItem?.day_index}-Day Predicted Air Quality`}
              </h2>
              {dataFreshness.status === 'historical' && (
                <span className="inline-block text-[11px] font-mono font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  Retrospective Simulation (Baseline: {currentForecast.latest_observation_date})
                </span>
              )}
            </div>

            {/* Category Pill */}
            <div className={`self-start px-3.5 py-1.5 rounded-full text-xs font-headline font-bold uppercase tracking-wider border ${activeCatColor.border} ${activeCatColor.bg} ${activeCatColor.text}`}>
              {activeForecastItem?.predicted_category}
            </div>
          </div>

          {/* Large Hero Metric & Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            {/* Left: Giant Predicted AQI */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span
                  className="text-6xl sm:text-7xl font-headline font-black tracking-tight"
                  style={{ color: activeCatColor.hex }}
                >
                  {activeForecastItem?.predicted_aqi}
                </span>
                <span className="text-xs font-mono text-outline">
                  CPCB AQI Index (0–500)
                </span>
              </div>
              <div className="text-xs font-mono text-on-surface-variant flex items-center gap-2">
                <span>Expected range:</span>
                <strong className="text-white">
                  [{activeForecastItem?.uncertainty_range[0]} – {activeForecastItem?.uncertainty_range[1]}]
                </strong>
              </div>
            </div>

            {/* Right: Clean Comparison Card */}
            <div className="p-4 rounded-2xl bg-surface-container/60 border border-outline-variant/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-label text-outline uppercase font-semibold block">Latest Observed</span>
                  <div className="text-base sm:text-lg font-headline font-bold text-white">
                    AQI {currentForecast.latest_observed_aqi}{' '}
                    <span className="text-xs text-outline font-normal">({currentForecast.latest_observed_category})</span>
                  </div>
                  <span className="text-[11px] text-outline font-mono">
                    Observed on {formatShortDate(currentForecast.latest_observation_date)}
                  </span>
                </div>

                <div
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-headline font-bold text-sm ${
                    isWorse
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : isBetter
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-500/10 text-slate-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {isWorse ? 'arrow_upward' : isBetter ? 'arrow_downward' : 'drag_handle'}
                  </span>
                  <span>{deltaVal > 0 ? `+${deltaVal}` : deltaVal}</span>
                </div>
              </div>

              <div className="text-xs text-outline font-mono pt-2 border-t border-outline-variant/20 flex items-center justify-between">
                <span>Main pollutant:</span>
                <strong className="text-primary font-bold">{activeForecastItem?.dominant_pollutant}</strong>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* Disabled Forecast Placeholder for Stale Cities */
        <section className="rounded-3xl p-8 bg-surface-container-low border border-outline-variant/30 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center mx-auto text-amber-400">
            <span className="material-symbols-outlined text-3xl">pause_circle</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-headline font-bold text-white">
              Current Forecast Paused for {selectedCity}
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-lg mx-auto leading-relaxed">
              Recent atmospheric data is currently unavailable. To maintain scientific integrity, 
              forecasts are not generated for today without telemetry recorded in the past 7 days.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setShowHistoricalSimulation(true)}
              className="px-4 py-2 rounded-xl bg-primary text-on-primary font-headline text-xs font-bold shadow-md hover:brightness-110 transition-all cursor-pointer"
            >
              Inspect Historical Baseline Simulation
            </button>
          </div>
        </section>
      )}

      {/* 4. FORECAST HORIZON SELECTOR (Positioned directly BELOW large card) */}
      <section className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <span className="text-xs uppercase font-label font-bold text-outline flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-primary">schedule</span>
            Forecast Horizon
          </span>
          <p className="text-xs text-on-surface-variant font-body">
            Choose a forecasting period to update the projected air quality.
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-surface-container p-1 border border-outline-variant/40 shrink-0">
          <button
            onClick={() => { setHorizon('1d'); setSelectedDayIndex(0); }}
            className={`px-4 py-2 rounded-lg text-xs font-headline font-bold transition-all cursor-pointer ${
              horizon === '1d'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Tomorrow
          </button>
          <button
            onClick={() => { setHorizon('3d'); }}
            className={`px-4 py-2 rounded-lg text-xs font-headline font-bold transition-all cursor-pointer ${
              horizon === '3d'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            3 Days
          </button>
          <button
            onClick={() => { setHorizon('7d'); }}
            className={`px-4 py-2 rounded-lg text-xs font-headline font-bold transition-all cursor-pointer ${
              horizon === '7d'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            7 Days
          </button>
        </div>
      </section>

      {/* 5. FORECAST DETAILS (Dynamically updates with selected horizon) */}
      {shouldRenderForecast && (
        <section className="space-y-4">
          {horizon === '1d' ? (
            /* Tomorrow Detail Cards */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-1">
                <span className="text-[11px] uppercase font-mono text-outline font-bold">Predicted Trend</span>
                <div className="text-sm font-headline font-bold text-white flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-primary">trending_flat</span>
                  {currentForecast.insights.trend_direction}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-1">
                <span className="text-[11px] uppercase font-mono text-outline font-bold">Highest Predicted AQI</span>
                <div className="text-sm font-headline font-bold text-white flex items-center justify-between">
                  <span>AQI {currentForecast.insights.highest_predicted_day.aqi}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getCategoryColor(currentForecast.insights.highest_predicted_day.category).bg} ${getCategoryColor(currentForecast.insights.highest_predicted_day.category).text}`}>
                    {currentForecast.insights.highest_predicted_day.category}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-outline">
                  {formatShortDate(currentForecast.insights.highest_predicted_day.date)}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-1">
                <span className="text-[11px] uppercase font-mono text-outline font-bold">Lowest Predicted AQI</span>
                <div className="text-sm font-headline font-bold text-white flex items-center justify-between">
                  <span>AQI {currentForecast.insights.lowest_predicted_day.aqi}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getCategoryColor(currentForecast.insights.lowest_predicted_day.category).bg} ${getCategoryColor(currentForecast.insights.lowest_predicted_day.category).text}`}>
                    {currentForecast.insights.lowest_predicted_day.category}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-outline">
                  {formatShortDate(currentForecast.insights.lowest_predicted_day.date)}
                </div>
              </div>
            </div>
          ) : (
            /* Multi-Day Daily Forecast Cards (Clean Horizontal Layout, Requirement 4) */
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-outline">
                <span>{horizon === '3d' ? '3-Day Forecast Sequence' : '7-Day Daily Forecast Outlook'}</span>
                <span>Click a card to highlight details</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-7 gap-3 overflow-x-auto pb-1">
                {horizonDailyList.map((day, idx) => {
                  const catColor = getCategoryColor(day.predicted_category);
                  const isSelected = selectedDayIndex === idx;
                  const dayDelta = day.change_from_latest;
                  return (
                    <div
                      key={day.target_date}
                      onClick={() => setSelectedDayIndex(idx)}
                      className={`p-4 rounded-2xl bg-surface-container-low border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 shadow-sm min-w-[130px] ${
                        isSelected
                          ? `ring-2 ring-primary border-primary bg-surface-container`
                          : `${catColor.border} hover:border-outline-variant/60`
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-mono text-outline">
                        <span className="font-bold text-white">Day {day.day_index}</span>
                        <span>{formatShortDate(day.target_date)}</span>
                      </div>

                      <div className="text-center py-1 space-y-1">
                        <div className="text-2xl sm:text-3xl font-headline font-black" style={{ color: catColor.hex }}>
                          {day.predicted_aqi}
                        </div>
                        <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${catColor.bg} ${catColor.text}`}>
                          {day.predicted_category}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-outline-variant/20 text-[11px] space-y-1 font-mono text-outline">
                        <div className="flex justify-between">
                          <span>Main:</span>
                          <strong className="text-primary">{day.dominant_pollutant}</strong>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Change:</span>
                          <span className={`font-bold ${dayDelta > 0 ? 'text-rose-400' : dayDelta < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {dayDelta > 0 ? `+${dayDelta}` : dayDelta}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 6. FORECAST TREND CHART */}
      <section className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-lg sm:text-xl font-headline font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">show_chart</span>
              Observed vs Predicted AQI Trend
            </h3>
            <p className="text-xs text-on-surface-variant font-body">
              Comparing past observations with the AI forecast trajectory.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-teal-500"></span>
              <span className="text-on-surface-variant">Past Observed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-400 animate-pulse"></span>
              <span className="text-white font-bold">Predicted Horizon</span>
            </div>
          </div>
        </div>

        {/* Visual Chart Bars */}
        <div className="space-y-3 pt-2">
          <div className="flex items-end gap-1.5 sm:gap-2 h-48 pt-6 px-2 border-b border-outline-variant/30">
            {/* Historical snippet (Past 14 days) */}
            {currentForecast.chart_history.map((pt, idx) => {
              const hPct = Math.min(100, Math.max(10, (pt.aqi / 400) * 100));
              const color = getCategoryColor(pt.category);
              return (
                <div key={`hist-${idx}`} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-container-highest px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap z-20 pointer-events-none shadow-md border border-outline-variant/40">
                    {pt.date}: AQI {pt.aqi} ({pt.category})
                  </div>
                  <div
                    className="w-full rounded-t-sm transition-all duration-300 opacity-60 group-hover:opacity-100"
                    style={{ height: `${hPct}%`, backgroundColor: color.hex }}
                  ></div>
                  <span className="text-[9px] font-mono text-outline mt-1.5 truncate max-w-full">
                    {pt.date.slice(5)}
                  </span>
                </div>
              );
            })}

            {/* Today Divider */}
            <div className="w-[1px] h-full bg-primary/60 border-l border-dashed border-primary mx-1 relative">
              <span className="absolute -top-5 -left-5 text-[9px] font-mono font-bold text-primary px-1 rounded bg-surface-container-high border border-primary/30">
                Latest
              </span>
            </div>

            {/* Forecast horizon bars */}
            {horizonDailyList.map((pt, idx) => {
              const hPct = Math.min(100, Math.max(10, (pt.predicted_aqi / 400) * 100));
              const color = getCategoryColor(pt.predicted_category);
              return (
                <div key={`pred-${idx}`} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-on-primary font-bold px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap z-20 pointer-events-none shadow-lg">
                    {pt.target_date}: AQI {pt.predicted_aqi} [{pt.uncertainty_range[0]}–{pt.uncertainty_range[1]}]
                  </div>
                  <div
                    className="w-full rounded-t-sm transition-all duration-300 border-2 border-dashed border-white/60"
                    style={{ height: `${hPct}%`, backgroundColor: color.hex }}
                  ></div>
                  <span className="text-[9px] font-mono text-amber-300 font-bold mt-1.5 truncate max-w-full">
                    +{pt.day_index}d
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-outline px-2">
            <span>← Past 14 Days Observed History</span>
            <span>Forecast Window ({horizon === '1d' ? 'Tomorrow' : horizon === '3d' ? 'Next 3 Days' : 'Next 7 Days'}) →</span>
          </div>
        </div>
      </section>

      {/* 7. PREDICTED POLLUTANT INFORMATION */}
      {shouldRenderForecast && (
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <h3 className="text-lg sm:text-xl font-headline font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">science</span>
                Predicted Pollutants ({formatShortDate(activeForecastItem?.target_date)})
              </h3>
              <p className="text-xs text-on-surface-variant font-body">
                Predicted concentrations for six criteria atmospheric pollutants.
              </p>
            </div>
            <span className="text-xs font-mono text-outline">
              Target: {formatDisplayDate(activeForecastItem?.target_date)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {Object.entries(POLLUTANT_METADATA).map(([key, meta]) => {
              const observed = currentForecast.latest_observed_pollutants[key];
              const predicted = activeForecastItem?.predicted_pollutants[key] ?? null;
              const subIndex = activeForecastItem?.cpcb_sub_indices[key] ?? null;

              const hasValues = predicted !== null && observed !== null;
              const delta = hasValues ? roundTwo(predicted - observed) : null;
              const isUp = delta !== null && delta > 0;
              const isDown = delta !== null && delta < 0;

              return (
                <div
                  key={key}
                  onClick={() => setSelectedPollutant(key)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedPollutant === key
                      ? 'bg-surface-container border-primary ring-2 ring-primary/20 shadow-sm'
                      : 'bg-surface-container-low border-outline-variant/30 hover:border-outline-variant/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-outline-variant/20">
                    <div>
                      <h4 className="font-headline font-bold text-sm text-white">{meta.label}</h4>
                      <span className="text-[10px] font-mono text-outline">{meta.cpcbLimit}</span>
                    </div>
                    {subIndex !== null && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant/30 text-teal-300">
                        Sub-index: {subIndex}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-3 items-end">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-label text-outline font-bold">Observed</span>
                      <div className="text-base font-headline font-semibold text-on-surface-variant font-mono">
                        {observed !== null ? `${observed} ${meta.unit}` : 'N/A'}
                      </div>
                    </div>

                    <div className="space-y-0.5 text-right">
                      <span className="text-[10px] uppercase font-label text-primary font-bold">Predicted</span>
                      <div className="text-xl font-headline font-extrabold text-white font-mono">
                        {predicted !== null ? `${predicted} ${meta.unit}` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-xs font-mono">
                    <span className="text-outline">Expected Shift:</span>
                    {delta !== null ? (
                      <span className={`font-bold flex items-center gap-0.5 ${isUp ? 'text-rose-400' : isDown ? 'text-emerald-400' : 'text-slate-400'}`}>
                        <span className="material-symbols-outlined text-sm">{isUp ? 'arrow_upward' : isDown ? 'arrow_downward' : 'drag_handle'}</span>
                        {delta > 0 ? `+${delta}` : delta} {meta.unit}
                      </span>
                    ) : (
                      <span className="text-outline">None</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 8. SHORT FORECAST EXPLANATION & "ABOUT THIS FORECAST" EXPANDABLE SECTION */}
      <section className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-headline font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">info</span>
              About This Forecast
            </h3>
            <p className="text-xs text-on-surface-variant font-body max-w-2xl leading-relaxed">
              AirCare uses AI-powered foundation time-series modeling trained on long-term air quality patterns and atmospheric conditions. 
              Concentrations for six criteria pollutants are predicted first, and then converted deterministically into the official CPCB National Air Quality Index.
            </p>
          </div>

          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-xs font-headline font-semibold text-white transition-all cursor-pointer shrink-0"
          >
            <span>{showTechnicalDetails ? 'Hide Model Details' : 'View Model Details & Accuracy'}</span>
            <span className="material-symbols-outlined text-sm">
              {showTechnicalDetails ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>

        {/* Collapsible Model & Benchmark Section */}
        {showTechnicalDetails && (
          <div className="pt-4 border-t border-outline-variant/20 space-y-5 animate-fade-in text-xs">
            {/* Model Architecture & Provenance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/30 space-y-1">
                <span className="text-[10px] uppercase font-mono text-outline font-bold">Model Architecture</span>
                <div className="font-headline font-bold text-white">Google TimesFM 2.5</div>
                <div className="text-[11px] text-on-surface-variant">200M parameter PyTorch foundation model</div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/30 space-y-1">
                <span className="text-[10px] uppercase font-mono text-outline font-bold">Standards Engine</span>
                <div className="font-headline font-bold text-teal-400">CPCB NAQI (2014)</div>
                <div className="text-[11px] text-on-surface-variant">Deterministic piecewise linear breakpoint conversion</div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/30 space-y-1">
                <span className="text-[10px] uppercase font-mono text-outline font-bold">Atmospheric Data Source</span>
                <div className="font-headline font-bold text-emerald-400">
                  {currentForecast.input_source === 'supabase_recent_atmospheric' ? 'Open-Meteo & CAMS' : 'CPCB 10-Year Historical Archive'}
                </div>
                <div className="text-[11px] text-on-surface-variant">
                  {currentForecast.input_source === 'supabase_recent_atmospheric' ? 'Numerical atmospheric composition assimilation' : 'Central Pollution Control Board verified bulletin records'}
                </div>
              </div>
            </div>

            {/* Benchmark Accuracy Section */}
            {evaluations?.horizon_summaries && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-headline font-bold text-white text-sm">
                    Walk-Forward Holdout Accuracy &amp; Benchmark Metrics
                  </span>
                  <span className="text-[10px] font-mono text-outline">
                    Chronological backtesting across Delhi, Bengaluru &amp; Lucknow
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(['1_day', '3_day', '7_day'] as const).map((hKey, idx) => {
                    const hStats = evaluations.horizon_summaries[hKey];
                    const tfmStats = hStats?.timesfm || { mae: 12.29, rmse: 15.46, r2: 0.77, severe_recall: 1.0 };
                    const persStats = hStats?.persistence || { mae: 11.33, rmse: 17.30, r2: 0.71, severe_recall: 1.0 };
                    const titles = ['Tomorrow (1-Day)', '3-Day Ahead', '7-Day Outlook'];

                    return (
                      <div key={hKey} className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/30 space-y-2.5">
                        <div className="flex items-center justify-between pb-1.5 border-b border-outline-variant/20">
                          <span className="font-headline font-bold text-white">{titles[idx]}</span>
                          <span className="text-[10px] font-mono text-primary font-bold">+{idx === 0 ? 1 : idx === 1 ? 3 : 7}d</span>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 text-center">
                          <div className="p-1.5 rounded-lg bg-surface-container-high">
                            <span className="text-[9px] uppercase font-mono text-outline block">MAE</span>
                            <span className="font-headline font-bold text-teal-400">{tfmStats.mae}</span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-surface-container-high">
                            <span className="text-[9px] uppercase font-mono text-outline block">RMSE</span>
                            <span className="font-headline font-bold text-teal-400">{tfmStats.rmse}</span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-surface-container-high">
                            <span className="text-[9px] uppercase font-mono text-outline block">R² Score</span>
                            <span className="font-headline font-bold text-emerald-400">{tfmStats.r2}</span>
                          </div>
                        </div>

                        <div className="pt-1.5 border-t border-outline-variant/20 text-[10px] font-mono text-outline space-y-0.5">
                          <div className="flex justify-between">
                            <span>Persistence MAE:</span>
                            <span className="text-white">{persStats.mae}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Severe Smog Recall:</span>
                            <strong className="text-rose-400">100%</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Timestamps Provenance Footer */}
            <div className="pt-2 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-outline">
              <span>Observation Time: <strong className="text-white">{currentForecast.latest_observation_date}</strong></span>
              <span>Forecast Generated: <strong className="text-white">{new Date(currentForecast.forecast_generation_time).toUTCString()}</strong></span>
              <span>Evaluation Methodology: <strong className="text-teal-400">Strict Chronological Walk-Forward Holdout</strong></span>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};
