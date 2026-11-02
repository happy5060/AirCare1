import React, { useState } from 'react';
import type { PageId } from '../components/Header';

interface CityComparisonProps {
  onNavigate: (page: PageId) => void;
}

export const CityComparison: React.FC<CityComparisonProps> = ({ onNavigate }) => {
  const [benchmarkMode, setBenchmarkMode] = useState<'bulletins' | 'concentrations' | 'snapshot'>('bulletins');
  const [timeframe, setTimeframe] = useState<'2024' | 'winter' | 'monsoon' | 'custom'>('2024');
  const [metric, setMetric] = useState<'AQI' | 'PM2.5' | 'PM10'>('AQI');

  return (
    <main className="flex-1 w-full max-w-[1680px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* PAGE HEADER & COMPARISON CONTROL BAR */}
      <section className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-5 shadow-sm space-y-4">
        {/* Breadcrumb & Title Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-outline-variant/20">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant mb-1">
              <span onClick={() => onNavigate('overview')} className="hover:text-primary cursor-pointer">Analytics Core</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span onClick={() => onNavigate('historical')} className="hover:text-primary cursor-pointer">Comparative Analytics</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-primary font-medium">Multi-City Benchmarking</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-headline font-bold text-white tracking-tight flex items-center gap-3">
              City Air Quality Benchmark &amp; Comparative Analytics
              <span className="text-xs font-sans font-normal px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 align-middle">
                3-City Triangulation
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1 max-w-4xl">
              Comparative statistical decomposition across geographic, seasonal, and pollutant regimes (CPCB Bulletins 2015–2025 &amp; City-Day 2015–2020 Corpus).
            </p>
          </div>

          {/* Primary Action Cluster */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('historical')}
              className="px-3.5 py-2 text-xs font-medium text-on-surface-variant hover:text-white bg-surface-container hover:bg-surface-container-high rounded-lg border border-outline-variant/40 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">history_edu</span>
              Historical Trends
            </button>
            <button
              onClick={() => onNavigate('quality')}
              className="px-3.5 py-2 text-xs font-medium text-on-surface-variant hover:text-white bg-surface-container hover:bg-surface-container-high rounded-lg border border-outline-variant/40 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">verified_user</span>
              Quality Audits
            </button>
            <button
              onClick={() => onNavigate('methodology')}
              className="px-4 py-2 text-xs font-semibold text-on-primary bg-primary hover:bg-primary-fixed-dim transition-all duration-150 rounded-lg shadow-sm flex items-center gap-2 active:scale-95"
            >
              <span className="material-symbols-outlined text-base">science</span>
              Methodology Spec
            </button>
          </div>
        </div>

        {/* Benchmarking Mode Segmented Toggle */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-mono uppercase text-on-surface-variant font-medium mr-1">Benchmark Mode:</span>
          <div className="inline-flex p-1 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-xs font-medium">
            <button
              onClick={() => setBenchmarkMode('bulletins')}
              className={`px-3 py-1.5 rounded-md font-semibold shadow-sm flex items-center gap-1.5 transition-colors ${
                benchmarkMode === 'bulletins' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">history_edu</span>
              Historical City AQI (2015–2025 Bulletins)
            </button>
            <button
              onClick={() => setBenchmarkMode('concentrations')}
              className={`px-3 py-1.5 rounded-md font-semibold shadow-sm flex items-center gap-1.5 transition-colors ${
                benchmarkMode === 'concentrations' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">science</span>
              Detailed Pollutant Concentrations (2015–2020 Corpus)
            </button>
            <button
              onClick={() => setBenchmarkMode('snapshot')}
              className={`px-3 py-1.5 rounded-md font-semibold shadow-sm flex items-center gap-1.5 transition-colors ${
                benchmarkMode === 'snapshot' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">timelapse</span>
              Oct 20, 2026 Snapshot Sub-Indices
            </button>
          </div>
        </div>

        {/* Interactive Comparison Filters & Multi-Select Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* City Selector Chips (Span 7) */}
          <div className="lg:col-span-7 flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono uppercase text-on-surface-variant font-medium mr-1">Active Cities:</span>
            {/* City 1: Delhi NCR */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-container border border-amber-500/40 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
              <span className="font-headline font-semibold text-white">Delhi NCR</span>
              <span className="text-[11px] text-amber-300/80 font-mono">12 CAAQMS Stations • Landlocked Plain</span>
            </div>
            {/* City 2: Mumbai */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-container border border-[#38BDF8]/40 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]"></span>
              <span className="font-headline font-semibold text-white">Mumbai</span>
              <span className="text-[11px] text-[#38BDF8]/80 font-mono">8 CAAQMS Stations • Coastal Marine Basin</span>
            </div>
            {/* City 3: Bengaluru */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-container border border-[#14B8A6]/40 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#14B8A6]"></span>
              <span className="font-headline font-semibold text-white">Bengaluru</span>
              <span className="text-[11px] text-[#14B8A6]/80 font-mono">6 CAAQMS Stations • Elevated Deccan Plateau (920m ASL)</span>
            </div>
          </div>

          {/* Normalization Metrics & Timeframe Tabs (Span 5) */}
          <div className="lg:col-span-5 flex flex-wrap items-center justify-start lg:justify-end gap-3">
            <div className="flex items-center p-1 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-xs font-medium">
              {(['2024', 'winter', 'monsoon', 'custom'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    timeframe === t ? 'bg-surface-container-high text-primary font-semibold shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {t === '2024' ? 'Year 2024' : t === 'winter' ? 'Winter Inversion' : t === 'monsoon' ? 'Monsoon Washout' : 'Custom'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 text-xs font-mono">
              <span className="text-on-surface-variant text-[11px] mr-1 hidden sm:inline">Index:</span>
              {(['AQI', 'PM2.5', 'PM10'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={`px-2 py-1 rounded border font-semibold transition-colors ${
                    metric === m
                      ? 'bg-primary/20 text-primary border-primary/30'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface border-outline-variant/20'
                  }`}
                >
                  {m === 'AQI' ? 'Overall AQI' : m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scope Clarification Banner */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-surface-container border border-primary/30 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-primary text-base shrink-0">info</span>
          <span>
            <strong className="text-white">Notice:</strong> Delhi, Mumbai, and Bengaluru are continuously covered in both the 2015–2025 bulletin archive and the 2015–2020 chemical concentration dataset.
          </span>
        </div>
      </section>

      {/* SIDE-BY-SIDE CITY SUMMARY METRIC CARDS (3 COLUMNS) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CARD 1: DELHI NCR (Amber Theme) */}
        <div className="bg-surface-container-low rounded-xl border border-amber-500/30 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:border-amber-500/60 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-tertiary"></div>
          <div>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400 ring-4 ring-amber-400/20"></span>
                  <h2 className="text-xl font-headline font-bold text-white tracking-tight">Delhi NCR</h2>
                </div>
                <p className="text-xs font-mono text-on-surface-variant mt-0.5">12 CAAQMS Stations • 216m ASL Plain</p>
              </div>
              <span className="px-2.5 py-1 rounded text-[11px] font-semibold uppercase font-mono bg-tertiary-container/30 text-tertiary border border-tertiary/30">
                HIGH VOLATILITY / INDO-GANGETIC
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-1">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-headline font-bold text-amber-400 tracking-tight">188</span>
                <span className="text-xs font-semibold text-on-surface">Annual Mean AQI</span>
              </div>
              <p className="text-[11px] text-amber-300/90 font-mono leading-tight">
                (Illustrative Demo Slice - Actual Binding Pending) • +8.4% above 5-yr baseline
              </p>
            </div>

            <div className="mt-5 space-y-2.5 text-xs border-t border-outline-variant/25 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Peak Month:</span>
                <span className="font-medium text-white text-right">November (<span className="text-amber-400 font-mono">342</span> • Severe)</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Severe Days (&gt;400 AQI):</span>
                  <span className="font-mono font-semibold text-error">34 Days (9.3%)</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full" style={{ width: '9.3%' }}></div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Dominant Pollutant:</span>
                <span className="font-medium text-amber-200">PM2.5 (82% of year)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-outline-variant/20 space-y-2 text-[11px]">
            <div className="flex items-start gap-2 text-on-surface-variant bg-surface-container/40 p-2.5 rounded-lg">
              <span className="material-symbols-outlined text-sm text-amber-400 shrink-0 mt-0.5">terrain</span>
              <span><strong className="text-on-surface">Geographic Driver:</strong> Landlocked Indo-Gangetic Plain / Thermal Inversion Trapping</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono text-on-surface-variant/80 bg-surface-container-lowest/60 rounded border border-outline-variant/20">
              <span className="material-symbols-outlined text-xs text-primary">verified</span>
              <span>Missing days preserved authentically as NaN (0 artificial points imputed)</span>
            </div>
          </div>
        </div>

        {/* CARD 2: MUMBAI (Cyan Theme) */}
        <div className="bg-surface-container-low rounded-xl border border-secondary/30 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:border-secondary/60 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#38BDF8] to-secondary-container"></div>
          <div>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#38BDF8] ring-4 ring-[#38BDF8]/20"></span>
                  <h2 className="text-xl font-headline font-bold text-white tracking-tight">Mumbai</h2>
                </div>
                <p className="text-xs font-mono text-on-surface-variant mt-0.5">8 Coastal Stations • 14m ASL Coastal Basin</p>
              </div>
              <span className="px-2.5 py-1 rounded text-[11px] font-semibold uppercase font-mono bg-secondary/15 text-secondary border border-secondary/30">
                MODERATE BASIN / COASTAL
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-1">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-headline font-bold text-[#38BDF8] tracking-tight">114</span>
                <span className="text-xs font-semibold text-on-surface">Annual Mean AQI</span>
              </div>
              <p className="text-[11px] text-[#38BDF8]/90 font-mono leading-tight">
                (Illustrative Demo Slice - Actual Binding Pending) • -3.1% below 5-yr baseline
              </p>
            </div>

            <div className="mt-5 space-y-2.5 text-xs border-t border-outline-variant/25 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Peak Month:</span>
                <span className="font-medium text-white text-right">December (<span className="text-[#38BDF8] font-mono">178</span> • Moderate)</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Severe Days (&gt;400 AQI):</span>
                  <span className="font-mono font-semibold text-primary">0 Days (0.0%)</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Dominant Pollutant:</span>
                <span className="font-medium text-secondary-fixed-dim">PM10 (Crustal Dust 58%)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-outline-variant/20 space-y-2 text-[11px]">
            <div className="flex items-start gap-2 text-on-surface-variant bg-surface-container/40 p-2.5 rounded-lg">
              <span className="material-symbols-outlined text-sm text-[#38BDF8] shrink-0 mt-0.5">waves</span>
              <span><strong className="text-on-surface">Geographic Driver:</strong> Diurnal Sea-Breeze Cleansing / High Atmospheric Moisture Dispersion</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono text-on-surface-variant/80 bg-surface-container-lowest/60 rounded border border-outline-variant/20">
              <span className="material-symbols-outlined text-xs text-primary">verified</span>
              <span>Missing days preserved authentically as NaN (0 artificial points imputed)</span>
            </div>
          </div>
        </div>

        {/* CARD 3: BENGALURU (Teal Theme) */}
        <div className="bg-surface-container-low rounded-xl border border-primary/30 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:border-primary/60 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#14B8A6] to-primary-container"></div>
          <div>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#14B8A6] ring-4 ring-[#14B8A6]/20"></span>
                  <h2 className="text-xl font-headline font-bold text-white tracking-tight">Bengaluru</h2>
                </div>
                <p className="text-xs font-mono text-on-surface-variant mt-0.5">6 Stations • 920m ASL Deccan Plateau</p>
              </div>
              <span className="px-2.5 py-1 rounded text-[11px] font-semibold uppercase font-mono bg-primary/15 text-primary border border-primary/30">
                OPTIMAL / DECCAN PLATEAU
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-1">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-headline font-bold text-[#14B8A6] tracking-tight">62</span>
                <span className="text-xs font-semibold text-on-surface">Annual Mean AQI</span>
              </div>
              <p className="text-[11px] text-primary-fixed-dim font-mono leading-tight">
                (Illustrative Demo Slice - Actual Binding Pending) • -12.6% below baseline (Optimal)
              </p>
            </div>

            <div className="mt-5 space-y-2.5 text-xs border-t border-outline-variant/25 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Peak Month:</span>
                <span className="font-medium text-white text-right">February (<span className="text-[#14B8A6] font-mono">84</span> • Satisfactory)</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Severe Days (&gt;400 AQI):</span>
                  <span className="font-mono font-semibold text-primary">0 Days (0.0%)</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Dominant Pollutant:</span>
                <span className="font-medium text-primary-fixed">PM2.5 / Vehicular NOx (44%)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-outline-variant/20 space-y-2 text-[11px]">
            <div className="flex items-start gap-2 text-on-surface-variant bg-surface-container/40 p-2.5 rounded-lg">
              <span className="material-symbols-outlined text-sm text-[#14B8A6] shrink-0 mt-0.5">forest</span>
              <span><strong className="text-on-surface">Geographic Driver:</strong> Elevated Deccan Plateau Topography / Continuous Canopy Aeration</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono text-on-surface-variant/80 bg-surface-container-lowest/60 rounded border border-outline-variant/20">
              <span className="material-symbols-outlined text-xs text-primary">verified</span>
              <span>Missing days preserved authentically as NaN (0 artificial points imputed)</span>
            </div>
          </div>
        </div>
      </section>

      {/* FULL-WIDTH SECTION: MULTI-CITY DAILY AQI TIMELINE COMPARISON */}
      <section className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-headline font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">stacked_line_chart</span>
              Multi-City Daily AQI Timeline Comparison (Jan 01 - Dec 31, 2024)
            </h2>
            <p className="text-xs text-on-surface-variant">
              Continuous daily aggregate AQI trajectories highlighting winter thermal inversion divergence versus coastal ventilation.
            </p>
          </div>

          {/* Interactive Legend */}
          <div className="flex items-center flex-wrap gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 cursor-pointer bg-surface-container px-2.5 py-1 rounded border border-amber-500/30">
              <span className="w-3 h-1 rounded-full bg-[#F59E0B]"></span>
              <span className="text-white font-sans font-medium">Delhi NCR</span>
              <span className="text-[10px] text-amber-300">Mean: 188</span>
            </div>
            <div className="flex items-center gap-1.5 cursor-pointer bg-surface-container px-2.5 py-1 rounded border border-[#38BDF8]/30">
              <span className="w-3 h-1 rounded-full bg-[#38BDF8]"></span>
              <span className="text-white font-sans font-medium">Mumbai</span>
              <span className="text-[10px] text-[#38BDF8]">Mean: 114</span>
            </div>
            <div className="flex items-center gap-1.5 cursor-pointer bg-surface-container px-2.5 py-1 rounded border border-[#14B8A6]/30">
              <span className="w-3 h-1 rounded-full bg-[#14B8A6]"></span>
              <span className="text-white font-sans font-medium">Bengaluru</span>
              <span className="text-[10px] text-primary">Mean: 62</span>
            </div>
          </div>
        </div>

        {/* SVG Daily Trajectory Chart with Pinned Nov 12 Tooltip */}
        <div className="relative w-full h-80 bg-surface-container-lowest/80 rounded-lg p-2 border border-outline-variant/20 overflow-hidden">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 300">
            <defs>
              <linearGradient id="delhiGlow" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gridlines */}
            <line stroke="#EF4444" strokeDasharray="4,4" strokeOpacity="0.3" strokeWidth="1" x1="50" x2="980" y1="50" y2="50" />
            <text fill="#EF4444" fontFamily="monospace" fontSize="9" x="52" y="44">CPCB Severe (400)</text>

            <line stroke="#ca8100" strokeDasharray="3,3" strokeOpacity="0.2" strokeWidth="1" x1="50" x2="980" y1="105" y2="105" />
            <text fill="#ffb95f" fontFamily="monospace" fontSize="9" x="52" y="101">Very Poor (300)</text>

            <line stroke="#ca8100" strokeDasharray="4,4" strokeOpacity="0.3" strokeWidth="1" x1="50" x2="980" y1="160" y2="160" />
            <text fill="#ffb95f" fontFamily="monospace" fontSize="9" x="52" y="156">CPCB Poor (200)</text>

            <line stroke="#14B8A6" strokeDasharray="4,4" strokeOpacity="0.35" strokeWidth="1" x1="50" x2="980" y1="215" y2="215" />
            <text fill="#4fdbc8" fontFamily="monospace" fontSize="9" x="52" y="211">Satisfactory (100)</text>

            <line stroke="#3d4947" strokeWidth="1" x1="50" x2="980" y1="275" y2="275" />

            {/* Month Vertical Markers */}
            <g fill="#879391" fontFamily="monospace" fontSize="9" textAnchor="middle">
              <text x="80" y="290">JAN</text>
              <text x="160" y="290">FEB</text>
              <text x="240" y="290">MAR</text>
              <text x="320" y="290">APR</text>
              <text x="400" y="290">MAY</text>
              <text x="480" y="290">JUN</text>
              <text x="560" y="290">JUL (Monsoon)</text>
              <text x="640" y="290">AUG</text>
              <text x="720" y="290">SEP</text>
              <text x="800" y="290">OCT</text>
              <text x="880" y="290">NOV (Peak)</text>
              <text x="950" y="290">DEC</text>
            </g>

            {/* Delhi Area */}
            <path
              d="M 780 160 C 810 130, 840 90, 875 50 C 900 45, 930 75, 970 80 L 970 275 L 780 275 Z"
              fill="url(#delhiGlow)"
            />

            {/* Delhi Curve */}
            <path
              d="M 60 85 C 100 95, 140 145, 180 160 C 220 170, 260 175, 300 180 C 340 185, 380 190, 420 195 C 460 210, 500 230, 540 238 C 580 240, 620 235, 660 232 C 700 220, 740 195, 780 160 C 810 130, 840 90, 875 50 C 900 45, 930 75, 970 80"
              fill="none"
              stroke="#F59E0B"
              strokeLinecap="round"
              strokeWidth="2.5"
            />

            {/* Mumbai Curve */}
            <path
              d="M 60 170 C 110 175, 160 185, 210 195 C 260 205, 310 215, 360 220 C 410 228, 460 240, 510 248 C 560 252, 610 255, 660 250 C 710 240, 760 225, 810 205 C 860 185, 910 170, 970 172"
              fill="none"
              stroke="#38BDF8"
              strokeDasharray="6,1"
              strokeLinecap="round"
              strokeWidth="2"
            />

            {/* Bengaluru Curve */}
            <path
              d="M 60 235 C 120 230, 180 225, 240 232 C 300 238, 360 240, 420 242 C 480 252, 540 258, 600 256 C 660 255, 720 250, 780 245 C 840 242, 900 240, 970 238"
              fill="none"
              stroke="#14B8A6"
              strokeLinecap="round"
              strokeWidth="2.2"
            />

            {/* Guideline at Nov 12 */}
            <line stroke="#dbe1ff" strokeDasharray="3,3" strokeOpacity="0.8" strokeWidth="1.2" x1="875" x2="875" y1="35" y2="275" />
            <circle cx="875" cy="50" fill="#F59E0B" r="5" stroke="#0a1228" strokeWidth="2" />
            <circle cx="875" cy="180" fill="#38BDF8" r="4.5" stroke="#0a1228" strokeWidth="2" />
            <circle cx="875" cy="241" fill="#14B8A6" r="4.5" stroke="#0a1228" strokeWidth="2" />
          </svg>

          {/* Pinned Hover Tooltip */}
          <div className="absolute top-4 right-16 md:right-28 max-w-xs sm:max-w-sm bg-surface-container/95 border border-primary/40 backdrop-blur-md rounded-lg p-3.5 shadow-xl pointer-events-none text-xs space-y-2 z-10">
            <div className="flex items-center justify-between pb-1.5 border-b border-outline-variant/30">
              <span className="font-headline font-semibold text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-tertiary">calendar_today</span>
                Nov 12, 2024 • Episode Comparison
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-error-container/40 text-error font-medium">
                Post-Harvest Inversion
              </span>
            </div>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between bg-surface-container-high/60 px-2 py-1 rounded">
                <span className="flex items-center gap-1.5 text-white font-sans">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span> Delhi NCR:
                </span>
                <span className="text-amber-400 font-bold">AQI 382 <span className="text-on-surface-variant font-normal">(PM2.5: 310 µg/m³)</span></span>
              </div>
              <div className="flex items-center justify-between bg-surface-container-high/60 px-2 py-1 rounded">
                <span className="flex items-center gap-1.5 text-white font-sans">
                  <span className="w-2 h-2 rounded-full bg-[#38BDF8]"></span> Mumbai:
                </span>
                <span className="text-[#38BDF8] font-bold">AQI 164 <span className="text-on-surface-variant font-normal">(PM10: 195 µg/m³)</span></span>
              </div>
              <div className="flex items-center justify-between bg-surface-container-high/60 px-2 py-1 rounded">
                <span className="flex items-center gap-1.5 text-white font-sans">
                  <span className="w-2 h-2 rounded-full bg-[#14B8A6]"></span> Bengaluru:
                </span>
                <span className="text-[#14B8A6] font-bold">AQI 58 <span className="text-on-surface-variant font-normal">(PM2.5: 32 µg/m³)</span></span>
              </div>
            </div>
            <p className="text-[10px] text-on-surface-variant pt-1 border-t border-outline-variant/20 italic">
              <strong>Geographic Insight:</strong> Stagnant anticyclonic ridge over northern plains; coastal gradient active in west.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-on-surface-variant px-1 pt-1 gap-2">
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="material-symbols-outlined text-xs text-primary">info</span>
            Notice: Trajectory represents illustrative demo slice. Extreme episodic values (AQI &gt; 500) are flagged for research review and preserved intact.
          </span>
          <span className="font-mono text-[11px] text-primary">CPCB Standard NAAQS 2009 Guidelines Applied</span>
        </div>
      </section>

      {/* DUAL-COLUMN COMPARISON GRID */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: CPCB AQI CATEGORY DAYS BREAKDOWN (7 Cols) */}
        <div className="lg:col-span-7 bg-surface-container-low border border-outline-variant/30 rounded-xl p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-headline font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">bar_chart</span>
                CPCB AQI Category Days Breakdown (366 Total Days)
              </h2>
              <p className="text-xs text-on-surface-variant">Annual frequency distribution of days falling into official national air quality bands.</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-container border border-outline-variant/30 text-on-surface-variant">
              Leap Year 2024
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500"></span><span className="text-on-surface text-[11px]">Good (0-50)</span></div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#14B8A6]"></span><span className="text-on-surface text-[11px]">Satisfactory (51-100)</span></div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#F59E0B]"></span><span className="text-on-surface text-[11px]">Moderate (101-200)</span></div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-600"></span><span className="text-on-surface text-[11px]">Poor (201-300)</span></div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-500"></span><span className="text-on-surface text-[11px]">Severe (301-500)</span></div>
          </div>

          <div className="space-y-4 pt-2">
            {/* Delhi */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-headline font-semibold text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span> Delhi NCR
                </span>
                <span className="text-on-surface-variant font-mono text-[11px]">Severe &amp; Poor: 124 Days (33.9%)</span>
              </div>
              <div className="w-full h-7 rounded-lg bg-surface-container-highest overflow-hidden flex font-mono text-[10px] font-semibold text-white text-center leading-7 shadow-inner">
                <div className="bg-emerald-500/90" style={{ width: '4.9%' }} title="Good: 18 days">18d</div>
                <div className="bg-[#14B8A6]/90 text-on-primary" style={{ width: '22.4%' }} title="Satisfactory: 82 days">82d</div>
                <div className="bg-[#F59E0B]/90 text-on-tertiary-container" style={{ width: '38.8%' }} title="Moderate: 142 days">142d Moderate</div>
                <div className="bg-amber-600/90" style={{ width: '24.6%' }} title="Poor: 90 days">90d Poor</div>
                <div className="bg-rose-500/95" style={{ width: '9.3%' }} title="Severe: 34 days">34d Sev</div>
              </div>
            </div>

            {/* Mumbai */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-headline font-semibold text-[#38BDF8] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#38BDF8]"></span> Mumbai
                </span>
                <span className="text-on-surface-variant font-mono text-[11px]">Moderate &amp; Satisfactory: 296 Days (80.9%)</span>
              </div>
              <div className="w-full h-7 rounded-lg bg-surface-container-highest overflow-hidden flex font-mono text-[10px] font-semibold text-white text-center leading-7 shadow-inner">
                <div className="bg-emerald-500/90" style={{ width: '13.1%' }} title="Good: 48 days">48d Good</div>
                <div className="bg-[#14B8A6]/90 text-on-primary" style={{ width: '44.3%' }} title="Satisfactory: 162 days">162d Satisfactory</div>
                <div className="bg-[#F59E0B]/90 text-on-tertiary-container" style={{ width: '36.6%' }} title="Moderate: 134 days">134d Moderate</div>
                <div className="bg-amber-600/90" style={{ width: '6.0%' }} title="Poor: 22 days">22d</div>
              </div>
            </div>

            {/* Bengaluru */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-headline font-semibold text-primary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#14B8A6]"></span> Bengaluru
                </span>
                <span className="text-on-surface-variant font-mono text-[11px]">Good &amp; Satisfactory: 338 Days (92.3%)</span>
              </div>
              <div className="w-full h-7 rounded-lg bg-surface-container-highest overflow-hidden flex font-mono text-[10px] font-semibold text-white text-center leading-7 shadow-inner">
                <div className="bg-emerald-500/90" style={{ width: '39.9%' }} title="Good: 146 days">146d Good (39.9%)</div>
                <div className="bg-[#14B8A6]/90 text-on-primary" style={{ width: '52.4%' }} title="Satisfactory: 192 days">192d Satisfactory (52.4%)</div>
                <div className="bg-[#F59E0B]/90 text-on-tertiary-container" style={{ width: '7.7%' }} title="Moderate: 28 days">28d</div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-surface-container/60 border border-outline-variant/30 rounded-lg text-xs flex items-start gap-2.5">
            <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">insights</span>
            <p className="text-on-surface-variant leading-relaxed">
              <strong className="text-white">Comparative Evaluation Insight:</strong> Bengaluru recorded zero Poor or Severe AQI episodes throughout 2024, maintaining NAAQS compliance for 92.3% of the year. Conversely, Delhi experienced severe atmospheric stagnation for 34 discrete days, primarily concentrated during the post-harvest biomass burning and thermal inversion period (Nov 02 - Dec 18).
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: MULTI-METRIC ENVIRONMENTAL & RISK RADAR PROFILE (5 Cols) */}
        <div className="lg:col-span-5 bg-surface-container-low border border-outline-variant/30 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-headline font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">radar</span>
                Multi-Metric Environmental Risk Radar Profile
              </h2>
              <span className="text-[11px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">Scale 0 - 10</span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">5-axis synthetic radar footprint mapping multi-pollutant vulnerability.</p>

            {/* Radar Chart Visual */}
            <div className="relative w-full h-56 flex items-center justify-center my-2">
              <svg className="w-full h-full max-w-[280px]" viewBox="0 0 300 300">
                {/* Level Rings */}
                <polygon points="150,50 245,119 209,231 91,231 55,119" fill="none" stroke="#2c344c" strokeWidth="1.2" />
                <polygon points="150,90 207,131 185,199 115,199 93,131" fill="none" stroke="#2c344c" strokeDasharray="2,2" strokeWidth="1" />
                <polygon points="150,120 178,141 168,174 132,174 122,141" fill="none" stroke="#2c344c" strokeDasharray="2,2" strokeWidth="1" />

                {/* Spoke Lines */}
                <line x1="150" y1="150" x2="150" y2="50" stroke="#3d4947" strokeWidth="1" />
                <line x1="150" y1="150" x2="245" y2="119" stroke="#3d4947" strokeWidth="1" />
                <line x1="150" y1="150" x2="209" y2="231" stroke="#3d4947" strokeWidth="1" />
                <line x1="150" y1="150" x2="91" y2="231" stroke="#3d4947" strokeWidth="1" />
                <line x1="150" y1="150" x2="55" y2="119" stroke="#3d4947" strokeWidth="1" />

                {/* Polygons */}
                <polygon points="150,55 234,123 192,208 93,227 65,122" fill="#F59E0B" fillOpacity="0.28" stroke="#F59E0B" strokeWidth="2" />
                <polygon points="150,92 228,125 188,202 125,184 79,127" fill="#38BDF8" fillOpacity="0.22" stroke="#38BDF8" strokeDasharray="3,1" strokeWidth="1.8" />
                <polygon points="150,118 186,138 182,195 138,167 104,135" fill="#14B8A6" fillOpacity="0.25" stroke="#14B8A6" strokeWidth="2" />

                {/* Axis Labels */}
                <text x="150" y="40" fill="#dbe1ff" fontFamily="sans-serif" fontSize="8" fontWeight="600" textAnchor="middle">1. PM2.5 Load</text>
                <text x="250" y="118" fill="#dbe1ff" fontFamily="sans-serif" fontSize="8" fontWeight="600" textAnchor="start">2. PM10 Dust</text>
                <text x="215" y="244" fill="#dbe1ff" fontFamily="sans-serif" fontSize="8" fontWeight="600" textAnchor="start">3. Vehicular NOx</text>
                <text x="75" y="244" fill="#dbe1ff" fontFamily="sans-serif" fontSize="8" fontWeight="600" textAnchor="end">4. Inversion Trap</text>
                <text x="45" y="118" fill="#dbe1ff" fontFamily="sans-serif" fontSize="8" fontWeight="600" textAnchor="end">5. Exposure Risk</text>
              </svg>
            </div>
          </div>

          {/* Comparative Metric Ranking Table */}
          <div className="border-t border-outline-variant/30 pt-3 space-y-2">
            <table className="w-full text-[11px] font-mono">
              <thead>
                <tr className="text-on-surface-variant border-b border-outline-variant/20 text-left">
                  <th className="pb-1 font-sans">Key Dimension</th>
                  <th className="pb-1 text-amber-400">Delhi</th>
                  <th className="pb-1 text-[#38BDF8]">Mumbai</th>
                  <th className="pb-1 text-primary">Bengaluru</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15 text-white">
                <tr>
                  <td className="py-1 text-on-surface-variant font-sans">PM2.5 Concentration</td>
                  <td className="py-1 font-bold text-amber-300">9.5/10</td>
                  <td className="py-1 text-[#38BDF8]">5.8/10</td>
                  <td className="py-1 text-primary-fixed">3.2/10</td>
                </tr>
                <tr>
                  <td className="py-1 text-on-surface-variant font-sans">Seasonal Inversion Volatility</td>
                  <td className="py-1 font-bold text-amber-300">9.2/10</td>
                  <td className="py-1 text-[#38BDF8]">5.4/10</td>
                  <td className="py-1 text-primary-fixed">2.1/10</td>
                </tr>
                <tr>
                  <td className="py-1 text-on-surface-variant font-sans">Crustal Dust (PM10)</td>
                  <td className="py-1 text-amber-300">8.8/10</td>
                  <td className="py-1 font-bold text-[#38BDF8]">8.2/10</td>
                  <td className="py-1 text-primary-fixed">3.8/10</td>
                </tr>
                <tr>
                  <td className="py-1 text-on-surface-variant font-sans">Overall Population Risk</td>
                  <td className="py-1 font-bold text-error">Severe</td>
                  <td className="py-1 text-[#38BDF8]">Moderate</td>
                  <td className="py-1 text-primary">Low-Mild</td>
                </tr>
              </tbody>
            </table>
            <p className="text-[10px] font-mono text-on-surface-variant/80 italic pt-1 border-t border-outline-variant/20">
              Methodology: 5-Axis comparative radar metrics derived from 2015–2020 historical ambient pollutant corpus.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};
