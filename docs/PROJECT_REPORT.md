# AirCare — Comprehensive Academic Project Report

> **Project Title**: Air Quality Analysis and Visualization Using Data Analytics (**AirCare**)  
> **Course / Degree**: Bachelor of Computer Applications (BCA Minor Project)  
> **Academic Session**: 2026–2027  
> **Version**: v1.0.0 (Release Candidate)  
> **Last Updated**: November 2, 2026  

---

## 1. Project Overview & Problem Statement

### 1.1 Introduction
Ambient air pollution represents one of the most critical public health and environmental challenges across urban and industrial regions in India. High concentrations of fine particulate matter ($\text{PM}_{2.5}$ and $\text{PM}_{10}$), nitrogen dioxide ($\text{NO}_2$), and ground-level ozone ($\text{O}_3$) frequently trigger severe respiratory, cardiovascular, and systemic illnesses.

While governmental bodies such as the **Central Pollution Control Board (CPCB)** publish continuous ambient monitoring data, general citizens and academic researchers often struggle to interpret raw concentrations, historical trends, or seasonal atmospheric anomalies due to:
* Data fragmentation across disparate PDF bulletins and tabular dumps.
* Misunderstanding of the multi-pollutant **National Air Quality Index (NAQI)** sub-index mathematical aggregation logic.
* Confusion between instantaneous atmospheric model approximations and physical ground station measurements.
* Fabricated or zero-imputed historical data points in commercial weather applications during monitoring outages.

### 1.2 The AirCare Solution
**AirCare** is an open, client-side environmental data analytics platform engineered specifically to address these challenges with scientific rigor and academic honesty:
1. **Real-Time Atmospheric Evaluation**: Translates instantaneous meteorological concentrations from Open-Meteo into compliant CPCB NAQI sub-indices with explicit health advisories.
2. **Historical Longitudinal Analysis**: Empowers users to query 10 years of official CPCB daily bulletin records (2015–2025) across 297 Indian cities, evaluate seasonal event windows (e.g. Diwali festive weeks, winter inversions, monsoon clean windows), and audit data completeness.
3. **Multi-City Synchronized Comparisons**: Performs side-by-side comparative analysis of up to 3 Indian cities across identical historical calendar windows, evaluating air quality divergence and regional topological dispersion factors.
4. **Academic Transparency**: Enforces zero synthetic data imputation, preserves official government category boundary shifts, and explicitly demarcates atmospheric model simulations from physical continuous monitoring stations (CAAQMS).

---

## 2. System Architecture

AirCare is architected as a high-performance, purely client-side Single-Page Application (SPA) backed by pre-partitioned, static JSON data stores and public atmospheric APIs:

```
+-----------------------------------------------------------------------------+
|                                AIRCARE CLIENT                               |
|                                                                             |
|  +-------------------+  +------------------------+  +--------------------+  |
|  |   Today's AQI     |  |   Past Air Quality     |  |   Compare Cities   |  |
|  |  (Live Analytics) |  |  (Historical Archive)  |  | (Multi-City Comp.) |  |
|  +---------+---------+  +-----------+------------+  +---------+----------+  |
|            |                        |                         |             |
|            v                        v                         v             |
|  +-------------------+  +------------------------------------------------+  |
|  |  liveAqiService   |  |              airQualityData Service            |  |
|  |  (NAQI Engine)    |  |  (In-Memory Cache & Statistics Calculator)     |  |
|  +---------+---------+  +-----------------------+------------------------+  |
|            |                                    |                           |
+------------|------------------------------------|---------------------------+
             |                                    |
             v                                    v
+-----------------------------+    +------------------------------------------+
|  Open-Meteo Atmospheric API |    |  Static Data Store (/data/)              |
|  (Instantaneous CAMS Feed)  |    |  ├── bulletins_index.json                |
|  - PM2.5, PM10, NO2, SO2,   |    |  ├── bulletins/{city}.json (297 cities)  |
|    CO, Ozone concentrations |    |  ├── city_day/{city}.json (26 cities)    |
+-----------------------------+    |  └── station_snapshot.json (522 CAAQMS)  |
                                   +------------------------------------------+
```

### Key Architectural Strengths:
1. **Zero Secret Footprint & Security**: AirCare requires **zero API keys** to run. Live feeds leverage open-access endpoints, eliminating the risk of exposed backend secrets or compromised environment tokens.
2. **Lightweight Distribution**: Total production bundle is just **317.93 kB** (88.62 kB gzipped), delivering instant loading across mobile and desktop devices.
3. **Optimized Static Partitioning**: Rather than forcing the browser to download a monolithic 20 MB CSV file, historical records are pre-partitioned into city-specific JSON files loaded on demand.

---

## 3. Data Sources & Data Engineering Pipeline

AirCare integrates three distinct, verified environmental datasets:

| Dataset Identifier | Origin & Authority | Coverage Window | Volume & Scope | Purpose in Platform |
| :--- | :--- | :--- | :--- | :--- |
| **CPCB 4pm Daily Bulletins** | Central Pollution Control Board (CPCB), MoEFCC | May 1, 2015 – Dec 31, 2025 | 471,015 records across 297 cities | Powers **Past Air Quality** & **Compare Cities** |
| **Kaggle Multi-Pollutant `city_day`** | Continuous CAAQMS Stations (Compiled on Kaggle) | Jan 1, 2015 – Jul 1, 2020 | 29,531 records across 26 cities | Secondary validation for chemical concentrations |
| **CAAQMS Station Snapshot** | CPCB Continuous Station Network | Frozen baseline (Oct 20, 2026) | 522 physical stations across 273 cities | Provides station counts & sensor parameters in **Today's AQI** |

### Data Cleaning & Normalization Steps (`scripts/clean_data.py`):
1. **Header Normalization**: Converted inconsistent column names into standardized snake_case identifiers (`city`, `date`, `aqi`, `prominent_pollutant`, `category`).
2. **Date Reconciliation**: Parsed all dates into ISO 8601 (`YYYY-MM-DD`).
3. **Outlier Reconciliation**: Identified physical sensor saturation caps (e.g. AQI 500 ceiling, PM10 capped at 1000 $\mu\text{g}/\text{m}^3$) and flagged them without discarding valid records.
4. **Preservation of Discretionary Classifications**: Retained official government bulletin category overrides (such as Delhi on 2018-02-24, where AQI 300 was classified as 'Very Poor' instead of formulaic 'Poor') with explicit audit flags.
5. **Zero-Imputation Policy**: Missing days and dates prior to May 2015 are strictly preserved as missing observations; numerical zero is never substituted for missing air quality.

---

## 4. Scientific Methodology & CPCB NAQI Formulas

The **National Air Quality Index (NAQI)** defined by CPCB (October 2014) utilizes a piecewise linear interpolation sub-index calculation:

$$I_p = \frac{I_{HI} - I_{LO}}{B_{HI} - B_{LO}} \cdot (C_p - B_{LO}) + I_{LO}$$

Where:
* $C_p$ is the pollutant concentration.
* $B_{HI}$ and $B_{LO}$ are the upper and lower breakpoint concentrations.
* $I_{HI}$ and $I_{LO}$ are the corresponding index values.

### Official Breakpoint Table:
| AQI Category | Sub-Index Range | $\text{PM}_{2.5}$ ($\mu\text{g}/\text{m}^3$) | $\text{PM}_{10}$ ($\mu\text{g}/\text{m}^3$) | $\text{NO}_2$ ($\mu\text{g}/\text{m}^3$) | $\text{SO}_2$ ($\mu\text{g}/\text{m}^3$) | $\text{CO}$ ($\text{mg}/\text{m}^3$) | $\text{O}_3$ ($\mu\text{g}/\text{m}^3$) | $\text{NH}_3$ ($\mu\text{g}/\text{m}^3$) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Good** | 0 – 50 | 0 – 30 | 0 – 50 | 0 – 40 | 0 – 40 | 0.0 – 1.0 | 0 – 50 | 0 – 200 |
| **Satisfactory** | 51 – 100 | 31 – 60 | 51 – 100 | 41 – 80 | 41 – 80 | 1.1 – 2.0 | 51 – 100 | 201 – 400 |
| **Moderate** | 101 – 200 | 61 – 90 | 101 – 250 | 81 – 180 | 81 – 380 | 2.1 – 10.0 | 101 – 168 | 401 – 800 |
| **Poor** | 201 – 300 | 91 – 120 | 251 – 350 | 181 – 280 | 381 – 800 | 10.1 – 17.0 | 169 – 208 | 801 – 1200 |
| **Very Poor** | 301 – 400 | 121 – 250 | 351 – 430 | 281 – 400 | 801 – 1600 | 17.1 – 34.0 | 209 – 748 | 1201 – 1800 |
| **Severe** | 401 – 500 | 250+ | 430+ | 400+ | 1600+ | 34.0+ | 748+ | 1800+ |

### Official CPCB Minimum Pollutant Criteria:
To formulate a scientifically compliant NAQI score:
1. At least **three criteria pollutants** must be monitored.
2. At least one must be a particulate fraction ($\text{PM}_{2.5}$ or $\text{PM}_{10}$).
3. The overall composite AQI is the **maximum sub-index** among all qualifying pollutants:

$$\text{AQI} = \max(I_{\text{PM2.5}}, I_{\text{PM10}}, I_{\text{NO2}}, I_{\text{SO2}}, I_{\text{CO}}, I_{\text{O3}})$$

The pollutant exhibiting the maximum sub-index is designated as the **Prominent (Dominant) Pollutant**.

---

## 5. Core Application Features

### 5.1 Today's AQI Dashboard (`TodaysAqi.tsx`)
* **Atmospheric Model Telemetry**: Queries Open-Meteo's hourly atmospheric model, executes NAQI sub-index formulas in real time, and computes dominant pollutant rankings.
* **Physical Station Baseline**: Incorporates the 522-station CPCB CAAQMS baseline, detailing physical reporting stations and active sensors across Indian cities.
* **Health Impact Advisories**: Maps CPCB medical advisories (e.g., respiratory warnings, outdoor exertion limits) dynamically based on the calculated AQI band.
* **Honest Attribution**: Displays explicit badges distinguishing numerical model estimates from physical ground monitors.

### 5.2 Past Air Quality Explorer (`PastAqi.tsx`)
* **10-Year CPCB Archive (2015–2025)**: Granular day-by-day exploration across 297 Indian cities.
* **Lookup Modes**: Allows single-day inspection (e.g. Delhi's peak smog on Nov 18, 2024 at AQI 494) and arbitrary multi-month date ranges.
* **Curated Seasonal Presets**: One-click exploration of major atmospheric events:
  * *November 2024 (Winter Peak Season)*
  * *Diwali Festive Week 2024 (Oct 28 – Nov 5)*
  * *Monsoon Clean Window 2024 (Jul 1 – Aug 31)*
  * *Winter 2023–24 Thermal Inversion*
  * *Historical 2016 Great Smog Episode*
* **Completeness Analytics**: Reports total calendar days vs. published bulletin days, calculating genuine data availability percentages without zero-imputation.

### 5.3 Compare Cities Analytics (`CompareCities.tsx`)
* **Synchronized Triad Comparison**: Simultaneous side-by-side analysis of up to 3 Indian cities across an identical historical timeframe.
* **Divergence Metrics**: Computes exact mathematical delta and pollution divergence ratios (e.g. demonstrating Delhi experiencing 4.4x the particulate concentration of Bengaluru during winter inversion months).
* **Topological & Geographic Insights**: Explains regional variations based on terrain:
  * *Coastal marine basin ventilation (Mumbai, Chennai)*
  * *Deccan plateau boundary-layer elevation (Bengaluru, Hyderabad)*
  * *Indo-Gangetic plain winter thermal inversion stagnation (Delhi, Lucknow, Patna)*

---

## 6. Verification & Automated Test Results

Every functional and mathematical component of AirCare was verified using comprehensive automated test suites:

### 6.1 Formula Compliance (`tests/test_cpcb_formulas.py`)
* **16/16 Assertions Passed (100% Success)**
* Verified CO unit conversion ($\mu\text{g}/\text{m}^3 \rightarrow \text{mg}/\text{m}^3$), ozone piecewise interpolation, PM sub-indices, and NAQI 3-pollutant validation rules.

### 6.2 Historical Analytics & Integrity (`tests/test_historical_analytics.py`)
* **6/6 Verification Stages Passed (100% Success)**
* Verified 471,015-record archive load, single-day lookups, period aggregations (Amritsar Diwali mean AQI 232.4), and zero-imputation protection.

### 6.3 Comprehensive Runtime Test (`tests/test_runtime_comprehensive.py`)
* **4/4 Sections Passed (100% Success)**
* Verified live Open-Meteo queries across 8 cities, coordinate boundary error rejection (HTTP 400), physical station snapshot integrity, and zero chatbot/Gemini code traces in active files.

### 6.4 Browser End-to-End Automation (`tests/test_browser_runtime.js`)
* Executed via Google Chrome headless using Chrome DevTools Protocol (CDP).
* Confirmed:
  * **0 Browser Console Errors**
  * **0 Network Failures** (all 41 assets returned HTTP 200)
  * **0 Horizontal Scroll Overflows** across mobile (375px), tablet (768px), and desktop (1280px) viewports.

---

## 7. Academic Disclosures, Caveats & Limitations

1. **Model Estimates vs. Physical Measurements**:
   * Open-Meteo atmospheric readings are 1-hour instantaneous numerical simulations from global atmospheric models (CAMS/ECMWF), not physical continuous CAAQMS ground station averages.
   * Official CPCB daily bulletins represent 24-hour diurnal averages from physical ground monitors published at 4:00 PM daily.
2. **Machine Learning Forecasting Integration**:
   * AirCare integrates **Google TimesFM 2.5** (200M parameter PyTorch foundation model) to predict future mass concentrations across 6 criteria pollutants (PM2.5, PM10, NO2, SO2, CO, O3).
   * Predicted concentrations are passed directly into official Central Pollution Control Board (CPCB) NAQI 2014 piecewise linear formulas to derive mathematically consistent composite AQI forecasts.
   * Generalization performance is validated through rigorous chronological rolling-origin backtesting against Persistence and XGBoost baselines (achieving 1-day AQI RMSE of 15.46 and R² = 0.770).
3. **Missing Data Handling**:
   * In compliance with academic data analytics guidelines, missing observations in historical archives are preserved as `null`. AirCare never invents synthetic readings or treats missing air quality as zero.
4. **Government Discretionary Overrides**:
   * Rare discrepancies exist in official CPCB archives where reported categories deviate from mathematical boundaries (e.g. AQI 300 classified as 'Very Poor'). AirCare preserves the authentic government bulletin record while displaying an audit flag.

---

## 8. Technology Stack

* **Frontend Framework**: React 19, TypeScript
* **Build System & Bundler**: Vite 8.3
* **Styling & UI Components**: Tailwind CSS, Material Symbols Outlined, Space Grotesk & Inter typography
* **Machine Learning & Time Series**: Google TimesFM 2.5 (200M PyTorch Checkpoint), XGBoost Regressor, Scikit-Learn
* **Database & Cloud Storage**: Supabase PostgreSQL (`air_quality_readings`, `aqi_predictions`, `prediction_evaluations`)
* **Testing & Automation**: Python 3.13, Node.js v24, GitHub Actions Cron Pipelines, Oxlint
* **Data Sources**: Central Pollution Control Board (CPCB), Open-Meteo Atmospheric Services (CAMS Global / ECMWF IFS)

---

## 9. Conclusion

AirCare provides a robust, scientifically honest, and technically sound environmental analytics platform for ambient air quality monitoring in India. By bridging the gap between raw government archives and accessible citizen data visualization, the platform satisfies all academic criteria for the BCA Minor Project with zero third-party secret dependencies, high performance, and complete verification.

