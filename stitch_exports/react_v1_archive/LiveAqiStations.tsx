import React, { useState } from 'react';
import type { PageId } from '../components/Header';

interface LiveAqiStationsProps {
  onNavigate: (page: PageId) => void;
}

interface Station {
  id: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lon: number;
  subindex: number;
  category: 'Good' | 'Satisfactory' | 'Moderate' | 'Poor' | 'Very Poor';
  color: string;
  activeSensors: string;
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  topPct: string;
  leftPct: string;
}

export const LiveAqiStations: React.FC<LiveAqiStationsProps> = ({ onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStationId, setSelectedStationId] = useState<string>('DL-004');
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');
  const [activeLayer, setActiveLayer] = useState<'heatmap' | 'wind' | 'density'>('heatmap');

  const stations: Station[] = [
    {
      id: 'DL-004',
      name: 'Anand Vihar, Delhi',
      city: 'Delhi',
      state: 'DL',
      lat: 28.65,
      lon: 77.31,
      subindex: 284,
      category: 'Poor',
      color: 'text-orange-400 bg-orange-500/20 border-orange-500/40',
      activeSensors: '6/6',
      pm25: 198,
      pm10: 310,
      no2: 74,
      so2: 18,
      co: 62,
      topPct: '28%',
      leftPct: '44%',
    },
    {
      id: 'MH-012',
      name: 'BKC, Mumbai',
      city: 'Mumbai',
      state: 'MH',
      lat: 19.06,
      lon: 72.87,
      subindex: 148,
      category: 'Moderate',
      color: 'text-amber-300 bg-amber-400/20 border-amber-400/40',
      activeSensors: '6/6',
      pm25: 112,
      pm10: 174,
      no2: 48,
      so2: 14,
      co: 42,
      topPct: '60%',
      leftPct: '32.5%',
    },
    {
      id: 'KA-008',
      name: 'BTM Layout, Bengaluru',
      city: 'Bengaluru',
      state: 'KA',
      lat: 12.91,
      lon: 77.61,
      subindex: 68,
      category: 'Satisfactory',
      color: 'text-lime-300 bg-lime-400/20 border-lime-400/40',
      activeSensors: '5/6',
      pm25: 64,
      pm10: 82,
      no2: 32,
      so2: 9,
      co: 28,
      topPct: '74%',
      leftPct: '42.5%',
    },
    {
      id: 'WB-005',
      name: 'Victoria Memorial, Kolkata',
      city: 'Kolkata',
      state: 'WB',
      lat: 22.54,
      lon: 88.34,
      subindex: 192,
      category: 'Moderate',
      color: 'text-amber-400 bg-amber-500/20 border-amber-500/40',
      activeSensors: '6/6',
      pm25: 142,
      pm10: 218,
      no2: 56,
      so2: 16,
      co: 48,
      topPct: '43.5%',
      leftPct: '72.5%',
    },
    {
      id: 'TN-003',
      name: 'IIT Madras, Chennai',
      city: 'Chennai',
      state: 'TN',
      lat: 12.99,
      lon: 80.23,
      subindex: 52,
      category: 'Satisfactory',
      color: 'text-lime-300 bg-lime-400/20 border-lime-400/40',
      activeSensors: '6/6',
      pm25: 48,
      pm10: 64,
      no2: 52,
      so2: 8,
      co: 22,
      topPct: '75.5%',
      leftPct: '51.5%',
    },
    {
      id: 'BR-002',
      name: 'Collectorate, Muzaffarpur',
      city: 'Muzaffarpur',
      state: 'BR',
      lat: 26.12,
      lon: 85.36,
      subindex: 312,
      category: 'Very Poor',
      color: 'text-rose-400 bg-rose-500/20 border-rose-500/40',
      activeSensors: '4/6',
      pm25: 242,
      pm10: 340,
      no2: 82,
      so2: 22,
      co: 74,
      topPct: '35%',
      leftPct: '64%',
    },
    {
      id: 'KL-001',
      name: 'Plammoodu, Thiruvananthapuram',
      city: 'Thiruvananthapuram',
      state: 'KL',
      lat: 8.51,
      lon: 76.95,
      subindex: 36,
      category: 'Good',
      color: 'text-emerald-300 bg-emerald-400/20 border-emerald-400/40',
      activeSensors: '5/6',
      pm25: 28,
      pm10: 42,
      no2: 18,
      so2: 6,
      co: 15,
      topPct: '87%',
      leftPct: '40%',
    },
  ];

  const filteredStations = stations.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.state.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedStation = stations.find((s) => s.id === selectedStationId) || stations[0];

  return (
    <main className="flex-1 w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* HEADER & FILTER TOOLBAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl md:text-2xl font-headline font-bold text-on-surface">
              CAAQMS Station Snapshot & Geospatial Explorer
            </h1>
            <span className="text-[11px] font-label font-semibold px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary border border-primary/30">
              Static Baseline Snapshot
            </span>
          </div>
          <p className="text-xs text-on-surface-variant font-body mt-0.5">
            Spatial distribution of 524 continuous monitoring stations across 273 cities (Snapshot captured October 20, 2026 10:00 AM IST)
          </p>
        </div>

        {/* View toggles & Quick stats */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/30 flex text-xs font-label">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === 'split' ? 'bg-primary text-on-primary-container font-semibold' : 'text-on-surface-variant'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === 'map' ? 'bg-primary text-on-primary-container font-semibold' : 'text-on-surface-variant'
              }`}
            >
              Map Only
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === 'list' ? 'bg-primary text-on-primary-container font-semibold' : 'text-on-surface-variant'
              }`}
            >
              Station List
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-xs font-mono text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>3,403 Active / 265 Offline</span>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-2 text-sm text-outline">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search station by name, city, or ID (e.g., Anand Vihar, BKC, DL-004)..."
            className="w-full bg-surface-container text-xs font-body pl-9 pr-3 py-1.5 rounded-lg border border-outline-variant/40 text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-label">
          {['All', 'Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary text-on-primary-container font-semibold shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN VIEW AREA (Map Left 65%, List Right 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* MAP CANVAS (lg:col-span-8 or 12) */}
        {(viewMode === 'split' || viewMode === 'map') && (
          <div
            className={`${
              viewMode === 'map' ? 'lg:col-span-12' : 'lg:col-span-8'
            } relative rounded-2xl bg-surface-container-lowest border border-outline-variant/40 overflow-hidden shadow-xl min-h-[600px] flex flex-col justify-between`}
          >
            {/* Map Top Floating Overlay Info & Layer Buttons */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5">
              <div className="bg-surface-container-low/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-outline-variant/40 text-[11px] font-mono text-on-surface-variant shadow-md">
                <span className="text-primary font-bold">Pan-India Telemetry Mesh</span> • 8.4°N to 34.2°N
              </div>
            </div>

            {/* Layer Controls Top Right */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
              <div className="bg-surface-container-low/95 backdrop-blur-md p-1 rounded-lg border border-outline-variant/40 flex flex-col gap-1 shadow-lg">
                <button
                  onClick={() => setActiveLayer('heatmap')}
                  className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                    activeLayer === 'heatmap' ? 'bg-primary text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  title="AQI Heatmap Layer"
                >
                  <span className="material-symbols-outlined text-base">layers</span>
                </button>
                <button
                  onClick={() => setActiveLayer('wind')}
                  className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                    activeLayer === 'wind' ? 'bg-primary text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  title="Wind Flow Dispersion"
                >
                  <span className="material-symbols-outlined text-base">air</span>
                </button>
                <button
                  onClick={() => setActiveLayer('density')}
                  className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                    activeLayer === 'density' ? 'bg-primary text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  title="Station Density Grid"
                >
                  <span className="material-symbols-outlined text-base">bubble_chart</span>
                </button>
              </div>
            </div>

            {/* India Map Canvas Graphic */}
            <div className="relative w-full h-[620px] flex items-center justify-center p-4">
              <div className="relative w-full max-w-xl h-full">
                {/* SVG Silhouette */}
                <svg
                  className="w-full h-full filter drop-shadow-[0_0_35px_rgba(79,219,200,0.08)]"
                  fill="none"
                  viewBox="0 0 600 700"
                >
                  <defs>
                    <linearGradient id="indiaDarkGrad2" x1="0%" x2="100%" y1="0%" y2="100%">
                      <stop offset="0%" stopColor="#171f35" stopOpacity="0.85" />
                      <stop offset="60%" stopColor="#131b31" stopOpacity="0.95" />
                      <stop offset="100%" stopColor="#0a1228" stopOpacity="0.9" />
                    </linearGradient>
                    <radialGradient cx="44%" cy="28%" id="delhiSmogGrad2" r="22%">
                      <stop offset="0%" stopColor="#f97316" stopOpacity="0.45" />
                      <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#131b31" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient cx="58%" cy="32%" id="gangaBasinGrad2" r="28%">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                      <stop offset="50%" stopColor="#f97316" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#131b31" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient cx="42%" cy="75%" id="southGrad2" r="30%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                      <stop offset="80%" stopColor="#06b6d4" stopOpacity="0.05" />
                      <stop offset="100%" stopColor="#131b31" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Lat/Lon gridlines */}
                  <g stroke="#3d4947" strokeDasharray="3 4" strokeOpacity="0.35">
                    <line x1="20" x2="580" y1="120" y2="120" />
                    <text fill="#879391" fontFamily="monospace" fontSize="9" x="30" y="115">32° N</text>
                    <line x1="20" x2="580" y1="230" y2="230" />
                    <text fill="#879391" fontFamily="monospace" fontSize="9" x="30" y="225">26° N (Tropic Zone)</text>
                    <line x1="20" x2="580" y1="380" y2="380" />
                    <text fill="#879391" fontFamily="monospace" fontSize="9" x="30" y="375">18° N</text>
                    <line x1="20" x2="580" y1="530" y2="530" />
                    <text fill="#879391" fontFamily="monospace" fontSize="9" x="30" y="525">10° N</text>
                    <line x1="160" x2="160" y1="40" y2="650" />
                    <text fill="#879391" fontFamily="monospace" fontSize="9" x="165" y="660">72° E</text>
                    <line x1="310" x2="310" y1="40" y2="650" />
                    <text fill="#879391" fontFamily="monospace" fontSize="9" x="315" y="660">80° E</text>
                    <line x1="460" x2="460" y1="40" y2="650" />
                    <text fill="#879391" fontFamily="monospace" fontSize="9" x="465" y="660">88° E</text>
                  </g>

                  {/* Contour */}
                  <path
                    d="M 235 55 C 255 45, 290 60, 295 90 C 305 110, 340 120, 360 145 C 390 155, 430 170, 460 160 C 500 150, 520 180, 550 195 C 540 220, 520 235, 500 240 C 480 250, 470 280, 475 305 C 460 325, 420 330, 410 360 C 400 400, 385 450, 360 495 C 340 535, 305 600, 290 635 C 285 645, 280 645, 275 635 C 250 580, 225 510, 205 450 C 190 410, 175 375, 170 345 C 150 335, 120 340, 110 320 C 100 295, 125 270, 145 255 C 165 240, 185 220, 190 180 C 195 150, 215 125, 215 95 Z"
                    fill="url(#indiaDarkGrad2)"
                    stroke="#38bdf8"
                    strokeOpacity="0.35"
                    strokeWidth="1.2"
                  />

                  {/* Ambient heat plumes if heatmap active */}
                  {activeLayer === 'heatmap' && (
                    <>
                      <circle cx="265" cy="195" fill="url(#delhiSmogGrad2)" r="95" />
                      <circle cx="340" cy="225" fill="url(#gangaBasinGrad2)" r="110" />
                      <circle cx="255" cy="510" fill="url(#southGrad2)" r="130" />
                    </>
                  )}

                  {/* Network link mesh */}
                  <g stroke="#4fdbc8" strokeDasharray="2 3" strokeOpacity="0.25" strokeWidth="0.75">
                    <line x1="265" x2="200" y1="195" y2="280" />
                    <line x1="265" x2="330" y1="195" y2="230" />
                    <line x1="330" x2="385" y1="230" y2="245" />
                    <line x1="385" x2="435" y1="245" y2="305" />
                    <line x1="200" x2="185" y1="280" y2="335" />
                    <line x1="185" x2="195" y1="335" y2="420" />
                    <line x1="195" x2="265" y1="420" y2="455" />
                    <line x1="265" x2="255" y1="455" y2="520" />
                    <line x1="255" x2="310" y1="520" y2="530" />
                    <line x1="255" x2="240" y1="520" y2="610" />
                  </g>
                </svg>

                {/* STATION NODES OVERLAY */}
                {stations.map((st) => {
                  const isSelected = selectedStationId === st.id;
                  return (
                    <div
                      key={st.id}
                      onClick={() => setSelectedStationId(st.id)}
                      style={{ top: st.topPct, left: st.leftPct }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-20"
                    >
                      <div className="relative flex items-center justify-center">
                        {isSelected && (
                          <span className="w-8 h-8 rounded-full bg-primary/20 animate-ping absolute"></span>
                        )}
                        <span
                          className={`w-3.5 h-3.5 rounded-full border-2 transition-transform group-hover:scale-150 ${
                            isSelected
                              ? 'border-primary bg-primary shadow-[0_0_12px_#4fdbc8]'
                              : st.category === 'Good'
                              ? 'border-emerald-400 bg-emerald-400'
                              : st.category === 'Satisfactory'
                              ? 'border-lime-400 bg-lime-400'
                              : st.category === 'Moderate'
                              ? 'border-amber-400 bg-amber-400'
                              : st.category === 'Poor'
                              ? 'border-orange-500 bg-orange-500'
                              : 'border-rose-500 bg-rose-500 animate-pulse'
                          }`}
                        ></span>
                      </div>
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden group-hover:flex flex-col bg-surface-container-high px-2 py-1 rounded border border-outline-variant text-[11px] whitespace-nowrap z-30 shadow-xl">
                        <span className="font-bold text-on-surface">{st.name}</span>
                        <span className="font-mono text-primary">Sub-Index: {st.subindex} ({st.category})</span>
                      </div>
                    </div>
                  );
                })}

                {/* PINNED STATION DETAIL OVERLAY (Selected Station) */}
                <div className="absolute left-6 top-16 w-[320px] sm:w-[350px] bg-surface-container/95 backdrop-blur-xl border border-primary/40 rounded-xl p-4 shadow-2xl z-30 select-text">
                  <div className="bg-amber-500/20 border border-amber-400/40 rounded-lg p-2 mb-2 text-[10px] text-amber-300 leading-tight flex items-start gap-1.5">
                    <span className="material-symbols-outlined text-xs text-amber-400 shrink-0 mt-0.5">warning</span>
                    <span>
                      <strong>CRITICAL NOTICE:</strong> Values represent dimensionless CPCB AQI sub-indices, not mass concentrations.
                    </span>
                  </div>

                  <div className="flex items-start justify-between border-b border-outline-variant/30 pb-2 mb-2.5">
                    <div>
                      <h3 className="text-xs font-bold text-on-surface font-headline">{selectedStation.name}</h3>
                      <div className="flex flex-col gap-0.5 mt-0.5 text-[10px] font-mono text-outline">
                        <span>ID: {selectedStation.id} • Lat: {selectedStation.lat}, Lon: {selectedStation.lon}</span>
                        <span className="text-secondary">Snapshot Time: 2026-10-20 10:00:00 IST</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold font-headline text-on-surface leading-none">{selectedStation.subindex}</div>
                      <span className="text-[10px] font-semibold text-primary uppercase tracking-wider block mt-1">
                        {selectedStation.category}
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] font-semibold text-primary mb-1.5">
                    CPCB AQI Sub-Indices (Dimensionless 0-500 scale)
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2.5">
                    <div className="p-2 rounded-lg bg-surface-container-high/80 border border-outline-variant/30">
                      <div className="flex justify-between items-center text-[10px] text-on-surface-variant">
                        <span className="font-semibold text-orange-300">PM2.5 Sub-Index</span>
                        <span className="font-mono text-on-surface font-bold">{selectedStation.pm25}</span>
                      </div>
                      <div className="w-full bg-surface-container-lowest h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-orange-500 h-full rounded-full" style={{ width: `${Math.min(100, (selectedStation.pm25 / 400) * 100)}%` }}></div>
                      </div>
                      <span className="text-[9px] text-outline font-mono mt-0.5 block">Sub-Index Score</span>
                    </div>

                    <div className="p-2 rounded-lg bg-surface-container-high/80 border border-outline-variant/30">
                      <div className="flex justify-between items-center text-[10px] text-on-surface-variant">
                        <span className="font-semibold text-amber-300">PM10 Sub-Index</span>
                        <span className="font-mono text-on-surface font-bold">{selectedStation.pm10}</span>
                      </div>
                      <div className="w-full bg-surface-container-lowest h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full" style={{ width: `${Math.min(100, (selectedStation.pm10 / 400) * 100)}%` }}></div>
                      </div>
                      <span className="text-[9px] text-outline font-mono mt-0.5 block">Sub-Index Score</span>
                    </div>

                    <div className="p-2 rounded-lg bg-surface-container-high/80 border border-outline-variant/30">
                      <div className="flex justify-between items-center text-[10px] text-on-surface-variant">
                        <span>NO2 Sub-Index</span>
                        <span className="font-mono text-on-surface font-semibold">{selectedStation.no2}</span>
                      </div>
                      <div className="w-full bg-surface-container-lowest h-1 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(100, (selectedStation.no2 / 200) * 100)}%` }}></div>
                      </div>
                      <span className="text-[9px] text-outline font-mono mt-0.5 block">Sub-Index Score</span>
                    </div>

                    <div className="p-2 rounded-lg bg-surface-container-high/80 border border-outline-variant/30 flex flex-col justify-between">
                      <div className="flex justify-between items-center text-[10px] text-on-surface-variant">
                        <span>SO2: <strong className="text-on-surface font-mono">{selectedStation.so2}</strong></span>
                        <span>CO: <strong className="text-on-surface font-mono">{selectedStation.co}</strong></span>
                      </div>
                      <div className="w-full bg-surface-container-lowest h-1 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-emerald-400 h-full rounded-full" style={{ width: '35%' }}></div>
                      </div>
                      <span className="text-[9px] text-outline font-mono mt-0.5 block">Gaseous Sub-Indices</span>
                    </div>
                  </div>

                  <div className="bg-surface-container-lowest/80 rounded-lg p-2 border border-outline-variant/20 mb-2.5 text-[10px]">
                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>CAAQMS Continuous Ambient Analyzer</span>
                      </span>
                      <span className="font-mono text-primary">Sensors: {selectedStation.activeSensors} Active</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigate('comparison')}
                      className="flex-1 py-1.5 px-2 bg-primary hover:bg-primary-container text-on-primary rounded text-[11px] font-semibold text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[13px]">compare_arrows</span>
                      <span>Compare City</span>
                    </button>
                    <button
                      onClick={() => onNavigate('quality')}
                      className="flex-1 py-1.5 px-2 bg-surface-container-high hover:bg-surface-bright text-on-surface rounded text-[11px] font-medium border border-outline-variant/40 text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[13px]">verified</span>
                      <span>Quality Audit</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Scale Legend */}
            <div className="p-3 bg-surface-container-low/95 border-t border-outline-variant/40 flex flex-wrap items-center justify-between gap-2 text-xs font-label">
              <div className="flex items-center gap-2">
                <span className="font-headline font-semibold text-on-surface">NAAQS AQI Scale:</span>
                <span className="text-[10px] text-outline font-mono">(CPCB Breakpoints)</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400"></span>Good (0-50)</span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container"><span className="w-2.5 h-2.5 rounded-sm bg-lime-400"></span>Satisfactory (51-100)</span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400"></span>Moderate (101-200)</span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container"><span className="w-2.5 h-2.5 rounded-sm bg-orange-400"></span>Poor (201-300)</span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>Very Poor (301-400)</span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container"><span className="w-2.5 h-2.5 rounded-sm bg-red-700"></span>Severe (401-500)</span>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT PANEL: STATION DIRECTORY LIST */}
        {(viewMode === 'split' || viewMode === 'list') && (
          <div
            className={`${
              viewMode === 'list' ? 'lg:col-span-12' : 'lg:col-span-4'
            } rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between overflow-hidden shadow-lg`}
          >
            {/* Header */}
            <div className="p-4 border-b border-outline-variant/30 bg-surface-container/60 flex items-center justify-between">
              <div>
                <h2 className="font-headline font-bold text-sm text-on-surface">Monitored Stations Directory</h2>
                <span className="text-[10px] font-mono text-primary">524 CAAQMS Stations across 273 Cities</span>
              </div>
              <span className="text-xs text-on-surface-variant font-mono">
                {filteredStations.length} Showing
              </span>
            </div>

            {/* List */}
            <div className="p-3 space-y-2 max-h-[520px] overflow-y-auto">
              {filteredStations.map((st) => {
                const isSelected = selectedStationId === st.id;
                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStationId(st.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-surface-container border-2 border-primary shadow-[0_0_15px_rgba(79,219,200,0.15)]'
                        : 'bg-surface-container-high/60 hover:bg-surface-container border-outline-variant/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-headline font-bold text-sm text-on-surface">{st.name}</h3>
                          {isSelected && (
                            <span className="material-symbols-outlined text-primary text-[14px]">check_circle</span>
                          )}
                        </div>
                        <div className="text-[11px] text-outline font-mono mt-0.5">
                          <span>{st.state} • Lat: {st.lat}, Lon: {st.lon}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${st.color}`}>
                        {st.category}
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-outline-variant/20 flex items-center justify-between text-xs font-label">
                      <span className="text-on-surface-variant flex items-center gap-1 text-[11px]">
                        Sub-Index: <strong className="text-on-surface font-mono">{st.subindex}</strong>
                      </span>
                      <span className="text-primary font-medium text-[10px]">
                        Active Sensors: {st.activeSensors}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Network Diagnostics */}
            <div className="p-3.5 bg-surface-container-lowest border-t border-outline-variant/30">
              <div className="flex items-center justify-between mb-2">
                <span className="font-headline font-semibold text-xs text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-sm">hub</span>
                  Station Network Diagnostics
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">Snapshot Validated</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                <div className="bg-surface-container-low p-1.5 rounded border border-outline-variant/30">
                  <div className="text-primary font-bold">524</div>
                  <div className="text-outline text-[9px]">Total Stations</div>
                </div>
                <div className="bg-surface-container-low p-1.5 rounded border border-outline-variant/30">
                  <div className="text-emerald-400 font-bold">3,403 (92.8%)</div>
                  <div className="text-outline text-[9px]">Active Meas.</div>
                </div>
                <div className="bg-surface-container-low p-1.5 rounded border border-outline-variant/30">
                  <div className="text-amber-400 font-bold">265 (7.2%)</div>
                  <div className="text-outline text-[9px]">Inactive / NaN</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
