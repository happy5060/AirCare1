import React, { useState, useEffect, useMemo } from 'react';
import type { PageId } from '../components/Header';
import {
  fetchBulletinIndex,
  fetchCityBulletin,
  calculatePeriodStats,
  getCategoryColor,
  type BulletinCityMeta,
  type BulletinRecord,
  type PeriodStats,
} from '../services/airQualityData';

interface CompareCitiesProps {
  onNavigate: (page: PageId) => void;
}

interface CityCompareSlot {
  cityKey: string;
  name: string;
  color: string;
  stats: PeriodStats | null;
  records: BulletinRecord[];
  isLoading: boolean;
  geography: string;
}

const TIMEFRAME_PRESETS = [
  { id: 'nov24', label: 'November 2024 (Winter Peak Season)', start: '2024-11-01', end: '2024-11-30' },
  { id: 'diwali24', label: 'Diwali Festive Week 2024', start: '2024-10-28', end: '2024-11-05' },
  { id: 'monsoon24', label: 'Monsoon 2024 (Clean Air Window)', start: '2024-07-01', end: '2024-08-31' },
  { id: 'winter23', label: 'Winter Inversion 2023-24', start: '2023-12-01', end: '2024-01-31' },
  { id: 'year2024', label: 'Full Calendar Year 2024', start: '2024-01-01', end: '2024-12-31' },
];

function getCityGeographyInsight(city: string): string {
  const c = city.toLowerCase();
  if (['mumbai', 'chennai', 'visakhapatnam', 'kochi', 'thiruvananthapuram', 'surat', 'haldia'].some((k) => c.includes(k))) {
    return 'Coastal marine basin benefits from daily sea-breeze circulation that actively disperses surface particulate matter.';
  }
  if (['bengaluru', 'hyderabad', 'pune', 'mysuru', 'coimbatore'].some((k) => c.includes(k))) {
    return 'Elevated Deccan plateau topography (500–900m ASL) provides favorable year-round wind dispersion and higher boundary layer height.';
  }
  if (['delhi', 'lucknow', 'kanpur', 'patna', 'varanasi', 'agra', 'ghaziabad', 'noida', 'gurugram', 'faridabad'].some((k) => c.includes(k))) {
    return 'Landlocked Indo-Gangetic Plain bounded by the Himalayas; experiences severe winter thermal inversions that trap local emissions close to the ground.';
  }
  if (['amritsar', 'ludhiana', 'jalandhar', 'bathinda', 'patiala', 'karnal', 'hisar'].some((k) => c.includes(k))) {
    return 'Northern agricultural basin vulnerable to seasonal post-harvest biomass burning and calm winter anti-cyclonic winds.';
  }
  if (['kolkata', 'howrah', 'asansol', 'durgapur', 'siliguri'].some((k) => c.includes(k))) {
    return 'Eastern river basin with moderate winter inversion stagnation and dense vehicular/industrial traffic.';
  }
  return 'Inland regional urban center influenced by seasonal local meteorological winds and boundary layer dynamics.';
}

export const CompareCities: React.FC<CompareCitiesProps> = ({ onNavigate }) => {
  const [availableCities, setAvailableCities] = useState<BulletinCityMeta[]>([]);

  // Selected cities
  const [cityKeyA, setCityKeyA] = useState<string>('Delhi');
  const [cityKeyB, setCityKeyB] = useState<string>('Mumbai');
  const [cityKeyC, setCityKeyC] = useState<string>('Bengaluru');

  // Timeframe state
  const [timeframeMode, setTimeframeMode] = useState<string>('nov24');
  const [startDate, setStartDate] = useState<string>('2024-11-01');
  const [endDate, setEndDate] = useState<string>('2024-11-30');

  // Raw records cache
  const [recordsA, setRecordsA] = useState<BulletinRecord[]>([]);
  const [recordsB, setRecordsB] = useState<BulletinRecord[]>([]);
  const [recordsC, setRecordsC] = useState<BulletinRecord[]>([]);

  const [loadingA, setLoadingA] = useState<boolean>(true);
  const [loadingB, setLoadingB] = useState<boolean>(true);
  const [loadingC, setLoadingC] = useState<boolean>(true);

  // 1. Fetch index on mount
  useEffect(() => {
    fetchBulletinIndex().then((cities) => {
      setAvailableCities(cities);
    });
  }, []);

  // 2. Load data for City A
  useEffect(() => {
    setLoadingA(true);
    fetchCityBulletin(cityKeyA).then((records) => {
      setRecordsA(records);
      setLoadingA(false);
    });
  }, [cityKeyA]);

  // 3. Load data for City B
  useEffect(() => {
    setLoadingB(true);
    fetchCityBulletin(cityKeyB).then((records) => {
      setRecordsB(records);
      setLoadingB(false);
    });
  }, [cityKeyB]);

  // 4. Load data for City C
  useEffect(() => {
    if (!cityKeyC) {
      setRecordsC([]);
      setLoadingC(false);
      return;
    }
    setLoadingC(true);
    fetchCityBulletin(cityKeyC).then((records) => {
      setRecordsC(records);
      setLoadingC(false);
    });
  }, [cityKeyC]);

  // Handle Preset Timeframe Change
  const handleTimeframePresetChange = (presetId: string) => {
    setTimeframeMode(presetId);
    const p = TIMEFRAME_PRESETS.find((x) => x.id === presetId);
    if (p) {
      setStartDate(p.start);
      setEndDate(p.end);
    }
  };

  // 5. Calculate dynamically calculated period statistics for the common date range
  const statsA = useMemo(() => calculatePeriodStats(recordsA, startDate, endDate), [recordsA, startDate, endDate]);
  const statsB = useMemo(() => calculatePeriodStats(recordsB, startDate, endDate), [recordsB, startDate, endDate]);
  const statsC = useMemo(() => (cityKeyC ? calculatePeriodStats(recordsC, startDate, endDate) : null), [cityKeyC, recordsC, startDate, endDate]);

  // Construct City Slots
  const slots: CityCompareSlot[] = useMemo(() => {
    const list: CityCompareSlot[] = [
      {
        cityKey: cityKeyA,
        name: availableCities.find((c) => c.key === cityKeyA)?.city || cityKeyA,
        color: '#F59E0B', // Amber
        stats: statsA,
        records: recordsA,
        isLoading: loadingA,
        geography: getCityGeographyInsight(cityKeyA),
      },
      {
        cityKey: cityKeyB,
        name: availableCities.find((c) => c.key === cityKeyB)?.city || cityKeyB,
        color: '#38BDF8', // Sky Blue
        stats: statsB,
        records: recordsB,
        isLoading: loadingB,
        geography: getCityGeographyInsight(cityKeyB),
      },
    ];

    if (cityKeyC) {
      list.push({
        cityKey: cityKeyC,
        name: availableCities.find((c) => c.key === cityKeyC)?.city || cityKeyC,
        color: '#10B981', // Emerald
        stats: statsC,
        records: recordsC,
        isLoading: loadingC,
        geography: getCityGeographyInsight(cityKeyC),
      });
    }

    return list;
  }, [cityKeyA, cityKeyB, cityKeyC, availableCities, statsA, statsB, statsC, recordsA, recordsB, recordsC, loadingA, loadingB, loadingC]);

  // Determine cleanest city in the selected timeframe
  const sortedByCleanest = useMemo(() => {
    return [...slots]
      .filter((s) => s.stats && s.stats.periodAverage !== null)
      .sort((a, b) => (a.stats!.periodAverage || 999) - (b.stats!.periodAverage || 999));
  }, [slots]);

  const cleanestCity = sortedByCleanest[0] || slots[0];
  const maxAverageAqi = Math.max(100, ...slots.map((s) => s.stats?.periodAverage || 0));

  return (
    <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* 1. SECTION HEADER */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant">
          <span onClick={() => onNavigate('today')} className="hover:text-primary cursor-pointer">
            AirCare
          </span>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary font-medium">Compare Cities</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-headline font-extrabold text-white tracking-tight">
              Compare Air Quality Between Cities
            </h1>
            <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
              Compare actual CPCB bulletin records between 2 or 3 Indian cities across an identical historical timeframe. Real period averages, peak spikes, and clean air days.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-xs font-mono text-secondary self-start md:self-center">
            <span className="material-symbols-outlined text-sm">balance</span>
            <span>Identical Timeframe Comparison</span>
          </div>
        </div>
      </section>

      {/* 2. CITY SELECTION & TIMEFRAME CONTROLS */}
      <section className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* City 1 Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-amber-400 font-semibold flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              City 1 (Required)
            </label>
            <select
              value={cityKeyA}
              onChange={(e) => setCityKeyA(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-container border border-amber-500/40 text-sm text-white font-medium focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <optgroup label="Popular Metros">
                <option value="Delhi">Delhi</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Kolkata">Kolkata</option>
                <option value="Chennai">Chennai</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Ahmedabad">Ahmedabad</option>
                <option value="Amritsar">Amritsar</option>
                <option value="Lucknow">Lucknow</option>
                <option value="Patna">Patna</option>
                <option value="Jaipur">Jaipur</option>
              </optgroup>
              <optgroup label="All 297 Cities">
                {availableCities.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.city}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* City 2 Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#38BDF8] font-semibold flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]"></span>
              City 2 (Required)
            </label>
            <select
              value={cityKeyB}
              onChange={(e) => setCityKeyB(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-container border border-[#38BDF8]/40 text-sm text-white font-medium focus:outline-none focus:border-[#38BDF8] cursor-pointer"
            >
              <optgroup label="Popular Metros">
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi">Delhi</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Kolkata">Kolkata</option>
                <option value="Chennai">Chennai</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Ahmedabad">Ahmedabad</option>
                <option value="Amritsar">Amritsar</option>
                <option value="Lucknow">Lucknow</option>
                <option value="Patna">Patna</option>
                <option value="Jaipur">Jaipur</option>
              </optgroup>
              <optgroup label="All 297 Cities">
                {availableCities.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.city}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* City 3 Selector (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              City 3 (Optional)
            </label>
            <select
              value={cityKeyC}
              onChange={(e) => setCityKeyC(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-container border border-emerald-500/40 text-sm text-white font-medium focus:outline-none focus:border-emerald-400 cursor-pointer"
            >
              <option value="">None (Compare 2 Cities Only)</option>
              <optgroup label="Popular Metros">
                <option value="Bengaluru">Bengaluru</option>
                <option value="Delhi">Delhi</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Kolkata">Kolkata</option>
                <option value="Chennai">Chennai</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Ahmedabad">Ahmedabad</option>
                <option value="Amritsar">Amritsar</option>
                <option value="Lucknow">Lucknow</option>
                <option value="Patna">Patna</option>
                <option value="Jaipur">Jaipur</option>
              </optgroup>
              <optgroup label="All 297 Cities">
                {availableCities.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.city}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Common Timeframe Preset */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-outline uppercase font-semibold">
              Timeframe Preset
            </label>
            <select
              value={timeframeMode}
              onChange={(e) => handleTimeframePresetChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-container border border-outline-variant/50 text-sm text-on-surface font-medium focus:outline-none focus:border-primary cursor-pointer"
            >
              {TIMEFRAME_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
              <option value="custom">Custom Date Range...</option>
            </select>
          </div>
        </div>

        {/* Custom Date Pickers when 'custom' is selected */}
        {timeframeMode === 'custom' && (
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-outline-variant/20">
            <span className="text-xs font-mono text-outline">Custom Range:</span>
            <input
              type="date"
              value={startDate}
              min="2015-05-01"
              max="2025-12-31"
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/50 text-xs text-white font-mono"
            />
            <span className="text-outline text-xs font-mono">to</span>
            <input
              type="date"
              value={endDate}
              min="2015-05-01"
              max="2025-12-31"
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/50 text-xs text-white font-mono"
            />
          </div>
        )}
      </section>

      {/* 3. DYNAMIC VERDICT / WINNER CALLOUT */}
      <section className="bg-primary/10 border border-primary/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">verified</span>
          </div>
          <div>
            <span className="text-xs font-mono text-primary uppercase font-bold tracking-wider">
              AirCare Dynamic Comparison Summary
            </span>
            <h2 className="text-lg font-headline font-bold text-white mt-0.5">
              {cleanestCity.name} recorded the cleanest air quality during this period.
            </h2>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              With an average AQI of{' '}
              <strong className="text-primary font-bold">
                {cleanestCity.stats?.periodAverage || 'N/A'} ({cleanestCity.stats?.periodCategory})
              </strong>
              , {cleanestCity.name} experienced significantly lower particulate pollution than{' '}
              {slots
                .filter((s) => s.cityKey !== cleanestCity.cityKey)
                .map((s) => `${s.name} (avg ${s.stats?.periodAverage || 'N/A'})`)
                .join(' and ')}{' '}
              between {startDate} and {endDate}.
            </p>
          </div>
        </div>
        <div className="text-[11px] text-outline font-mono shrink-0 self-end sm:self-center">
          *Calculated from actual CPCB daily bulletins
        </div>
      </section>

      {/* 4. SIDE-BY-SIDE DYNAMIC CITY CARDS */}
      <section className={`grid grid-cols-1 ${slots.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-5`}>
        {slots.map((item) => {
          const stats = item.stats;
          const catCol = stats?.periodCategory ? getCategoryColor(stats.periodCategory) : null;
          return (
            <div
              key={item.cityKey}
              className="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-lg hover:border-outline-variant/60 transition-all"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <h3 className="text-xl font-headline font-bold text-white">{item.name}</h3>
                    </div>
                    <p className="text-xs font-mono text-on-surface-variant mt-0.5">
                      {stats ? `${stats.availableDays} / ${stats.totalCalendarDays} days recorded` : 'Loading...'}
                    </p>
                  </div>
                  {stats?.periodCategory && (
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-headline font-bold border"
                      style={{
                        backgroundColor: `${catCol?.hex}20`,
                        color: catCol?.hex,
                        borderColor: `${catCol?.hex}40`,
                      }}
                    >
                      {stats.periodCategory}
                    </span>
                  )}
                </div>

                {/* Main Period Average AQI */}
                <div className="mt-5 p-4 rounded-xl bg-surface-container text-center">
                  <span className="text-xs font-mono text-outline uppercase">Period Average AQI</span>
                  <div
                    className="text-4xl font-headline font-extrabold mt-1"
                    style={{ color: item.color }}
                  >
                    {item.isLoading ? (
                      <span className="text-2xl text-outline font-mono">Loading...</span>
                    ) : stats?.periodAverage !== null ? (
                      stats?.periodAverage
                    ) : (
                      'No Data'
                    )}
                  </div>
                  <span className="text-[11px] text-outline font-mono">CPCB Scale (0–500)</span>
                </div>

                {/* Detailed Breakdown */}
                {stats && (
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-outline-variant/20">
                      <span className="text-on-surface-variant">Cleanest Day:</span>
                      <span className="font-mono font-bold text-primary">
                        {stats.cleanestRecord ? `${stats.cleanestRecord.aqi} AQI (${stats.cleanestRecord.d})` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-outline-variant/20">
                      <span className="text-on-surface-variant">Worst Daily Spike:</span>
                      <span className="font-mono font-bold text-error">
                        {stats.peakRecord ? `${stats.peakRecord.aqi} AQI (${stats.peakRecord.d})` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-outline-variant/20">
                      <span className="text-on-surface-variant">Severe Days (&gt;400):</span>
                      <span className="font-mono font-bold text-white">
                        {stats.categoryDistribution['Severe'] || 0} Day(s)
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-outline-variant/20">
                      <span className="text-on-surface-variant">Dominant Pollutant:</span>
                      <span className="font-bold text-white">
                        {stats.dominantPollutants[0]?.pollutant || 'Not Reported'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-on-surface-variant">Completeness:</span>
                      <span className="font-mono text-secondary">
                        {stats.completenessPercent}% ({stats.missingDaysCount} missing)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Geographic Insight */}
              <div className="pt-3 border-t border-outline-variant/20 text-xs text-outline leading-relaxed">
                <strong className="text-white block mb-0.5">Atmospheric &amp; Geographic Factor:</strong>
                {item.geography}
              </div>
            </div>
          );
        })}
      </section>

      {/* 5. DYNAMIC HORIZONTAL BAR COMPARISON */}
      <section className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-headline font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">bar_chart</span>
              Average AQI Comparison Bar Chart
            </h2>
            <p className="text-xs text-on-surface-variant">
              Comparing arithmetic mean pollution load between selected cities from {startDate} to {endDate}.
            </p>
          </div>
          <span className="text-xs font-mono text-outline">CPCB Safe Limit: 100</span>
        </div>

        {/* Dynamic Comparison Bars */}
        <div className="space-y-4 pt-2">
          {slots.map((item) => {
            const avg = item.stats?.periodAverage || 0;
            const barWidth = maxAverageAqi > 0 ? Math.min(100, Math.max(12, (avg / Math.max(400, maxAverageAqi)) * 100)) : 10;
            return (
              <div key={item.cityKey} className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-headline font-bold text-white flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    {item.name}
                  </span>
                  <span className="font-bold" style={{ color: item.color }}>
                    AQI {avg} ({item.stats?.periodCategory || 'No Data'})
                  </span>
                </div>
                <div className="w-full h-7 rounded-lg bg-surface-container overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-md transition-all duration-500 flex items-center justify-end pr-3 text-[11px] font-mono font-bold text-black"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: item.color,
                    }}
                  >
                    {avg}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. OVERLAID MULTI-CITY TIME-SERIES TRAJECTORY */}
      <section className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-headline font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-xl">show_chart</span>
              Daily Comparative AQI Trajectory
            </h2>
            <p className="text-xs text-on-surface-variant">
              Day-by-day pollution trajectories overlaid on the exact same timeline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
            {slots.map((s) => (
              <div key={s.cityKey} className="flex items-center gap-1.5 bg-surface-container px-2 py-1 rounded-md border border-outline-variant/30">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }}></span>
                <span className="text-white font-medium">{s.name}</span>
                {s.stats && s.stats.missingDaysCount > 0 && (
                  <span className="text-[10px] text-amber-400 font-mono" title={`${s.stats.missingDaysCount} unreleased bulletin days`}>
                    ({s.stats.availableDays}d)
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Multi-Line SVG Chart */}
        <div className="relative w-full h-72 bg-surface-container-lowest/90 rounded-xl p-4 border border-outline-variant/30 overflow-hidden">
          {(() => {
            // Find all unique dates in the range
            const allDatesSet = new Set<string>();
            slots.forEach((s) => {
              s.stats?.recordsInRange.forEach((r) => allDatesSet.add(r.d));
            });
            const sortedDates = Array.from(allDatesSet).sort();

            if (sortedDates.length === 0) {
              return (
                <div className="h-full flex items-center justify-center text-xs font-mono text-outline">
                  No data available for the selected date range.
                </div>
              );
            }

            const svgWidth = 1000;
            const svgHeight = 220;
            const paddingX = 40;
            const paddingTop = 20;
            const paddingBottom = 30;
            const usableHeight = svgHeight - paddingTop - paddingBottom;
            const usableWidth = svgWidth - paddingX * 2;
            const maxVal = 500;

            const getY = (val: number) => {
              const clamped = Math.min(maxVal, Math.max(0, val));
              return paddingTop + usableHeight - (clamped / maxVal) * usableHeight;
            };

            const getX = (dateStr: string) => {
              const idx = sortedDates.indexOf(dateStr);
              if (idx === -1 || sortedDates.length <= 1) return paddingX + usableWidth / 2;
              return paddingX + (idx / (sortedDates.length - 1)) * usableWidth;
            };

            return (
              <svg className="w-full h-full" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
                {/* Reference Standard Lines */}
                <line x1={paddingX} x2={svgWidth - paddingX} y1={getY(400)} y2={getY(400)} stroke="#EF4444" strokeDasharray="3 3" strokeOpacity="0.3" strokeWidth="1" />
                <text x={paddingX + 5} y={getY(400) - 4} fill="#EF4444" fontSize="9" fontFamily="monospace">400 Severe</text>

                <line x1={paddingX} x2={svgWidth - paddingX} y1={getY(200)} y2={getY(200)} stroke="#EAB308" strokeDasharray="3 3" strokeOpacity="0.2" strokeWidth="1" />
                <text x={paddingX + 5} y={getY(200) - 4} fill="#EAB308" fontSize="9" fontFamily="monospace">200 Moderate</text>

                <line x1={paddingX} x2={svgWidth - paddingX} y1={getY(100)} y2={getY(100)} stroke="#14B8A6" strokeDasharray="3 3" strokeOpacity="0.2" strokeWidth="1" />
                <text x={paddingX + 5} y={getY(100) - 4} fill="#14B8A6" fontSize="9" fontFamily="monospace">100 Satisfactory</text>

                {/* Polylines for each city */}
                {slots.map((slot) => {
                  const records = slot.stats?.recordsInRange || [];
                  const valid = records.filter((r) => r.aqi !== null);
                  if (valid.length === 0) return null;

                  const pathStr = valid.reduce((acc, r, i) => {
                    const x = getX(r.d);
                    const y = getY(r.aqi!);
                    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                  }, '');

                  return (
                    <g key={slot.cityKey}>
                      <path
                        d={pathStr}
                        fill="none"
                        stroke={slot.color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.9"
                      />
                      {valid.map((r, i) => (
                        <circle
                          key={i}
                          cx={getX(r.d)}
                          cy={getY(r.aqi!)}
                          r={sortedDates.length > 40 ? 2 : 3.5}
                          fill={slot.color}
                          stroke="#0a1228"
                          strokeWidth="1.5"
                        />
                      ))}
                    </g>
                  );
                })}
              </svg>
            );
          })()}

          {/* Timeline Bounds */}
          <div className="absolute bottom-1 inset-x-0 flex justify-between px-6 text-[10px] font-mono text-outline">
            <span>{startDate}</span>
            <span>Mid-Period</span>
            <span>{endDate}</span>
          </div>
        </div>

        {/* Scientific Context Disclosure */}
        <div className="pt-2 text-xs text-outline leading-relaxed flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-secondary shrink-0">info</span>
          <span>
            <strong>Comparative Principle:</strong> A city having cleaner air during a specific month does not mean it is cleaner year-round. Coastal cities benefit from monsoon rain and sea breezes in July–August, whereas northern plains experience severe thermal stagnation in November–January.
          </span>
        </div>
      </section>
    </main>
  );
};
