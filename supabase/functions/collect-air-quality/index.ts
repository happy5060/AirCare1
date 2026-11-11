// =============================================================================
// Supabase Edge Function: collect-air-quality
// Schedule: Every 3 hours (e.g., via pg_cron or GitHub Actions)
// Purpose: Automates collection of live Open-Meteo atmospheric readings for
//          10 Indian cities and stores validated CPCB NAQI observations in Supabase.
// =============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

// 10 Supported Indian Metros and Regional Hubs
const TRACKED_CITIES = [
  { city: "Delhi", lat: 28.6139, lon: 77.2090 },
  { city: "Mumbai", lat: 19.0760, lon: 72.8777 },
  { city: "Bengaluru", lat: 12.9716, lon: 77.5946 },
  { city: "Kolkata", lat: 22.5726, lon: 88.3639 },
  { city: "Chennai", lat: 13.0827, lon: 80.2707 },
  { city: "Hyderabad", lat: 17.3850, lon: 78.4867 },
  { city: "Ahmedabad", lat: 23.0225, lon: 72.5714 },
  { city: "Pune", lat: 18.5204, lon: 73.8567 },
  { city: "Jaipur", lat: 26.9124, lon: 75.7873 },
  { city: "Lucknow", lat: 26.8467, lon: 80.9462 },
];

// CPCB Sub-Index Calculation Logic (2014 Standard)
function calcSubIndexPM25(v: number): number {
  if (v <= 0 || !isFinite(v)) return 0;
  if (v <= 30) return Math.round((v * 50) / 30);
  if (v <= 60) return Math.round(50 + ((v - 30) * 50) / 30);
  if (v <= 90) return Math.round(100 + ((v - 60) * 100) / 30);
  if (v <= 120) return Math.round(200 + ((v - 90) * 100) / 30);
  if (v <= 250) return Math.round(300 + ((v - 120) * 100) / 130);
  return Math.min(500, Math.round(400 + ((v - 250) * 100) / 130));
}

function calcSubIndexPM10(v: number): number {
  if (v <= 0 || !isFinite(v)) return 0;
  if (v <= 50) return Math.round(v);
  if (v <= 100) return Math.round(v);
  if (v <= 250) return Math.round(100 + ((v - 100) * 100) / 150);
  if (v <= 350) return Math.round(200 + (v - 250));
  if (v <= 430) return Math.round(300 + ((v - 350) * 100) / 80);
  return Math.min(500, Math.round(400 + ((v - 430) * 100) / 70));
}

function calcSubIndexNO2(v: number): number {
  if (v <= 0 || !isFinite(v)) return 0;
  if (v <= 40) return Math.round((v * 50) / 40);
  if (v <= 80) return Math.round(50 + ((v - 40) * 50) / 40);
  if (v <= 180) return Math.round(100 + ((v - 80) * 100) / 100);
  if (v <= 280) return Math.round(200 + ((v - 180) * 100) / 100);
  if (v <= 400) return Math.round(300 + ((v - 280) * 100) / 120);
  return Math.min(500, Math.round(400 + ((v - 400) * 100) / 100));
}

function calcSubIndexSO2(v: number): number {
  if (v <= 0 || !isFinite(v)) return 0;
  if (v <= 40) return Math.round((v * 50) / 40);
  if (v <= 80) return Math.round(50 + ((v - 40) * 50) / 40);
  if (v <= 380) return Math.round(100 + ((v - 80) * 100) / 300);
  if (v <= 800) return Math.round(200 + ((v - 380) * 100) / 420);
  if (v <= 1600) return Math.round(300 + ((v - 800) * 100) / 800);
  return Math.min(500, Math.round(400 + ((v - 1600) * 100) / 400));
}

function calcSubIndexCO(co_mg: number): number {
  if (co_mg <= 0 || !isFinite(co_mg)) return 0;
  if (co_mg <= 1.0) return Math.round(co_mg * 50);
  if (co_mg <= 2.0) return Math.round(50 + (co_mg - 1.0) * 50);
  if (co_mg <= 10.0) return Math.round(100 + ((co_mg - 2.0) * 100) / 8.0);
  if (co_mg <= 17.0) return Math.round(200 + ((co_mg - 10.0) * 100) / 7.0);
  if (co_mg <= 34.0) return Math.round(300 + ((co_mg - 17.0) * 100) / 17.0);
  return Math.min(500, Math.round(400 + ((co_mg - 34.0) * 100) / 16.0));
}

function calcSubIndexO3(v: number): number {
  if (v <= 0 || !isFinite(v)) return 0;
  if (v <= 50) return Math.round(v);
  if (v <= 100) return Math.round(v);
  if (v <= 168) return Math.round(100 + ((v - 100) * 100) / 68);
  if (v <= 208) return Math.round(200 + ((v - 168) * 100) / 40);
  if (v <= 748) return Math.round(300 + ((v - 208) * 100) / 540);
  return Math.min(500, Math.round(400 + ((v - 748) * 100) / 252));
}

function getCpcbCategory(aqi: number): string {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Satisfactory";
  if (aqi <= 200) return "Moderate";
  if (aqi <= 300) return "Poor";
  if (aqi <= 400) return "Very Poor";
  return "Severe";
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

serve(async (req: Request) => {
  // CORS Headers for browser invocation (if needed by diagnostic tool)
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
      return new Response(
        JSON.stringify({ error: "Server misconfiguration: missing Supabase credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const results = [];
    const errors = [];

    for (const target of TRACKED_CITIES) {
      try {
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${target.lat}&longitude=${target.lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=Asia%2FKolkata`;

        const resp = await fetch(url);
        if (!resp.ok) {
          throw new Error(`Open-Meteo returned status ${resp.status}`);
        }

        const data = await resp.json();
        const current = data.current;
        if (!current || !current.time) {
          throw new Error(`Invalid response schema from Open-Meteo for ${target.city}`);
        }

        // Parse concentrations
        const pm25 = current.pm2_5 !== undefined && current.pm2_5 !== null ? Math.max(0, current.pm2_5) : null;
        const pm10 = current.pm10 !== undefined && current.pm10 !== null ? Math.max(0, current.pm10) : null;
        const no2 = current.nitrogen_dioxide !== undefined && current.nitrogen_dioxide !== null ? Math.max(0, current.nitrogen_dioxide) : null;
        const so2 = current.sulphur_dioxide !== undefined && current.sulphur_dioxide !== null ? Math.max(0, current.sulphur_dioxide) : null;
        const o3 = current.ozone !== undefined && current.ozone !== null ? Math.max(0, current.ozone) : null;

        // Open-Meteo CO is in µg/m³. Convert to CPCB reporting unit mg/m³
        const coRawUg = current.carbon_monoxide !== undefined && current.carbon_monoxide !== null ? Math.max(0, current.carbon_monoxide) : null;
        const coMg = coRawUg !== null ? Math.round((coRawUg / 1000.0) * 100) / 100 : null;

        // Calculate sub-indices
        const subIndices: { name: string; val: number }[] = [];
        if (pm25 !== null) subIndices.push({ name: "PM2.5", val: calcSubIndexPM25(pm25) });
        if (pm10 !== null) subIndices.push({ name: "PM10", val: calcSubIndexPM10(pm10) });
        if (no2 !== null) subIndices.push({ name: "NO2", val: calcSubIndexNO2(no2) });
        if (so2 !== null) subIndices.push({ name: "SO2", val: calcSubIndexSO2(so2) });
        if (coMg !== null) subIndices.push({ name: "CO", val: calcSubIndexCO(coMg) });
        if (o3 !== null) subIndices.push({ name: "O3", val: calcSubIndexO3(o3) });

        let estimatedAqi = 0;
        let dominantPollutant = "PM2.5";

        if (subIndices.length > 0) {
          subIndices.sort((a, b) => b.val - a.val);
          estimatedAqi = subIndices[0].val;
          dominantPollutant = subIndices[0].name;
        }

        const aqiCategory = getCpcbCategory(estimatedAqi);

        // Convert Open-Meteo local time to ISO string
        // Open-Meteo current.time is in format "YYYY-MM-DDTHH:mm" in Asia/Kolkata (+05:30)
        const observedAtIso = new Date(current.time + ":00+05:30").toISOString();

        const readingRow = {
          city: target.city,
          source: "open-meteo",
          source_type: "atmospheric_model",
          observed_at: observedAtIso,
          latitude: target.lat,
          longitude: target.lon,
          pm2_5: pm25,
          pm10: pm10,
          no2: no2,
          so2: so2,
          co: coMg,
          o3: o3,
          estimated_aqi: estimatedAqi,
          aqi_category: aqiCategory,
          dominant_pollutant: dominantPollutant,
          model_or_source_metadata: {
            provider: "Open-Meteo Air Quality API",
            model: "CAMS / ECMWF Atmospheric Numerical Reanalysis",
            grid_resolution_km: 11,
            raw_co_ug_m3: coRawUg,
            units: {
              pm2_5: "µg/m³",
              pm10: "µg/m³",
              no2: "µg/m³",
              so2: "µg/m³",
              co: "mg/m³",
              o3: "µg/m³"
            },
            sub_indices: subIndices.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.val }), {}),
            collected_by: "supabase_edge_function"
          }
        };

        // Insert into Supabase table with duplicate prevention via ON CONFLICT (city, source, observed_at)
        const { error: insertError } = await supabase
          .from("air_quality_readings")
          .upsert(readingRow, { onConflict: "city,source,observed_at", ignoreDuplicates: true });

        if (insertError) {
          throw insertError;
        }

        results.push({
          city: target.city,
          observed_at: observedAtIso,
          aqi: estimatedAqi,
          status: "saved"
        });

        // 300ms pause to respect API rate limits
        await sleep(300);
      } catch (cityErr) {
        console.error(`Error processing city ${target.city}:`, cityErr);
        errors.push({
          city: target.city,
          error: cityErr instanceof Error ? cityErr.message : String(cityErr)
        });
      }
    }

    return new Response(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        total_cities: TRACKED_CITIES.length,
        saved_count: results.length,
        errors_count: errors.length,
        results,
        errors
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (globalErr) {
    console.error("Global collection error:", globalErr);
    return new Response(
      JSON.stringify({ error: "Internal server error during data collection" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
