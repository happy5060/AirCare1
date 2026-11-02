# AirCare Phase 4 Completion Report: Live AQI & Monitoring Station Integration (Audited & Corrected)

**Project:** Air Quality Analysis & Visualization Using Data Analytics (BCA Minor Project)  
**Platform Name:** AirCare  
**Phase Completed:** Phase 4 — Live Atmospheric Feed & Historical Station Snapshot Integration  
**Status:** Complete, Audited & Fully Verified  

---

## 1. Executive Summary

Phase 4 connects genuine real-time environmental data to AirCare while strictly maintaining separation from the frozen **October 20, 2026 CAAQM Station Snapshot** and the **2015–2025 Historical Bulletin Archive**.

Following a thorough technical audit against official Central Pollution Control Board (CPCB) guidelines:
1. All atmospheric model readings are explicitly labeled **`Model-Estimated CPCB AQI`** to distinguish them from direct physical CPCB ground station readings.
2. Complete CPCB NAQI sub-index formulas have been implemented for all criteria pollutants, including **Ozone ($O_3$, 8-hr)** and **Carbon Monoxide ($CO$, converted from $\mu g/m^3 \rightarrow mg/m^3$)**.
3. CPCB's **minimum 3-pollutant requirement** (with at least $PM_{2.5}$ or $PM_{10}$) is enforced.
4. Hourly model concentrations are disclosed as 1-hour instantaneous estimates rather than official 24-hour diurnal ground averages.
5. Client-side security disclosures clarify that `VITE_*` environment variables in SPAs are public client tokens.

---

## 2. API Source Investigation & Attribution

| API Source | Type of Data | Auth / Key Requirements | Indian Coverage | AirCare Integration Status |
| :--- | :--- | :--- | :--- | :--- |
| **Open-Meteo Air Quality API** | **Atmospheric Numerical Model** (CAMS / ECMWF reanalysis & satellite assimilation) | Free, no API key required; CORS-enabled. | Complete coverage across all 273 Indian monitoring cities via exact station coordinates. | **Primary Default Engine** (Evaluated in real-time using official CPCB mathematical sub-index algorithms). |
| **WAQI / AQICN API** | **Aggregated Ground Station Telemetry** (Physical CAAQMS feeds) | Public client token required (`api.waqi.info`). | Selected Indian CAAQM stations. | **Optional Direct Station Feed** (Supported via `VITE_WAQI_API_KEY` in `.env`). |

### Key Clarification on Data Origin:
- Open-Meteo does **not** provide direct ground sensor telemetry; it provides high-resolution numerical atmospheric model estimates.
- AirCare processes these live concentrations using CPCB’s official National Air Quality Index formulas to produce a **`Model-Estimated CPCB AQI`**.

---

## 3. Audited CPCB NAQI Conversion Engine

All calculations strictly adhere to the Central Pollution Control Board technical guidelines (*"National Air Quality Index"*, 2014):

$$\text{Sub-Index } I = I_{low} + \frac{I_{high} - I_{low}}{C_{high} - C_{low}} \times (C - C_{low})$$

$$\text{Overall AQI} = \max\left(I_{PM_{2.5}}, I_{PM_{10}}, I_{NO_2}, I_{SO_2}, I_{O_3}, I_{CO}\right)$$

### Official Breakpoint Concentration Bands:

| Category | AQI Range | $PM_{10}$ (24-hr) | $PM_{2.5}$ (24-hr) | $NO_2$ (24-hr) | $O_3$ (8-hr) | $CO$ (8-hr, $mg/m^3$) | $SO_2$ (24-hr) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Good** | 0 – 50 | 0 – 50 | 0 – 30 | 0 – 40 | 0 – 50 | 0.0 – 1.0 | 0 – 40 |
| **Satisfactory** | 51 – 100 | 51 – 100 | 31 – 60 | 41 – 80 | 51 – 100 | 1.1 – 2.0 | 41 – 80 |
| **Moderate** | 101 – 200 | 101 – 250 | 61 – 90 | 81 – 180 | 101 – 168 | 2.1 – 10.0 | 81 – 380 |
| **Poor** | 201 – 300 | 251 – 350 | 91 – 120 | 181 – 280 | 169 – 208 | 10.1 – 17.0 | 381 – 800 |
| **Very Poor** | 301 – 400 | 351 – 430 | 121 – 250 | 281 – 400 | 209 – 748 | 17.1 – 34.0 | 801 – 1600 |
| **Severe** | 401 – 500 | 430 – 500 | 250 – 380 | 400 – 500 | 748 – 1000 | 34.0 – 50.0 | 1600 – 2000 |

*Note on Carbon Monoxide unit conversion:* Open-Meteo returns $CO$ in $\mu g/m^3$, which is divided by $1000$ to obtain $mg/m^3$ before applying the CPCB formula.

---

## 4. Minimum Pollutant Compliance Criteria

In accordance with official CPCB methodology:
- An AQI is considered officially valid only if at least **3 criteria pollutants** are monitored, of which at least one **must be $PM_{10}$ or $PM_{2.5}$**.
- AirCare validates this rule on all live fetches. If fewer than 3 pollutants are present, the interface explicitly notes: *"Insufficient pollutant data for official CPCB NAQI standard."*

---

## 5. Temporal Tier Architecture

```mermaid
graph TD
    A["AirCare Data Tiers"] --> B["Tier 1: Live Feed (Today's AQI)"]
    A --> C["Tier 2: Physical Station Snapshot"]
    A --> D["Tier 3: Historical Bulletin Archive"]

    B --> B1["Source: Open-Meteo Atmospheric Model"]
    B --> B2["Nature: 1-hour instantaneous model estimate"]
    B --> B3["Attribution: Model-Estimated CPCB AQI"]

    C --> C1["Source: processed_data/cleaned_live_station_snapshot.csv"]
    C --> C2["Nature: Static audit snapshot (Oct 20, 2026, 10:00 AM IST)"]
    C --> C3["Attribution: 524 Physical Ground CAAQM Stations"]

    D --> D1["Source: cleaned_cpcb_aqi_bulletins.csv (2015-2025)"]
    D --> D2["Nature: Official 4 PM daily 24-hr bulletins (471k rows)"]
    D --> D3["Pages: Past Air Quality & Compare Cities"]
```

---

## 6. Client-Side Security Disclosures

As documented in `frontend/.env.example`:
- In client-side React/Vite SPAs without a dedicated backend server, all variables prefixed with `VITE_*` are compiled directly into the public JavaScript bundle.
- Any optional WAQI token provided is treated as a **public client token**, not a secure backend secret.

---

## 7. Verification & Build Results

1. **Sub-Index Formulas Tested:**
   - $CO = 501\ \mu g/m^3 = 0.501\ mg/m^3 \implies \text{Sub-Index } 25$ (*Good*).
   - $O_3 = 179\ \mu g/m^3 \implies \text{Sub-Index } 228$ (*Poor*).
   - $PM_{10} = 180.7\ \mu g/m^3 \implies \text{Sub-Index } 154$ (*Moderate*).
   - $PM_{2.5} = 50.2\ \mu g/m^3 \implies \text{Sub-Index } 84$ (*Satisfactory*).

2. **Phase 3 Test Verification Script (`scratch/verify_phase3_queries.py`):**
   - 471,015 bulletin records verified across Delhi, Bengaluru, Mumbai, Amritsar with 100% calculation consistency.

3. **Production Build (`npm run build`):**
   - 24 modules transformed cleanly. Zero lint, TypeScript, or bundling errors.
