import React, { useState } from 'react';
import type { PageId } from '../components/Header';

interface OverviewDashboardProps {
  onNavigate: (page: PageId) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onNavigate }) => {
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D' | '1Y'>('30D');
  const [citySearch, setCitySearch] = useState('');

  const cityRows = [
    { city: 'Delhi NCR', state: 'DL', pollutant: 'PM2.5', aqi: 268, category: 'Poor', color: 'text-error', badgeBg: 'bg-error-container/30 text-error border-error/30' },
    { city: 'Mumbai', state: 'MH', pollutant: 'PM10', aqi: 112, category: 'Moderate', color: 'text-tertiary', badgeBg: 'bg-tertiary-container/30 text-tertiary border-tertiary/30' },
    { city: 'Bengaluru', state: 'KA', pollutant: 'PM2.5', aqi: 64, category: 'Satisfactory', color: 'text-secondary', badgeBg: 'bg-secondary-container/30 text-secondary border-secondary/30' },
    { city: 'Kolkata', state: 'WB', pollutant: 'PM2.5', aqi: 178, category: 'Moderate', color: 'text-tertiary', badgeBg: 'bg-tertiary-container/30 text-tertiary border-tertiary/30' },
    { city: 'Chennai', state: 'TN', pollutant: 'NO2', aqi: 58, category: 'Satisfactory', color: 'text-secondary', badgeBg: 'bg-secondary-container/30 text-secondary border-secondary/30' },
    { city: 'Thiruvananthapuram', state: 'KL', pollutant: 'PM10', aqi: 38, category: 'Good', color: 'text-primary', badgeBg: 'bg-primary-container/30 text-primary border-primary/30' },
  ];

  const filteredCities = cityRows.filter(
    (c) =>
      c.city.toLowerCase().includes(citySearch.toLowerCase()) ||
      c.pollutant.toLowerCase().includes(citySearch.toLowerCase()) ||
      c.state.toLowerCase().includes(citySearch.toLowerCase())
  );

  return (
    <main className="flex-1 w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* SUBHEADER / QUICK STATS BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-outline-variant/20">
        <div>
          <h1 className="text-xl md:text-2xl font-headline font-bold text-on-surface flex items-center gap-2">
            CPCB Observational Baseline Overview
            <span className="text-xs font-normal font-label px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary border border-primary/30">
              Evaluation Release Candidate
            </span>
          </h1>
          <p className="text-xs text-on-surface-variant font-body mt-0.5">
            Exploratory data analysis across 471,015 CPCB bulletin records, 29,531 city-day pollutant records, and Oct 20, 2026 static CAAQMS station snapshot.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button 
            onClick={() => onNavigate('quality')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/50 text-xs font-label text-on-surface transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-sm text-secondary">verified_user</span>
            Audit Report
          </button>
          <button 
            onClick={() => onNavigate('methodology')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary-container font-headline font-semibold text-xs transition-all hover:bg-primary-fixed active:scale-95 shadow-[0_0_12px_rgba(79,219,200,0.3)]"
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              menu_book
            </span>
            Methodology
          </button>
        </div>
      </div>

      {/* GLOBAL METRIC CARDS (Top 5-Card Responsive Grid) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: National Average AQI */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 relative overflow-hidden flex flex-col justify-between group hover:border-primary/50 transition-all shadow-sm">
          <div className="flex items-center justify-between text-xs font-label text-on-surface-variant">
            <span className="font-medium">National Average AQI</span>
            <span className="p-1 rounded bg-surface-container text-primary">
              <span className="material-symbols-outlined text-sm">equalizer</span>
            </span>
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <span className="font-headline text-3xl font-bold tracking-tight text-on-surface">142</span>
            <span className="text-[11px] font-label font-semibold px-2 py-0.5 rounded-full bg-tertiary-container/30 text-tertiary border border-tertiary/40">
              Moderate
            </span>
          </div>
          <div className="text-[10px] text-outline font-label mb-1.5 truncate">
            (Demo Sample Slice - Actual Binding Pending)
          </div>
          <div className="flex items-center justify-between text-[11px] font-label pt-2 border-t border-outline-variant/20">
            <span className="flex items-center gap-0.5 text-primary font-medium">
              <span className="material-symbols-outlined text-xs">trending_down</span>
              -4.2% <span className="text-on-surface-variant font-normal">from prior period</span>
            </span>
            <svg className="w-14 h-5 stroke-primary fill-none overflow-visible" viewBox="0 0 50 20">
              <path d="M0,15 Q10,12 18,17 T32,8 T50,5" strokeLinecap="round" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Card 2: Highest Snapshot Sub-Index */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 relative overflow-hidden flex flex-col justify-between group hover:border-error/40 transition-all shadow-sm">
          <div className="flex items-center justify-between text-xs font-label text-on-surface-variant">
            <span>Highest Snapshot Sub-Index</span>
            <span className="p-1 rounded bg-surface-container text-error">
              <span className="material-symbols-outlined text-sm">warning</span>
            </span>
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <div>
              <div className="font-headline text-lg font-bold text-on-surface">Delhi NCR</div>
              <div className="font-headline text-2xl font-bold text-error tracking-tight">Sub-Index 268</div>
            </div>
            <span className="text-[11px] font-label font-semibold px-2 py-0.5 rounded-full bg-error-container/40 text-error border border-error/40">
              Poor
            </span>
          </div>
          <div className="text-[10px] text-outline font-label mb-1.5">
            CPCB AQI Sub-Index (0-500 scale, Not raw concentration)
          </div>
          <div className="flex items-center justify-between text-[11px] font-label pt-2 border-t border-outline-variant/20 text-on-surface-variant">
            <span>Oct 20, 2026 Snapshot</span>
            <span className="text-error font-mono font-medium">subindex_max: 268</span>
          </div>
        </div>

        {/* Card 3: Lowest Snapshot Sub-Index */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 relative overflow-hidden flex flex-col justify-between group hover:border-primary/50 transition-all shadow-sm">
          <div className="flex items-center justify-between text-xs font-label text-on-surface-variant">
            <span>Lowest Snapshot Sub-Index</span>
            <span className="p-1 rounded bg-surface-container text-primary">
              <span className="material-symbols-outlined text-sm">nature</span>
            </span>
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <div>
              <div className="font-headline text-lg font-bold text-on-surface truncate max-w-[130px]">
                Thiruvananthapuram
              </div>
              <div className="font-headline text-2xl font-bold text-primary tracking-tight">Sub-Index 38</div>
            </div>
            <span className="text-[11px] font-label font-semibold px-2 py-0.5 rounded-full bg-primary-container/30 text-primary border border-primary/40">
              Good
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-label pt-2 border-t border-outline-variant/20 text-on-surface-variant">
            <span className="truncate">Coastal buffer dispersion • Optimal air quality</span>
            <span className="text-primary font-semibold">Min (38)</span>
          </div>
        </div>

        {/* Card 4: Prominent Active Sub-Index */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 relative overflow-hidden flex flex-col justify-between group hover:border-secondary/50 transition-all shadow-sm">
          <div className="flex items-center justify-between text-xs font-label text-on-surface-variant">
            <span>Prominent Active Sub-Index</span>
            <span className="p-1 rounded bg-surface-container text-secondary">
              <span className="material-symbols-outlined text-sm">cloud</span>
            </span>
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <div>
              <div className="font-headline text-sm font-semibold text-secondary">PM2.5 Sub-Index</div>
              <div className="font-headline text-xl font-bold text-on-surface tracking-tight">subindex_avg: 68.4</div>
            </div>
            <span className="text-[10px] font-label font-semibold px-2 py-0.5 rounded-full bg-secondary-container/30 text-secondary border border-secondary/30">
              Satisfactory
            </span>
          </div>
          <div className="text-[10px] font-label pt-2 border-t border-outline-variant/20 text-tertiary leading-tight">
            <strong>Dimensionless CPCB Sub-Index (0-500)</strong>, Not physical mass concentration
          </div>
        </div>

        {/* Card 5: Total Monitored Records in DB */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 relative overflow-hidden flex flex-col justify-between group hover:border-outline transition-all shadow-sm">
          <div className="flex items-center justify-between text-xs font-label text-on-surface-variant">
            <span>Total Monitored Records in DB</span>
            <span className="p-1 rounded bg-surface-container text-outline">
              <span className="material-symbols-outlined text-sm">database</span>
            </span>
          </div>
          <div className="my-2">
            <div className="font-headline text-2xl font-bold text-on-surface tracking-tight">471,015 Records</div>
            <div className="text-[10px] font-label text-on-surface-variant leading-snug mt-0.5">
              Historical CPCB AQI Bulletins Archive (May 2015 – Dec 2025, 297 Cities) • 0 Duplicates
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-label pt-2 border-t border-outline-variant/20 text-primary">
            <span className="material-symbols-outlined text-xs">verified</span>
            <span className="truncate font-medium">100% Provenance Verified</span>
          </div>
        </div>
      </section>

      {/* MAIN ANALYTICAL SECTION (2-Column Grid: 8 Cols Left, 4 Cols Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT COLUMN (8 COLS) ================= */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. National AQI Historical Trend */}
          <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-md">
            {/* Chart Header & Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline-variant/20">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-headline font-bold text-on-surface">
                    National AQI Historical Trend (CPCB Bulletin Archive 2015–2025 Slice)
                  </h2>
                  <span className="text-[10px] font-label uppercase px-2 py-0.5 rounded bg-surface-container-high text-primary border border-primary/20">
                    (Illustrative Demo Trajectory - Pre-Integration)
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Simulated trend based on seasonal CPCB historical archives with standard NAAQS threshold bands
                </p>
              </div>
              <div className="flex items-center bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/30 text-xs font-label self-start sm:self-auto">
                {(['7D', '30D', '90D', '1Y'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      timeRange === r
                        ? 'bg-primary text-on-primary-container font-semibold shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Chart Area with CPCB Threshold Bands */}
            <div className="relative w-full h-[320px] mt-4 font-mono select-none">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 760 280">
                <defs>
                  <linearGradient id="aqiAreaGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#4fdbc8" stopOpacity="0.38" />
                    <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#0a1228" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="bandVeryPoor" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#93000a" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="#93000a" stopOpacity="0.06" />
                  </linearGradient>
                  <linearGradient id="bandPoor" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#ca8100" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#ca8100" stopOpacity="0.04" />
                  </linearGradient>
                  <linearGradient id="bandModerate" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#ffb95f" stopOpacity="0.09" />
                    <stop offset="100%" stopColor="#ffb95f" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Severe / Very Poor band */}
                <rect fill="url(#bandVeryPoor)" height="65" width="705" x="55" y="0" />
                <line stroke="#93000a" strokeDasharray="3,3" strokeOpacity="0.3" strokeWidth="1" x1="55" x2="760" y1="65" y2="65" />
                {/* Poor band */}
                <rect fill="url(#bandPoor)" height="65" width="705" x="55" y="65" />
                <line stroke="#ca8100" strokeDasharray="3,3" strokeOpacity="0.35" strokeWidth="1" x1="55" x2="760" y1="130" y2="130" />
                {/* Moderate band */}
                <rect fill="url(#bandModerate)" height="65" width="705" x="55" y="130" />
                <line stroke="#ffb95f" strokeDasharray="3,3" strokeOpacity="0.3" strokeWidth="1" x1="55" x2="760" y1="195" y2="195" />
                {/* Satisfactory & Good */}
                <rect fill="#4fdbc8" fillOpacity="0.03" height="55" width="705" x="55" y="195" />
                <line stroke="#4fdbc8" strokeDasharray="2,2" strokeOpacity="0.25" strokeWidth="1" x1="55" x2="760" y1="225" y2="225" />

                {/* Y-Axis Labels */}
                <text fill="#879391" fontSize="10" textAnchor="end" x="45" y="12">400</text>
                <text fill="#879391" fontSize="10" textAnchor="end" x="45" y="70">300</text>
                <text fill="#879391" fontSize="10" textAnchor="end" x="45" y="135">200</text>
                <text fill="#879391" fontSize="10" textAnchor="end" x="45" y="200">100</text>
                <text fill="#879391" fontSize="10" textAnchor="end" x="45" y="252">0</text>

                {/* X-Axis Baseline Gridline */}
                <line stroke="#3d4947" strokeWidth="1" x1="55" x2="760" y1="250" y2="250" />
                {/* Vertical Date Gridlines */}
                <line stroke="#222940" strokeDasharray="2,2" strokeWidth="1" x1="150" x2="150" y1="0" y2="250" />
                <line stroke="#222940" strokeDasharray="2,2" strokeWidth="1" x1="270" x2="270" y1="0" y2="250" />
                <line stroke="#222940" strokeDasharray="2,2" strokeWidth="1" x1="390" x2="390" y1="0" y2="250" />
                <line stroke="#222940" strokeDasharray="2,2" strokeWidth="1" x1="510" x2="510" y1="0" y2="250" />
                <line stroke="#222940" strokeDasharray="2,2" strokeWidth="1" x1="630" x2="630" y1="0" y2="250" />

                {/* AQI Historical Area Path */}
                <path
                  d="M 55,188 C 85,182 120,170 150,158 C 180,146 210,165 240,155 C 270,145 300,122 330,135 C 360,148 390,180 420,172 C 450,164 480,140 510,130 C 540,120 570,145 600,152 C 630,158 660,168 690,162 C 720,156 740,160 760,155 L 760,250 L 55,250 Z"
                  fill="url(#aqiAreaGrad)"
                />
                {/* AQI Historical Line Stroke */}
                <path
                  d="M 55,188 C 85,182 120,170 150,158 C 180,146 210,165 240,155 C 270,145 300,122 330,135 C 360,148 390,180 420,172 C 450,164 480,140 510,130 C 540,120 570,145 600,152 C 630,158 660,168 690,162 C 720,156 740,160 760,155"
                  fill="none"
                  filter="drop-shadow(0 0 5px rgba(79,219,200,0.5))"
                  stroke="#4fdbc8"
                  strokeWidth="2.5"
                />
                {/* Secondary Moving Avg Line (Dashed Cyan) */}
                <path d="M 55,195 Q 200,165 350,142 T 600,158 T 760,150" fill="none" opacity="0.8" stroke="#7bd0ff" strokeDasharray="4,3" strokeWidth="1.5" />

                {/* Tooltip Marker */}
                <line stroke="#4fdbc8" strokeDasharray="2,2" strokeWidth="1.5" x1="690" x2="690" y1="30" y2="250" />
                <circle cx="690" cy="162" fill="#4fdbc8" r="5" stroke="#0a1228" strokeWidth="2" />
                <circle cx="690" cy="162" fill="none" opacity="0.6" r="9" stroke="#4fdbc8" strokeWidth="1" />

                {/* Tooltip Bubble Box */}
                <g transform="translate(620, 68)">
                  <rect fill="#171f35" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.6))" height="52" rx="6" stroke="#4fdbc8" strokeWidth="1" width="135" />
                  <text fill="#bcc9c6" fontFamily="Inter" fontSize="9" x="10" y="18">Oct 18 • Day 28 (Demo)</text>
                  <text fill="#dbe1ff" fontFamily="Space Grotesk" fontSize="12" fontWeight="700" x="10" y="34">AQI: 142</text>
                  <text fill="#ca8100" fontFamily="Inter" fontSize="10" fontWeight="600" x="68" y="34">Moderate</text>
                  <text fill="#7bd0ff" fontFamily="Inter" fontSize="8" x="10" y="46">PM2.5: 68 µg/m³</text>
                </g>

                {/* X-Axis Date Markings */}
                <text fill="#879391" fontSize="10" textAnchor="middle" x="55" y="268">Sep 21</text>
                <text fill="#879391" fontSize="10" textAnchor="middle" x="190" y="268">Sep 28</text>
                <text fill="#879391" fontSize="10" textAnchor="middle" x="330" y="268">Oct 05</text>
                <text fill="#879391" fontSize="10" textAnchor="middle" x="470" y="268">Oct 12</text>
                <text fill="#879391" fontSize="10" textAnchor="middle" x="610" y="268">Oct 19</text>
                <text fill="#4fdbc8" fontSize="10" fontWeight="600" textAnchor="middle" x="745" y="268">Today</text>
              </svg>
            </div>

            {/* Bottom CPCB Classifications Legend Strip */}
            <div className="mt-4 pt-3 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-3 text-xs font-label">
              <span className="text-on-surface-variant font-medium">CPCB Bands:</span>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-primary"></span><span className="text-on-surface">Good (0-50)</span></span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-secondary"></span><span className="text-on-surface">Satisfactory (51-100)</span></span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-tertiary"></span><span className="text-on-surface">Moderate (101-200)</span></span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-tertiary-container"></span><span className="text-on-surface">Poor (201-300)</span></span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-error"></span><span className="text-on-surface">Very Poor (301-400)</span></span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-error-container"></span><span className="text-on-surface">Severe (401-500)</span></span>
              </div>
            </div>
          </div>

          {/* 2. Daily Pollutant Breakdown */}
          <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline-variant/20">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-headline font-bold text-on-surface">Daily Pollutant Concentration Breakdown</h2>
                  <span className="text-[10px] font-label uppercase px-2 py-0.5 rounded bg-surface-container-high text-primary border border-primary/20">
                    (Demo Distribution based on 2015–2020 City-Day Historical Corpus)
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  7-Day particulate and gaseous components (µg/m³ or mg/m³) across historical urban telemetry hubs
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-label">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container border border-outline-variant/40"><span className="w-2.5 h-2.5 rounded-sm bg-primary"></span><span className="text-on-surface">PM2.5</span></span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container border border-outline-variant/40"><span className="w-2.5 h-2.5 rounded-sm bg-secondary"></span><span className="text-on-surface">PM10</span></span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container border border-outline-variant/40"><span className="w-2.5 h-2.5 rounded-sm bg-[#6366f1]"></span><span className="text-on-surface">NO2</span></span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container border border-outline-variant/40"><span className="w-2.5 h-2.5 rounded-sm bg-[#8b5cf6]"></span><span className="text-on-surface">SO2</span></span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container border border-outline-variant/40"><span className="w-2.5 h-2.5 rounded-sm bg-tertiary"></span><span className="text-on-surface">CO</span></span>
              </div>
            </div>

            {/* Stacked Bars Visual Container */}
            <div className="grid grid-cols-7 gap-3 sm:gap-4 pt-6 pb-2 items-end h-56">
              {[
                { day: 'Mon', val: 188, h1: 'h-14', h2: 'h-16', h3: 'h-8', h4: 'h-4', h5: 'h-3' },
                { day: 'Tue', val: 214, h1: 'h-16', h2: 'h-18', h3: 'h-9', h4: 'h-4', h5: 'h-3' },
                { day: 'Wed', val: 248, h1: 'h-20', h2: 'h-20', h3: 'h-10', h4: 'h-5', h5: 'h-4' },
                { day: 'Thu', val: 192, h1: 'h-14', h2: 'h-16', h3: 'h-8', h4: 'h-4', h5: 'h-3' },
                { day: 'Fri', val: 230, h1: 'h-18', h2: 'h-18', h3: 'h-9', h4: 'h-5', h5: 'h-4' },
                { day: 'Sat', val: 168, h1: 'h-12', h2: 'h-14', h3: 'h-7', h4: 'h-4', h5: 'h-3' },
                { day: 'Sun', val: 154, h1: 'h-10', h2: 'h-14', h3: 'h-6', h4: 'h-4', h5: 'h-3', isToday: true },
              ].map((item) => (
                <div key={item.day} className="flex flex-col items-center h-full justify-end group relative">
                  {item.isToday && (
                    <span className="absolute -top-6 text-[9px] font-headline font-semibold px-1.5 py-0.5 rounded bg-primary text-on-primary-container">
                      TODAY
                    </span>
                  )}
                  <div className={`text-[10px] font-mono mb-1 transition-colors ${item.isToday ? 'text-primary font-bold' : 'text-on-surface-variant group-hover:text-primary'}`}>
                    {item.val}
                  </div>
                  <div className={`w-full max-w-[42px] flex flex-col-reverse rounded-t overflow-hidden bg-surface-container-high transition-transform group-hover:scale-[1.02] ${item.isToday ? 'ring-1 ring-primary shadow-[0_0_12px_rgba(79,219,200,0.25)]' : ''}`}>
                    <div className={`${item.h1} bg-primary`} title="PM2.5"></div>
                    <div className={`${item.h2} bg-secondary`} title="PM10"></div>
                    <div className={`${item.h3} bg-[#6366f1]`} title="NO2"></div>
                    <div className={`${item.h4} bg-[#8b5cf6]`} title="SO2"></div>
                    <div className={`${item.h5} bg-tertiary`} title="CO"></div>
                  </div>
                  <span className={`text-xs font-label mt-2 ${item.isToday ? 'text-primary font-semibold' : 'text-on-surface-variant font-medium'}`}>
                    {item.day}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 text-[11px] font-label text-on-surface-variant bg-surface-container/60 p-2.5 rounded-lg flex items-center justify-between border border-outline-variant/20">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-secondary">info</span>
                Weekly meteorological profile illustrates typical Indo-Gangetic dispersion patterns across urban clusters.
              </span>
              <span className="text-[10px] font-mono text-outline">NAAQS Calibrated</span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN (4 COLS) ================= */}
        <div className="lg:col-span-4 space-y-6">
          {/* CPCB AQI Category Distribution */}
          <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-md flex flex-col justify-between">
            <div className="pb-3 border-b border-outline-variant/20 flex items-center justify-between">
              <div>
                <h2 className="text-base font-headline font-bold text-on-surface">CPCB AQI Category Distribution</h2>
                <p className="text-xs text-on-surface-variant mt-0.5 leading-snug">
                  Snapshot distribution across 524 stations (3,403 active sensor sub-indices, 265 offline/NaN)
                </p>
              </div>
              <span className="material-symbols-outlined text-outline text-base">pie_chart</span>
            </div>

            <div className="relative w-44 h-44 mx-auto my-4 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="none" r="38" stroke="#171f35" strokeWidth="12" />
                <circle cx="50" cy="50" fill="none" r="38" stroke="#4fdbc8" strokeDasharray="52.5 186.26" strokeDashoffset="0" strokeWidth="12" />
                <circle cx="50" cy="50" fill="none" r="38" stroke="#7bd0ff" strokeDasharray="81.18 157.58" strokeDashoffset="-52.5" strokeWidth="12" />
                <circle cx="50" cy="50" fill="none" r="38" stroke="#ffb95f" strokeDasharray="66.85 171.91" strokeDashoffset="-133.68" strokeWidth="12" />
                <circle cx="50" cy="50" fill="none" r="38" stroke="#ca8100" strokeDasharray="28.65 210.11" strokeDashoffset="-200.53" strokeWidth="12" />
                <circle cx="50" cy="50" fill="none" r="38" stroke="#ffb4ab" strokeDasharray="9.55 229.21" strokeDashoffset="-229.18" strokeWidth="12" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="font-headline text-2xl font-bold text-on-surface leading-none">524</span>
                <span className="text-[10px] font-label text-on-surface-variant uppercase tracking-wider mt-0.5">STATIONS</span>
                <span className="text-[9px] font-mono text-primary mt-0.5">3,403 Active</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-outline-variant/20 text-xs font-label">
              {[
                { name: 'Good (0-50)', color: 'bg-primary', stns: '115 stns', pct: '22%', text: 'text-primary' },
                { name: 'Satisfactory (51-100)', color: 'bg-secondary', stns: '178 stns', pct: '34%', text: 'text-secondary' },
                { name: 'Moderate (101-200)', color: 'bg-tertiary', stns: '147 stns', pct: '28%', text: 'text-tertiary' },
                { name: 'Poor (201-300)', color: 'bg-tertiary-container', stns: '63 stns', pct: '12%', text: 'text-tertiary-container' },
                { name: 'Very Poor / Severe (301+)', color: 'bg-error', stns: '21 stns', pct: '4%', text: 'text-error' },
              ].map((row) => (
                <div key={row.name} className="flex items-center justify-between py-1 px-2 rounded hover:bg-surface-container transition-colors">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${row.color}`}></span>
                    <span className="text-on-surface">{row.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-on-surface-variant">{row.stns}</span>
                    <span className={`${row.text} font-semibold w-8 text-right`}>{row.pct}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* City Snapshot Table */}
          <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-md">
            <div className="pb-3 border-b border-outline-variant/20 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-headline font-bold text-on-surface">City Snapshot Table</h2>
                <span className="text-[10px] font-mono text-outline">Oct 20, 2026 Baseline Snapshot</span>
              </div>
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-2.5 top-2 text-sm text-outline">search</span>
                <input
                  type="text"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="Filter city or pollutant..."
                  className="w-full bg-surface-container text-xs font-body pl-8 pr-3 py-1.5 rounded-lg border border-outline-variant/40 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs font-label">
                <thead>
                  <tr className="text-[11px] text-on-surface-variant border-b border-outline-variant/20">
                    <th className="pb-2 font-medium">City</th>
                    <th className="pb-2 font-medium">State/UT</th>
                    <th className="pb-2 font-medium">Prominent Pollutant</th>
                    <th className="pb-2 font-medium text-right">AQI / Sub-Index</th>
                    <th className="pb-2 font-medium text-right">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 font-body">
                  {filteredCities.map((c) => (
                    <tr key={c.city} className="hover:bg-surface-container/60 transition-colors">
                      <td className="py-2.5 font-medium text-on-surface">{c.city}</td>
                      <td className="py-2.5 text-outline font-mono text-[10px]">{c.state}</td>
                      <td className="py-2.5 text-on-surface-variant font-mono">{c.pollutant}</td>
                      <td className={`py-2.5 font-headline font-bold ${c.color} text-right`}>{c.aqi}</td>
                      <td className="py-2.5 text-right">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${c.badgeBg}`}>
                          {c.category}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between">
              <span className="text-[11px] text-on-surface-variant font-label">
                Showing {filteredCities.length} benchmark cities from 273 monitored cities
              </span>
              <button
                onClick={() => onNavigate('live')}
                className="inline-flex items-center gap-1 text-xs font-headline font-semibold text-primary hover:text-secondary transition-colors group cursor-pointer"
              >
                <span>View all 524 stations</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
