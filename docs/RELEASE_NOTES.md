# AirCare — Release Notes

## Version 1.0.0 (Release Candidate)
**Release Date**: November 2, 2026  
**Platform**: Pure Client-Side Single Page Application (React 19 + TypeScript + Vite)  
**Target Environment**: Modern Web Browsers (Desktop, Tablet, Mobile)  

---

### 1. Overview

AirCare v1.0.0 is the official release of the **Air Quality Analysis and Visualization Platform** for the BCA Minor Project. This release delivers a streamlined, high-performance, and academically sound environmental data analytics application without external server-side proxy dependencies or secret API key requirements.

---

### 2. Core Features in v1.0.0

* **Today's AQI Dashboard**:
  * Real-time atmospheric air quality estimation powered by Open-Meteo's high-resolution atmospheric model (CAMS / ECMWF).
  * Real-time evaluation of official **Central Pollution Control Board (CPCB) NAQI** piecewise linear sub-index breakpoint formulas for $\text{PM}_{2.5}$, $\text{PM}_{10}$, $\text{NO}_2$, $\text{SO}_2$, $\text{CO}$, and $\text{O}_3$.
  * Minimum 3-pollutant compliance validation with particulate fraction requirement.
  * Direct health impact and activity guidance mapped to official CPCB health advisories.
  * Frozen physical CAAQMS monitoring station baseline (522 stations across 273 Indian cities) detailing active physical ground sensor networks.
  * Explicit UI badges and scientific notices demarcating model-estimated values from physical ground monitors.

* **Past Air Quality Explorer**:
  * Complete 10-year official CPCB 4:00 PM daily bulletin archive (May 1, 2015 – December 31, 2025) across 297 Indian cities.
  * Single-day lookups and arbitrary historical date range filtering.
  * Five curated seasonal event presets:
    * *November 2024 (Winter Peak Season)*
    * *Diwali Festive Week 2024 (Oct 28 – Nov 5)*
    * *Monsoon Clean Window 2024 (Jul 1 – Aug 31)*
    * *Winter 2023–24 Thermal Inversion*
    * *Historical 2016 Great Smog Episode*
  * Comprehensive period statistics: calendar days, available days, completeness percentage, peak day, cleanest day, and pollutant category distributions.
  * Strict academic data integrity: zero synthetic data imputation for missing days or pre-archive dates; authentic government category boundary shifts preserved with audit flags.

* **Compare Cities Analytics**:
  * Multi-city side-by-side comparative analytics for up to 3 Indian cities across an identical historical calendar window.
  * Synchronized daily date alignment ensuring mathematical consistency.
  * Pollution divergence calculation and cleanest-city rankings.
  * Geographical and meteorological insights detailing coastal sea-breeze dispersion, Deccan plateau elevation advantages, and Indo-Gangetic plain winter inversion traps.

---

### 3. Key Architectural & Codebase Improvements

* **Chatbot & Backend Removal**:
  * Completely eliminated the experimental chatbot interface, deterministic NLU parser, and Express proxy server (`server/`).
  * Eliminated all `@google/genai` dependencies and root `.env` credential files.
  * Application requires **zero secret API keys** and runs entirely within the client browser.
* **Bundle & Performance Optimization**:
  * Reduced production JavaScript bundle size from 368.55 kB to **317.93 kB** (88.62 kB gzipped), a saving of 50.62 kB.
  * Vite production build executes in **under 1.1 seconds**.
* **Directory Reorganization**:
  * Structured repository into dedicated top-level directories: `frontend/`, `docs/`, `scripts/`, `tests/`, `processed_data/`, and `archive/`.
  * Centralized TypeScript interfaces in `frontend/src/types/index.ts`.

---

### 4. Verification & Testing Evidence

* **Automated Python Tests**:
  * `tests/test_cpcb_formulas.py`: 16/16 assertions passed (100% success).
  * `tests/test_historical_analytics.py`: 6/6 verification stages passed (100% success).
  * `tests/test_runtime_comprehensive.py`: 4/4 sections passed across 8 live cities (100% success).
* **Headless Chrome Browser Automation (CDP)**:
  * `tests/test_browser_runtime.js`: 100% pass across all navigation routes and viewports.
  * **0 Browser Console Errors**.
  * **0 Network Request Failures** (all 41 static data and chunk requests returned HTTP 200).
  * **0 Horizontal Scroll Overflows** on mobile (375px), tablet (768px), and desktop (1280px) viewports.

---

### 5. Running AirCare v1.0.0

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Or build and preview production bundle
npm run build
npm run preview
```
Open `http://localhost:5173/` in any modern web browser.

