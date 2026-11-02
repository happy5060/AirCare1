import React, { useState, useEffect, useMemo } from 'react';
import type { PageId } from '../components/Header';
import {
  fetchBulletinIndex,
  fetchCityBulletin,
  fetchCityDayIndex,
  fetchCityDay,
  calculatePeriodStats,
  getCategoryColor,
  getExpectedCategory,
  type BulletinCityMeta,
  type BulletinRecord,
  type CityDayCityMeta,
  type CityDayRecord,
} from '../services/airQualityData';

interface PastAqiProps {
  onNavigate: (page: PageId) => void;
}

const PRESET_OPTIONS = [
  { id: 'nov24', label: 'November 2024 (Winter Peak)', start: '2024-11-01', end: '2024-11-30' },
  { id: 'diwali24', label: 'Diwali Week 2024', start: '2024-10-28', end: '2024-11-05' },
  { id: 'monsoon24', label: 'Monsoon 2024 (Clean Window)', start: '2024-07-01', end: '2024-08-31' },
  { id: 'winter23', label: 'Winter 2023-24 Inversion', start: '2023-12-01', end: '2024-01-31' },
  { id: 'smog16', label: 'Historical 2016 Smog Episode', start: '2016-10-28', end: '2016-11-10' },
];

export const PastAqi: React.FC<PastAqiProps> = ({ onNavigate }) => {
  // Dataset mode: bulletins (2015-2025, 297 cities) vs chemical city_day (2015-2020, 26 cities)
  const [datasetMode, setDatasetMode] = useState<'bulletins' | 'city_day'>('bulletins');

  // Bulletin State
  const [bulletinCities, setBulletinCities] = useState<BulletinCityMeta[]>([]);
  const [selectedCityKey, setSelectedCityKey] = useState<string>('Delhi');
  const [cityRecords, setCityRecords] = useState<BulletinRecord[]>([]);
  const [isLoadingCity, setIsLoadingCity] = useState<boolean>(true);

  // Query Controls
  const [viewMode, setViewMode] = useState<'range' | 'single'>('range');
  const [startDate, setStartDate] = useState<string>('2024-11-01');
  const [endDate, setEndDate] = useState<string>('2024-11-30');
  const [singleDate, setSingleDate] = useState<string>('2024-11-18');
  const [activePreset, setActivePreset] = useState<string>('nov24');

  // Hover state for interactive chart
  const [hoveredRecord, setHoveredRecord] = useState<BulletinRecord | null>(null);

  // Chemical / City-Day state
  const [cityDayCities, setCityDayCities] = useState<CityDayCityMeta[]>([]);
  const [selectedCityDayKey, setSelectedCityDayKey] = useState<string>('Delhi');
  const [cityDayRecords, setCityDayRecords] = useState<CityDayRecord[]>([]);
  const [isLoadingCityDay, setIsLoadingCityDay] = useState<boolean>(false);

  // 1. Load Index Metadata on mount
  useEffect(() => {
    fetchBulletinIndex().then((cities) => {
      setBulletinCities(cities);
    });
    fetchCityDayIndex().then((cities) => {
      setCityDayCities(cities);
    });
  }, []);

  // 2. Load Selected City Bulletin Records
  useEffect(() => {
    if (!selectedCityKey) return;
    setIsLoadingCity(true);
    fetchCityBulletin(selectedCityKey).then((records) => {
      setCityRecords(records);
      setIsLoadingCity(false);
    });
  }, [selectedCityKey]);

  // 3. Load Selected CityDay Records when in city_day mode
  useEffect(() => {
    if (datasetMode !== 'city_day' || !selectedCityDayKey) return;
    setIsLoadingCityDay(true);
    fetchCityDay(selectedCityDayKey).then((records) => {
      setCityDayRecords(records);
      setIsLoadingCityDay(false);
    });
  }, [datasetMode, selectedCityDayKey]);

  // Dynamic Period Statistics derived strictly from real records
  const periodStats = useMemo(() => {
    if (viewMode === 'single') {
      return calculatePeriodStats(cityRecords, singleDate, singleDate);
    }
    return calculatePeriodStats(cityRecords, startDate, endDate);
  }, [cityRecords, viewMode, startDate, endDate, singleDate]);

  // Single Day Exact Record
  const singleDayRecord = useMemo(() => {
    return cityRecords.find((r) => r.d === singleDate) || null;
  }, [cityRecords, singleDate]);

  // Handle Preset Clicks
  const handlePresetClick = (presetId: string, start: string, end: string) => {
    setActivePreset(presetId);
    setStartDate(start);
    setEndDate(end);
    setViewMode('range');
  };

  const currentCityMeta = bulletinCities.find((c) => c.key === selectedCityKey);

  return (
    <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* 1. SECTION HEADER */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant">
          <span onClick={() => onNavigate('today')} className="hover:text-primary cursor-pointer">
            AirCare
          </span>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary font-medium">Past Air Quality Explorer</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-headline font-extrabold text-white tracking-tight">
              Check Past Air Quality
            </h1>
            <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
              Query real historical environmental records across Indian cities. Calculate period averages, analyze seasonal trends, and inspect data completeness.
            </p>
          </div>

          {/* Dataset Switcher Tabs (Separating CPCB Bulletins from Older City-Day Pollutants) */}
          <div className="flex items-center p-1 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-medium self-start md:self-center">
            <button
              onClick={() => setDatasetMode('bulletins')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                datasetMode === 'bulletins'
                  ? 'bg-primary text-on-primary font-bold shadow'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">menu_book</span>
              <span>CPCB Bulletins (2015–2025)</span>
            </button>
            <button
              onClick={() => {
                setDatasetMode('city_day');
                setStartDate('2019-11-01');
                setEndDate('2019-11-30');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                datasetMode === 'city_day'
                  ? 'bg-primary text-on-primary font-bold shadow'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">science</span>
              <span>Multi-Pollutant Chemistry (2015–2020)</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* MODE 1: CPCB DAILY BULLETINS (2015 - 2025) across 297 Indian Cities       */}
      {/* ========================================================================= */}
      {datasetMode === 'bulletins' && (
        <>
          {/* 2. FILTER & QUERY CONTROLS */}
          <section className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5 sm:p-6 space-y-5 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {/* City Selection (5 cols) */}
              <div className="md:col-span-5 space-y-1.5">
                <label className="text-xs font-mono text-outline uppercase font-semibold flex items-center justify-between">
                  <span>Select City ({bulletinCities.length} Available)</span>
                  {currentCityMeta && (
                    <span className="text-[11px] text-secondary font-mono lowercase">
                      {currentCityMeta.valid_records.toLocaleString()} valid days
                    </span>
                  )}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-base text-primary">
                    location_on
                  </span>
                  <select
                    value={selectedCityKey}
                    onChange={(e) => setSelectedCityKey(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-surface-container border border-outline-variant/50 text-sm text-on-surface font-medium focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <optgroup label="Major Metropolitan Cities">
                      <option value="Delhi">Delhi (3,873 days: 2015–2025)</option>
                      <option value="Mumbai">Mumbai (3,614 days: 2015–2025)</option>
                      <option value="Bengaluru">Bengaluru (3,850 days: 2015–2025)</option>
                      <option value="Kolkata">Kolkata (3,240 days: 2016–2025)</option>
                      <option value="Chennai">Chennai (3,805 days: 2015–2025)</option>
                      <option value="Hyderabad">Hyderabad (3,862 days: 2015–2025)</option>
                      <option value="Ahmedabad">Ahmedabad (3,268 days: 2015–2025)</option>
                      <option value="Pune">Pune (3,448 days: 2015–2025)</option>
                      <option value="Lucknow">Lucknow (3,786 days: 2015–2025)</option>
                      <option value="Amritsar">Amritsar (2,929 days: 2017–2025)</option>
                      <option value="Patna">Patna (3,320 days: 2015–2025)</option>
                      <option value="Jaipur">Jaipur (3,450 days: 2015–2025)</option>
                      <option value="Chandigarh">Chandigarh (2,286 days: 2019–2025)</option>
                    </optgroup>
                    <optgroup label="All Available CPCB Monitoring Cities">
                      {bulletinCities.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.city} ({c.valid_records} records, {c.min_date.slice(0, 4)}–{c.max_date.slice(0, 4)})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Mode Switch: Range vs Single Date (3 cols) */}
              <div className="md:col-span-3 space-y-1.5">
                <label className="text-xs font-mono text-outline uppercase font-semibold">
                  Lookup Mode
                </label>
                <div className="flex items-center p-1 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-medium h-10">
                  <button
                    onClick={() => setViewMode('range')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                      viewMode === 'range' ? 'bg-primary text-on-primary font-bold shadow' : 'text-on-surface-variant hover:text-white'
                    }`}
                  >
                    Date Range
                  </button>
                  <button
                    onClick={() => setViewMode('single')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                      viewMode === 'single' ? 'bg-primary text-on-primary font-bold shadow' : 'text-on-surface-variant hover:text-white'
                    }`}
                  >
                    Single Day
                  </button>
                </div>
              </div>

              {/* Date Pickers (4 cols) */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-mono text-outline uppercase font-semibold">
                  {viewMode === 'single' ? 'Select Exact Date' : 'Select Date Range'}
                </label>
                {viewMode === 'single' ? (
                  <input
                    type="date"
                    value={singleDate}
                    min="2015-05-01"
                    max="2025-12-31"
                    onChange={(e) => {
                      setSingleDate(e.target.value);
                      setActivePreset('');
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/50 text-sm text-on-surface font-mono focus:outline-none focus:border-primary h-10"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={startDate}
                      min="2015-05-01"
                      max="2025-12-31"
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setActivePreset('');
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-surface-container border border-outline-variant/50 text-xs text-on-surface font-mono focus:outline-none focus:border-primary h-10"
                    />
                    <span className="text-outline text-xs font-mono">to</span>
                    <input
                      type="date"
                      value={endDate}
                      min="2015-05-01"
                      max="2025-12-31"
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setActivePreset('');
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-surface-container border border-outline-variant/50 text-xs text-on-surface font-mono focus:outline-none focus:border-primary h-10"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Quick Presets */}
            {viewMode === 'range' && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-outline-variant/20 text-xs">
                <span className="text-outline font-medium">Seasonal Presets:</span>
                {PRESET_OPTIONS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handlePresetClick(p.id, p.start, p.end)}
                    className={`px-2.5 py-1 rounded-lg border text-xs transition-colors ${
                      activePreset === p.id
                        ? 'bg-secondary/15 text-secondary border-secondary/40 font-semibold'
                        : 'bg-surface-container text-on-surface-variant hover:text-white border-outline-variant/30'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* 3. RESULTS DISPLAY CARD */}
          <section className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline-variant/20">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-headline font-bold text-white">
                    {currentCityMeta?.city || selectedCityKey} Air Quality Records
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-primary/10 text-primary border border-primary/20">
                    CPCB Daily Bulletin
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Period: {viewMode === 'single' ? singleDate : `${periodStats.startDate} to ${periodStats.endDate}`} • {periodStats.availableDays} records found
                </p>
              </div>

              <button
                onClick={() => onNavigate('compare')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant text-xs text-on-surface font-medium transition-colors self-start sm:self-center"
              >
                <span className="material-symbols-outlined text-sm">compare_arrows</span>
                <span>Compare with Another City</span>
              </button>
            </div>

            {/* Loading Indicator */}
            {isLoadingCity ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-mono text-outline">Loading official historical records...</p>
              </div>
            ) : viewMode === 'single' ? (
              /* SINGLE DAY CARD */
              <div className="space-y-6">
                {singleDayRecord && singleDayRecord.aqi !== null ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Main AQI Value Card */}
                    <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant/30 text-center space-y-2">
                      <span className="text-xs font-mono uppercase text-outline">Recorded Daily AQI</span>
                      <div
                        className="text-5xl font-headline font-extrabold tracking-tight"
                        style={{ color: getCategoryColor(singleDayRecord.cat).hex }}
                      >
                        {singleDayRecord.aqi}
                      </div>
                      <div className="inline-block px-3 py-1 rounded-full text-xs font-bold border"
                        style={{
                          backgroundColor: `${getCategoryColor(singleDayRecord.cat).hex}20`,
                          color: getCategoryColor(singleDayRecord.cat).hex,
                          borderColor: `${getCategoryColor(singleDayRecord.cat).hex}40`,
                        }}
                      >
                        {singleDayRecord.cat}
                      </div>
                      <p className="text-xs text-outline pt-2">
                        Published in CPCB 4 PM Daily Bulletin on {singleDayRecord.d}
                      </p>
                    </div>

                    {/* Operational Station Details */}
                    <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-xs font-mono uppercase text-outline">Station Network &amp; Pollutants</span>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="material-symbols-outlined text-secondary text-2xl">sensors</span>
                          <span className="text-2xl font-headline font-bold text-white">
                            {singleDayRecord.stn > 0 ? `${singleDayRecord.stn} Active Stations` : 'Network Average'}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant">
                          Prominent Pollutant(s):{' '}
                          <strong className="text-white">{singleDayRecord.poll || 'Not Reported'}</strong>
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs text-outline">
                        CPCB standard arithmetic 24-hr averaging protocol applied across all active continuous monitoring stations.
                      </div>
                    </div>

                    {/* Category Consistency Audit */}
                    <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-3 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <span className="text-xs font-mono uppercase text-outline">CPCB Classification Audit</span>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="material-symbols-outlined text-primary text-xl">verified</span>
                          <span className="text-sm font-headline font-bold text-white">
                            {singleDayRecord.incon ? 'Category Boundary Shift' : 'Consistent with CPCB Formula'}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          {singleDayRecord.incon ? (
                            <>
                              Official bulletin recorded category is <strong className="text-amber-400">{singleDayRecord.cat}</strong>, whereas standard formula boundary ({getExpectedCategory(singleDayRecord.aqi)}) differs. AirCare preserves the exact government bulletin category.
                            </>
                          ) : (
                            <>
                              Recorded category (<strong className="text-primary">{singleDayRecord.cat}</strong>) matches strict mathematical CPCB bounds [0–50 Good, 51–100 Satisfactory, 101–200 Moderate, 201–300 Poor, 301–400 Very Poor, 401+ Severe].
                            </>
                          )}
                        </p>
                      </div>

                      <div className="text-[11px] font-mono text-outline">
                        Dataset Source: Central Pollution Control Board (CPCB)
                      </div>
                    </div>
                  </div>
                ) : (
                  /* MISSING DAY NOTIFICATION (NEVER TREAT AS 0) */
                  <div className="p-8 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-3">
                    <span className="material-symbols-outlined text-amber-400 text-4xl">event_busy</span>
                    <h3 className="text-lg font-headline font-bold text-white">
                      No Official CPCB Bulletin Record on {singleDate}
                    </h3>
                    <p className="text-xs text-on-surface-variant max-w-lg mx-auto leading-relaxed">
                      The Central Pollution Control Board did not publish an official bulletin reading for {currentCityMeta?.city || selectedCityKey} on this date. In accordance with data integrity guidelines, AirCare does <strong>not</strong> invent a number or treat missing air quality as zero.
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container text-xs font-mono text-amber-300">
                      <span>Historical Record Integrity: Preserved as Missing Observation</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* DATE RANGE METRIC BENTO GRID (CALCULATED FROM REAL DATA) */
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Metric 1: Period Average */}
                  <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 space-y-1">
                    <span className="text-[11px] font-mono uppercase text-outline">Period Average AQI</span>
                    <div className="flex items-baseline gap-2">
                      <span
                        className="text-3xl font-headline font-bold"
                        style={{ color: getCategoryColor(periodStats.periodCategory).hex }}
                      >
                        {periodStats.periodAverage !== null ? periodStats.periodAverage : 'N/A'}
                      </span>
                      <span
                        className="text-xs font-semibold"
                        style={{ color: getCategoryColor(periodStats.periodCategory).hex }}
                      >
                        {periodStats.periodCategory}
                      </span>
                    </div>
                    <p className="text-[11px] text-outline">
                      Calculated across {periodStats.availableDays} recorded days
                    </p>
                  </div>

                  {/* Metric 2: Peak Spike */}
                  <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 space-y-1">
                    <span className="text-[11px] font-mono uppercase text-outline">Peak Daily Spike</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-headline font-bold text-error">
                        {periodStats.peakRecord ? periodStats.peakRecord.aqi : 'N/A'}
                      </span>
                      <span className="text-xs text-error font-mono">
                        {periodStats.peakRecord?.cat || ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-outline">
                      {periodStats.peakRecord ? `Recorded on ${periodStats.peakRecord.d}` : 'No records'}
                    </p>
                  </div>

                  {/* Metric 3: Cleanest Day */}
                  <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 space-y-1">
                    <span className="text-[11px] font-mono uppercase text-outline">Cleanest Recorded Day</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-headline font-bold text-primary">
                        {periodStats.cleanestRecord ? periodStats.cleanestRecord.aqi : 'N/A'}
                      </span>
                      <span className="text-xs text-primary font-mono">
                        {periodStats.cleanestRecord?.cat || ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-outline">
                      {periodStats.cleanestRecord ? `Recorded on ${periodStats.cleanestRecord.d}` : 'No records'}
                    </p>
                  </div>

                  {/* Metric 4: Record Completeness */}
                  <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 space-y-1">
                    <span className="text-[11px] font-mono uppercase text-outline">Record Completeness</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-headline font-bold text-secondary">
                        {periodStats.completenessPercent}%
                      </span>
                      <span className="text-xs text-secondary font-mono">
                        {periodStats.availableDays} / {periodStats.totalCalendarDays} Days
                      </span>
                    </div>
                    <p className="text-[11px] text-outline">
                      {periodStats.missingDaysCount === 0
                        ? '100% complete — zero missing days'
                        : `${periodStats.missingDaysCount} unreleased bulletin days`}
                    </p>
                  </div>
                </div>

                {/* REAL HISTORICAL TIME-SERIES SVG CHART */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono gap-1">
                    <span className="font-headline font-semibold text-white">
                      Daily AQI Trajectory ({periodStats.recordsInRange.length} Data Points)
                    </span>
                    <span className="text-outline">
                      Hover points for exact daily bulletin details
                    </span>
                  </div>

                  <div className="relative w-full h-72 bg-surface-container-lowest/90 rounded-xl p-4 border border-outline-variant/30 overflow-hidden">
                    {periodStats.recordsInRange.length > 0 ? (
                      (() => {
                        const records = periodStats.recordsInRange;
                        const maxVal = Math.max(500, ...records.map((r) => r.aqi || 0));
                        const svgWidth = 1000;
                        const svgHeight = 220;
                        const paddingX = 40;
                        const paddingTop = 20;
                        const paddingBottom = 30;
                        const usableHeight = svgHeight - paddingTop - paddingBottom;
                        const usableWidth = svgWidth - paddingX * 2;

                        const getY = (val: number) => {
                          const clamped = Math.min(maxVal, Math.max(0, val));
                          return paddingTop + usableHeight - (clamped / maxVal) * usableHeight;
                        };

                        const getX = (index: number) => {
                          if (records.length === 1) return paddingX + usableWidth / 2;
                          return paddingX + (index / (records.length - 1)) * usableWidth;
                        };

                        // Build SVG path
                        const points = records.map((r, i) => ({
                          x: getX(i),
                          y: r.aqi !== null ? getY(r.aqi) : null,
                          record: r,
                        }));

                        // Filter out points where aqi is null for path drawing
                        const validPoints = points.filter((p) => p.y !== null) as {
                          x: number;
                          y: number;
                          record: BulletinRecord;
                        }[];

                        const pathData =
                          validPoints.length > 0
                            ? validPoints.reduce(
                                (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
                                ''
                              )
                            : '';

                        return (
                          <svg className="w-full h-full" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
                            {/* Threshold Reference Lines */}
                            <line x1={paddingX} x2={svgWidth - paddingX} y1={getY(400)} y2={getY(400)} stroke="#EF4444" strokeDasharray="3 3" strokeOpacity="0.3" strokeWidth="1" />
                            <text x={paddingX + 5} y={getY(400) - 4} fill="#EF4444" fontSize="9" fontFamily="monospace">400 Severe</text>

                            <line x1={paddingX} x2={svgWidth - paddingX} y1={getY(300)} y2={getY(300)} stroke="#F97316" strokeDasharray="3 3" strokeOpacity="0.25" strokeWidth="1" />
                            <text x={paddingX + 5} y={getY(300) - 4} fill="#F97316" fontSize="9" fontFamily="monospace">300 Very Poor</text>

                            <line x1={paddingX} x2={svgWidth - paddingX} y1={getY(200)} y2={getY(200)} stroke="#EAB308" strokeDasharray="3 3" strokeOpacity="0.2" strokeWidth="1" />
                            <text x={paddingX + 5} y={getY(200) - 4} fill="#EAB308" fontSize="9" fontFamily="monospace">200 Moderate</text>

                            <line x1={paddingX} x2={svgWidth - paddingX} y1={getY(100)} y2={getY(100)} stroke="#14B8A6" strokeDasharray="3 3" strokeOpacity="0.2" strokeWidth="1" />
                            <text x={paddingX + 5} y={getY(100) - 4} fill="#14B8A6" fontSize="9" fontFamily="monospace">100 Satisfactory</text>

                            {/* Data Line Path */}
                            {pathData && (
                              <path
                                d={pathData}
                                fill="none"
                                stroke="#4fdbc8"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )}

                            {/* Individual Day Nodes */}
                            {validPoints.map((p, idx) => {
                              const isHovered = hoveredRecord?.d === p.record.d;
                              const col = getCategoryColor(p.record.cat).hex;
                              return (
                                <circle
                                  key={idx}
                                  cx={p.x}
                                  cy={p.y}
                                  r={isHovered ? 6 : records.length > 40 ? 2.5 : 4}
                                  fill={col}
                                  stroke="#0a1228"
                                  strokeWidth={isHovered ? 2.5 : 1.5}
                                  className="cursor-pointer transition-all"
                                  onMouseEnter={() => setHoveredRecord(p.record)}
                                />
                              );
                            })}
                          </svg>
                        );
                      })()
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs font-mono text-outline">
                        No records recorded for this city in the selected date range.
                      </div>
                    )}

                    {/* Timeline Bounds */}
                    <div className="absolute bottom-1 inset-x-0 flex justify-between px-6 text-[10px] font-mono text-outline pointer-events-none">
                      <span>{periodStats.startDate}</span>
                      <span>Mid-Period</span>
                      <span>{periodStats.endDate}</span>
                    </div>

                    {/* Interactive Tooltip Card */}
                    {hoveredRecord && (
                      <div className="absolute top-3 right-3 bg-surface-container/95 border border-primary/40 rounded-xl p-3 shadow-2xl backdrop-blur text-xs space-y-1 pointer-events-none z-10">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-mono text-white font-bold">{hoveredRecord.d}</span>
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{
                              backgroundColor: `${getCategoryColor(hoveredRecord.cat).hex}25`,
                              color: getCategoryColor(hoveredRecord.cat).hex,
                            }}
                          >
                            {hoveredRecord.cat}
                          </span>
                        </div>
                        <div className="text-xl font-headline font-extrabold text-white">
                          AQI: {hoveredRecord.aqi}
                        </div>
                        <div className="text-[11px] text-on-surface-variant">
                          Prominent: {hoveredRecord.poll || 'N/A'} • {hoveredRecord.stn} Stn
                        </div>
                        {hoveredRecord.incon && (
                          <div className="text-[10px] text-amber-300 font-mono">
                            *CPCB recorded boundary shift
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* CATEGORY DISTRIBUTION & PROMINENT POLLUTANTS ROW */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Breakdown */}
                  <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 space-y-3">
                    <span className="text-xs font-mono uppercase text-outline font-semibold">
                      Category Distribution in Period
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(periodStats.categoryDistribution).map(([cat, count]) => {
                        const pct =
                          periodStats.availableDays > 0
                            ? Math.round((count / periodStats.availableDays) * 100)
                            : 0;
                        const col = getCategoryColor(cat);
                        return (
                          <div
                            key={cat}
                            className={`p-2.5 rounded-lg border ${col.border} ${col.bg} flex flex-col justify-between`}
                          >
                            <span className="text-[11px] font-medium text-white">{cat}</span>
                            <div className="flex items-baseline justify-between mt-1">
                              <span className={`text-base font-bold ${col.text}`}>{count}d</span>
                              <span className="text-[10px] font-mono text-outline">{pct}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dominant Reported Pollutants */}
                  <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 space-y-3">
                    <span className="text-xs font-mono uppercase text-outline font-semibold">
                      Prominent Reported Pollutants
                    </span>
                    <div className="space-y-2">
                      {periodStats.dominantPollutants.slice(0, 4).map((item) => {
                        const pct =
                          periodStats.availableDays > 0
                            ? Math.round((item.count / periodStats.availableDays) * 100)
                            : 0;
                        return (
                          <div key={item.pollutant} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-bold text-white">{item.pollutant}</span>
                              <span className="text-outline font-mono">
                                {item.count} days ({pct}%)
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${Math.min(100, pct)}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* TRANSPARENT CATEGORY INCONSISTENCY CALLOUT (Requirement 8) */}
                {periodStats.inconsistentRecords.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs leading-relaxed">
                    <span className="material-symbols-outlined text-amber-400 text-lg shrink-0 mt-0.5">
                      fact_check
                    </span>
                    <div>
                      <h4 className="font-headline font-bold text-white">
                        Official CPCB Category Boundary Notice ({periodStats.inconsistentRecords.length} Day(s))
                      </h4>
                      <p className="text-on-surface-variant mt-0.5">
                        In {periodStats.inconsistentRecords.length} record(s) within this range (e.g.{' '}
                        {periodStats.inconsistentRecords
                          .slice(0, 2)
                          .map((r) => `${r.d}: AQI ${r.aqi} reported as '${r.cat}'`)
                          .join(', ')}
                        ), the official bulletin published a category differing from the strict mathematical formula. In strict adherence to academic rigor, AirCare displays the official published category without alteration.
                      </p>
                    </div>
                  </div>
                )}

                {/* HONEST MISSING DATA DISCLOSURE (Requirement 6) */}
                {periodStats.missingDaysCount > 0 && (
                  <div className="p-4 rounded-xl bg-surface-container border border-secondary/20 flex items-start gap-3 text-xs leading-relaxed">
                    <span className="material-symbols-outlined text-secondary text-lg shrink-0 mt-0.5">
                      info
                    </span>
                    <div>
                      <h4 className="font-headline font-bold text-white">
                        Missing Observation Transparency ({periodStats.missingDaysCount} Unreleased Bulletin Day(s))
                      </h4>
                      <p className="text-on-surface-variant mt-0.5">
                        The CPCB did not release daily bulletins for {currentCityMeta?.city || selectedCityKey} on {periodStats.missingDaysCount} calendar day(s) during this range (dates:{' '}
                        {periodStats.missingDates.slice(0, 5).join(', ')}
                        {periodStats.missingDates.length > 5 ? `, +${periodStats.missingDates.length - 5} more` : ''}
                        ). These days are excluded from the period average rather than treated as zero or imputed.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: MULTI-POLLUTANT CHEMISTRY (2015 - 2020) across 26 Indian Cities   */}
      {/* ========================================================================= */}
      {datasetMode === 'city_day' && (
        <section className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline-variant/20">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-headline font-bold text-white">
                  Historical Chemical Pollutant Concentrations
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-secondary/15 text-secondary border border-secondary/30">
                  Older Multi-Pollutant Dataset (2015–2020)
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Exact microgram concentrations (μg/m³) for PM2.5, PM10, NO2, SO2, and CO across 26 major cities.
              </p>
            </div>

            <div className="w-full sm:w-64">
              <label className="text-[11px] font-mono text-outline uppercase block mb-1">
                Select from 26 Cities
              </label>
              <select
                value={selectedCityDayKey}
                onChange={(e) => setSelectedCityDayKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/50 text-sm text-white focus:outline-none focus:border-primary cursor-pointer"
              >
                {cityDayCities.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.city} ({c.total_records} records, avg AQI: {c.avg_aqi})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoadingCityDay ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-mono text-outline">Loading multi-pollutant dataset...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Dataset Scope Info Box */}
              <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex items-start gap-3 text-xs leading-relaxed">
                <span className="material-symbols-outlined text-primary text-xl shrink-0 mt-0.5">
                  history_edu
                </span>
                <div>
                  <h3 className="font-headline font-bold text-white">
                    Different Scope &amp; Purpose from Bulletin Dataset
                  </h3>
                  <p className="text-on-surface-variant mt-0.5">
                    This dataset covers January 2015 to July 2020 and includes specific chemical pollutant measurements (PM2.5, PM10, NO2, SO2, CO) rather than just index numbers. As documented in our audit report, extreme readings (such as PM10 sensor saturations and AQI &gt; 500) were flagged for academic review rather than blindly removed.
                  </p>
                </div>
              </div>

              {/* Sample Records Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-outline-variant/30 rounded-xl overflow-hidden">
                  <thead className="bg-surface-container font-mono text-outline uppercase text-[11px]">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">AQI</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">PM2.5 (μg/m³)</th>
                      <th className="p-3">PM10 (μg/m³)</th>
                      <th className="p-3">NO2 (μg/m³)</th>
                      <th className="p-3">SO2 (μg/m³)</th>
                      <th className="p-3">CO (mg/m³)</th>
                      <th className="p-3">Audit Flags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20 font-mono">
                    {cityDayRecords.slice(-15).map((row, idx) => (
                      <tr key={idx} className="hover:bg-surface-container/50">
                        <td className="p-3 text-white font-bold">{row.d}</td>
                        <td className="p-3" style={{ color: getCategoryColor(row.cat).hex }}>
                          {row.aqi !== null ? row.aqi : '—'}
                        </td>
                        <td className="p-3">{row.cat}</td>
                        <td className="p-3 text-on-surface-variant">{row.pm25 !== null ? row.pm25 : '—'}</td>
                        <td className="p-3 text-on-surface-variant">{row.pm10 !== null ? row.pm10 : '—'}</td>
                        <td className="p-3 text-on-surface-variant">{row.no2 !== null ? row.no2 : '—'}</td>
                        <td className="p-3 text-on-surface-variant">{row.so2 !== null ? row.so2 : '—'}</td>
                        <td className="p-3 text-on-surface-variant">{row.co !== null ? row.co : '—'}</td>
                        <td className="p-3">
                          {row.flag_aqi_500 || row.flag_pm10_cap || row.flag_pm25_ext || row.flag_co_ext ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              Flagged
                            </span>
                          ) : (
                            <span className="text-outline text-[10px]">Normal</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-outline font-mono text-right">
                Showing latest 15 records of {cityDayRecords.length} total entries for {selectedCityDayKey}
              </p>
            </div>
          )}
        </section>
      )}
    </main>
  );
};
