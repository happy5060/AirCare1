-- =============================================================================
-- Migration: 20261111000003_scheduled_collection_pgcron.sql
-- Description: Scheduled 3-Hour Automation via Supabase pg_cron + pg_net
-- Notes: pg_cron and pg_net extensions are supported on Supabase Free & Pro tiers.
-- =============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Setup scheduled cron job to run every 3 hours (at minute 0)
-- Schedule expression: '0 */3 * * *' (00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00 UTC)
--
-- Note: Replace [YOUR_PROJECT_REF] and [YOUR_ANON_OR_SERVICE_KEY] with your actual Supabase project values
-- or store them in supabase vault (vault.decrypted_secrets).
--
-- Example configuration:
/*
SELECT cron.schedule(
    'collect-air-quality-3h',
    '0 */3 * * *',
    $$
    SELECT
      net.http_post(
        url := 'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/collect-air-quality',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
        ),
        body := '{}'::jsonb
      ) AS request_id;
    $$
);
*/

-- Helper view to monitor cron job status
CREATE OR REPLACE VIEW air_quality_cron_status AS
SELECT 
    jobid,
    jobname,
    schedule,
    active,
    command
FROM cron.job
WHERE jobname = 'collect-air-quality-3h';

