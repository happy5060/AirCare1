# AirCare — Supabase Integration & Live Air Quality Storage Guide

This document specifies the setup, database schema, security posture, automated data-collection pipelines, and diagnostic procedures for connecting **AirCare** to **Supabase** (Phase 1).

---

## 1. Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │          Browser Client UI             │
                      │  (Vite + React 19 + Tailwind CSS)      │
                      └───────┬──────────────────────┬─────────┘
                              │                      │
                      Direct Public Read        Direct Live Model
                     (SELECT via PostgREST)     (Open-Meteo HTTP)
                              │                      │
                              ▼                      ▼
┌────────────────────────────────────────┐    ┌─────────────────────────┐
│           Supabase Database            │    │  Open-Meteo Air Quality │
│       PostgreSQL + PostgREST           │    │  Atmospheric Reanalysis │
│  ┌──────────────────────────────────┐  │    └────────────┬────────────┘
│  │ Table: air_quality_readings      │  │                 │
│  │ (RLS: SELECT=anon, WRITE=service)│  │                 │
│  ├──────────────────────────────────┤  │                 │
│  │ Table: aqi_predictions           │  │                 │
│  ├──────────────────────────────────┤  │                 │
│  │ Table: prediction_evaluations    │  │                 │
│  └──────────────────────────────────┘  │                 │
└──────────────────▲─────────────────────┘                 │
                   │                                       │
            Upsert via Service Role                        │
           (Every 3 Hours: 0 */3 * * *)                    │
                   │                                       │
        ┌──────────┴──────────────────────────────┐        │
        │      Automated Collection Worker        │        │
        │  Option A: Supabase Edge Function (Deno)◄────────┤
        │  Option B: GitHub Actions Cron (Python) ◄────────┘
        └─────────────────────────────────────────┘
```

### Key Principles
1. **Academic & Measurement Honesty**: Physical ground monitoring stations (CPCB CAAQMS) are explicitly distinguished from numerical atmospheric reanalysis models (Open-Meteo CAMS/ECMWF) via the `source_type` field (`physical_station` vs `atmospheric_model`).
2. **Measurement Normalization**: Gaseous pollutants ($\text{NO}_2, \text{SO}_2, \text{O}_3$) and particulate matter ($\text{PM}_{2.5}, \text{PM}_{10}$) are recorded in $\mu\text{g/m}^3$. Carbon Monoxide ($\text{CO}$) is normalized to CPCB reporting units ($\text{mg/m}^3$) by dividing Open-Meteo's raw $\mu\text{g/m}^3$ by $1000.0$.
3. **Zero Frontend Credential Leakage**: Only public publishable / anon keys are supplied to Vite. The `service_role` secret key is strictly restricted to trusted server-side environments.
4. **Idempotency & Duplicate Prevention**: Database uniqueness constraints (`(city, source, observed_at)`) ensure zero redundant rows even during back-to-back collection runs.

---

## 2. Environment Variables

### A. Frontend Client (`frontend/.env`)
Create `frontend/.env` using `frontend/.env.example` as a template:

```ini
# Project URL (Supabase Dashboard -> Project Settings -> API)
VITE_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co

# Public Publishable Key / Anon Key (Safe for client browsers under Row Level Security)
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_[YOUR_PUBLIC_TOKEN]
# Legacy anon key fallback (supported if you use classic anon JWT):
# VITE_SUPABASE_ANON_KEY=eyJh...

# Optional: WAQI physical ground station API key
VITE_WAQI_API_KEY=
```

> [!CAUTION]
> **CRITICAL SECURITY RULE:** Never put `SUPABASE_SERVICE_ROLE_KEY` in `frontend/.env` or prefix it with `VITE_`. Any variable starting with `VITE_` is bundled directly into the public JavaScript output and exposed to every visitor.

### B. Server-Side Automated Collector (`.github/workflows` or server environment)
When running automated collection via GitHub Actions or standalone scripts:

```ini
SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJh...[YOUR_SECRET_SERVICE_ROLE_KEY]
```

---

## 3. Database Schema & SQL Migrations

Migrations are located in `supabase/migrations/`:

### 1. `20261111000001_air_quality_schema.sql`
Creates three primary tables:
- **`air_quality_readings`**:
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `city`: `VARCHAR(100) NOT NULL` (e.g., Delhi, Mumbai, Bengaluru)
  - `source`: `VARCHAR(150) NOT NULL` (`open-meteo` or `cpcb-station`)
  - `source_type`: `VARCHAR(50) NOT NULL CHECK (source_type IN ('atmospheric_model', 'physical_station'))`
  - `observed_at`: `TIMESTAMPTZ NOT NULL` (Observation timestamp from provider in UTC)
  - `fetched_at`: `TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())`
  - `latitude`, `longitude`: `DOUBLE PRECISION NOT NULL`
  - `pm2_5`, `pm10`, `no2`, `so2`, `o3`: `NUMERIC(8, 2)` (in $\mu\text{g/m}^3$)
  - `co`: `NUMERIC(8, 2)` (normalized to $\text{mg/m}^3$)
  - `estimated_aqi`: `INTEGER NOT NULL CHECK (estimated_aqi >= 0 AND estimated_aqi <= 500)`
  - `aqi_category`: `VARCHAR(50) NOT NULL CHECK (aqi_category IN ('Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor', 'Severe'))`
  - `dominant_pollutant`: `VARCHAR(50) NOT NULL`
  - `model_or_source_metadata`: `JSONB NOT NULL DEFAULT '{}'::jsonb`
  - **Constraint**: `CONSTRAINT uq_city_source_observed UNIQUE (city, source, observed_at)`
  - **Indexes**: `(city, observed_at DESC)`, `(observed_at DESC)`, `(source_type)`

- **`aqi_predictions`** *(Prepared for Phase 2 ML)*:
  - Stores future multi-horizon forecasts ($24\text{h}, 48\text{h}, 72\text{h}$) without fabricating values today.
  - Columns: `id`, `city`, `model_name`, `model_version`, `generated_at`, `target_time`, `forecast_horizon`, `predicted_pollutants`, `predicted_aqi`, `prediction_metadata`.

- **`prediction_evaluations`** *(Prepared for Phase 3 Model Benchmarking)*:
  - Links predictions to ground truth observations for validation (MAE, RMSE, MAPE).
  - Columns: `id`, `prediction_id` (FK), `observation_id` (FK), `evaluated_at`, `error_metrics`, `evaluation_metadata`.

### 2. `20261111000002_rls_security_policies.sql`
Enforces Row Level Security (RLS):
- Enables RLS on all 3 tables.
- Creates public `SELECT` policies for `anon` and `authenticated` roles.
- Strictly omits `INSERT`, `UPDATE`, and `DELETE` policies for anonymous users, blocking write operations from browser DevTools or malicious API queries.
- Grants write permissions to `service_role`.

### 3. `20261111000003_scheduled_collection_pgcron.sql`
Configures in-database scheduling using PostgreSQL extensions `pg_cron` and `pg_net` (available on Supabase Free & Pro tiers).

---

## 4. How to Apply Migrations to Your Supabase Project

You can apply the migrations using either the Supabase Web Dashboard or the Supabase CLI:

### Option A: Supabase Dashboard (Recommended, No CLI required)
1. Open your [Supabase Project Dashboard](https://supabase.com/dashboard).
2. Navigate to **SQL Editor** in the left sidebar.
3. Click **New query**.
4. Copy the entire contents of [`supabase/migrations/20261111000001_air_quality_schema.sql`](file:///e:/minor%20project/supabase/migrations/20261111000001_air_quality_schema.sql) and paste into the editor.
5. Click **Run**.
6. Repeat for [`supabase/migrations/20261111000002_rls_security_policies.sql`](file:///e:/minor%20project/supabase/migrations/20261111000002_rls_security_policies.sql).

### Option B: Supabase CLI
```bash
supabase link --project-ref [YOUR_PROJECT_REF]
supabase db push
```

---

## 5. Automated Data Collection Setup (Every 3 Hours)

The collector queries 10 Indian cities:
1. Delhi
2. Mumbai
3. Bengaluru
4. Kolkata
5. Chennai
6. Hyderabad
7. Ahmedabad
8. Pune
9. Jaipur
10. Lucknow

### Method 1: GitHub Actions Cron (Recommended, 100% Free & Self-Contained)
A pre-configured GitHub Actions workflow is provided at [`.github/workflows/scheduled-data-collection.yml`](file:///e:/minor%20project/.github/workflows/scheduled-data-collection.yml):
1. In your GitHub repository, navigate to **Settings** -> **Secrets and variables** -> **Actions**.
2. Click **New repository secret** and add:
   - `SUPABASE_URL`: `https://[YOUR_PROJECT_REF].supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: `[YOUR_SERVICE_ROLE_SECRET_KEY]`
3. The workflow executes automatically at minute 0 every 3 hours (`0 */3 * * *`).
4. You can also trigger an immediate run via the **Actions** tab -> **Scheduled Air Quality Collection** -> **Run workflow**.

### Method 2: Supabase Edge Function (`supabase/functions/collect-air-quality`)
1. Deploy the Edge Function:
   ```bash
   supabase functions deploy collect-air-quality --no-verify-jwt
   ```
2. Schedule via `pg_cron` (see [`supabase/migrations/20261111000003_scheduled_collection_pgcron.sql`](file:///e:/minor%20project/supabase/migrations/20261111000003_scheduled_collection_pgcron.sql)).

### Method 3: Local or Server Standalone Execution
Run the Python script directly:
```powershell
$env:SUPABASE_URL = "https://[YOUR_PROJECT_REF].supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "[YOUR_SERVICE_ROLE_KEY]"
python scripts/collect_air_quality.py
```

---

## 6. Verification and Diagnostics

### In-App UI Diagnostics
1. Launch the AirCare application (`npm --prefix frontend run dev`).
2. In the footer, click **Database Status** (or navigate to `/#diagnostics`).
3. The diagnostic modal inspects:
   - Live Supabase connection health
   - Stored reading counts in `air_quality_readings`
   - Latest collection timestamp (converted to IST)
   - Covered cities
   - Missing pollutant fields check
   - Zero credential leaks

### CLI Verification Script
Run the automated verification suite:
```powershell
python scripts/verify_supabase.py
```
This tests:
- Public anonymous `SELECT` permissions
- Rejection of unauthorized anonymous `INSERT` requests (RLS verification)
- Authorized `service_role` upsert and duplicate prevention

---

## 7. Troubleshooting Guide

| Issue / Symptom | Root Cause | Solution |
| :--- | :--- | :--- |
| **"Not Configured (Operating in Direct Open-Meteo Mode)"** | `VITE_SUPABASE_URL` or `VITE_SUPABASE_PUBLISHABLE_KEY` is missing in `frontend/.env`. | AirCare gracefully falls back to direct Open-Meteo queries. Set the variables and restart the dev server. |
| **HTTP 401 / 403 on SELECT** | RLS is enabled but `Public read access` policy was not applied. | Run `20261111000002_rls_security_policies.sql` in the Supabase SQL Editor. |
| **HTTP 401 / 403 on Collector Upsert** | Collector is passing the public anon key instead of `SUPABASE_SERVICE_ROLE_KEY`. | Set `SUPABASE_SERVICE_ROLE_KEY` in GitHub Secrets or server environment. |
| **HTTP 429 Rate Limit from Open-Meteo** | Excessive parallel queries in short time window. | The collector script includes a 300ms pause between cities to respect API limits. |
| **Duplicate records on re-run** | Unique constraint was omitted. | Ensure table was created with `CONSTRAINT uq_city_source_observed UNIQUE (city, source, observed_at)`. |

---

## 8. Role in the Future ML Forecasting Pipeline (Phase 2 & 3)

The persistent 3-hour readings accumulated in `air_quality_readings` serve as the **ground truth training corpus** for the machine learning models proposed in [`docs/MACHINE_LEARNING_PROPOSAL.md`](file:///e:/minor%20project/docs/MACHINE_LEARNING_PROPOSAL.md):
- **72-Hour Lag Windows**: Creates sequential input tensors for LightGBM and LSTM recurrent networks.
- **Diurnal Cycle Modeling**: Captures the morning rush hour spike (08:00–10:00 IST) and nocturnal thermal inversion trapping (20:00–04:00 IST).
- **Forecast Verification**: Allows `prediction_evaluations` to calculate Mean Absolute Error (MAE) and Root Mean Squared Error (RMSE) against actual recorded air quality.
