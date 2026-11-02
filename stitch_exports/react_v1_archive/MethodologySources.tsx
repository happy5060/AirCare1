import React from 'react';
import type { PageId } from '../components/Header';

interface MethodologySourcesProps {
  onNavigate: (page: PageId) => void;
}

export const MethodologySources: React.FC<MethodologySourcesProps> = ({ onNavigate }) => {
  return (
    <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* PAGE HEADER & DOCUMENT METADATA */}
      <section className="space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant">
          <span onClick={() => onNavigate('overview')} className="text-secondary hover:underline cursor-pointer">
            Analytics Core
          </span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-on-surface-variant">Project Specifications</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-medium">Methodology, Data Provenance &amp; Mathematics</span>
        </div>

        {/* Main Title Block & CTAs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
          <div className="space-y-1.5 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-mono bg-primary/10 border border-primary/30 text-primary">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              BCA Minor Project Academic Documentation
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-headline font-bold text-on-surface tracking-tight">
              Methodology, Data Sources &amp; Analytical Architecture
            </h1>
            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
              Complete documentation of data provenance, CPCB AQI mathematical sub-index computation, cleaning pipeline, and scientific scope boundaries (BCA Minor Project).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
            <button
              onClick={() => onNavigate('quality')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container-high hover:bg-surface-bright border border-outline-variant/40 text-on-surface text-xs font-medium transition-all active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm text-secondary">verified_user</span>
              <span>Quality Audits Report</span>
            </button>
            <button
              onClick={() => onNavigate('historical')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container-high hover:bg-surface-bright border border-outline-variant/40 text-on-surface text-xs font-medium transition-all active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm text-primary">history_edu</span>
              <span>Historical Trends</span>
            </button>
            <button
              onClick={() => onNavigate('live')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary text-on-primary font-headline font-semibold text-xs tracking-wide hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm font-semibold">sensors</span>
              <span>CAAQMS Explorer</span>
            </button>
          </div>
        </div>

        {/* Quick Metadata Strip (4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/30 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-surface-variant text-primary">
              <span className="material-symbols-outlined text-lg">person_outline</span>
            </div>
            <div>
              <div className="text-[11px] font-mono text-on-surface-variant uppercase tracking-wider">Author / Candidate</div>
              <div className="text-xs sm:text-sm font-headline font-semibold text-on-surface mt-0.5">BCA Final Year Minor Project Candidate</div>
            </div>
          </div>
          <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/30 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-surface-variant text-secondary">
              <span className="material-symbols-outlined text-lg">science</span>
            </div>
            <div>
              <div className="text-[11px] font-mono text-on-surface-variant uppercase tracking-wider">Subject / Specialization</div>
              <div className="text-xs sm:text-sm font-headline font-semibold text-on-surface mt-0.5">Data Analytics &amp; Environmental Info Systems</div>
            </div>
          </div>
          <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/30 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-surface-variant text-tertiary">
              <span className="material-symbols-outlined text-lg">tag</span>
            </div>
            <div>
              <div className="text-[11px] font-mono text-on-surface-variant uppercase tracking-wider">Evaluation Version</div>
              <div className="text-xs sm:text-sm font-headline font-semibold text-on-surface mt-0.5">Release Candidate v1.0.4 (Demo Dataset)</div>
            </div>
          </div>
          <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/30 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-surface-variant text-primary">
              <span className="material-symbols-outlined text-lg">verified_user</span>
            </div>
            <div>
              <div className="text-[11px] font-mono text-on-surface-variant uppercase tracking-wider">Primary Reference Standard</div>
              <div className="text-xs sm:text-sm font-headline font-semibold text-on-surface mt-0.5">CPCB NAAQS 2014 &amp; IIT-K Formulation</div>
            </div>
          </div>
        </div>
      </section>

      {/* MODULE 1: DATASET PROVENANCE & INGESTION SOURCES */}
      <section className="bg-surface-container p-6 rounded-2xl border border-outline-variant/30 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <span className="material-symbols-outlined text-2xl">database</span>
            </div>
            <div>
              <h2 className="text-lg font-headline font-bold text-on-surface">Dataset Provenance: Three Distinct Observational Datasets</h2>
              <p className="text-xs text-on-surface-variant">Exhaustive provenance, schema stratification, missingness retention, and observational parameters</p>
            </div>
          </div>
          <span className="self-start sm:self-center px-3 py-1 rounded-full text-xs font-mono font-medium bg-primary/15 text-primary border border-primary/30">
            Audited Multi-Corpus Architecture
          </span>
        </div>

        {/* 3 Distinct Dataset Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dataset 1 */}
          <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant/30 flex flex-col justify-between space-y-4 hover:border-primary/50 transition-colors">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">DATASET 01</span>
                <span className="text-[11px] font-mono text-on-surface-variant">2015 – 2025</span>
              </div>
              <div>
                <h3 className="text-base font-headline font-bold text-on-surface">Historical CPCB Daily AQI Bulletins</h3>
                <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">Official published city-level daily 24h average AQI and primary prominent pollutant archive.</p>
              </div>
              <div className="space-y-2 pt-2 border-t border-outline-variant/20 text-xs font-mono">
                <div className="flex items-center justify-between py-1 border-b border-outline-variant/15">
                  <span className="text-on-surface-variant font-body">Total Volume</span>
                  <span className="text-primary font-bold">471,015 Records</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-outline-variant/15">
                  <span className="text-on-surface-variant font-body">Urban Coverage</span>
                  <span className="text-on-surface font-semibold">297 Distinct Cities</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-outline-variant/15">
                  <span className="text-on-surface-variant font-body">Temporal Span</span>
                  <span className="text-secondary font-semibold">May 1, 2015 – Dec 31, 2025</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-on-surface-variant font-body">Duplicate Key Rate</span>
                  <span className="text-primary font-bold">0 Duplicates (City, Date)</span>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest/80 p-3 rounded-lg border border-outline-variant/20 text-[11px] font-mono space-y-1 text-on-surface-variant">
              <div className="text-primary font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">verified</span>
                Provenance &amp; Integrity Audit
              </div>
              <p className="font-body leading-relaxed text-[11px]">
                Missing observations were authentic and NOT artificially synthesized. Exactly 268 category boundary inconsistencies flagged for researcher validation.
              </p>
            </div>
          </div>

          {/* Dataset 2 */}
          <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant/30 flex flex-col justify-between space-y-4 hover:border-secondary/50 transition-colors">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-secondary/10 text-secondary border border-secondary/20">DATASET 02</span>
                <span className="text-[11px] font-mono text-tertiary font-semibold">Terminates Mid-2020</span>
              </div>
              <div>
                <h3 className="text-base font-headline font-bold text-on-surface">City-Day Ambient Pollutants</h3>
                <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">Physical mass concentration measurements across 12 distinct chemical parameters.</p>
              </div>
              <div className="space-y-2 pt-2 border-t border-outline-variant/20 text-xs font-mono">
                <div className="flex items-center justify-between py-1 border-b border-outline-variant/15">
                  <span className="text-on-surface-variant font-body">Total Volume</span>
                  <span className="text-secondary font-bold">29,531 Records</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-outline-variant/15">
                  <span className="text-on-surface-variant font-body">Urban Centers</span>
                  <span className="text-on-surface font-semibold">26 Major Metros</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-outline-variant/15">
                  <span className="text-on-surface-variant font-body">Temporal Window</span>
                  <span className="text-tertiary font-semibold">Jan 1, 2015 – Jul 1, 2020</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-on-surface-variant font-body">Parameters (12)</span>
                  <span className="text-on-surface text-[10px]">PM2.5, PM10, NO, NO2, NOx, NH3, CO, SO2, O3, Benzene, Toluene, Xylene</span>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest/80 p-3 rounded-lg border border-outline-variant/20 text-[11px] font-mono space-y-1 text-on-surface-variant">
              <div className="text-secondary font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">inventory_2</span>
                Authentic Missingness &amp; Outliers
              </div>
              <p className="font-body leading-relaxed text-[11px]">
                Omissions retained without synthetic fill (Xylene: 61.3%, PM10: 37.7%, NH3: 35.0%, AQI: 15.9%, PM2.5: 15.6%). 576 episodic extremes (1.95%) flagged via boolean flags, NOT clamped or deleted.
              </p>
            </div>
          </div>

          {/* Dataset 3 */}
          <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant/30 flex flex-col justify-between space-y-4 hover:border-tertiary/50 transition-colors">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-tertiary/10 text-tertiary border border-tertiary/20">DATASET 03</span>
                <span className="text-[11px] font-mono text-primary font-semibold">Point-in-Time Snapshot</span>
              </div>
              <div>
                <h3 className="text-base font-headline font-bold text-on-surface">Live CAAQMS Station Snapshot</h3>
                <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">Static point-in-time baseline snapshot: October 20, 2026 (10:00 AM IST) — NOT continuous telemetry.</p>
              </div>
              <div className="space-y-2 pt-2 border-t border-outline-variant/20 text-xs font-mono">
                <div className="flex items-center justify-between py-1 border-b border-outline-variant/15">
                  <span className="text-on-surface-variant font-body">Station Readings</span>
                  <span className="text-tertiary font-bold">3,668 Records</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-outline-variant/15">
                  <span className="text-on-surface-variant font-body">Station Density</span>
                  <span className="text-on-surface font-semibold">524 CAAQMS Stations</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-outline-variant/15">
                  <span className="text-on-surface-variant font-body">Spatial Spread</span>
                  <span className="text-on-surface font-semibold">273 Cities across 31 States/UTs</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-on-surface-variant font-body">Active vs Offline</span>
                  <span className="text-primary font-semibold">3,403 (92.78%) / 265 (7.22%)</span>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest/80 p-3 rounded-lg border border-outline-variant/20 text-[11px] font-mono space-y-1 text-on-surface-variant">
              <div className="text-tertiary font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">straighten</span>
                Critical Scale Distinction
              </div>
              <p className="font-body leading-relaxed text-[11px]">
                Contains dimensionless CPCB sub-index scores (0–500 scale), NOT raw physical mass concentrations (µg/m³ or mg/m³). Clean fields tagged as subindex_min, subindex_max, subindex_avg.
              </p>
            </div>
          </div>
        </div>

        {/* Comparative Provenance Matrix Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-container-lowest/60 p-4 rounded-xl border border-outline-variant/30 text-xs">
          <div className="space-y-1">
            <span className="text-primary font-mono font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">sync_disabled</span>
              Temporal Asymmetry Principle
            </span>
            <p className="text-on-surface-variant text-[11px] leading-relaxed">
              Datasets 1 and 2 operate on independent timelines (2015–2025 vs 2015–2020) and are deliberately unmerged to prevent synthetic bias.
            </p>
          </div>
          <div className="space-y-1 md:border-l md:border-outline-variant/20 md:pl-4">
            <span className="text-secondary font-mono font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">filter_alt_off</span>
              Zero Synthetic Imputation
            </span>
            <p className="text-on-surface-variant text-[11px] leading-relaxed">
              Missing observations across all datasets are retained authentically. No linear, spline, or generative fill was applied.
            </p>
          </div>
          <div className="space-y-1 md:border-l md:border-outline-variant/20 md:pl-4">
            <span className="text-tertiary font-mono font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">flag</span>
              Episodic Integrity
            </span>
            <p className="text-on-surface-variant text-[11px] leading-relaxed">
              576 extreme episodic records (e.g. Diwali bursts, stubble burning) are preserved with diagnostic boolean flags without clamping.
            </p>
          </div>
        </div>
      </section>

      {/* MODULE 2: CPCB AQI MATHEMATICAL FORMULATION */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Formula & Standard Scale */}
        <div className="lg:col-span-7 bg-surface-container p-6 rounded-2xl border border-outline-variant/30 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-secondary/10 border border-secondary/20 text-secondary">
                  <span className="material-symbols-outlined text-2xl">functions</span>
                </div>
                <div>
                  <h2 className="text-lg font-headline font-bold text-on-surface">Mathematical Formulation: Sub-Index Algorithm</h2>
                  <p className="text-xs text-on-surface-variant">Piecewise Linear Interpolation conforming to IIT Kanpur &amp; CPCB 2014 Framework</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-surface-container-high text-secondary text-xs font-mono border border-secondary/20">
                Eq. 2.1-A
              </span>
            </div>

            {/* Formula Code Box */}
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 font-mono space-y-2 text-xs sm:text-sm">
              <div className="text-primary font-bold tracking-wide">
                I<sub>p</sub> = [ (I<sub>HI</sub> - I<sub>LO</sub>) / (B<sub>HI</sub> - B<sub>LO</sub>) ] × (C<sub>p</sub> - B<sub>LO</sub>) + I<sub>LO</sub>
              </div>
              <div className="text-secondary font-bold tracking-wide">
                AQI = max(I<sub>1</sub>, I<sub>2</sub>, I<sub>3</sub>, ..., I<sub>n</sub>)
              </div>
              <div className="pt-2 border-t border-outline-variant/20 text-[11px] text-on-surface-variant font-body">
                <strong className="text-on-surface font-mono">Mandatory Validation Criterion:</strong> An overall AQI can only be calculated if data is available for at least <strong>three pollutants</strong>, out of which one must strictly be either <strong>PM2.5</strong> or <strong>PM10</strong>.
              </div>
            </div>

            {/* Variable Definitions */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-on-surface-variant">
              <div className="bg-surface-container-low p-2 rounded border border-outline-variant/20">
                <span className="text-primary font-bold">C<sub>p</sub></span>: Measured pollutant concentration
              </div>
              <div className="bg-surface-container-low p-2 rounded border border-outline-variant/20">
                <span className="text-primary font-bold">I<sub>p</sub></span>: Computed sub-index for pollutant p
              </div>
              <div className="bg-surface-container-low p-2 rounded border border-outline-variant/20">
                <span className="text-secondary font-bold">B<sub>HI</sub>, B<sub>LO</sub></span>: Breakpoint concentration caps
              </div>
              <div className="bg-surface-container-low p-2 rounded border border-outline-variant/20">
                <span className="text-secondary font-bold">I<sub>HI</sub>, I<sub>LO</sub></span>: AQI category indices corresponding to B
              </div>
            </div>

            {/* CPCB 6-Category Standard Reference Table */}
            <div className="space-y-2">
              <div className="text-xs font-headline font-semibold text-on-surface flex items-center justify-between">
                <span>CPCB 6-Category National Standard Scale</span>
                <span className="text-[11px] font-mono text-on-surface-variant">Standard AQI Range (0 - 500)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-surface-container-low border border-[#10B981]/30 flex items-start gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#10B981] mt-0.5 shrink-0 shadow-[0_0_8px_#10B981]"></span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-surface">Good</span>
                      <span className="font-mono text-[11px] text-[#10B981]">0 – 50</span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant leading-tight">Minimal health impact</div>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-container-low border border-[#34D399]/30 flex items-start gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#34D399] mt-0.5 shrink-0 shadow-[0_0_8px_#34D399]"></span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-surface">Satisfactory</span>
                      <span className="font-mono text-[11px] text-[#34D399]">51 – 100</span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant leading-tight">Minor breathing discomfort to sensitive people</div>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-container-low border border-[#F59E0B]/30 flex items-start gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#F59E0B] mt-0.5 shrink-0 shadow-[0_0_8px_#F59E0B]"></span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-surface">Moderate</span>
                      <span className="font-mono text-[11px] text-[#F59E0B]">101 – 200</span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant leading-tight">Breathing discomfort to people with lung/heart disease</div>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-container-low border border-[#F97316]/30 flex items-start gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#F97316] mt-0.5 shrink-0 shadow-[0_0_8px_#F97316]"></span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-surface">Poor</span>
                      <span className="font-mono text-[11px] text-[#F97316]">201 – 300</span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant leading-tight">Breathing discomfort to most people on prolonged exposure</div>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-container-low border border-[#EF4444]/30 flex items-start gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#EF4444] mt-0.5 shrink-0 shadow-[0_0_8px_#EF4444]"></span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-surface">Very Poor</span>
                      <span className="font-mono text-[11px] text-[#EF4444]">301 – 400</span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant leading-tight">Respiratory illness on prolonged exposure</div>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-container-low border border-[#881337]/50 flex items-start gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#881337] mt-0.5 shrink-0 shadow-[0_0_8px_#881337]"></span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-surface">Severe</span>
                      <span className="font-mono text-[11px] text-error">401 – 500</span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant leading-tight">Affects healthy people &amp; seriously impacts vulnerabilities</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs font-mono text-on-surface-variant">
            <span>Breakpoint Matrix Version: CPCB-2014-NAAQS</span>
            <span className="text-primary">Status: Validated &amp; Deterministic</span>
          </div>
        </div>

        {/* Right: Step-by-Step Computational Architecture */}
        <div className="lg:col-span-5 bg-surface-container p-6 rounded-2xl border border-outline-variant/30 space-y-4">
          <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
            <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <span className="material-symbols-outlined text-2xl">account_tree</span>
            </div>
            <div>
              <h2 className="text-lg font-headline font-bold text-on-surface">Computational Pipeline Flow</h2>
              <p className="text-xs text-on-surface-variant">Sequential mathematical execution stack in data engine</p>
            </div>
          </div>

          {/* Vertical Flow Sequence */}
          <div className="space-y-3 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-outline-variant/30">
            {[
              { num: '1', title: 'Raw Telemetry & IST Normalization', desc: 'Ingests station-level feeds, standardizing Asian/Kolkata timestamps to UTC ISO-8601 representation.', border: 'border-primary text-primary' },
              { num: '2', title: 'Physical Bound Check & Optical Clamping', desc: 'Enforces instrument thresholds. Values < 0 µg/m³ flagged as sensor fault; optical scattering baseline calibrated.', border: 'border-primary text-primary' },
              { num: '3', title: '24-Hour Truncated Arithmetic Mean', desc: "Applies CPCB's 16-hour minimum valid data rule (≥ 66.7% daily temporal completeness required per diurnal cycle).", border: 'border-secondary text-secondary' },
              { num: '4', title: 'Piecewise Linear Sub-Index Interpolation', desc: 'Locates breakpoint brackets (BLO, BHI) for each valid pollutant and computes individual Ip values.', border: 'border-secondary text-secondary' },
              { num: '5', title: 'Dominant Pollutant & Final AQI Maxima', desc: 'Verifies 3-pollutant condition; extracts peak sub-index as final AQI, logging the governing pollutant identifier.', border: 'border-tertiary text-tertiary' },
            ].map((s) => (
              <div key={s.num} className="relative flex items-start gap-3 pl-1">
                <div className={`w-7 h-7 rounded-full bg-surface-container-high border-2 ${s.border} flex items-center justify-center font-mono text-xs font-bold shrink-0 z-10 shadow-sm`}>
                  {s.num}
                </div>
                <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 flex-1">
                  <div className="text-xs font-headline font-semibold text-on-surface">{s.title}</div>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center gap-2.5 text-xs text-primary font-mono">
            <span className="material-symbols-outlined text-sm shrink-0">check_circle</span>
            <span>Zero-heuristic implementation: Exact algebraic reproducibility across all 524 CAAQMS stations.</span>
          </div>
        </div>
      </section>

      {/* MODULE 3: DATA CLEANING & PREPROCESSING PIPELINE (clean_data.py) */}
      <section className="bg-surface-container p-6 rounded-2xl border border-outline-variant/30 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <span className="material-symbols-outlined text-2xl">terminal</span>
            </div>
            <div>
              <h2 className="text-lg font-headline font-bold text-on-surface">
                Non-Destructive Data Preprocessing Pipeline (<code className="text-primary font-mono text-sm">clean_data.py</code>)
              </h2>
              <p className="text-xs text-on-surface-variant">Verified 6-stage non-destructive architecture: zero data destruction, authentic missingness retention</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-surface-container-high text-xs font-mono text-primary border border-primary/30">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              ETL Status: 100% Non-Destructive
            </span>
          </div>
        </div>

        {/* 6-Stage Non-Destructive Pipeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
          {[
            { stage: 'STAGE 01', icon: 'lock', title: 'Raw Integrity Assurance', desc: 'Pre- and post-cleaning MD5 cryptographic hash verification guarantees raw source files remain 100% unaltered.', proto: 'Protocol: MD5 Checksums', c: 'text-primary' },
            { stage: 'STAGE 02', icon: 'reorder', title: 'Schema Standardization', desc: 'Normalization of column headers to standard snake_case and date parsing to standard ISO-8601 UTC representation.', proto: 'Format: snake_case / ISO-8601', c: 'text-primary' },
            { stage: 'STAGE 03', icon: 'fingerprint', title: 'Key Uniqueness Audit', desc: 'Verification of 0 duplicate composite keys across all datasets (city, date). 268 category boundary shifts flagged for review.', proto: 'Audit: 0 Duplicate Keys', c: 'text-secondary' },
            { stage: 'STAGE 04', icon: 'flag', title: 'Outlier Diagnostic Flagging', desc: 'Preserves legitimate episodes via boolean flags (flag_aqi_above_500, flag_pm10_sensor_cap). Zero clamping or deletion.', proto: 'Mode: Non-Destructive Flags', c: 'text-secondary' },
            { stage: 'STAGE 05', icon: 'hourglass_disabled', title: 'Authentic Missingness', desc: 'Zero synthetic or interpolated records created. Natural NaN states preserved transparently for honest academic EDA.', proto: 'Rule: Zero Interpolation', c: 'text-tertiary' },
            { stage: 'STAGE 06', icon: 'output', title: 'Sub-Index Naming & Export', desc: 'Explicitly renames snapshot fields to subindex_min, max, avg. Exports sanitized Parquet and CSV archives for analysis.', proto: 'Output: Explicit Sub-Index CSV', c: 'text-primary' },
          ].map((item) => (
            <div key={item.stage} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 relative flex flex-col justify-between group hover:border-primary/50 transition-colors">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-primary font-bold px-1.5 py-0.5 rounded bg-primary/10">{item.stage}</span>
                  <span className={`material-symbols-outlined text-sm ${item.c}`}>{item.icon}</span>
                </div>
                <div className="text-xs font-headline font-bold text-on-surface">{item.title}</div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">{item.desc}</p>
              </div>
              <div className={`mt-3 pt-2 border-t border-outline-variant/20 text-[10px] font-mono ${item.c}`}>
                {item.proto}
              </div>
            </div>
          ))}
        </div>

        {/* Pipeline Verification Audit Banner */}
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-primary/30 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">verified</span>
            <span className="text-primary font-bold tracking-wide">STATUS: 100% VERIFIED ACCORDING TO CLEANING REPORT</span>
            <span className="text-on-surface-variant">• ZERO RECORDS CLAMPED OR DESTRUCTIVELY ALTERED</span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-[11px]">
            <div><span className="text-on-surface-variant">Duplicates Dropped:</span> <span className="text-primary font-bold">0 Records</span></div>
            <div><span className="text-on-surface-variant">Episodic Extremes Flagged:</span> <span className="text-secondary font-bold">576 (1.95%)</span></div>
            <div><span className="text-on-surface-variant">Synthetic Fills Injected:</span> <span className="text-primary font-bold">0 (0.0%)</span></div>
            <div><span className="text-on-surface-variant">Execution Integrity:</span> <span className="text-on-surface font-bold">Bit-for-Bit Proven</span></div>
          </div>
        </div>
      </section>

      {/* MODULE 4: PROJECT SCOPE BOUNDARIES & SYSTEM LIMITATIONS (2x2 Callout Grid) */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-headline font-bold text-on-surface">Project Scope Boundaries &amp; Academic Limitations</h2>
          <p className="text-xs text-on-surface-variant">Academic research demarcation, scientific constraints, and empirical evaluation boundaries</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Limitation 1 */}
          <div className="bg-surface-container p-5 rounded-2xl border border-tertiary/30 space-y-2 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-tertiary/5 rounded-full pointer-events-none"></div>
            <div className="flex items-center gap-2 text-tertiary">
              <span className="material-symbols-outlined text-lg">camera</span>
              <span className="text-xs font-headline font-bold tracking-wide uppercase">Limitation 01: Static Snapshot Notice</span>
            </div>
            <h3 className="text-sm font-headline font-semibold text-on-surface">Point-in-Time Baseline (Not Live Telemetry)</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              The live station dataset is a single point-in-time snapshot captured on <strong className="text-on-surface">October 20, 2026 (10:00 AM IST)</strong>, representing 524 CAAQMS stations across 273 cities. It serves as a benchmark baseline and does not represent a live, streaming socket connection or statutory regulatory bulletin.
            </p>
          </div>

          {/* Limitation 2 */}
          <div className="bg-surface-container p-5 rounded-2xl border border-secondary/30 space-y-2 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-secondary/5 rounded-full pointer-events-none"></div>
            <div className="flex items-center gap-2 text-secondary">
              <span className="material-symbols-outlined text-lg">timelapse</span>
              <span className="text-xs font-headline font-bold tracking-wide uppercase">Limitation 02: Temporal Asymmetry</span>
            </div>
            <h3 className="text-sm font-headline font-semibold text-on-surface">Independent Analytical Regimes (2015–2020 vs 2015–2025)</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Historical pollutant mass concentrations cover January 2015 to July 2020, while historical AQI bulletins cover May 2015 to December 2025. They constitute distinct observational corpuses and are evaluated independently rather than artificially stitched together, preventing longitudinal distortion.
            </p>
          </div>

          {/* Limitation 3 */}
          <div className="bg-surface-container p-5 rounded-2xl border border-outline-variant/40 space-y-2 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-outline-variant/10 rounded-full pointer-events-none"></div>
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-lg">tune</span>
              <span className="text-xs font-headline font-bold tracking-wide uppercase">Limitation 03: Scale Distinction</span>
            </div>
            <h3 className="text-sm font-headline font-semibold text-on-surface">Sub-Index Values vs Physical Mass Concentrations</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Live station snapshot figures are dimensionless CPCB sub-index scores (0–500 scale) rather than physical mass concentrations (µg/m³ or mg/m³). Cleaned fields are explicitly labeled as <code className="text-primary font-mono">subindex_min</code>, <code className="text-primary font-mono">subindex_max</code>, and <code className="text-primary font-mono">subindex_avg</code> to eliminate ambiguity.
            </p>
          </div>

          {/* Limitation 4 */}
          <div className="bg-surface-container p-5 rounded-2xl border border-primary/30 space-y-2 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/5 rounded-full pointer-events-none"></div>
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-lg">calculate</span>
              <span className="text-xs font-headline font-bold tracking-wide uppercase">Limitation 04: Deterministic Analytics</span>
            </div>
            <h3 className="text-sm font-headline font-semibold text-on-surface">Strictly Deterministic Rules (Zero AI/ML)</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Calculations strictly use deterministic algebraic formulas and descriptive statistical aggregations conforming to CPCB 2014 &amp; IIT Kanpur guidelines. The project deliberately omits opaque deep learning, neural networks, LSTM, or black-box predictive models to retain 100% algebraic reproducibility.
            </p>
          </div>
        </div>
      </section>

      {/* MODULE 5: TECHNOLOGY STACK & ACADEMIC SPECIFICATION */}
      <section className="bg-surface-container p-6 rounded-2xl border border-outline-variant/30 space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-primary">code_blocks</span>
            Technology Stack &amp; Academic Artifact Metadata
          </h2>
          <span className="text-xs font-mono text-primary font-semibold">Evaluation Term: 2026</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1 bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/20">
            <div className="text-[10px] font-mono text-on-surface-variant uppercase">Frontend Layer</div>
            <div className="font-headline font-bold text-on-surface">React + Vite + TypeScript</div>
            <div className="text-[11px] text-on-surface-variant">Tailwind CSS, Glassmorphic UI tokens, Space Grotesk</div>
          </div>
          <div className="space-y-1 bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/20">
            <div className="text-[10px] font-mono text-on-surface-variant uppercase">Data Engine</div>
            <div className="font-headline font-bold text-on-surface">Python 3.11 Runtime</div>
            <div className="text-[11px] text-on-surface-variant">pandas, numpy, scipy.stats, vectorized arithmetic</div>
          </div>
          <div className="space-y-1 bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/20">
            <div className="text-[10px] font-mono text-on-surface-variant uppercase">Computational Rules</div>
            <div className="font-headline font-bold text-on-surface">Deterministic Engine</div>
            <div className="text-[11px] text-on-surface-variant">CPCB 2014 &amp; IIT Kanpur piece-wise algebraic algorithm</div>
          </div>
          <div className="space-y-1 bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/20">
            <div className="text-[10px] font-mono text-on-surface-variant uppercase">Curriculum Context</div>
            <div className="font-headline font-bold text-on-surface">BCA Minor Project</div>
            <div className="text-[11px] text-on-surface-variant">Bachelor of Computer Applications Final Submission</div>
          </div>
        </div>
      </section>
    </main>
  );
};
