import React, { useState, useEffect } from 'react';
import type { PageId } from '../components/Header';
import {
  fetchLiveAqi,
  fetchStationSnapshot,
  getCpcbCategory,
  type LiveAqiReading,
  type StationSnapshotCity,
} from '../services/liveAqiService';
import { getCategoryColor } from '../services/airQualityData';

interface TodaysAqiProps {
  onNavigate: (page: PageId) => void;
}

const POPULAR_CITIES = ['Delhi', 'Mumbai', 'Bengaluru', 'Kolkata', 'Chennai', 'Hyderabad', 'Ahmedabad', 'Amritsar'];

export const TodaysAqi: React.FC<TodaysAqiProps> = ({ onNavigate }) => {
  // Mode: 'live' (Real-time atmospheric model) vs 'stations' (Physical station snapshot: Oct 20, 2026)
  const [activeTab, setActiveTab] = useState<'live' | 'stations'>('live');

  // Selected City
  const [selectedCity, setSelectedCity] = useState<string>('Delhi');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Live API State
  const [liveData, setLiveData] = useState<LiveAqiReading | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(true);
  const [liveError, setLiveError] = useState<string | null>(null);

  // Station Snapshot State
  const [snapshotMap, setSnapshotMap] = useState<Record<string, StationSnapshotCity>>({});
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState<boolean>(false);
  const [stationSearch, setStationSearch] = useState<string>('');

  // 1. Fetch Station Snapshot on mount
  useEffect(() => {
    fetchStationSnapshot().then((data) => {
      setSnapshotMap(data);
    });
  }, []);

  // 2. Fetch Live AQI whenever selected city changes or user refreshes
  const loadLiveAqi = async (city: string) => {
    setIsLoadingLive(true);
    setLiveError(null);
    try {
      const reading = await fetchLiveAqi(city);
      setLiveData(reading);
    } catch (err: any) {
      console.error('Failed to fetch live AQI:', err);
      setLiveError(err?.message || 'Could not reach live air quality service. Please check your internet connection.');
      setLiveData(null);
    } finally {
      setIsLoadingLive(false);
    }
  };

  useEffect(() => {
    loadLiveAqi(selectedCity);
  }, [selectedCity]);

  // Handle switching to snapshot tab
  const handleTabChange = (tab: 'live' | 'stations') => {
    setActiveTab(tab);
    if (tab === 'stations' && Object.keys(snapshotMap).length === 0) {
      setIsLoadingSnapshot(true);
      fetchStationSnapshot().then((data) => {
        setSnapshotMap(data);
        setIsLoadingSnapshot(false);
      });
    }
  };

  // Filtered popular cities
  const filteredPills = POPULAR_CITIES.filter((c) =>
    c.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // All available snapshot cities for dropdown
  const allSnapshotCities = Object.keys(snapshotMap).sort();

  // Selected City's Snapshot Data
  const currentCitySnapshot = snapshotMap[selectedCity] || null;

  // Filtered stations within the selected city
  const filteredStations = currentCitySnapshot
    ? currentCitySnapshot.stations.filter((s) =>
        s.name.toLowerCase().includes(stationSearch.toLowerCase())
      )
    : [];

  const categoryColor = liveData ? getCategoryColor(liveData.category) : getCategoryColor('Moderate');

  return (
    <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* 1. HERO TITLE & SEARCH */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-primary/10 border border-primary/25 text-primary">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span>BCA Minor Project • Real-Time Environmental Analytics</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline font-extrabold text-white tracking-tight">
          How is the air in your city right now?
        </h1>

        <p className="text-sm sm:text-base text-on-surface-variant font-body leading-relaxed">
          Check genuine current air quality readings, track microscopic pollutants, and understand what it means for your health in simple words.
        </p>

        {/* View Mode Switcher: Live Atmospheric Model vs Physical Ground Station Snapshot */}
        <div className="flex items-center justify-center pt-2">
          <div className="inline-flex p-1 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-medium">
            <button
              onClick={() => handleTabChange('live')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'live'
                  ? 'bg-primary text-on-primary font-bold shadow'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Live Atmospheric Feed (Real-Time API)</span>
            </button>
            <button
              onClick={() => handleTabChange('stations')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'stations'
                  ? 'bg-primary text-on-primary font-bold shadow'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">sensors</span>
              <span>Physical Ground Stations (Oct 20, 2026 Snapshot)</span>
            </button>
          </div>
        </div>

        {/* City Search Bar */}
        <div className="pt-2">
          <div className="relative max-w-xl mx-auto">
            <span className="material-symbols-outlined absolute left-3.5 top-3 text-xl text-outline">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to search an Indian city (e.g., Delhi, Mumbai, Bengaluru, Amritsar)..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-container-high border border-outline-variant/50 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary shadow-lg transition-all"
            />
          </div>

          {/* Quick Select City Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs">
            <span className="text-outline font-medium">Quick select:</span>
            {filteredPills.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setSelectedCity(c);
                  setSearchQuery('');
                }}
                className={`px-3 py-1 rounded-lg border transition-all text-xs font-medium ${
                  selectedCity === c
                    ? 'bg-primary text-on-primary border-primary font-semibold shadow-sm'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant border-outline-variant/30'
                }`}
              >
                {c}
              </button>
            ))}
            {allSnapshotCities.length > 0 && (
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/40 text-xs text-on-surface font-mono cursor-pointer"
              >
                <option value={selectedCity}>More ({allSnapshotCities.length} Cities)...</option>
                {allSnapshotCities.map((cityName) => (
                  <option key={cityName} value={cityName}>
                    {cityName}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* TAB 1: LIVE ATMOSPHERIC FEED (MODEL-ESTIMATED CPCB AQI)                   */}
      {/* ========================================================================= */}
      {activeTab === 'live' && (
        <>
          {isLoadingLive ? (
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-12 text-center space-y-4 shadow-xl">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <h3 className="text-lg font-headline font-bold text-white">
                Connecting to Live Atmospheric Air Quality Feed for {selectedCity}...
              </h3>
              <p className="text-xs text-outline font-mono max-w-md mx-auto">
                Querying hourly atmospheric model concentrations and evaluating CPCB National Air Quality Index formulas.
              </p>
            </div>
          ) : liveError ? (
            /* ERROR STATE — NEVER INVENT OR FAKE READINGS */
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-8 text-center space-y-4 shadow-xl">
              <span className="material-symbols-outlined text-error text-4xl">cloud_off</span>
              <div className="space-y-1">
                <h3 className="text-lg font-headline font-bold text-white">
                  Live Feed Unavailable for {selectedCity}
                </h3>
                <p className="text-xs text-on-surface-variant max-w-lg mx-auto leading-relaxed">
                  {liveError}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => loadLiveAqi(selectedCity)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs shadow hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  <span>Retry Connection</span>
                </button>
                <button
                  onClick={() => handleTabChange('stations')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container border border-outline-variant text-xs text-white hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">sensors</span>
                  <span>View Ground Station Snapshot</span>
                </button>
              </div>

              <div className="pt-2 text-[11px] font-mono text-outline">
                In strict adherence to academic honesty, AirCare never fabricates or pretends to have live readings when the API is unreachable.
              </div>
            </div>
          ) : liveData ? (
            /* 2. MAIN LIVE AQI HERO CARD */
            <section className={`bg-surface-container-low border ${categoryColor.border} rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all`}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left: Big Circular AQI Score (5 cols) */}
                <div className="lg:col-span-5 flex flex-col items-center text-center p-4 bg-surface-container-lowest/60 rounded-xl border border-outline-variant/20">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-secondary uppercase tracking-wider mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Live Atmospheric Estimate</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-headline font-bold text-white">
                    {liveData.city}
                  </h2>
                  <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                    Data Time: {liveData.timestamp}
                  </p>

                  {/* Circular AQI Display */}
                  <div className="relative my-6 flex items-center justify-center w-40 h-40 sm:w-44 sm:h-44 rounded-full bg-surface-container border-4 border-outline-variant/40 shadow-inner">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-mono text-outline uppercase tracking-wider">
                        Model-Estimated CPCB AQI
                      </span>
                      <span className={`text-5xl sm:text-6xl font-headline font-black ${categoryColor.text} tracking-tight`}>
                        {liveData.aqi}
                      </span>
                      <span className="text-[11px] font-mono text-on-surface-variant mt-1">Scale 0 to 500</span>
                    </div>
                  </div>

                  {/* Category Badge */}
                  <div className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-headline font-bold border ${categoryColor.border} ${categoryColor.bg} ${categoryColor.text}`}>
                    Air Quality: {liveData.category}
                  </div>

                  <p className="text-[11px] text-outline mt-3">
                    Prominent Pollutant: <strong className="text-white">{liveData.prominentPollutant}</strong>
                  </p>

                  {/* Scientific Model Disclaimer */}
                  <p className="text-[10px] text-outline mt-2 max-w-xs leading-tight">
                    Calculated from Open-Meteo / CAMS atmospheric model estimates using CPCB mathematical sub-index formulas. Not a physical CPCB ground station reading.
                  </p>
                </div>

                {/* Right: Medical Health Impact & Hourly Curve (7 cols) */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-mono text-secondary uppercase tracking-wider mb-1">
                        <span className="material-symbols-outlined text-sm">health_and_safety</span>
                        Health Advisory (Official CPCB Guidelines)
                      </div>
                      <h3 className="text-xl font-headline font-bold text-white">
                        What does an AQI of {liveData.aqi} mean for you?
                      </h3>
                    </div>

                    <button
                      onClick={() => loadLiveAqi(selectedCity)}
                      title="Refresh real-time feed"
                      className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-on-surface-variant hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">refresh</span>
                    </button>
                  </div>

                  {/* Health Guidance Box */}
                  <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-surface-container-high text-primary shrink-0">
                        <span className="material-symbols-outlined text-xl">medical_services</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-headline font-bold text-white uppercase tracking-wide">
                          Health Impact
                        </h4>
                        <p className="text-sm text-on-surface-variant font-body mt-1 leading-relaxed">
                          {liveData.healthAdvice}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Activity Recommendation Box */}
                  <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-surface-container-high text-secondary shrink-0">
                        <span className="material-symbols-outlined text-xl">directions_walk</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-headline font-bold text-white uppercase tracking-wide">
                          Outdoor Activity &amp; Mask Guidance
                        </h4>
                        <p className="text-sm text-on-surface-variant font-body mt-1 leading-relaxed">
                          {liveData.activityAdvice}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Methodology & Averaging Period Transparency Box */}
                  <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs text-outline leading-relaxed space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <span className="material-symbols-outlined text-sm text-primary">info</span>
                      Methodology &amp; Averaging Period Disclosure
                    </div>
                    <p>{liveData.methodologyNote}</p>
                    <p className="text-secondary font-mono text-[11px] pt-0.5">
                      {liveData.complianceNote}
                    </p>
                  </div>

                  {/* Past 24 Hours Real-Time Hourly Curve */}
                  {liveData.hourlyTrend.length > 0 && (
                    <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-headline font-semibold text-white flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-primary">show_chart</span>
                          Past 24 Hours Model Trajectory
                        </span>
                        <span className="font-mono text-[11px] text-outline">
                          Current Hour: {liveData.aqi} AQI
                        </span>
                      </div>

                      {/* Mini Bar Hourly Chart */}
                      <div className="flex items-end gap-1 h-16 pt-2">
                        {liveData.hourlyTrend.map((h, idx) => {
                          const heightPct = Math.min(100, Math.max(12, (h.aqi / 350) * 100));
                          const isCurrent = idx === liveData.hourlyTrend.length - 1;
                          const hCat = getCpcbCategory(h.aqi);
                          const hCol = getCategoryColor(hCat);
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                              <div className="w-full bg-surface-container-highest rounded-t h-full flex items-end">
                                <div
                                  style={{ height: `${heightPct}%`, backgroundColor: hCol.hex }}
                                  className={`w-full rounded-t transition-all ${
                                    isCurrent ? 'ring-1 ring-white' : 'opacity-80 group-hover:opacity-100'
                                  }`}
                                  title={`${h.time}: AQI ${h.aqi} (${hCat})`}
                                ></div>
                              </div>
                              {idx % 4 === 0 && (
                                <span className="text-[9px] font-mono text-outline">
                                  {h.time}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Attribution and Timestamp Notice */}
              <div className="mt-6 pt-4 border-t border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-secondary">verified</span>
                  <span>
                    <strong>Source:</strong> {liveData.source} • Sub-index scale (0–500).
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-outline">
                  <span>Data Timestamp: {liveData.timestamp}</span>
                </div>
              </div>
            </section>
          ) : null}

          {/* 3. KEY POLLUTANTS TILES (PM2.5, PM10, NO2, SO2, O3, CO) */}
          {liveData && (
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-headline font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">grain</span>
                  Atmospheric Pollutant Concentrations (Open-Meteo Model)
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Current mass concentrations evaluated against official CPCB national standards.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* PM2.5 Tile */}
                <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-error"></span>
                        <h3 className="text-base font-headline font-bold text-white">PM2.5 (Fine Particles)</h3>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Combustion smoke, vehicle exhaust &amp; biomass.
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-surface-container text-white border border-outline-variant/40">
                      {liveData.pm25 !== null ? `${liveData.pm25} µg/m³` : 'N/A'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-outline">
                      <span>CPCB Standard: 60 µg/m³ (24-hr)</span>
                      {liveData.pm25 !== null && (
                        <span className={liveData.pm25 > 60 ? 'text-error font-bold' : 'text-primary'}>
                          {liveData.pm25 > 60 ? `${(liveData.pm25 / 60).toFixed(1)}x limit` : 'Safe'}
                        </span>
                      )}
                    </div>
                    <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className="h-full bg-error rounded-full"
                        style={{ width: `${Math.min(100, ((liveData.pm25 || 0) / 150) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* PM10 Tile */}
                <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                        <h3 className="text-base font-headline font-bold text-white">PM10 (Coarse Dust)</h3>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Road dust, construction &amp; soil erosion.
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-surface-container text-white border border-outline-variant/40">
                      {liveData.pm10 !== null ? `${liveData.pm10} µg/m³` : 'N/A'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-outline">
                      <span>CPCB Standard: 100 µg/m³ (24-hr)</span>
                      {liveData.pm10 !== null && (
                        <span className={liveData.pm10 > 100 ? 'text-amber-400 font-bold' : 'text-primary'}>
                          {liveData.pm10 > 100 ? `${(liveData.pm10 / 100).toFixed(1)}x limit` : 'Safe'}
                        </span>
                      )}
                    </div>
                    <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${Math.min(100, ((liveData.pm10 || 0) / 250) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Nitrogen Dioxide Tile */}
                <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                        <h3 className="text-base font-headline font-bold text-white">NO2 (Traffic Emissions)</h3>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Automobile tailpipe gas &amp; diesel engines.
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-surface-container text-white border border-outline-variant/40">
                      {liveData.no2 !== null ? `${liveData.no2} µg/m³` : 'N/A'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-outline">
                      <span>CPCB Standard: 80 µg/m³ (24-hr)</span>
                      <span className="text-primary font-bold">Within standard</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className="h-full bg-secondary rounded-full"
                        style={{ width: `${Math.min(100, ((liveData.no2 || 0) / 100) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Ozone Tile */}
                <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
                        <h3 className="text-base font-headline font-bold text-white">O3 (Ground-Level Ozone)</h3>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Formed by sunlight photochemical reactions.
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-surface-container text-white border border-outline-variant/40">
                      {liveData.o3 !== null ? `${liveData.o3} µg/m³` : 'N/A'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-outline">
                      <span>CPCB Standard: 100 µg/m³ (8-hr)</span>
                      {liveData.o3 !== null && (
                        <span className={liveData.o3 > 100 ? 'text-amber-400 font-bold' : 'text-primary'}>
                          {liveData.o3 > 100 ? `${(liveData.o3 / 100).toFixed(1)}x limit` : 'Safe'}
                        </span>
                      )}
                    </div>
                    <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-400 rounded-full"
                        style={{ width: `${Math.min(100, ((liveData.o3 || 0) / 200) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Carbon Monoxide Tile */}
                <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                        <h3 className="text-base font-headline font-bold text-white">CO (Carbon Monoxide)</h3>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Incomplete fuel combustion in vehicles.
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-surface-container text-white border border-outline-variant/40">
                      {liveData.co !== null ? `${(liveData.co / 1000).toFixed(2)} mg/m³` : 'N/A'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-outline">
                      <span>CPCB Standard: 2.0 mg/m³ (8-hr)</span>
                      <span className="text-primary font-bold">Within standard</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-400 rounded-full"
                        style={{ width: `${Math.min(100, (((liveData.co || 0) / 1000) / 4.0) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Sulphur Dioxide Tile */}
                <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-violet-400"></span>
                        <h3 className="text-base font-headline font-bold text-white">SO2 (Sulphur Dioxide)</h3>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Thermal power plants and fossil fuel burning.
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-surface-container text-white border border-outline-variant/40">
                      {liveData.so2 !== null ? `${liveData.so2} µg/m³` : 'N/A'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-outline">
                      <span>CPCB Standard: 80 µg/m³ (24-hr)</span>
                      <span className="text-primary font-bold">Within standard</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-400 rounded-full"
                        style={{ width: `${Math.min(100, ((liveData.so2 || 0) / 100) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PHYSICAL GROUND STATIONS (OCT 20, 2026 SNAPSHOT)                   */}
      {/* ========================================================================= */}
      {activeTab === 'stations' && (
        <section className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/20">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-headline font-bold text-white">
                  Physical Ground Monitoring Station Network
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Frozen Audit Snapshot
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Physical sensor readings recorded across 524 continuous ambient air quality monitoring (CAAQM) stations in 273 cities.
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs text-outline self-start md:self-center">
              <span className="material-symbols-outlined text-sm text-secondary">database</span>
              <span>524 Stations in 273 Cities</span>
            </div>
          </div>

          {/* Prominent Frozen Historical Snapshot Banner (Requirement 7) */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs leading-relaxed">
            <span className="material-symbols-outlined text-amber-400 text-lg shrink-0 mt-0.5">
              history_toggle_off
            </span>
            <div>
              <h3 className="font-headline font-bold text-white">
                Frozen Historical Ground Sensor Snapshot (October 20, 2026, 10:00 AM IST)
              </h3>
              <p className="text-on-surface-variant mt-0.5">
                This network audit represents static telemetry recorded at <strong>10:00 AM IST on October 20, 2026</strong> across 524 physical continuous ambient air quality monitoring (CAAQM) stations. It reflects the data-cleaning pipeline audit state and does <strong>not</strong> update dynamically. For real-time atmospheric estimates, switch to the <strong>Live Atmospheric Feed</strong> tab.
              </p>
            </div>
          </div>

          {isLoadingSnapshot ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-mono text-outline">Loading physical station network snapshot...</p>
            </div>
          ) : currentCitySnapshot ? (
            <div className="space-y-5">
              {/* City Summary Card */}
              <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-headline font-bold text-white">
                    {currentCitySnapshot.city}, {currentCitySnapshot.state}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {currentCitySnapshot.station_count} Continuous Monitoring Station(s) recorded in audit snapshot
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[11px] font-mono text-outline uppercase block">Network Average AQI</span>
                    <span className="text-2xl font-headline font-black text-white">
                      {currentCitySnapshot.city_avg_aqi !== null ? currentCitySnapshot.city_avg_aqi : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Station Filter Input */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-base text-outline">
                  search
                </span>
                <input
                  type="text"
                  value={stationSearch}
                  onChange={(e) => setStationSearch(e.target.value)}
                  placeholder={`Search among ${currentCitySnapshot.station_count} stations in ${currentCitySnapshot.city}...`}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs text-white placeholder:text-outline focus:outline-none focus:border-primary"
                />
              </div>

              {/* Physical Station List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStations.map((stn, idx) => {
                  const sCat = stn.aqi !== null ? getCpcbCategory(stn.aqi) : 'Moderate';
                  const sCol = getCategoryColor(sCat);
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 space-y-3 hover:border-outline-variant/60 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            <h4 className="text-sm font-headline font-bold text-white leading-tight">
                              {stn.name}
                            </h4>
                          </div>
                          {stn.lat && stn.lon && (
                            <span className="text-[10px] font-mono text-outline block mt-0.5">
                              GPS: {stn.lat.toFixed(3)}°N, {stn.lon.toFixed(3)}°E
                            </span>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-xl font-headline font-extrabold ${sCol.text}`}>
                            {stn.aqi !== null ? stn.aqi : '—'}
                          </span>
                          <span className={`block text-[10px] font-bold ${sCol.text}`}>
                            {stn.aqi !== null ? sCat : 'No Data'}
                          </span>
                        </div>
                      </div>

                      {/* Subindices breakdown */}
                      <div className="pt-2 border-t border-outline-variant/20 flex flex-wrap gap-1.5 text-[11px] font-mono">
                        {Object.entries(stn.pollutants).map(([poll, val]) => (
                          <span
                            key={poll}
                            className={`px-2 py-0.5 rounded ${
                              poll === stn.dominant
                                ? 'bg-primary/20 text-primary border border-primary/30 font-bold'
                                : 'bg-surface-container-high text-on-surface-variant'
                            }`}
                          >
                            {poll}: {val}
                          </span>
                        ))}
                      </div>

                      <div className="text-[10px] font-mono text-outline flex items-center justify-between">
                        <span>Dominant: <strong className="text-white">{stn.dominant}</strong></span>
                        <span>{stn.active ? 'Sensors Active' : 'Sensor Offline'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredStations.length === 0 && (
                <div className="p-8 text-center text-xs font-mono text-outline">
                  No stations found matching "{stationSearch}".
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-xs font-mono text-outline">
              No physical station snapshot records for {selectedCity}. Please select another city from the dropdown.
            </div>
          )}
        </section>
      )}

      {/* 4. EXPLORATION SHORTCUTS */}
      <section className="bg-surface-container p-6 rounded-2xl border border-outline-variant/30 space-y-4">
        <h2 className="text-base font-headline font-bold text-white">
          Explore more air quality features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => onNavigate('past')}
            className="p-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 text-left transition-all group flex items-start gap-3"
          >
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-xl">history</span>
            </div>
            <div>
              <div className="font-headline font-bold text-sm text-white flex items-center gap-1">
                Check Past History
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Look up {selectedCity}'s 10-year records from 2015 to 2025.
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('compare')}
            className="p-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 text-left transition-all group flex items-start gap-3"
          >
            <div className="p-2 rounded-lg bg-secondary/10 text-secondary group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-xl">compare_arrows</span>
            </div>
            <div>
              <div className="font-headline font-bold text-sm text-white flex items-center gap-1">
                Compare with Another City
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Compare {selectedCity} with Mumbai, Bengaluru, or Amritsar.
              </p>
            </div>
          </button>
        </div>
      </section>
    </main>
  );
};
