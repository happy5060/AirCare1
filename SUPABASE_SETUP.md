# AirCare — Supabase Integration & Live Air Quality Storage Guide

This document specifies the setup, database schema, security posture, automated data-collection pipelines, and diagnostic procedures for connecting **AirCare** to **Supabase** (Phase 1).

Full academic & engineering documentation is available at [`docs/SUPABASE_SETUP.md`](file:///e:/minor%20project/docs/SUPABASE_SETUP.md).

---

## Quick Summary

- **Database Schemas**: [`supabase/migrations/20261111000001_air_quality_schema.sql`](file:///e:/minor%20project/supabase/migrations/20261111000001_air_quality_schema.sql)
- **RLS Security Policies**: [`supabase/migrations/20261111000002_rls_security_policies.sql`](file:///e:/minor%20project/supabase/migrations/20261111000002_rls_security_policies.sql)
- **Automated Collector**: [`scripts/collect_air_quality.py`](file:///e:/minor%20project/scripts/collect_air_quality.py) and [`supabase/functions/collect-air-quality/index.ts`](file:///e:/minor%20project/supabase/functions/collect-air-quality/index.ts)
- **3-Hour GitHub Actions Cron**: [`.github/workflows/scheduled-data-collection.yml`](file:///e:/minor%20project/.github/workflows/scheduled-data-collection.yml)
- **CLI Verification**: [`scripts/verify_supabase.py`](file:///e:/minor%20project/scripts/verify_supabase.py)
- **In-App Diagnostics**: Accessible via the **Database Status** button in the footer or URL hash `/#diagnostics`.

For complete details on schema definitions, environment variables, RLS configuration, and troubleshooting, please refer to [`docs/SUPABASE_SETUP.md`](file:///e:/minor%20project/docs/SUPABASE_SETUP.md).
