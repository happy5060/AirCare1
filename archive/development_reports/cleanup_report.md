# AirCare — Cleanup & Codebase Organization Report
> **Date**: November 2, 2026  
> **Project**: Air Quality Analysis and Visualization Using Data Analytics (AirCare)  
> **Degree**: Bachelor of Computer Applications (BCA Minor Project)  

---

## 1. Executive Summary

This report documents the complete cleanup, codebase reorganization, and verification of the **AirCare** air quality analysis platform. The chatbot functionality, experimental implementations, and server-side Gemini backend have been completely removed. The remaining core features (**Today's AQI**, **Past Air Quality**, and **Compare Cities**) have been verified, reorganized into a clean and modular directory structure, and validated with automated tests and production builds.

---

## 2. Inventory of Changes

### A. Deleted Files & Directories
The following chatbot, server-side proxy, and experimental files were safely removed:

| File / Directory | Location | Reason for Removal |
| :--- | :--- | :--- |
| `AskAirCare.tsx` | `frontend/src/pages/` | Chatbot UI component & chat container |
| `airCareChatbotService.ts` | `frontend/src/services/` | Chatbot NLU parser, intent matcher & bridge |
| `server/` | `server/` | Dedicated Express server, proxy routes, `@google/genai` SDK, and rate limiter |
| `.env` | Root (`e:\minor project\`) | Server-side environment variables (`GEMINI_API_KEY`, `PORT=3001`) |
| `.env.example` | Root (`e:\minor project\`) | Outdated root template for Gemini API key |

### B. Moved & Reorganized Files
The following files were organized into dedicated, logical directories:

| Original Path | New Path | Description |
| :--- | :--- | :--- |
| `clean_data.py` | `scripts/clean_data.py` | Python automated data cleaning & outlier reconciliation pipeline |
| `prepare_frontend_data.py` | `scripts/prepare_frontend_data.py` | Partitioning script splitting 471k CPCB records into per-city JSON chunks |
| Scratch formula tests | `tests/test_cpcb_formulas.py` | Standalone automated unit tests for CPCB NAQI breakpoints and CO unit conversion |
| Scratch query tests | `tests/test_historical_analytics.py` | Standalone automated verification of CPCB bulletin queries and multi-city analytics |
| (New types module) | `frontend/src/types/index.ts` | Shared TypeScript interfaces (`PageId`, `LiveAqiReading`, `StationData`, etc.) |

### C. Modified Files
The following files were updated to remove chatbot dependencies and reflect the clean 3-feature platform:

| File | Changes Made |
| :--- | :--- |
| `frontend/src/App.tsx` | Removed `AskAirCare` import and routing; updated `VALID_PAGES` to `['today', 'past', 'compare']`. |
| `frontend/src/components/Header.tsx` | Removed `chat` navigation item, removed `Ask Assistant` header CTA button; set `PageId` to 3 pages. |
| `frontend/src/components/Footer.tsx` | Removed `Ask AirCare` navigation link and updated footer project summary. |
| `frontend/src/pages/TodaysAqi.tsx` | Rebalanced the exploration grid from 3 columns to 2 columns (`sm:grid-cols-2`), removing the chatbot card. |
| `frontend/vite.config.ts` | Removed `/api` proxy pointing to port 3001; restored minimal, high-performance configuration. |
| `scripts/clean_data.py` | Updated `BASE_DIR` resolution to dynamically locate project root relative to `scripts/`. |
| `scripts/prepare_frontend_data.py` | Updated `BASE_DIR` resolution to dynamically locate project root relative to `scripts/`. |
| `README.md` | Rewritten to focus on the 3 core features, clean project structure, and client-side setup instructions. |
| `docs/TESTING_REPORT.md` | Updated test matrix, production build outputs, and removed chatbot-specific tests. |
| `docs/VIVA_PREPARATION.md` | Updated viva questions, architecture diagram, and eliminated chatbot-specific questions. |

### D. Retained Core Files (Strictly Preserved)
The following files and datasets were strictly preserved without alteration:

| Category | File Path | Status |
| :--- | :--- | :--- |
| **Raw Datasets** | `cpcb_city_aqi_2015_2025.csv` (19.2 MB) | Preserved (Unchanged) |
| **Raw Datasets** | `city_day.csv` (2.57 MB) | Preserved (Unchanged) |
| **Raw Datasets** | `3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69.csv` (415 KB) | Preserved (Unchanged) |
| **Processed Data** | `processed_data/cleaned_cpcb_aqi_bulletins.csv` | Preserved (Unchanged) |
| **Processed Data** | `processed_data/cleaned_city_day.csv` | Preserved (Unchanged) |
| **Processed Data** | `processed_data/cleaned_live_station_snapshot.csv` | Preserved (Unchanged) |
| **Frontend Cache** | `frontend/public/data/bulletins_index.json` | Preserved (Unchanged) |
| **Frontend Cache** | `frontend/public/data/bulletins/*.json` (297 cities) | Preserved (Unchanged) |
| **Frontend Cache** | `frontend/public/data/city_day/*.json` | Preserved (Unchanged) |
| **Frontend Cache** | `frontend/public/data/station_snapshot.json` | Preserved (Unchanged) |
| **Core Pages** | `frontend/src/pages/TodaysAqi.tsx` | Preserved & Active |
| **Core Pages** | `frontend/src/pages/PastAqi.tsx` | Preserved & Active |
| **Core Pages** | `frontend/src/pages/CompareCities.tsx` | Preserved & Active |
| **Core Services** | `frontend/src/services/airQualityData.ts` | Preserved & Active |
| **Core Services** | `frontend/src/services/liveAqiService.ts` | Preserved & Active |
| **Methodology** | `docs/DATA_SOURCES_AND_METHODOLOGY.md` | Preserved & Active |

---

## 3. Clean Project Structure

```text
E:\minor project\
├── README.md                           <- Master project overview & setup guide
├── cleanup_report.md                   <- This cleanup & organization report
├── dataset_audit_report.md             <- Initial dataset exploratory audit
├── data_cleaning_report.md             <- Data cleaning pipeline audit
├── phase_4_completion_report.md        <- Live API & NAQI formula verification report
├── phase_5_completion_report.md        <- Historical data query verification report
├── .gitignore                          <- Root Git ignore configuration
│
├── 3b01bcb8-0b14-4abf-b6f2-*.csv       <- [RAW] CAAQM continuous monitoring stations snapshot (Oct 20, 2026)
├── city_day.csv                        <- [RAW] Kaggle multi-pollutant city daily dataset (2015-2020)
├── cpcb_city_aqi_2015_2025.csv         <- [RAW] CPCB official 4pm daily bulletin archive (2015-2025)
│
├── processed_data/                     <- Verified, cleaned & normalized datasets
│   ├── cleaned_cpcb_aqi_bulletins.csv  <- 471,015 daily bulletin records
│   ├── cleaned_city_day.csv            <- 29,531 multi-pollutant records
│   └── cleaned_live_station_snapshot.csv <- 524 physical ground stations
│
├── scripts/                            <- Data processing & partitioning scripts
│   ├── clean_data.py                   <- Python cleaning pipeline for raw CSVs
│   └── prepare_frontend_data.py        <- City-partitioning script for lightweight JSON delivery
│
├── tests/                              <- Standalone automated test suites
│   ├── test_cpcb_formulas.py           <- CPCB NAQI formula & breakpoint unit tests
│   └── test_historical_analytics.py    <- CPCB bulletin query and statistics verification
│
├── docs/                               <- Academic documentation & viva preparation
│   ├── DATA_SOURCES_AND_METHODOLOGY.md <- Comprehensive methodology & breakpoint formulas
│   ├── TESTING_REPORT.md               <- Testing logs, assertions, and verification results
│   └── VIVA_PREPARATION.md             <- BCA minor project viva voce guide with 20 Q&As
│
├── stitch_exports/                     <- Historical Stitch UI mockups & component designs
│
└── frontend/                           <- Pure Client-Side React 19 + TypeScript SPA
    ├── package.json                    <- Dependencies (React 19, Lucide, Tailwind, Vite)
    ├── vite.config.ts                  <- Clean Vite configuration (no server proxy needed)
    ├── tailwind.config.js              <- Tailwind theme & color tokens
    ├── public/
    │   └── data/                       <- Partitioned JSON datasets served to browser
    │       ├── bulletins_index.json    <- Metadata index for 297 Indian cities
    │       ├── bulletins/              <- Per-city bulletin records (e.g. delhi.json)
    │       ├── city_day/               <- Per-city multi-pollutant records
    │       └── station_snapshot.json   <- Frozen 524 CAAQM station snapshot
    └── src/
        ├── App.tsx                     <- Client router managing 3 core features
        ├── index.css / App.css         <- Global styles & Tailwind directives
        ├── main.tsx                    <- React entry point
        ├── pages/
        │   ├── TodaysAqi.tsx           <- Live atmospheric model feed & station snapshot
        │   ├── PastAqi.tsx             <- 10-year historical CPCB archive & preset explorer
        │   └── CompareCities.tsx       <- Multi-city side-by-side comparative analytics
        ├── services/
        │   ├── liveAqiService.ts       <- Open-Meteo client & CPCB sub-index calculation
        │   └── airQualityData.ts       <- Historical JSON data fetcher & aggregators
        ├── types/
        │   └── index.ts                <- Shared TypeScript interface definitions
        └── components/
            ├── Header.tsx              <- Navigation header for 3 features
            └── Footer.tsx              <- Standard disclosures and data notices
```

---

## 4. Verification & Validation Results

### 1. Production Build Output
```text
> frontend@0.0.0 build
> tsc -b && vite build

vite v8.3.4 building client environment for production...
transforming...
✓ 23 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.18 kB │ gzip:  0.60 kB
dist/assets/index-BhFn3tAQ.css   26.08 kB │ gzip:  5.54 kB
dist/assets/index-nUN7YwMH.js   317.93 kB │ gzip: 88.62 kB

✓ built in 1.24s
```
- **Exit Code**: `0`
- **TypeScript Errors**: `0`
- **Bundle Optimization**: JS bundle decreased by **50.62 kB** (from 368.55 kB down to 317.93 kB).

### 2. Static Code Analysis (Oxlint)
```text
> frontend@0.0.0 lint
> oxlint

Found 6 warnings and 0 errors.
Finished in 66ms on 13 files with 116 rules using 12 threads.
```
- **Errors**: `0`
- **Warnings**: 6 non-blocking React compiler optimization hints (`setState` in effects for asynchronous JSON loading). All 7 impure `Date.now()` warnings from the removed chatbot were eliminated.

### 3. CPCB Formula Tests (`tests/test_cpcb_formulas.py`)
- **Execution Command**: `python tests/test_cpcb_formulas.py`
- **Result**: `ALL CPCB FORMULA & COMPLIANCE TESTS PASSED (100% SUCCESS)`
- **Key Assertions Verified**:
  - CO concentration conversion ($\mu g/m^3 \rightarrow mg/m^3$) across all 6 breakpoint bands.
  - Ozone piecewise linear interpolation.
  - Particulate matter ($PM_{2.5}$, $PM_{10}$) mathematical sub-indices.
  - Minimum 3-pollutant NAQI criteria enforcement with particulate requirement.

### 4. Historical Analytics Tests (`tests/test_historical_analytics.py`)
- **Execution Command**: `python tests/test_historical_analytics.py`
- **Result**: `ALL HISTORICAL ANALYTICS TESTS PASSED (100% SUCCESS RATE)`
- **Key Assertions Verified**:
  - Full archive load (471,015 records across 297 cities).
  - Single-day lookup accuracy (Delhi 2024-11-18: AQI 494 Severe, PM2.5).
  - Period aggregations (Amritsar Diwali Week: mean 232.4, peak 368).
  - Multi-city comparison (Delhi 374.4 vs. Bengaluru 85.1; 289.3 point difference).
  - Preserved category inconsistency audit flag (Delhi 2018-02-24).
  - Zero-imputation policy (0 rows for pre-2015 dates; no fabricated numbers).

### 5. API Key & Security Check
- **Gemini API Key Requirement**: Completely removed. The application requires **zero API keys** to run.
- **Client Bundle Scan**: Zero secret keys, tokens, or backend credentials exist in `frontend/dist/`.
- **Live Feed Source**: Open-Meteo High-Resolution Atmospheric Air Quality API (free, open-access, public).

---

## 5. Remaining Warnings or Issues

- **React Compiler State Suggestions (6 warnings)**: In `PastAqi.tsx` and `CompareCities.tsx`, calling `setState` synchronously within `useEffect` to trigger asynchronous data fetches generates standard React Compiler purity suggestions. These are cosmetic, standard in client-side data-fetching SPAs, and produce zero runtime errors or performance degradation.
- **No Blocking Issues**: The project is completely stable, clean, and ready for evaluation.

