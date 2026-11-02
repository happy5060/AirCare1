# Data Cleaning & Preprocessing Report

**Project Title:** Air Quality Analysis (BCA Minor Project)  
**Pipeline Execution Date:** 2026-10-20 11:24:52  
**Status:** Successfully Executed & Verified (All 3 Raw Datasets Preserved Intact)

---

## 1. Executive Summary & Raw File Integrity

A reproducible data-cleaning pipeline was executed using `clean_data.py`. All outputs were written to [`e:\minor project\processed_data`](file:///e:/minor%20project/processed_data).

**Zero-Modification Guarantee:** All three original raw CSV datasets in the project root were verified before and after pipeline execution using MD5 hash fingerprints:

| Raw Dataset | Path | Original Size | Post-Pipeline Size | Status |
| :--- | :--- | :--- | :--- | :---: |
| **City-Day Ambient Pollutants** | [`city_day.csv`](file:///e:/minor%20project/city_day.csv) | 2,574,056 bytes | 2,574,056 bytes | [PASS] 100% Intact |
| **Live Station Snapshot** | [`3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69.csv`](file:///e:/minor%20project/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69.csv) | 415,974 bytes | 415,974 bytes | [PASS] 100% Intact |
| **Historical AQI Bulletins** | [`cpcb_city_aqi_2015_2025.csv`](file:///e:/minor%20project/cpcb_city_aqi_2015_2025.csv) | 19,215,811 bytes | 19,215,811 bytes | [PASS] 100% Intact |

---

## 2. Dataset 1: Historical CPCB Daily AQI Bulletins (2015-2025)

* **Cleaned Output File:** [`processed_data/cleaned_cpcb_aqi_bulletins.csv`](file:///e:/minor%20project/processed_data/cleaned_cpcb_aqi_bulletins.csv)
* **Record Count:** **471,015 rows x 8 columns**
* **Temporal Range:** **2015-05-01 to 2025-12-31** (Covers through December 31, 2025)
* **Geographic Coverage:** **297 distinct Indian cities**

### Transformations Applied:
1. **Standardized Column Nomenclature:**
   * `date` (ISO-8601 string `YYYY-MM-DD`)
   * `city` (Clean trimmed string)
   * `station_count` (Integer count of active monitoring stations)
   * `aqi_category` (CPCB health bracket: `Good`, `Satisfactory`, `Moderate`, `Poor`, `Very Poor`, `Severe`)
   * `aqi` (Composite 24-hr Air Quality Index score)
   * `prominent_pollutant` (Primary pollutant driving the index; 1 missing value filled with `'Unspecified'`)
2. **Quality Auditing & Breakpoint Consistency:**
   * Cross-verified reported `aqi_category` against official CPCB breakpoints:
     * 0-50: Good
     * 51-100: Satisfactory
     * 101-200: Moderate
     * 201-300: Poor
     * 301-400: Very Poor
     * 401-500: Severe
   * Identified **268 records (0.06%)** where reported category differs from strict breakpoint boundaries (mostly borderline values like 100 or 200).
   * Added diagnostic columns: `expected_category` and `is_category_inconsistent` without altering CPCB's official reported category.
3. **Integrity & Missingness Policy:**
   * **Duplicate (city, date) pairs:** 0 (strictly unique).
   * **Missing Observations:** No artificial or synthetic values were imputed. Missing city-days reflect actual dates when stations were non-operational or bulletins omitted.

---

## 3. Dataset 2: Historical City-Day Ambient Pollutants (2015-2020)

* **Cleaned Output File:** [`processed_data/cleaned_city_day.csv`](file:///e:/minor%20project/processed_data/cleaned_city_day.csv)
* **Record Count:** **29,531 rows x 21 columns**
* **Temporal Range:** **2015-01-01 to 2020-07-01**
* **Geographic Coverage:** **26 major Indian cities**

### Transformations Applied:
1. **Schema Standardization:**
   * Normalized columns to snake_case: `city`, `date`, `pm2_5`, `pm10`, `no`, `no2`, `nox`, `nh3`, `co`, `so2`, `o3`, `benzene`, `toluene`, `xylene`, `aqi`, `aqi_bucket`.
2. **Missingness Handling (Non-Destructive):**
   * Missing values were **not deleted or blindly interpolated**, preserving the authentic data distribution for EDA.
   * Missing rates: `xylene` (61.32%), `pm10` (37.72%), `nh3` (34.97%), `toluene` (27.23%), `benzene` (19.04%), `aqi` (15.85%), `pm2_5` (15.57%), `nox` (14.17%), `o3` (13.62%), `so2` (13.05%), `no2` (12.14%), `no` (12.13%), `co` (6.97%).
3. **Outlier & Hardware Cap Diagnostics:**
   * Rather than deleting legitimate pollution spikes (which frequently occur during Diwali or crop burning season in Northern India), diagnostic boolean flags were added:
     * `flag_aqi_above_500`: **543 rows** where AQI exceeds official 500 ceiling.
     * `flag_pm10_sensor_cap`: **1 rows** where PM10 hits hardware saturation limit (1,000 ug/m3).
     * `flag_pm25_extreme`: **37 rows** where PM2.5 > 500 ug/m3.
     * `flag_co_extreme`: **120 rows** where CO > 50 mg/m3.
     * `flag_any_extreme`: **576 rows (1.95%)** flagged for user review.

---

## 4. Dataset 3: Live CAAQMS Station Snapshot

* **Cleaned Output File:** [`processed_data/cleaned_live_station_snapshot.csv`](file:///e:/minor%20project/processed_data/cleaned_live_station_snapshot.csv)
* **Record Count:** **3,668 rows x 12 columns**
* **Snapshot Timestamp:** **2026-10-20 10:00:00**
* **Coverage:** **524 CAAQMS monitoring stations across 273 cities in 31 States/UTs**

### Transformations Applied:
1. **Critical Metric Clarification (Sub-Index vs Physical Concentration):**
   * Renamed `pollutant_min`, `pollutant_max`, `pollutant_avg` to `subindex_min`, `subindex_max`, `subindex_avg`.
   * **Explicit Warning Documented:** These values represent CPCB AQI sub-indices (dimensionless scale 0-500), **NOT physical mass concentrations (ug/m3 or mg/m3)**.
2. **Geospatial Integrity:**
   * All GPS coordinates validated within India boundaries (Latitude: 8.51°N to 34.15°N, Longitude: 70.78°E to 94.64°E).
3. **Sensor Operational Status:**
   * Added `is_sensor_active` flag: **3,403 active measurements (92.78%)** and **265 offline/NaN measurements (7.22%)**.

---

## 5. Automated Pipeline Validation Summary

| Dataset | Pre-Clean Rows | Post-Clean Rows | Key Integrity Check | Date Range Verified | Status |
| :--- | :---: | :---: | :--- | :---: | :---: |
| **CPCB AQI Bulletins** | 471,015 | 471,015 | 0 Duplicate (city, date) | 2015-05-01 to 2025-12-31 | [PASS] |
| **City-Day Pollutants** | 29,531 | 29,531 | 0 Duplicate (city, date) | 2015-01-01 to 2020-07-01 | [PASS] |
| **Live Station Snapshot** | 3,668 | 3,668 | 0 Duplicate (station, pollutant) | Single snapshot verified | [PASS] |

*All datasets are structured, validated, and ready for EDA, descriptive statistics, and visualization without machine learning.*
