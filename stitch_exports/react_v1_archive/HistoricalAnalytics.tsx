import React, { useState } from 'react';
import type { PageId } from '../components/Header';

interface HistoricalAnalyticsProps {
  onNavigate: (page: PageId) => void;
}

export const HistoricalAnalytics: React.FC<HistoricalAnalyticsProps> = ({ onNavigate }) => {
  const [corpus, setCorpus] = useState<'corpusA' | 'corpusB'>('corpusA');
  const [timeRange, setTimeRange] = useState<'5Y' | '3Y' | '2024' | '10Y'>('2024');
  const [aggMode, setAggMode] = useState<'daily' | 'monthly' | 'seasonal'>('daily');
  const [selectedCity, setSelectedCity] = useState('Delhi NCR');
  const [pollutants, setPollutants] = useState<{ [key: string]: boolean }>({
    'PM2.5': true,
    'PM10': true,
    'NO2': true,
    'SO2': false,
    'CO': false,
    'Ozone': false,
  });

  const togglePollutant = (key: string) => {
    setPollutants((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <main className="flex-1 w-full max-w-[1680px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Breadcrumb Bar */}
      <div className="flex items-center justify-between text-xs font-mono text-outline py-0.5 border-b border-outline-variant/20 mb-2">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span onClick={() => onNavigate('overview')} className="hover:text-primary cursor-pointer">Analytics Core</span>
          <span className="text-outline-variant">&gt;</span>
          <span className="hover:text-primary cursor-pointer">Time-Series Aggregation</span>
          <span className="text-outline-variant">&gt;</span>
          <span className="text-primary font-semibold">Historical Analytics &amp; Seasonal Trends</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-tertiary font-medium">
          <span className="material-symbols-outlined text-sm">history_edu</span>
          <span>Non-Destructive Observation Protocol</span>
        </div>
      </div>

      {/* Interactive Filter & Parameter Bar */}
      <section className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-4 shadow-xl backdrop-blur-md">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-outline-variant/20">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-mono text-outline uppercase font-semibold">Corpus Architecture:</span>
              <div className="inline-flex rounded-lg bg-surface-container-lowest p-1 border border-outline-variant/40 text-xs font-medium">
                <button
                  onClick={() => setCorpus('corpusA')}
                  className={`px-3 py-1.5 rounded-md font-bold shadow flex items-center gap-1.5 transition-colors ${
                    corpus === 'corpusA'
                      ? 'bg-primary-container text-on-primary-container'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">dataset</span>
                  Corpus A: CPCB City AQI Bulletins (2015–2025, 297 Cities)
                </button>
                <button
                  onClick={() => setCorpus('corpusB')}
                  className={`px-3 py-1.5 rounded-md font-bold shadow flex items-center gap-1.5 transition-colors ${
                    corpus === 'corpusB'
                      ? 'bg-primary-container text-on-primary-container'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">table_view</span>
                  Corpus B: Ambient Pollutant Concentrations (2015–2020, 26 Cities)
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-surface-container text-secondary text-xs px-2.5 py-1 rounded border border-secondary/30 font-mono">
                Active: {selectedCity} Monitoring Core
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-surface-container/60 border border-secondary/20 rounded-lg px-3 py-2 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-secondary text-base">info</span>
            <span>
              <strong className="text-secondary font-semibold">Notice:</strong> City AQI Bulletins extend through Dec 31, 2025 (471,015 rows); detailed individual pollutant mass concentrations (PM2.5, PM10, etc.) cover Jan 2015 to Jul 1, 2020.
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-surface-container px-3.5 py-2 rounded-lg border border-outline-variant/50 text-xs font-mono">
                <span className="material-symbols-outlined text-primary text-base">calendar_month</span>
                <span className="text-on-surface font-medium">
                  {corpus === 'corpusA' ? '2015-05-01 to 2025-12-31' : '2015-01-01 to 2020-07-01'}
                </span>
              </div>
              <div className="inline-flex rounded-lg bg-surface-container-lowest p-1 border border-outline-variant/30 text-xs">
                {(['5Y', '3Y', '2024', '10Y'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      timeRange === r
                        ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {r === '5Y' ? '5-Yr Baseline' : r === '3Y' ? 'Recent 3 Yrs' : r === '2024' ? '2024 Full Year' : 'Full Corpus'}
                  </button>
                ))}
              </div>
              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="bg-surface-container text-xs font-semibold text-on-surface border border-outline-variant/50 rounded-lg px-3 py-2 focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="Delhi NCR">Delhi NCR (12 CAAQMS Stations)</option>
                  <option value="Mumbai">Mumbai (8 CAAQMS Stations)</option>
                  <option value="Bengaluru">Bengaluru (6 CAAQMS Stations)</option>
                  <option value="Kolkata">Kolkata (7 CAAQMS Stations)</option>
                  <option value="Chennai">Chennai (5 CAAQMS Stations)</option>
                  <option value="Hyderabad">Hyderabad (6 CAAQMS Stations)</option>
                </select>
              </div>
            </div>

            {/* Pollutant checkboxes */}
            <div className="flex flex-wrap items-center gap-1.5 bg-surface-container-lowest/60 p-1.5 rounded-lg border border-outline-variant/20">
              <span className="text-[11px] font-mono text-outline uppercase px-2 font-semibold">Pollutants:</span>
              {Object.keys(pollutants).map((p) => (
                <label
                  key={p}
                  onClick={() => togglePollutant(p)}
                  className={`cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    pollutants[p]
                      ? 'bg-primary/10 text-primary border border-primary/40'
                      : 'text-on-surface-variant hover:text-on-surface border border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={pollutants[p]}
                    readOnly
                    className="w-3.5 h-3.5 rounded bg-surface-container border-primary text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span>{p}</span>
                </label>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <div className="hidden lg:inline-flex rounded-lg bg-surface-container-lowest p-1 border border-outline-variant/30 text-xs">
                {(['daily', 'monthly', 'seasonal'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setAggMode(m)}
                    className={`px-2.5 py-1 rounded capitalize transition-colors ${
                      aggMode === m ? 'bg-surface-bright text-on-surface font-medium' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {m === 'daily' ? 'Daily Observed' : m === 'monthly' ? 'Monthly Mean' : 'Seasonal Regimes'}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => onNavigate('comparison')}
                className="flex items-center gap-1.5 bg-primary hover:bg-primary-fixed text-on-primary font-semibold text-xs px-3.5 py-2 rounded-lg transition-all active:scale-95 shadow"
              >
                <span className="material-symbols-outlined text-base">compare_arrows</span>
                <span>Compare Cities</span>
              </button>
              <button 
                onClick={() => onNavigate('quality')}
                className="flex items-center gap-1.5 bg-surface-container-high hover:bg-surface-bright border border-secondary/30 text-secondary text-xs px-3 py-2 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-base">verified_user</span>
                <span>Audit Trail</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Summary Metric Strip (4 Bento Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-low border border-outline-variant/30 hover:border-primary/40 rounded-xl p-5 relative overflow-hidden transition-all group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-tertiary/10 rounded-full blur-xl group-hover:scale-125 transition-transform"></div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-medium text-outline tracking-wider uppercase">Annual Mean AQI</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-tertiary-container/30 text-tertiary border border-tertiary/30">Moderate</span>
          </div>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="font-headline text-4xl font-extrabold text-on-surface">188</span>
            <span className="text-xs font-mono text-outline">NAAQS Benchmark: 100</span>
          </div>
          <div className="flex flex-col gap-1 text-xs text-on-surface-variant">
            <div className="flex items-center gap-1.5 text-error font-medium">
              <span className="material-symbols-outlined text-base">trending_up</span>
              <span>Historical Peak: <strong>432</strong> in Nov</span>
            </div>
            <p className="text-[11px] font-mono text-outline mt-0.5">(Illustrative Demo Slice - Non-destructive CPCB mean)</p>
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 hover:border-primary/40 rounded-xl p-5 relative overflow-hidden transition-all group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-error/10 rounded-full blur-xl group-hover:scale-125 transition-transform"></div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-medium text-outline tracking-wider uppercase">Extreme Episodic Spikes</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-error-container/30 text-error border border-error/30">543 Records</span>
          </div>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="font-headline text-3xl font-extrabold text-on-surface">AQI &gt; 500</span>
            <span className="text-xs font-mono text-error font-semibold">Records Flagged</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
            <span className="material-symbols-outlined text-base text-secondary">shield</span>
            <span className="text-[11px] font-mono">(Preserved intact in historical corpus for extreme event research • 0 Clamped)</span>
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 hover:border-primary/40 rounded-xl p-5 relative overflow-hidden transition-all group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-error/10 rounded-full blur-xl group-hover:scale-125 transition-transform"></div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-medium text-outline tracking-wider uppercase">Winter Inversion Mean (Nov–Jan)</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-error-container/40 text-error border border-error/40">Poor / Severe</span>
          </div>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="font-headline text-4xl font-extrabold text-on-surface">AQI 294</span>
            <span className="text-xs font-mono text-error font-semibold">Poor/Severe</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-base text-tertiary">compress</span>
            <span>Thermal inversion &amp; stagnant boundary layer trapping (+142% vs Monsoon)</span>
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 hover:border-primary/40 rounded-xl p-5 relative overflow-hidden transition-all group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/10 rounded-full blur-xl group-hover:scale-125 transition-transform"></div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-medium text-outline tracking-wider uppercase">Monsoon Washout (Jul–Aug)</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-container/30 text-primary border border-primary/40">Satisfactory</span>
          </div>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="font-headline text-4xl font-extrabold text-primary">AQI 62</span>
            <span className="text-xs font-mono text-primary font-semibold">Satisfactory</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-base text-primary">water_drop</span>
            <span>Precipitation scavenging &amp; seasonal dip (-78% vs Winter)</span>
          </div>
        </div>
      </section>

      {/* Main Historical Trend Line Chart (Wide Card) */}
      <section className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-6 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b border-outline-variant/20">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-headline text-lg sm:text-xl font-bold text-on-surface tracking-tight">
                Historical AQI Trajectory (Illustrative Demo Slice from CPCB 2015–2025 Archive)
              </h2>
              <span className="bg-surface-container px-2 py-0.5 rounded text-[11px] font-mono text-secondary border border-secondary/30">
                {selectedCity} • 12-Station Mean
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Comparative analysis mapping observed daily recorded index values against the multi-year CPCB benchmark envelope.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="w-4 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(79,219,200,0.8)]"></span>
              <span className="text-on-surface">Observed Daily AQI</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 border-b-2 border-dashed border-secondary"></span>
              <span className="text-secondary">5-Yr Historical Baseline</span>
            </div>
            <div className="flex items-center gap-1.5 text-outline text-[11px] font-mono bg-surface-container px-2.5 py-1 rounded">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span>Recorded at 24h Intervals</span>
            </div>
          </div>
        </div>

        {/* High-Fidelity SVG Line Chart Visualization */}
        <div className="relative w-full h-[360px] sm:h-[400px]">
          {/* Seasonal Regime Highlights Overlay */}
          <div className="absolute inset-x-12 top-6 bottom-10 grid grid-cols-12 pointer-events-none z-0">
            <div className="col-span-2 bg-error/5 border-r border-error/10 relative">
              <span className="absolute top-2 left-2 text-[10px] font-mono font-semibold text-error/80 uppercase tracking-wider bg-surface-container-lowest/80 px-1.5 py-0.5 rounded">
                Winter Inversion
              </span>
            </div>
            <div className="col-span-1 border-r border-outline-variant/10"></div>
            <div className="col-span-3 bg-tertiary/5 border-r border-tertiary/15 relative">
              <span className="absolute top-2 left-2 text-[10px] font-mono font-semibold text-tertiary/80 uppercase tracking-wider bg-surface-container-lowest/80 px-1.5 py-0.5 rounded">
                Crustal Dust &amp; Ozone
              </span>
            </div>
            <div className="col-span-3 bg-primary/5 border-r border-primary/15 relative">
              <span className="absolute top-2 left-2 text-[10px] font-mono font-semibold text-primary/80 uppercase tracking-wider bg-surface-container-lowest/80 px-1.5 py-0.5 rounded">
                Monsoon Cleansing
              </span>
            </div>
            <div className="col-span-3 bg-error/10 relative">
              <span className="absolute top-2 left-2 text-[10px] font-mono font-semibold text-error uppercase tracking-wider bg-surface-container-lowest/90 px-1.5 py-0.5 rounded border border-error/30">
                Post-Harvest Peak
              </span>
            </div>
          </div>

          {/* SVG Canvas */}
          <svg className="w-full h-full overflow-visible relative z-10" preserveAspectRatio="none" viewBox="0 0 1000 360">
            <defs>
              <linearGradient id="histAreaGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#4fdbc8" stopOpacity="0.25" />
                <stop offset="60%" stopColor="#4fdbc8" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#4fdbc8" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            <line stroke="#ffb4ab" strokeDasharray="3 3" strokeOpacity="0.3" strokeWidth="1" x1="50" x2="980" y1="40" y2="40" />
            <text fill="#ffb4ab" fontFamily="monospace" fontSize="10" opacity="0.8" x="985" y="44">400 Severe</text>

            <line stroke="#ca8100" strokeDasharray="3 3" strokeOpacity="0.3" strokeWidth="1" x1="50" x2="980" y1="100" y2="100" />
            <text fill="#ca8100" fontFamily="monospace" fontSize="10" opacity="0.8" x="985" y="104">300 Very Poor</text>

            <line stroke="#ffb95f" strokeDasharray="3 3" strokeOpacity="0.25" strokeWidth="1" x1="50" x2="980" y1="170" y2="170" />
            <text fill="#ffb95f" fontFamily="monospace" fontSize="10" opacity="0.8" x="985" y="174">200 Moderate</text>

            <line stroke="#00a6e0" strokeDasharray="3 3" strokeOpacity="0.25" strokeWidth="1" x1="50" x2="980" y1="240" y2="240" />
            <text fill="#00a6e0" fontFamily="monospace" fontSize="10" opacity="0.8" x="985" y="244">100 Sat.</text>

            <line stroke="#4fdbc8" strokeDasharray="3 3" strokeOpacity="0.25" strokeWidth="1" x1="50" x2="980" y1="290" y2="290" />
            <text fill="#4fdbc8" fontFamily="monospace" fontSize="10" opacity="0.8" x="985" y="294">50 Good</text>

            {/* Vertical Month Gridlines */}
            <g stroke="#3d4947" strokeOpacity="0.25" strokeWidth="1">
              {[50, 134, 218, 302, 386, 470, 554, 638, 722, 806, 890, 974].map((x) => (
                <line key={x} x1={x} x2={x} y1="30" y2="320" />
              ))}
            </g>

            {/* Baseline Curve (Dashed Cyan) */}
            <path
              d="M 50,75 C 92,90 134,130 176,145 C 218,160 260,175 302,185 C 344,195 386,180 428,190 C 470,200 512,250 554,270 C 596,285 638,280 680,265 C 722,250 764,200 806,130 C 848,70 890,65 932,70 L 974,78"
              fill="none"
              stroke="#7bd0ff"
              strokeDasharray="5 4"
              strokeOpacity="0.85"
              strokeWidth="2"
            />

            {/* Observed Area Gradient */}
            <path
              d="M 50,68 C 92,85 134,125 176,140 C 218,155 260,180 302,175 C 344,170 386,165 428,210 C 470,240 512,285 554,295 C 596,305 638,290 680,270 C 722,240 764,130 806,90 C 848,45 890,32 932,60 L 974,72 L 974,320 L 50,320 Z"
              fill="url(#histAreaGrad)"
            />

            {/* Observed Solid Line */}
            <path
              d="M 50,68 C 92,85 134,125 176,140 C 218,155 260,180 302,175 C 344,170 386,165 428,210 C 470,240 512,285 554,295 C 596,305 638,290 680,270 C 722,240 764,130 806,90 C 848,45 890,32 932,60 L 974,72"
              fill="none"
              stroke="#4fdbc8"
              strokeLinecap="round"
              strokeWidth="3"
            />

            {/* Key Nodes */}
            <circle cx="50" cy="68" fill="#ffb4ab" r="4" stroke="#0a1228" strokeWidth="2" />
            <circle cx="302" cy="175" fill="#ffb95f" r="4" stroke="#0a1228" strokeWidth="2" />
            <circle cx="554" cy="295" fill="#4fdbc8" r="4" stroke="#0a1228" strokeWidth="2" />
            <circle cx="806" cy="90" fill="#ca8100" r="5" stroke="#0a1228" strokeWidth="2" />
            <circle cx="890" cy="32" fill="#ffb4ab" r="6" stroke="#0a1228" strokeWidth="2" className="animate-ping" />
            <circle cx="890" cy="32" fill="#ffb4ab" r="5" stroke="#0a1228" strokeWidth="2" />

            {/* Pinned Tooltip at Nov Peak */}
            <g transform="translate(735, 12)">
              <rect width="170" height="74" rx="6" fill="#131b31" stroke="#3d4947" strokeWidth="1" className="shadow-xl" />
              <text x="12" y="18" fill="#dbe1ff" fontFamily="Space Grotesk" fontSize="11" fontWeight="700">Nov 08 Peak Exceedance</text>
              <text x="12" y="34" fill="#ffb4ab" fontFamily="Inter" fontSize="11" fontWeight="600">AQI 432 • Severe Spike</text>
              <text x="12" y="48" fill="#bcc9c6" fontFamily="monospace" fontSize="10">PM2.5: 398 µg/m³</text>
              <text x="12" y="62" fill="#879391" fontFamily="monospace" fontSize="9">Wind: 0.8 m/s (Calm NW)</text>
              <line x1="85" y1="74" x2="155" y2="20" stroke="#ffb4ab" strokeDasharray="2 2" strokeWidth="1" />
            </g>
          </svg>

          {/* X-Axis Month Labels */}
          <div className="absolute bottom-1 inset-x-0 flex justify-between px-8 text-xs font-mono font-medium text-outline">
            {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>

        {/* Insight Pills */}
        <div className="mt-4 pt-4 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-on-surface font-semibold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-sm">psychology</span>
              Key Meteorological Regimes:
            </span>
            <span className="bg-surface-container px-2.5 py-1 rounded text-[11px] font-mono text-error/90 border border-error/20">Winter Inversion (Nov–Jan)</span>
            <span className="bg-surface-container px-2.5 py-1 rounded text-[11px] font-mono text-tertiary border border-tertiary/20">Summer Dust (Apr–Jun)</span>
            <span className="bg-surface-container px-2.5 py-1 rounded text-[11px] font-mono text-primary border border-primary/20">Monsoon Cleansing (Jul–Sep)</span>
          </div>
          <div className="flex items-center gap-2 bg-surface-container-highest/50 px-3 py-1 rounded-lg border border-outline-variant/30 text-[11px] font-mono text-on-surface">
            <span className="material-symbols-outlined text-secondary text-sm">verified_user</span>
            <span>Missing days are retained intact as authentic omission; no synthetic data imputed.</span>
          </div>
        </div>
      </section>

      {/* Bottom Two Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Seasonal Pollutant Dynamics (7 cols) */}
        <section className="lg:col-span-7 bg-surface-container-low border border-outline-variant/40 rounded-xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-4">
              <div>
                <h3 className="font-headline text-base sm:text-lg font-bold text-on-surface tracking-tight">
                  Seasonal Pollutant Dynamics (2015–2020 Pollutant Corpus Slice)
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Mass concentration corpus covers 2015–mid-2020 (29,531 records across 26 cities)
                </p>
              </div>
              <span className="text-xs font-mono text-primary bg-primary/10 border border-primary/30 px-2 py-1 rounded">
                NAAQS Standard Limit
              </span>
            </div>

            <div className="space-y-3.5">
              {/* PM2.5 */}
              <div className="bg-surface-container/60 p-3.5 rounded-lg border border-outline-variant/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-on-surface">PM2.5</span>
                    <span className="text-[11px] text-outline font-mono">Fine Respirable Matter (&lt;2.5µm)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-outline">Standard: 60 µg/m³</span>
                    <span className="text-error font-semibold bg-error/10 px-2 py-0.5 rounded border border-error/20">2.7x Exceedance</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-on-surface-variant">
                      <span>Winter Peak</span>
                      <span className="font-mono text-error font-bold">164 µg/m³</span>
                    </div>
                    <div className="w-full bg-surface-container-highest rounded-full h-2">
                      <div className="bg-error h-2 rounded-full" style={{ width: '90%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-on-surface-variant">
                      <span>Summer Dust</span>
                      <span className="font-mono text-tertiary font-bold">98 µg/m³</span>
                    </div>
                    <div className="w-full bg-surface-container-highest rounded-full h-2">
                      <div className="bg-tertiary h-2 rounded-full" style={{ width: '54%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-on-surface-variant">
                      <span>Monsoon Washout</span>
                      <span className="font-mono text-primary font-bold">32 µg/m³</span>
                    </div>
                    <div className="w-full bg-surface-container-highest rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '18%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PM10 */}
              <div className="bg-surface-container/60 p-3.5 rounded-lg border border-outline-variant/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-on-surface">PM10</span>
                    <span className="text-[11px] text-outline font-mono">Coarse Particulate Dust (&lt;10µm)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-outline">Standard: 100 µg/m³</span>
                    <span className="text-tertiary font-semibold bg-tertiary/10 px-2 py-0.5 rounded border border-tertiary/20">2.9x Exceedance</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-on-surface-variant">
                      <span>Winter Peak</span>
                      <span className="font-mono text-error font-bold">286 µg/m³</span>
                    </div>
                    <div className="w-full bg-surface-container-highest rounded-full h-2">
                      <div className="bg-error h-2 rounded-full" style={{ width: '86%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-on-surface-variant">
                      <span>Summer Dust</span>
                      <span className="font-mono text-tertiary font-bold">242 µg/m³</span>
                    </div>
                    <div className="w-full bg-surface-container-highest rounded-full h-2">
                      <div className="bg-tertiary h-2 rounded-full" style={{ width: '73%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-on-surface-variant">
                      <span>Monsoon Washout</span>
                      <span className="font-mono text-primary font-bold">68 µg/m³</span>
                    </div>
                    <div className="w-full bg-surface-container-highest rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* NO2 */}
              <div className="bg-surface-container/60 p-3.5 rounded-lg border border-outline-variant/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-on-surface">NO2</span>
                    <span className="text-[11px] text-outline font-mono">Vehicular &amp; Combustion Emissions</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-outline">Standard: 80 µg/m³</span>
                    <span className="text-secondary font-semibold bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20">Within Bounds</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-on-surface-variant">
                      <span>Winter Peak</span>
                      <span className="font-mono text-tertiary font-bold">74 µg/m³</span>
                    </div>
                    <div className="w-full bg-surface-container-highest rounded-full h-2">
                      <div className="bg-tertiary h-2 rounded-full" style={{ width: '62%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-on-surface-variant">
                      <span>Summer Dust</span>
                      <span className="font-mono text-secondary font-bold">48 µg/m³</span>
                    </div>
                    <div className="w-full bg-surface-container-highest rounded-full h-2">
                      <div className="bg-secondary h-2 rounded-full" style={{ width: '40%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-on-surface-variant">
                      <span>Monsoon Washout</span>
                      <span className="font-mono text-primary font-bold">26 µg/m³</span>
                    </div>
                    <div className="w-full bg-surface-container-highest rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '22%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SO2 */}
              <div className="bg-surface-container/60 p-3.5 rounded-lg border border-outline-variant/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-on-surface">SO2</span>
                    <span className="text-[11px] text-outline font-mono">Industrial Point Source &amp; Power Plants</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-outline">Standard: 80 µg/m³</span>
                    <span className="text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded border border-primary/20">Satisfactory</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-on-surface-variant">
                      <span>Winter Peak</span>
                      <span className="font-mono text-secondary font-bold">19 µg/m³</span>
                    </div>
                    <div className="w-full bg-surface-container-highest rounded-full h-2">
                      <div className="bg-secondary h-2 rounded-full" style={{ width: '24%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-on-surface-variant">
                      <span>Summer Dust</span>
                      <span className="font-mono text-secondary font-bold">16 µg/m³</span>
                    </div>
                    <div className="w-full bg-surface-container-highest rounded-full h-2">
                      <div className="bg-secondary h-2 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-on-surface-variant">
                      <span>Monsoon Washout</span>
                      <span className="font-mono text-primary font-bold">11 µg/m³</span>
                    </div>
                    <div className="w-full bg-surface-container-highest rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '14%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-[11px] font-mono text-outline">
            <span>*Values indicate arithmetic seasonal daily averages</span>
            <span onClick={() => onNavigate('quality')} className="text-primary hover:underline cursor-pointer">
              View Statistical Variance &amp; Audit Trail
            </span>
          </div>
        </section>

        {/* Right Column: Monthly AQI Category Distribution Matrix (5 cols) */}
        <section className="lg:col-span-5 bg-surface-container-low border border-outline-variant/40 rounded-xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-4">
              <div>
                <h3 className="font-headline text-base sm:text-lg font-bold text-on-surface tracking-tight">
                  Monthly AQI Category Distribution (CPCB Classification)
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">CPCB Air Quality Index Categorical Spread (2024)</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" title="Good"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-secondary inline-block" title="Satisfactory"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary inline-block" title="Moderate"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container inline-block" title="Poor"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-error inline-block" title="Severe"></span>
              </div>
            </div>

            {/* 12 Stacked Progress Bars */}
            <div className="space-y-2 text-xs">
              {[
                { month: 'JAN', bars: [{ w: '48%', c: 'bg-error', t: 'Severe: 15d' }, { w: '35%', c: 'bg-tertiary-container', t: 'Poor: 11d' }, { w: '17%', c: 'bg-tertiary', t: 'Moderate: 5d' }], label: '15d Sev', lc: 'text-error' },
                { month: 'FEB', bars: [{ w: '24%', c: 'bg-error' }, { w: '42%', c: 'bg-tertiary-container' }, { w: '34%', c: 'bg-tertiary' }], label: '7d Sev', lc: 'text-outline' },
                { month: 'MAR', bars: [{ w: '18%', c: 'bg-tertiary-container' }, { w: '58%', c: 'bg-tertiary' }, { w: '24%', c: 'bg-secondary' }], label: '18d Mod', lc: 'text-tertiary' },
                { month: 'APR', bars: [{ w: '25%', c: 'bg-tertiary-container' }, { w: '55%', c: 'bg-tertiary' }, { w: '20%', c: 'bg-secondary' }], label: '16d Mod', lc: 'text-tertiary' },
                { month: 'MAY', bars: [{ w: '30%', c: 'bg-tertiary-container' }, { w: '50%', c: 'bg-tertiary' }, { w: '20%', c: 'bg-secondary' }], label: '15d Mod', lc: 'text-tertiary' },
                { month: 'JUN', bars: [{ w: '15%', c: 'bg-tertiary-container' }, { w: '45%', c: 'bg-tertiary' }, { w: '30%', c: 'bg-secondary' }, { w: '10%', c: 'bg-primary' }], label: '9d Sat', lc: 'text-secondary' },
                { month: 'JUL', bars: [{ w: '25%', c: 'bg-secondary' }, { w: '75%', c: 'bg-primary' }], label: '24d Sat', lc: 'text-primary font-bold', highlight: 'bg-primary/5' },
                { month: 'AUG', bars: [{ w: '10%', c: 'bg-tertiary' }, { w: '35%', c: 'bg-secondary' }, { w: '55%', c: 'bg-primary' }], label: '17d Clean', lc: 'text-primary' },
                { month: 'SEP', bars: [{ w: '25%', c: 'bg-tertiary' }, { w: '50%', c: 'bg-secondary' }, { w: '25%', c: 'bg-primary' }], label: '15d Sat', lc: 'text-secondary' },
                { month: 'OCT', bars: [{ w: '22%', c: 'bg-error' }, { w: '48%', c: 'bg-tertiary-container' }, { w: '30%', c: 'bg-tertiary' }], label: '15d Poor', lc: 'text-tertiary-container' },
                { month: 'NOV', bars: [{ w: '60%', c: 'bg-error' }, { w: '30%', c: 'bg-tertiary-container' }, { w: '10%', c: 'bg-tertiary' }], label: '18d Sev', lc: 'text-error font-bold', highlight: 'bg-error/5' },
                { month: 'DEC', bars: [{ w: '45%', c: 'bg-error' }, { w: '40%', c: 'bg-tertiary-container' }, { w: '15%', c: 'bg-tertiary' }], label: '14d Sev', lc: 'text-error' },
              ].map((row) => (
                <div key={row.month} className={`flex items-center gap-3 py-0.5 px-1 rounded ${row.highlight || ''}`}>
                  <span className={`w-8 font-mono text-[11px] ${row.month === 'JUL' ? 'text-primary font-bold' : row.month === 'NOV' ? 'text-error font-bold' : 'text-outline font-semibold'}`}>
                    {row.month}
                  </span>
                  <div className="flex-1 h-3.5 bg-surface-container-highest rounded overflow-hidden flex">
                    {row.bars.map((b, i) => (
                      <div key={i} className={`${b.c} h-full`} style={{ width: b.w }} title={'t' in b ? (b as { t?: string }).t : undefined}></div>
                    ))}
                  </div>
                  <span className={`w-14 text-right font-mono text-[10px] ${row.lc}`}>{row.label}</span>
                </div>
              ))}
            </div>

            {/* Highlight Cards */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-outline-variant/20">
              <div className="bg-surface-container p-2.5 rounded-lg border border-error/30 text-xs">
                <span className="text-error font-semibold block text-[11px]">Peak Critical Month</span>
                <span className="font-headline font-bold text-on-surface">November (18 Severe Days)</span>
                <p className="text-[10px] text-outline mt-0.5">Biomass residue + boundary layer trapping</p>
              </div>
              <div className="bg-surface-container p-2.5 rounded-lg border border-primary/30 text-xs">
                <span className="text-primary font-semibold block text-[11px]">Optimal Air Quality</span>
                <span className="font-headline font-bold text-on-surface">July (24 Satisfactory Days)</span>
                <p className="text-[10px] text-outline mt-0.5">Monsoon convective scavenging peak</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 flex items-center justify-between text-[11px] font-mono text-outline">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-primary"></span> 0-50</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-secondary"></span> 51-100</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-tertiary"></span> 101-200</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-tertiary-container"></span> 201-300</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-error"></span> 301+</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
