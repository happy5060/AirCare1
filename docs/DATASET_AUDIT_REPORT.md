# Dataset Audit Report: Air Quality Analysis

**Project Title:** Air Quality Analysis (BCA Minor Project)  
**Audit Date:** October 20, 2026  
**Auditor:** Agentic AI Assistant (Antigravity)  
**Status:** Completed — Audit Only (No modifications made to raw files)

---

## 1. Executive Summary

A comprehensive, non-destructive audit was performed on the two raw CSV datasets located in the project directory (`e:\minor project`). Both files were ingested, validated, and statistically audited using Python (v3.13) and Pandas (v2.3.3).

| Attribute | File 1: `city_day.csv` | File 2: `3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69.csv` |
| :--- | :--- | :--- |
| **Exact Filename** | `city_day.csv` | `3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69.csv` |
| **File Size** | 2,574,056 bytes (~2.57 MB) | 415,974 bytes (~416 KB) |
| **Dimensions** | 29,531 rows × 16 columns | 3,668 rows × 11 columns |
| **Data Nature / Source** | Kaggle India Air Quality Dataset (CPCB Aggregated Daily) | Open Government Data (OGD) India / CPCB Real-Time API Endpoint Snapshot |
| **Temporal Coverage** | 2015-01-01 to 2020-07-01 (Daily time series, 5.5 years) | **2026-10-20 10:00:00** (Single instantaneous snapshot) |
| **Contains Data Through Dec 2025?** | ❌ No (Terminates on July 1, 2020) | ❌ **No (Zero historical records; only 1 timestamp in 2026)** |
| **Spatial Coverage** | 26 Cities (No stations or GPS coordinates) | 273 Cities, 524 Stations across 31 States/UTs (With GPS) |
| **Data Structure / Shape** | Wide format (1 column per pollutant) | Long format (1 row per station-pollutant combination) |
| **Metric / Unit Type** | Ambient concentration ($\mu\text{g/m}^3$, CO in $\text{mg/m}^3$) + Composite AQI | CPCB AQI Sub-Index values (0–500 scale, unitless index) |
| **Duplicate Rows** | 0 exact duplicates; 0 duplicate `(City, Date)` pairs | 0 exact duplicates; 0 duplicate `(station, pollutant_id)` pairs |
| **Safe to Merge Directly?** | ❌ **No. Fundamentally incompatible without extensive transformation.** |

---

## 2. File 1 Detailed Audit: `city_day.csv`

### 2.1 File Overview & Schema
* **Filename:** `city_day.csv`
* **File Size:** 2,574,056 bytes
* **Row Count:** 29,531 records
* **Column Count:** 16 columns
* **Integrity:** 0 exact duplicate rows. Every `(City, Date)` pair is strictly unique.

| Column Name | Data Type | Non-Null Count | Null Count | Null % | Description / Unit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `City` | `object` (string) | 29,531 | 0 | 0.00% | Name of the urban area |
| `Date` | `object` (date `YYYY-MM-DD`) | 29,531 | 0 | 0.00% | Observation date (daily interval) |
| `PM2.5` | `float64` | 24,933 | 4,598 | 15.57% | Particulate Matter < 2.5 µm ($\mu\text{g/m}^3$) |
| `PM10` | `float64` | 18,391 | 11,140 | 37.72% | Particulate Matter < 10 µm ($\mu\text{g/m}^3$) |
| `NO` | `float64` | 25,949 | 3,582 | 12.13% | Nitric Oxide ($\mu\text{g/m}^3$) |
| `NO2` | `float64` | 25,946 | 3,585 | 12.14% | Nitrogen Dioxide ($\mu\text{g/m}^3$) |
| `NOx` | `float64` | 25,346 | 4,185 | 14.17% | Nitrogen Oxides ($\text{ppb}$ or $\mu\text{g/m}^3$) |
| `NH3` | `float64` | 19,203 | 10,328 | 34.97% | Ammonia ($\mu\text{g/m}^3$) |
| `CO` | `float64` | 27,472 | 2,059 | 6.97% | Carbon Monoxide ($\text{mg/m}^3$) |
| `SO2` | `float64` | 25,677 | 3,854 | 13.05% | Sulphur Dioxide ($\mu\text{g/m}^3$) |
| `O3` | `float64` | 25,509 | 4,022 | 13.62% | Ozone ($\mu\text{g/m}^3$) |
| `Benzene` | `float64` | 23,908 | 5,623 | 19.04% | Benzene ($\mu\text{g/m}^3$) |
| `Toluene` | `float64` | 21,490 | 8,041 | 27.23% | Toluene ($\mu\text{g/m}^3$) |
| `Xylene` | `float64` | 11,422 | 18,109 | 61.32% | Xylene ($\mu\text{g/m}^3$) |
| `AQI` | `float64` | 24,850 | 4,681 | 15.85% | Air Quality Index (Dimensionless, 0–500 standard) |
| `AQI_Bucket`| `object` (category) | 24,850 | 4,681 | 15.85% | CPCB Classification Category |

### 2.2 Temporal Coverage
* **Earliest Date:** `2015-01-01`
* **Latest Date:** `2020-07-01`
* **Coverage Span:** 2,009 calendar days (~5.5 years).
* **Annual Breakdown:**
  * 2015: 2,801 records
  * 2016: 3,478 records
  * 2017: 4,689 records
  * 2018: 6,471 records
  * 2019: 7,446 records
  * 2020: 4,646 records (up to July 1, 2020)
* **City Start Dates Vary:** Not all cities start in 2015. E.g., Ahmedabad, Bengaluru, Chennai, Delhi, Lucknow, Mumbai start on `2015-01-01`, while Aizawl starts on `2020-03-11` (113 days), and Kochi/Ernakulam start on `2020-01-22` (162 days).

### 2.3 Geographic Coverage
* **Total Cities:** 26 unique cities across India.
* **Cities List:** Ahmedabad, Aizawl, Amaravati, Amritsar, Bengaluru, Bhopal, Brajrajnagar, Chandigarh, Chennai, Coimbatore, Delhi, Ernakulam, Gurugram, Guwahati, Hyderabad, Jaipur, Jorapokhar, Kochi, Kolkata, Lucknow, Mumbai, Patna, Shillong, Talcher, Thiruvananthapuram, Visakhapatnam.
* **Monitoring Stations:** None. The dataset has already collapsed/averaged station-level readings to single daily values per city.

### 2.4 Data Quality, Invalid Values & Outliers
* **Negative Values:** None detected (all minimum values are $\ge 0.0$).
* **Outliers & Extreme Values:**
  * `AQI`: Maximum value reaches `2,049.00` (99th percentile is `661.51`, median is `118.00`). Indian National AQI caps at `500` ("Severe"). Values $> 500$ reflect extreme episodic pollution events (e.g., Delhi winter/crop burning spikes) or sensor sub-index extrapolations.
  * `PM2.5`: Maximum reaches `949.99` $\mu\text{g/m}^3$ (median `48.57`).
  * `PM10`: Maximum reaches `1,000.00` $\mu\text{g/m}^3$ (hardware sensor ceiling limit).
  * `CO`: Maximum reaches `175.81` $\text{mg/m}^3$ (median `0.89`).
  * `Benzene` & `Toluene`: Spike up to `455.03` and `454.85` $\mu\text{g/m}^3$.
* **Missing Value Impact:** High missingness for VOCs (Xylene 61.3%, Toluene 27.2%, Benzene 19.0%) and `PM10` (37.7%). 4,681 rows (15.85%) lack both `AQI` and `AQI_Bucket` because CPCB requires at least 3 pollutants (including PM10 or PM2.5) to compute a valid AQI.

---

## 3. File 2 Detailed Audit: `3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69.csv`

### 3.1 File Overview & Schema
* **Filename:** `3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69.csv`
* **File Size:** 415,974 bytes
* **Row Count:** 3,668 records
* **Column Count:** 11 columns
* **Source Identification:** The filename `3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69` is the official resource UUID for the **Central Pollution Control Board (CPCB) "Real-time Air Quality Index from Various Locations" API on Open Government Data Platform India (`data.gov.in`)**.

| Column Name | Data Type | Non-Null Count | Null Count | Null % | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `country` | `object` (string) | 3,668 | 0 | 0.00% | Constant value: `"India"` |
| `state` | `object` (string) | 3,668 | 0 | 0.00% | 31 States / Union Territories |
| `city` | `object` (string) | 3,668 | 0 | 0.00% | 273 distinct cities/municipalities |
| `station` | `object` (string) | 3,668 | 0 | 0.00% | 524 distinct CAAQMS monitoring stations |
| `last_update`| `object` (timestamp) | 3,668 | 0 | 0.00% | Date/Time of feed snapshot |
| `latitude` | `float64` | 3,668 | 0 | 0.00% | GPS Latitude ($8.5149^\circ\text{N}$ to $34.1471^\circ\text{N}$) |
| `longitude`| `float64` | 3,668 | 0 | 0.00% | GPS Longitude ($70.7768^\circ\text{E}$ to $94.6366^\circ\text{E}$) |
| `pollutant_id` | `object` (string) | 3,668 | 0 | 0.00% | Pollutant ID: `NH3`, `PM2.5`, `CO`, `OZONE`, `NO2`, `SO2`, `PM10` |
| `pollutant_min`| `float64` | 3,403 | 265 | 7.22% | Rolling minimum sub-index |
| `pollutant_max`| `float64` | 3,403 | 265 | 7.22% | Rolling maximum sub-index |
| `pollutant_avg`| `float64` | 3,403 | 265 | 7.22% | Rolling average sub-index |

### 3.2 Verification of Historical Records Through December 2025
> [!CAUTION]
> **CRITICAL VERIFICATION FINDING: ZERO HISTORICAL RECORDS THROUGH DEC 2025**
> - The prompt specifically asked to verify whether this newer file contains historical records through December 2025.
> - **Result:** The file does **NOT** contain records through December 2025.
> - **Evidence:** 
>   - Exactly **100% of the 3,668 rows** share the exact same timestamp: `20-10-2026 10:00:00`.
>   - There are **no entries** for 2021, 2022, 2023, 2024, or 2025.
>   - The dataset is a live single-moment snapshot from the data.gov.in real-time API buffer, not a historical archive.

### 3.3 Spatial Coverage & Structure
* **States Covered:** 31 States / UTs (Top: Maharashtra with 616 rows/88 stations, UP with 462 rows/66 stations, Delhi with 392 rows/56 stations).
* **Stations Covered:** 524 distinct stations. Exactly 7 rows exist per station (one row for each of the 7 CPCB criteria pollutants: $524 \times 7 = 3,668$ rows).
* **Tidy / Long Format:** Rather than having separate columns for pollutants, it uses a key-value long structure (`pollutant_id` and `pollutant_avg`).

### 3.4 Metric Units & Sub-Index Clarification
* In this CPCB real-time API feed, `pollutant_min`, `pollutant_max`, and `pollutant_avg` represent **individual pollutant AQI sub-indices** (scale 0–500), rather than raw ambient concentration units ($\mu\text{g/m}^3$ or $\text{mg/m}^3$).
  * For example, `CO` has a median `pollutant_avg` of `34.0` and max of `170.0`. If this were raw concentration in $\text{mg/m}^3$, the air would be immediately fatal (ambient CO is typically $0.5 - 4.0\text{ mg/m}^3$). A value of 34 corresponds to a CPCB sub-index for CO in the "Good" category.
* **Missing Data:** 265 readings (7.22%) have `NaN` for min, max, and avg, representing sensor downtime or offline channels at specific stations during that hour (e.g., NH3 is offline at 76 stations, SO2 at 49 stations).

---

## 4. Cross-Dataset Comparison & Overlap Analysis

| Comparison Dimension | `city_day.csv` | `3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69.csv` | Overlap & Compatibility Assessment |
| :--- | :--- | :--- | :--- |
| **Temporal Range** | 2015-01-01 to 2020-07-01 (Daily) | 2026-10-20 10:00:00 (Single snapshot) | **Zero temporal overlap.** There is a gap of **2,302 days (over 6 years)** between the end of File 1 and the single snapshot of File 2. |
| **City Coverage** | 26 cities | 273 cities | **23 common cities overlap.** 3 cities in File 1 (`Ernakulam`, `Kochi`, `Talcher`) are not listed under those names in File 2. |
| **Monitoring Stations** | 0 (City-level aggregation) | 524 stations (Station-level) | **Zero station overlap.** File 1 has no station metadata. |
| **Geographic Coordinates** | None | Exact Latitude & Longitude | File 1 lacks GPS coordinates; File 2 includes CAAQMS station coordinates. |
| **Table Layout (Schema)** | Wide format (16 columns) | Long/Tidy format (11 columns) | Incompatible schemas. Direct concatenation is impossible without melting/pivoting. |
| **Pollutants Monitored** | 12 pollutants + AQI + Bucket | 7 criteria pollutants | File 1 contains VOCs (Benzene, Toluene, Xylene) and NO/NOx. File 2 only monitors criteria pollutants (PM2.5, PM10, NO2, NH3, SO2, CO, OZONE). |
| **Data Nature / Units** | Raw concentration ($\mu\text{g/m}^3, \text{mg/m}^3$) | AQI Sub-index points (0–500) | Incompatible units. File 2 cannot be compared with raw concentrations in File 1. |

---

## 5. Feasibility of Combining Datasets

### Can they be safely combined?
**Conclusion: NO, they cannot be safely combined into a single unified dataset.**

### Why Direct Merging / Concatenation Fails:
1. **Severe Temporal Discontinuity:** You cannot perform time series forecasting or trend analysis across a 6-year gap (July 2020 to October 2026) with only a single timestamp for the latter.
2. **Unit Mismatch (Concentration vs Sub-Index):** In `city_day.csv`, pollutant values represent physical mass concentrations. In `3b01bcb8...csv`, the values represent unitless AQI sub-indices. Merging them would corrupt any statistical model.
3. **Spatial Aggregation Mismatch:** File 1 is city-level; File 2 is station-level. Averaging stations in File 2 to city-level for one hour yields a single snapshot that does not represent a 24-hour daily average.
4. **Different Pollutant Scopes:** File 1 includes Benzene, Toluene, and Xylene, which are completely absent in File 2.

---

## 6. Recommendations for BCA Minor Project Architecture

Given that the project goal is "Air Quality Analysis", both files are valuable, but they must be utilized for **different modules** rather than merged into a single table:

1. **Keep Both Original Files Pristine:**
   * Preserve `city_day.csv` and `3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69.csv` in their original states in `e:\minor project\`.
2. **Module 1 — Historical Air Quality Trends & EDA (Using `city_day.csv`):**
   * Use for long-term trend analysis (2015–2020), seasonal variations (monsoon vs winter spikes), city-to-city comparisons, correlation between pollutants, and COVID-19 lockdown impact analysis (March–May 2020).
   * Clean missing values via forward/backward fill or iterative imputation per city.
3. **Module 2 — Geospatial Live / Station-Level Air Quality Map (Using `3b01bcb8...csv`):**
   * Use for interactive GIS/map visualization (e.g., Leaflet or Folium map plotting all 524 stations across 31 states with color-coded AQI sub-indices).
   * Pivot long format to wide format per station for real-time station diagnostics.
4. **Module 3 — Bridging the Gap (Optional Extended Scope):**
   * If continuous historical records up to 2025/2026 are required for model training, download the official CPCB annual historical archives from the CPCB portal or Kaggle rather than relying on the single-snapshot OGD endpoint.

---
*Report generated and validated autonomously by Antigravity IDE.*
