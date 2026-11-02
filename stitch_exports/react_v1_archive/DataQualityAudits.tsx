import React, { useState } from 'react';
import type { PageId } from '../components/Header';

interface DataQualityAuditsProps {
  onNavigate: (page: PageId) => void;
}

export const DataQualityAudits: React.FC<DataQualityAuditsProps> = ({ onNavigate }) => {
  const [selectedDataset, setSelectedDataset] = useState('cpcb_historical_bulletins_471k.csv');
  const [activeFilter, setActiveFilter] = useState<'all' | 'missing' | 'duplicate' | 'flags' | 'inconsistent'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const auditLogEntries = [
    {
      city: 'Anand Vihar, Delhi',
      node: 'NODE_DL_004',
      date: '2024-11-04',
      param: 'AQI & PM2.5',
      raw: 'AQI 538',
      rawSub: 'PM2.5: 412 µg/m³',
      flag: 'flag_aqi_above_500 = True',
      flagClass: 'bg-tertiary-container/30 text-tertiary border-tertiary/40',
      expected: 'Expected: Severe',
      recorded: 'Recorded: Severe (>500)',
      policy: 'Diagnostic Flag Added / Raw Value Retained Intact',
      policySub: 'Preserved for severe pollution episode research',
      status: 'Preserved Intact',
    },
    {
      city: 'BKC, Mumbai',
      node: 'NODE_MH_012',
      date: '2024-05-18',
      param: 'PM10',
      raw: '1,000.0 µg/m³',
      rawSub: 'Optical saturation ceiling',
      flag: 'flag_pm10_sensor_cap = True',
      flagClass: 'bg-error-container/30 text-error border-error-container',
      expected: 'Expected: Severe',
      recorded: 'Recorded: Sensor Ceiling Cap',
      policy: 'Sensor Saturation Documented / No Clamping',
      policySub: 'Non-destructive preservation of instrument limit',
      status: 'Preserved Intact',
    },
    {
      city: 'Victoria Memorial, Kolkata',
      node: 'NODE_WB_007',
      date: '2024-09-02',
      param: 'AQI Category',
      raw: 'AQI 122 ("Satisfactory")',
      rawSub: 'Bulletin Category Mismatch',
      flag: 'is_category_inconsistent = True',
      flagClass: 'bg-tertiary-container/30 text-tertiary border-tertiary/40',
      expected: 'Expected: Moderate (101-200)',
      recorded: 'Recorded: Satisfactory',
      policy: 'Mislabeled Bulletin Category Flagged for Review',
      policySub: 'Documented category inconsistency; raw record intact',
      status: 'Preserved Intact',
    },
    {
      city: 'BTM Layout, Bengaluru',
      node: 'NODE_KA_002',
      date: '2024-03-21',
      param: 'CO',
      raw: '18.4 mg/m³',
      rawSub: 'Industrial traffic spike',
      flag: 'flag_co_extreme = True',
      flagClass: 'bg-secondary/20 text-secondary border-secondary/30',
      expected: 'Expected: Very Poor',
      recorded: 'Recorded: High Localized Peak',
      policy: 'Extreme Spike Retained / Boolean Flag Recorded',
      policySub: 'Localized high-emission junction surge preserved',
      status: 'Preserved Intact',
    },
    {
      city: 'IIT Madras, Chennai',
      node: 'NODE_TN_005',
      date: '2024-12-10',
      param: 'Primary Key',
      raw: 'Key: (Chennai, 2024-12-10)',
      rawSub: '0 Collisions',
      flag: 'Duplicate Check: 0 Collisions',
      flagClass: 'bg-primary/20 text-primary border-primary/30',
      expected: 'Expected: Unique Record',
      recorded: 'Recorded: Unique Key',
      policy: 'Verified 100% Composite Key Uniqueness',
      policySub: 'Hash verification confirms zero duplicated telemetry rows',
      status: 'Validated Unique',
    },
  ];

  const filteredLogs = auditLogEntries.filter((item) => {
    const matchesSearch =
      item.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.param.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.flag.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeFilter === 'missing') return item.param.includes('PM') || item.param.includes('CO');
    if (activeFilter === 'duplicate') return item.flag.includes('Duplicate');
    if (activeFilter === 'flags') return item.flag.includes('flag_');
    if (activeFilter === 'inconsistent') return item.flag.includes('is_category_inconsistent');
    return true;
  });

  return (
    <main className="flex-1 w-full px-4 sm:px-6 py-6 max-w-[1600px] mx-auto space-y-6">
      {/* Breadcrumb & Title */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant">
          <span onClick={() => onNavigate('overview')} className="hover:text-primary cursor-pointer">Analytics Core</span>
          <span className="text-outline">/</span>
          <span onClick={() => onNavigate('methodology')} className="hover:text-primary cursor-pointer">Data Pipeline</span>
          <span className="text-outline">/</span>
          <span className="text-primary font-medium">Data Quality &amp; Preprocessing Audits</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-headline text-on-surface tracking-tight flex items-center gap-3">
              Data Quality Assurance &amp; Anomaly Diagnostics
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-container-highest text-primary border border-primary/30 font-medium">
                Verified Non-Destructive Audit
              </span>
            </h1>
            <p className="text-sm text-on-surface-variant mt-1.5 max-w-4xl">
              Systematic data hygiene audit across 471,015 CPCB bulletin records and 29,531 multi-city telemetry points. Adheres to strict non-destructive data governance: extreme values and missingness are diagnostically flagged rather than artificially altered.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('methodology')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface text-xs font-medium transition-all duration-150 active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">menu_book</span>
              <span>Methodology &amp; Pipeline</span>
            </button>
            <button
              onClick={() => onNavigate('historical')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface text-xs font-medium transition-all duration-150 active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">history_edu</span>
              <span>Historical Analytics</span>
            </button>
            <button
              onClick={() => onNavigate('comparison')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-fixed text-on-primary font-semibold text-xs transition-all duration-150 shadow-md shadow-primary/20 active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">compare_arrows</span>
              <span>City Benchmarks</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-3 bg-surface-container-low rounded-xl border border-primary/20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-surface-container-highest/60 px-3 py-1.5 rounded-lg border border-outline-variant/50">
              <span className="material-symbols-outlined text-sm text-primary">database</span>
              <select
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
                className="bg-transparent text-xs text-on-surface focus:outline-none border-none p-0 pr-6 font-medium cursor-pointer"
              >
                <option value="cpcb_historical_bulletins_471k.csv" className="bg-surface-container-high">cpcb_historical_bulletins_471k.csv (Full Corpus)</option>
                <option value="city_day_observations_29k.csv" className="bg-surface-container-high">city_day_observations_29k.csv (26 Cities)</option>
                <option value="realtime_aqi_telemetry_3668.json" className="bg-surface-container-high">realtime_aqi_telemetry_3668.json</option>
              </select>
            </div>

            <div className="hidden sm:flex items-center p-0.5 rounded-lg bg-surface-container border border-outline-variant/30 text-xs">
              {(['all', 'missing', 'duplicate', 'flags', 'inconsistent'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1 rounded capitalize transition-colors ${
                    activeFilter === f ? 'bg-primary text-on-primary font-medium' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {f === 'all'
                    ? 'All Checks'
                    : f === 'missing'
                    ? 'Missingness (NaN)'
                    : f === 'duplicate'
                    ? 'Duplicate Audit (0 Collisions)'
                    : f === 'flags'
                    ? 'Diagnostic Boolean Flags'
                    : 'Category Inconsistencies'}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-xs text-primary">schedule</span>
            <span>Audit Report Status: <strong className="text-on-surface font-semibold">Verified According to Cleaning Report</strong></span>
          </div>
        </div>
      </section>

      {/* 4 HIGH-LEVEL DATA HEALTH KPI CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-5 rounded-xl bg-surface-container border border-primary/20 hover:border-primary/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-on-surface-variant font-medium">Total Processed Records</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-lg">dataset</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-headline text-on-surface">471,015</span>
            <span className="text-xs text-primary font-medium">Bulletins</span>
          </div>
          <div className="mt-2 text-xs text-on-surface-variant leading-relaxed">
            Historical CPCB AQI Bulletins (2015–2024)
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-secondary/15 text-secondary border border-secondary/25">
              + 29,531 City-Day Records
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary/15 text-primary border border-primary/25">
              3,668 Live Snapshot Readings
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
            <span className="text-on-surface-variant">Corpus Coverage</span>
            <span className="text-secondary font-medium">10-Yr Corpus (26 Major Centers)</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-5 rounded-xl bg-surface-container border border-primary/20 hover:border-primary/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-on-surface-variant font-medium">Duplicate Record Audit</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-lg">fingerprint</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-headline text-on-surface">0 Duplicates</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/20 text-primary border border-primary/30">
              100% Key Uniqueness Verified
            </span>
          </div>
          <div className="mt-2 text-xs text-on-surface-variant leading-relaxed">
            0 duplicate (city, date) entries in historical bulletins
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
            <span className="text-on-surface-variant">Validation Check</span>
            <span className="text-on-surface font-medium font-mono text-[11px]">Strict Hash (city, timestamp)</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-5 rounded-xl bg-surface-container border border-primary/20 hover:border-primary/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-on-surface-variant font-medium">Missing Data Handling Policy</span>
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-lg">rule</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold font-headline text-on-surface">Non-Destructive Retention</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary/20 text-secondary border border-secondary/30">
              No Artificial Splines
            </span>
          </div>
          <div className="mt-2 text-xs text-on-surface-variant leading-relaxed">
            0 Imputed (Original Missingness Retained). Preserved authentically as NaN for statistical EDA.
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
            <span className="text-on-surface-variant">Data Governance</span>
            <span className="text-primary font-medium">Zero Synthetic Bias Introduced</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-5 rounded-xl bg-surface-container border border-primary/20 hover:border-primary/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-on-surface-variant font-medium">Outlier &amp; Anomaly Diagnostics</span>
            <div className="w-8 h-8 rounded-lg bg-tertiary-container/30 flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-lg">flag</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-headline text-on-surface">576 Extreme Values</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-tertiary/20 text-tertiary border border-tertiary/30">
              + 268 Category Flags
            </span>
          </div>
          <div className="mt-2 text-xs text-on-surface-variant leading-relaxed">
            Preserved Intact for Review (City-Day Dataset). Non-destructive: AQI &gt; 500 &amp; PM10 ≥ 1000 µg/m³ kept intact.
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
            <span className="text-on-surface-variant">Preservation Model</span>
            <span className="text-secondary font-medium">Diagnostic Boolean Audit Flags</span>
          </div>
        </div>
      </section>

      {/* SENSOR MISSINGNESS RATES SECTION */}
      <section className="rounded-xl bg-surface-container border border-primary/20 p-5 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold font-headline text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">grid_on</span>
              Authentic Sensor Missingness Rates across 26 Monitored Cities &amp; Pollutants
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Documented telemetry absence metrics across 29,531 multi-city daily records.{' '}
              <strong className="text-secondary font-semibold">Non-Destructive Retention Policy:</strong> Missing values preserved as NaN for transparent statistical exploratory data analysis without introducing synthetic bias.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant">Handling Policy:</span>
            <span className="px-2.5 py-1 rounded bg-surface-container-high border border-outline-variant/50 text-xs text-primary font-medium">
              Original Missingness Retained (0% Imputed)
            </span>
          </div>
        </div>

        {/* Parameter Summary Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-1">
          {[
            { name: 'Xylene', rate: '61.3%', c: 'text-tertiary' },
            { name: 'PM10', rate: '37.7%', c: 'text-tertiary' },
            { name: 'NH3', rate: '35.0%', c: 'text-tertiary' },
            { name: 'AQI', rate: '15.9%', c: 'text-secondary' },
            { name: 'PM2.5', rate: '15.6%', c: 'text-secondary' },
            { name: 'SO2', rate: '13.8%', c: 'text-secondary' },
            { name: 'NO2', rate: '12.4%', c: 'text-primary' },
            { name: 'CO', rate: '7.1%', c: 'text-primary' },
          ].map((item) => (
            <div key={item.name} className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col">
              <span className="text-[10px] font-mono uppercase text-on-surface-variant font-medium">{item.name}</span>
              <span className={`text-base font-bold font-mono ${item.c} mt-0.5`}>{item.rate}</span>
              <span className="text-[10px] text-outline">Missing (NaN)</span>
            </div>
          ))}
        </div>

        {/* Matrix Heatmap Table Grid */}
        <div className="overflow-x-auto rounded-lg border border-outline-variant/30">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-highest text-on-surface-variant border-b border-outline-variant/40">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider font-mono w-56">Urban Center / Region</th>
                <th className="py-3 px-3 text-center font-semibold uppercase font-mono">PM2.5 (15.6% Miss)</th>
                <th className="py-3 px-3 text-center font-semibold uppercase font-mono">PM10 (37.7% Miss)</th>
                <th className="py-3 px-3 text-center font-semibold uppercase font-mono">NO2 (12.4% Miss)</th>
                <th className="py-3 px-3 text-center font-semibold uppercase font-mono">SO2 (13.8% Miss)</th>
                <th className="py-3 px-3 text-center font-semibold uppercase font-mono">CO (7.1% Miss)</th>
                <th className="py-3 px-3 text-center font-semibold uppercase font-mono">NH3 (35.0% Miss)</th>
                <th className="py-3 px-3 text-center font-semibold uppercase font-mono">Xylene (61.3% Miss)</th>
                <th className="py-3 px-3 text-center font-semibold uppercase font-mono bg-surface-container-high text-primary">AQI Valid Record</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 bg-surface-container-low font-mono">
              {[
                { city: 'Delhi NCR (Capital Hub)', pm25: '97.8%', pm10: '94.2%', no2: '98.4%', so2: '91.1%', co: '98.9%', nh3: '78.4%', xylene: '44.2%', aqi: '96.8%' },
                { city: 'Mumbai (Coastal Urban)', pm25: '96.5%', pm10: '89.1%', no2: '95.0%', so2: '86.2%', co: '97.3%', nh3: '68.2%', xylene: '39.5%', aqi: '94.5%' },
                { city: 'Bengaluru (Southern Plateau)', pm25: '95.1%', pm10: '68.0%', no2: '98.4%', so2: '93.8%', co: '99.0%', nh3: '72.1%', xylene: '32.8%', aqi: '92.0%' },
                { city: 'Kolkata (Eastern Riverine)', pm25: '91.2%', pm10: '58.5%', no2: '94.2%', so2: '90.6%', co: '95.4%', nh3: '61.0%', xylene: '28.4%', aqi: '88.5%' },
                { city: 'Chennai (Coromandel Coast)', pm25: '98.4%', pm10: '62.9%', no2: '97.0%', so2: '94.2%', co: '99.1%', nh3: '64.5%', xylene: '36.1%', aqi: '93.2%' },
                { city: 'Ahmedabad (Western Industrial)', pm25: '92.7%', pm10: '64.8%', no2: '92.1%', so2: '88.0%', co: '96.0%', nh3: '62.0%', xylene: '41.2%', aqi: '89.4%' },
              ].map((r) => (
                <tr key={r.city} className="hover:bg-surface-container-high/50 transition-colors">
                  <td className="py-3 px-4 font-body font-medium text-on-surface flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    {r.city}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-block w-full py-1 rounded bg-primary/20 text-primary border border-primary/30 font-semibold">{r.pm25} Preserved</span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-block w-full py-1 rounded font-semibold ${parseFloat(r.pm10) >= 80 ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-tertiary/20 text-tertiary border border-tertiary/30'}`}>
                      {r.pm10} {parseFloat(r.pm10) < 80 ? '(NaN Kept)' : 'Preserved'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-block w-full py-1 rounded bg-primary/20 text-primary border border-primary/30 font-semibold">{r.no2} Preserved</span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-block w-full py-1 rounded bg-secondary/20 text-secondary border border-secondary/30 font-semibold">{r.so2} Preserved</span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-block w-full py-1 rounded bg-primary/20 text-primary border border-primary/30 font-semibold">{r.co} Preserved</span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-block w-full py-1 rounded bg-tertiary/20 text-tertiary border border-tertiary/30 font-semibold">{r.nh3} (NaN Kept)</span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-block w-full py-1 rounded bg-error-container/30 text-error border border-error-container/40 font-semibold">{r.xylene} (NaN Kept)</span>
                  </td>
                  <td className="py-2.5 px-3 text-center bg-surface-container-high/40">
                    <span className="inline-block w-full py-1 rounded bg-primary/25 text-primary border border-primary/40 font-bold">{r.aqi}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-2 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3 text-on-surface-variant font-mono">
            <span className="font-medium text-on-surface">Data Availability Scale:</span>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary/30 border border-primary"></span><span>≥90% Present (Intact)</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-secondary/30 border border-secondary"></span><span>80 - 89% Present</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-tertiary/30 border border-tertiary"></span><span>50 - 79% (NaN Preserved)</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-error-container/40 border border-error"></span><span>&lt;50% Absence (Transparent NaN)</span></div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-on-surface-variant bg-surface-container-high px-3 py-1.5 rounded-lg border border-outline-variant/30 text-[11px]">
            <span className="text-primary font-semibold">Audit Policy:</span>
            <span>Zero Synthetic Mean / Spline Interpolation</span>
            <span className="text-outline">•</span>
            <span>Preserved as authentic NaN for exploratory data analysis</span>
          </div>
        </div>
      </section>

      {/* TWO EQUAL COLUMN CARDS: BOOLEAN FLAGS & CORPUS CONTINUITY */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Diagnostic Boolean Flags */}
        <div className="rounded-xl bg-surface-container border border-primary/20 p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-headline text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl">flag</span>
                Diagnostic Boolean Flags &amp; Extreme Value Review
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded bg-surface-container-high text-tertiary border border-tertiary/30 font-mono font-medium">
                576 Extreme Values Flagged
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Severe episodic conditions and sensor ceilings preserved intact with diagnostic boolean flags rather than destructive clipping or filtering.
            </p>

            <div className="mt-4 space-y-3">
              <div className="p-3 rounded-lg bg-surface-container-low border border-primary/20 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-tertiary-container/40 text-tertiary border border-tertiary/40">flag_aqi_above_500</span>
                    <span className="font-semibold text-xs text-on-surface">543 Records Preserved</span>
                  </div>
                  <span className="text-[11px] font-mono font-medium text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    Retained Intact
                  </span>
                </div>
                <div className="text-on-surface-variant text-[11px] leading-relaxed">
                  Extreme winter hazardous spikes in Indo-Gangetic Plain preserved intact for severe pollution episode research.
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low border border-primary/20 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-error-container/40 text-error border border-error-container">flag_pm10_sensor_cap</span>
                    <span className="font-semibold text-xs text-on-surface">1 Record Flagged</span>
                  </div>
                  <span className="text-[11px] font-mono font-medium text-secondary bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20">
                    Not Discarded
                  </span>
                </div>
                <div className="text-on-surface-variant text-[11px] leading-relaxed">
                  Hardware optical ceiling of 1000 µg/m³ documented as instrument ceiling saturation; unmodified in dataset.
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low border border-primary/20 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-secondary/20 text-secondary border border-secondary/30">flag_pm25_extreme</span>
                    <span className="font-semibold text-xs text-on-surface">37 Records Preserved</span>
                  </div>
                  <span className="text-[11px] font-mono font-medium text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    Retained Intact
                  </span>
                </div>
                <div className="text-on-surface-variant text-[11px] leading-relaxed">
                  Acute post-harvest biomass burning episodes &gt;380 µg/m³ retained with boolean annotation for air quality modeling.
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low border border-primary/20 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-tertiary-container/40 text-tertiary border border-tertiary/40">flag_co_extreme</span>
                    <span className="font-semibold text-xs text-on-surface">120 Records Preserved</span>
                  </div>
                  <span className="text-[11px] font-mono font-medium text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    Retained Intact
                  </span>
                </div>
                <div className="text-on-surface-variant text-[11px] leading-relaxed">
                  High-density industrial traffic junction spikes retained without artificial compression or smoothing.
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Diagnostic Audit Principle</span>
            <span className="text-primary font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">verified</span>
              Zero Records Altered or Clamped
            </span>
          </div>
        </div>

        {/* Right: Audit Classification & Corpus Continuity */}
        <div className="rounded-xl bg-surface-container border border-primary/20 p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-headline text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">account_tree</span>
                Audit Classification &amp; Corpus Continuity
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded bg-surface-container-high text-primary border border-primary/30 font-medium">
                471,015 Records Verified
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Complete provenance audit across 10 years of official bulletins and multi-city observations.
            </p>

            <div className="mt-4 space-y-3">
              <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/30 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-on-surface font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">description</span>
                    CPCB Historical Bulletin Archive (2015–2024)
                  </span>
                  <span className="text-primary font-bold">471,015 Records</span>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Nationwide daily bulletin corpus. Audited for duplicate keys, formatting normalization, and date standardization. 0 duplicate collisions detected.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/30 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-on-surface font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-secondary">location_city</span>
                    Daily Multi-City Observations Dataset
                  </span>
                  <span className="text-secondary font-bold">29,531 Records (26 Cities)</span>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Consolidated urban center continuous monitoring series. Missingness preserved authentically as NaN without synthetic imputation bias.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-surface-container-low border border-tertiary/30 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-tertiary font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-tertiary">difference</span>
                    Category Inconsistencies Flagged
                  </span>
                  <span className="text-tertiary font-bold">268 Records Flagged</span>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Calculated AQI sub-index vs recorded bulletin category discrepancies explicitly documented with <code className="text-xs font-mono text-tertiary-fixed">is_category_inconsistent = True</code> for researcher review.
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/30 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">verified_user</span>
              <div className="text-xs text-on-surface-variant leading-relaxed">
                <strong className="text-primary font-semibold">Zero Data Destruction Guarantee:</strong>
                100% raw telemetry provenance preserved. No arbitrary outlier truncation, no forward-fill synthetic hallucination, and full reproducibility for academic evaluation.
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant font-mono">
            <span>Corpus Authenticity: <strong className="text-primary font-semibold">100% Preserved</strong></span>
            <span className="text-secondary font-medium">0 Synthesized Records</span>
          </div>
        </div>
      </section>

      {/* FLAGGED ANOMALIES & RESOLUTION AUDIT LOG TABLE */}
      <section className="rounded-xl bg-surface-container border border-primary/20 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold font-headline text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-xl">fact_check</span>
              Flagged Anomalies &amp; Resolution Audit Log
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Deterministic diagnostic trail adhering to the project's non-destructive data cleaning report.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-sm text-outline">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city, flag, or parameter..."
                className="w-72 pl-8 pr-3 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/50 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary font-body"
              />
            </div>
            <span className="text-xs text-on-surface-variant font-medium whitespace-nowrap">
              Showing <strong className="text-on-surface">{filteredLogs.length}</strong> sample verified records
            </span>
          </div>
        </div>

        {/* Rich Data Table */}
        <div className="overflow-x-auto rounded-lg border border-outline-variant/30">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-highest text-on-surface-variant border-b border-outline-variant/40 font-mono uppercase">
                <th className="py-3 px-4 font-semibold">City / Node Name</th>
                <th className="py-3 px-3 font-semibold">Timestamp / Date</th>
                <th className="py-3 px-3 font-semibold">Parameter</th>
                <th className="py-3 px-3 font-semibold">Observed Raw Telemetry</th>
                <th className="py-3 px-3 font-semibold">Audit Diagnostic Flag</th>
                <th className="py-3 px-3 font-semibold">Expected vs Recorded</th>
                <th className="py-3 px-4 font-semibold">Applied Audit Policy</th>
                <th className="py-3 px-4 font-semibold text-right">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 bg-surface-container-low font-body">
              {filteredLogs.map((row, idx) => (
                <tr key={idx} className="hover:bg-surface-container-high/40 transition-colors">
                  <td className="py-3 px-4 font-medium text-on-surface">
                    {row.city}
                    <span className="block text-[10px] text-outline font-mono">{row.node}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-on-surface-variant">{row.date}</td>
                  <td className="py-3 px-3 font-semibold text-on-surface">{row.param}</td>
                  <td className="py-3 px-3 font-mono">
                    <span className="text-error font-semibold">{row.raw}</span>
                    <span className="block text-[10px] text-on-surface-variant font-mono">{row.rawSub}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[11px] border font-semibold ${row.flagClass}`}>
                      {row.flag}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-on-surface-variant">
                    <span className="font-medium text-on-surface">{row.expected}</span>
                    <span className="block text-[10px] text-outline">{row.recorded}</span>
                  </td>
                  <td className="py-3 px-4 text-on-surface-variant">
                    {row.policy}
                    <span className="block text-[10px] text-outline">{row.policySub}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">
                      <span className="material-symbols-outlined text-xs">verified</span>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};
