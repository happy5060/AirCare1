# AirCare Platform: Career-Relevant FastAPI Backend Architecture Proposal

## 1. Executive Summary & Career Context

In AirCare v1.0, the application operates as a high-performance, client-side single-page application (SPA) deployed on Vercel. All CPCB historical bulletins (2015–2025, 471,015 records across 297 cities) are statically indexed and served as compressed JSON payloads from `/data/bulletins/{city}.json`, while live atmospheric model data is retrieved directly from the Open-Meteo High-Resolution Atmospheric Reanalysis API with client-side CPCB NAQI sub-index evaluation.

To elevate this codebase into a full-stack, enterprise-grade portfolio project suitable for senior engineering evaluations, Python developer interviews, and production scalability, this proposal specifies the target architecture for **AirCare Backend v2.0**, powered by **FastAPI**, **PostgreSQL + TimescaleDB**, **Redis**, and **Celery**.

---

## 2. High-Level System Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │               Client Layer                   │
                    │   React 19 + TypeScript + Vite + Tailwind    │
                    └──────────────────────┬───────────────────────┘
                                           │ HTTPS / REST (JSON)
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │              API Gateway / Reverse Proxy     │
                    │                    Nginx / Caddy             │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             FastAPI Application Service                         │
│                                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌────────────────────────┐  │
│  │   Live AQI Router    │  │ Historical Analytics │  │  City Rankings Router  │  │
│  │   /api/v1/aqi/live   │  │ /api/v1/aqi/history  │  │ /api/v1/aqi/rankings   │  │
│  └──────────┬───────────┘  └──────────┬───────────┘  └───────────┬────────────┘  │
│             │                         │                          │               │
│  ┌──────────▼─────────────────────────▼──────────────────────────▼────────────┐  │
│  │                            Business Logic Services                         │  │
│  │         (CPCB NAQI Engine, Data Cleaning Pipeline, Statistics Calculator)   │  │
│  └──────────┬─────────────────────────┬──────────────────────────┬────────────┘  │
└─────────────┼─────────────────────────┼──────────────────────────┼───────────────┘
              │                         │                          │
              ▼                         ▼                          ▼
   ┌────────────────────┐    ┌────────────────────┐     ┌───────────────────────┐
   │    Redis Cache     │    │ TimescaleDB / Postg│     │ Celery Worker Daemon  │
   │  (5m Live / 24h    │    │ (Hypertable for    │     │ (CPCB 4 PM Scraper    │
   │   Historical)      │    │  Time-Series)      │     │  & Quality Checker)   │
   └────────────────────┘    └────────────────────┘     └───────────────────────┘
```

---

## 3. Technology Stack & Rationale

| Component | Technology | Technical Rationale |
| :--- | :--- | :--- |
| **Framework** | **FastAPI (Python 3.11+)** | High throughput (ASGI via Uvicorn/Starlette), native async/await for I/O-bound atmospheric APIs, automatic OpenAPI/Swagger documentation, and strict type safety via Pydantic v2. |
| **Database** | **PostgreSQL 16 + TimescaleDB** | TimescaleDB hypertables automatically partition 10+ years of environmental time-series records by timestamp and city, accelerating temporal range aggregations by 10–100x compared to standard B-trees. |
| **Caching** | **Redis 7** | In-memory key-value store to cache live atmospheric queries (5-minute TTL) and static historical period statistics (24-hour TTL), protecting external APIs and minimizing database IOPS. |
| **Task Queue** | **Celery + Redis Broker** | Asynchronous task scheduling for daily automated web-scraping of CPCB 4:00 PM bulletins, anomaly detection audits, and data hygiene routines without blocking API requests. |
| **Object Relational**| **SQLAlchemy 2.0 (Async) + Alembic** | High-performance asynchronous query execution with deterministic database schema migrations. |

---

## 4. Database Schema (TimescaleDB Hypertables)

### 4.1. Table: `cities` (Dimensional Metadata)
```sql
CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    key VARCHAR(100) NOT NULL UNIQUE,
    state VARCHAR(100) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    elevation_meters DOUBLE PRECISION,
    geographical_basin VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cities_key ON cities(key);
```

### 4.2. Hypertable: `cpcb_bulletins` (Official Historical Archive)
```sql
CREATE TABLE cpcb_bulletins (
    recorded_date DATE NOT NULL,
    city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    aqi INTEGER,
    cpcb_category VARCHAR(30) NOT NULL,
    prominent_pollutant VARCHAR(100),
    active_station_count INTEGER DEFAULT 0,
    is_category_inconsistent BOOLEAN DEFAULT FALSE,
    raw_bulletin_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (recorded_date, city_id)
);

-- Convert standard PostgreSQL table into TimescaleDB hypertable partitioned by date
SELECT create_hypertable('cpcb_bulletins', 'recorded_date', chunk_time_interval => INTERVAL '1 year');

-- Composite Index for fast range queries per city
CREATE INDEX idx_cpcb_bulletins_city_date ON cpcb_bulletins (city_id, recorded_date DESC);
```

### 4.3. Hypertable: `live_model_telemetry` (Atmospheric Model Snapshots)
```sql
CREATE TABLE live_model_telemetry (
    timestamp TIMESTAMPTZ NOT NULL,
    city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    computed_aqi INTEGER NOT NULL,
    category VARCHAR(30) NOT NULL,
    prominent_pollutant VARCHAR(30) NOT NULL,
    pm25_concentration DOUBLE PRECISION,
    pm10_concentration DOUBLE PRECISION,
    no2_concentration DOUBLE PRECISION,
    so2_concentration DOUBLE PRECISION,
    o3_concentration DOUBLE PRECISION,
    co_concentration DOUBLE PRECISION,
    is_naqi_compliant BOOLEAN NOT NULL,
    data_source VARCHAR(100) NOT NULL,
    PRIMARY KEY (timestamp, city_id)
);

SELECT create_hypertable('live_model_telemetry', 'timestamp', chunk_time_interval => INTERVAL '1 month');
```

---

## 5. REST API Specification (OpenAPI Endpoints)

### 5.1. Live Atmospheric Estimate Endpoint
```http
GET /api/v1/aqi/live?city=Delhi&lat=28.6139&lon=77.2090
```
**Response (200 OK):**
```json
{
  "city": "Delhi",
  "timestamp": "2026-11-09 12:00:00 IST",
  "aqi": 187,
  "category": "Moderate",
  "prominent_pollutant": "O3",
  "is_naqi_compliant": true,
  "compliance_note": "Compliant with CPCB minimum criteria (6 criteria pollutants evaluated).",
  "source": "Open-Meteo High-Resolution Atmospheric Model (CAMS / ECMWF)",
  "pollutant_breakdown": [
    {
      "name": "PM2.5 (Fine Particles)",
      "code": "pm25",
      "concentration": 82.4,
      "unit": "µg/m³",
      "sub_index": 175,
      "category": "Moderate",
      "averaging_period": "24-hour",
      "cpcb_standard": "60 µg/m³",
      "is_dominant": false,
      "is_valid": true,
      "calculation_details": "Linear interpolation: 100 + [(82.4 - 60) × 100 / 30] = 175"
    },
    {
      "name": "O3 (Ground Ozone)",
      "code": "o3",
      "concentration": 162.8,
      "unit": "µg/m³",
      "sub_index": 187,
      "category": "Moderate",
      "averaging_period": "8-hour",
      "cpcb_standard": "100 µg/m³",
      "is_dominant": true,
      "is_valid": true,
      "calculation_details": "Linear interpolation: 100 + [(162.8 - 100) × 100 / 68] = 187"
    }
  ]
}
```

### 5.2. Historical Records & Range Analytics Endpoint
```http
GET /api/v1/aqi/history?city=Delhi&start_date=2024-11-01&end_date=2024-11-30
```
**Response (200 OK):**
```json
{
  "city": "Delhi",
  "period": {
    "start_date": "2024-11-01",
    "end_date": "2024-11-30",
    "calendar_days": 30,
    "valid_records": 30,
    "completeness_pct": 100.0
  },
  "statistics": {
    "average_aqi": 374.4,
    "period_category": "Very Poor",
    "peak_record": { "date": "2024-11-18", "aqi": 494, "category": "Severe" },
    "cleanest_record": { "date": "2024-11-01", "aqi": 218, "category": "Poor" },
    "severe_days_count": 8
  },
  "category_distribution": {
    "Good": 0, "Satisfactory": 0, "Moderate": 0, "Poor": 2, "Very Poor": 20, "Severe": 8
  }
}
```

### 5.3. City Rankings Endpoint with Coverage Threshold
```http
GET /api/v1/aqi/rankings?min_coverage=70.0&sort=asc
```
Returns a verified leaderboard of cleanest and most polluted cities based on long-term CPCB monitoring records, excluding cities with sparse observation coverage.

---

## 6. Background Pipeline: Automated CPCB 4 PM Scraper

```python
# app/workers/cpcb_scraper.py
from celery import shared_task
import httpx
import structlog
from app.services.bulletin_parser import parse_cpcb_pdf_bulletin
from app.db.session import async_session_factory

logger = structlog.get_logger()

@shared_task(name="tasks.scrape_daily_cpcb_bulletin")
def scrape_daily_cpcb_bulletin():
    """
    Runs every day at 16:30 IST via Celery Beat.
    Retrieves official 4:00 PM National Ambient Air Quality Bulletin from CPCB portal,
    validates checksum, parses station tables, audits boundary shifts,
    and upserts into TimescaleDB.
    """
    logger.info("Executing automated 4 PM CPCB bulletin scraping task...")
    # Scraper logic with exponential backoff retry
```

---

## 7. Deployment & Containerization Strategy

The proposed stack is packaged with Docker and Docker Compose:
- **`web`**: FastAPI app served with `uvicorn --workers 4 --loop uvloop`
- **`db`**: `timescale/timescaledb:latest-pg16`
- **`cache`**: `redis:7-alpine`
- **`worker`**: Celery worker instance executing scheduled scrapers and cache warmers
- **`scheduler`**: Celery beat cron scheduler

This architecture transforms AirCare into an enterprise-ready, robust platform capable of handling millions of real-time queries while maintaining rigorous environmental data honesty.
