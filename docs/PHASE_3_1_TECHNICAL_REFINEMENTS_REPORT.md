# AirCare Phase 3.1 — Final Scientific and Technical Audit Report

> **Project**: AirCare — Real-Time & Historical Air Quality Analysis Platform
> **Phase**: 3.1 Final Scientific & Technical Audit (Final Provenance Review)
> **Date**: 2026-11-12
> **Status**: Verified & Passing (All 19 Unit Tests & Live API Dry-Runs Succeeded; 0 Database Mutations)

---

## 1. Executive Summary & Provenance Audit Resolution

Following independent provenance review, the Phase 3.1 historical atmospheric backfill pipeline and database schema were audited and refined. The pipeline resolves native classification assumptions, establishes independent rolling-window validation, enforces provenance transparency, and eliminates false rejections of valid nominal timesteps.

| Area | Audit Requirement | Implementation Details | Verified In |
| :--- | :--- | :--- | :--- |
| **1. Qualified CAMS Classification** | Do not label API values as verified native CAMS observations; use an appropriately qualified classification | Open-Meteo normalizes CAMS Global 3-hour forecasts into an interpolated 1-hour JSON array without per-row native flags. Nominal 3-hour timesteps (00, 03, 06, 09, 12, 15, 18, 21 UTC) are classified as `assumed_nominal_3hour` with `native_provenance_verified = False` and `native_provenance_status = "assumed"`. | Unit Tests 5D, 5E, `classify_timestamp_provenance()` |
| **2. Missing Precursor Independence** | Do not reject an otherwise valid 03:00 timestamp merely because 02:00 is missing | CAMS Global produces predictions on 3-hour cycles independently of whether intermediate interpolated 1-hour points exist. Valid nominal 3-hour timesteps are retained even if preceding hourly slots are absent. | Unit Test 5A (`test_valid_nominal_timestamp_not_rejected_when_preceding_hourly_slot_missing`) |
| **3. Independent Rolling-Window Validation** | Independently validate anchor alignment, timestamp parsing, duplicates, non-zero minutes, slot membership, and window bounds | `compute_rolling_window_stats()` independently validates anchor timestamp alignment (minute == 0, second == 0), rejects malformed/irregular strings, isolates duplicates, detects out-of-order sequences, and tracks missing slots. Invalid samples never inflate completeness. | Unit Tests 4, 4A, 4B (`compute_rolling_window_stats()`) |
| **4. Provenance Transparency** | Preserve provider IDs, temporal resolution assumptions, missing data diagnostics, and explicit verified/assumed/unknown status | Deep metadata document stores `chemical_transport_model`, `meteorological_model`, `provenance_classification`, `time_series_validation`, and window diagnostics, declaring `native_provenance_verified: False`. Unknown or unrecognized datasets evaluate strictly to `native_provenance_status = "unknown"`. | Unit Test 5E, `model_or_source_metadata` |
| **5. Input Validation: Pollutants & Weather** | Preserve legitimate negative temperatures; reject NaN/Inf/strings without zero coercion | `sanitize_temperature()` preserves negative °C down to $-50^\circ\text{C}$ (e.g. $-8.5^\circ\text{C}$). `sanitize_weather_non_negative()` rejects $<0$, NaN, Inf without zero coercion. Pollutant sub-indices preserve NULL on invalid inputs. | Unit Tests 1, 2, `fetch_city_historical_data()` |
| **6. Accurate Partial-Insertion Accounting** | Update totals incrementally after every successful batch; preserve counts if a later batch fails | `total_inserted` and `total_skipped` update immediately after each successful batch. On subsequent batch failure, earlier counts are retained and partial ingestion is reported in `failed_cities`. | Unit Test 7, `run_backfill()` |
| **7. Migration Documentation** | Non-destructive schema extension with strict provenance comments | Added comment on `model_or_source_metadata` in migration; omitted redundant index on unique key; retained no-automatic-deletion policy and clarified static backup table nature. | `20261112000001_expand_source_type_and_metadata.sql` |
| **8. Comprehensive Verification** | Multi-faceted test suite separating verified application logic from mocked tests | Expanded test suite to 19 unit tests in `tests/test_phase3_backfill.py` separating verified test logic from mocked behavior; passed byte-compilation. | `python tests/test_phase3_backfill.py` (19/19 Passed) |

---

## 2. Documented Open-Meteo CAMS Global Provenance Reality

### 2.1 Provider Documentation & API Semantics
* **Dataset**: Copernicus Atmosphere Monitoring Service (**CAMS Global Atmospheric Composition Forecasts**), ECMWF IFS-COMPO cycle.
* **Spatial Resolution**: Global grid of $0.4^\circ \times 0.4^\circ$ ($\sim 45\text{ km}$ over India).
* **Native Temporal Cadence**: **3-hourly** output cycles ($00:00$, $03:00$, $06:00$, $09:00$, $12:00$, $15:00$, $18:00$, $21:00\text{ UTC}$).
* **API Delivery**: Open-Meteo provides an hourly time-series array via linear interpolation between 3-hour CAMS cycles.
* **Provenance Boundary**: The Open-Meteo REST API does **not** provide per-row cryptographic verification hashes, raw model flags, or provider tags confirming whether an individual timestamp was transferred directly from raw model output or adjusted during grid processing.
* **Defensible Classification**:
  1. A timestamp is **never** labeled as a "verified native CAMS observation".
  2. Nominal 3-hour timesteps (`hour % 3 == 0`, `min == 0`, `sec == 0`) are classified as `assumed_nominal_3hour`, with `native_provenance_verified: False` and `native_provenance_status: "assumed"`.
  3. Intermediate 1-hour timesteps (`hour % 3 != 0`) are classified as `interpolated_hourly_slot`, with `native_provenance_status: "not_native"`.
  4. Unrecognized, unspecified, or third-party datasets evaluate strictly to `native_provenance_status: "unknown"` and `classification: "unknown"`.

### 2.2 Missing Precursor Independence
In numerical atmospheric transport models, a 3-hour global forecast cycle (e.g. 03:00 UTC) is calculated by the meteorological model based on physical governing equations and atmospheric data assimilation. The presence or absence of an intermediate interpolated hourly point (02:00 UTC) in an external API query has zero physical or mathematical bearing on the validity of the 03:00 UTC model state.

Consequently, `validate_time_series_spacing()` does **not** reject a valid 03:00 nominal timestamp simply because 02:00 is missing. Both 00:00 and 03:00 are recognized as valid nominal 3-hour timesteps and retained for backfill processing, while the gap is documented in diagnostic anomaly metrics (`irregular_interval_count`).

---

## 3. Independent Rolling-Window Validation (`compute_rolling_window_stats`)

Under Requirement 2, `compute_rolling_window_stats()` independently validates every aspect of the retrospective window:

1. **Anchor Timestamp Alignment**:
   `times[current_idx]` must parse as valid ISO UTC with `minute == 0` and `second == 0`. If the anchor is malformed or unaligned, the window immediately fails validation (`valid_samples = 0`, `meets_policy = False`, `mean = None`).
2. **Exact Retrospective Boundaries**:
   The window is bounded strictly by $[T_{current} - (window\_hours - 1)\text{h}, T_{current}]$ inclusive. For a 24-hour window, exactly 24 discrete UTC hourly slots are expected.
3. **Timestamp Parsing & Malformed String Isolation**:
   Malformed strings are tracked in `malformed_timestamp_count` and rejected.
4. **Non-Zero Minutes & Seconds**:
   Irregular timestamps (e.g. `10:15`) are tracked in `irregular_timestamp_count` and excluded from hourly slot membership.
5. **Duplicate Timestamp Isolation**:
   Each discrete UTC hourly slot contributes at most once. Encounters of duplicates are tracked in `duplicate_timestamp_count` and ignored.
6. **Out-of-Order Sequence Tracking**:
   Non-monotonic timestamps within the candidate series are detected and tracked in `out_of_order_count`.
7. **Missing Slot Accounting**:
   Missing hourly slots are tracked in `missing_hourly_slots` ($window\_hours - \text{len}(seen\_slots)$).
8. **Completeness Inflation Protection**:
   Under no circumstances can duplicate, malformed, irregular, or out-of-order entries inflate `valid_samples`. Completeness policy is fulfilled only when `valid_samples >= min_required_samples` ($\ge 18/24$ or $\ge 6/8$).

---

## 4. Verification: Automated Unit Test Suite (`tests/test_phase3_backfill.py`)

Execution command: `python tests/test_phase3_backfill.py`

```
==============================================================================
RUNNING AIRCARE PHASE 3.1 FINAL SCIENTIFIC & TECHNICAL AUDIT TEST SUITE
==============================================================================
test_accurate_partial_insertion_accounting:
  ✓ Test 7 Passed: Partial batch insertion accounting accurately preserves successful batch counts.
test_aqi_averaging_period_and_composite_criteria:
  ✓ Test 3 Passed: Composite AQI strictly enforces >=3 pollutants with >=1 PM fraction.
test_defensive_weather_validation:
  ✓ Test 2 Passed: Defensive weather validation preserves negative temp and rejects invalid values.
test_duplicate_source_timestamps_validation:
  ✓ Test 5B Passed (Verified Unit Test): Duplicate source timestamps detected and isolated from native extraction.
test_mocked_supabase_duplicate_response_handling:
  ✓ Test 8 Passed (Mocked Unit Test): Supabase duplicate-skipped vs inserted counts parsed accurately.
test_native_cams_timestamp_and_spacing_validation:
  ✓ Test 5 Passed (Verified Unit Test): Native CAMS spacing validation flags irregular timestamps.
test_nominal_extraction_across_irregular_gaps:
  ✓ Test 5G Passed (Verified Unit Test): Nominal extraction across irregular gaps cleanly retains all valid nominal points.
test_out_of_order_timestamps:
  ✓ Test 5C Passed (Verified Unit Test): Out-of-order timestamps flagged in diagnostic irregular_intervals.
test_partial_city_failure_isolation:
  ✓ Test 10 Passed: Partial city failure tracked and triggers exit code 1.
test_pollutant_input_validation_rejects_invalid_values:
  ✓ Test 1 Passed: Negative, NaN, and Inf concentrations strictly return None (never zero).
test_rolling_completeness_cannot_be_inflated_by_malformed_or_duplicate_timestamps:
  ✓ Test 4A Passed (Verified Unit Test): Malformed, duplicate, and irregular samples strictly prevented from inflating completeness.
test_rolling_window_anchor_alignment_and_parsing:
  ✓ Test 4B Passed (Verified Unit Test): Anchor timestamp alignment and parsing independently validated.
test_rolling_window_duplicate_protection:
  ✓ Test 4 Passed: Rolling window duplicate and anomaly protection prevents sample inflation.
test_rolling_window_exact_boundaries_and_sample_categorization:
  ✓ Test 6 Passed: Exact 24h and 8h window boundaries and sample categorization verified.
test_source_key_isolation_logic:
  ✓ Test 9 Passed (Unit Logic Test): Live and historical source identifiers maintain strict key isolation.
test_timestamp_not_classified_as_native_solely_because_divisible_by_three:
  ✓ Test 5D Passed (Verified Unit Test): Timestamps not classified as native solely because hour is divisible by three.
test_unknown_provenance_remains_explicitly_unknown:
  ✓ Test 5E Passed (Verified Unit Test): Unknown provenance remains explicitly unknown across unverified feeds.
test_valid_continuous_hourly_series:
  ✓ Test 5F Passed (Verified Unit Test): Continuous uniform 24-hour series yields 8 nominal timesteps.
test_valid_nominal_timestamp_not_rejected_when_preceding_hourly_slot_missing:
  ✓ Test 5A Passed (Verified Unit Test): Valid nominal 3-hour timestep is not rejected solely because preceding hourly slot is missing.

----------------------------------------------------------------------
Ran 19 tests in 0.910s

OK (100% SUCCESS)
```

### Distinction Between Verified Test Logic and Assumptions:
1. **Direct Verified Application Unit Tests (Tests 1–6, 4A–4B, 5A–5G)**:
   Tests execute real Python application functions against programmatic edge cases (negative temperatures, duplicate timestamps, missing precursor hours, out-of-order timestamps, malformed ISO strings, non-zero minutes, unknown dataset classifications, missing pollutants). These are directly verified assertions against the application code logic.
2. **Mocked Unit Tests (Tests 7, 8, 10)**:
   Tests evaluate HTTP payload parsing, partial batch accounting, and provider timeout isolation using `unittest.mock.MagicMock` to simulate Supabase representation responses and network failures. They confirm client-side logic only and do not assert actual live PostgreSQL database transactions.
3. **Unit Logic Key Isolation (Test 9)**:
   Validates Python tuple derivation separating `open-meteo` from `open-meteo-historical`. It confirms that application-level compound keys are distinct, but does not execute against live PostgreSQL database constraints.

---

## 5. Verification: Live REST API Dry-Run (Delhi & Mumbai)

Execution command: `python scripts/backfill_air_quality.py --cities Delhi Mumbai --past-days 3`

```
==============================================================================
 AirCare Phase 3.1 — Historical Backfill Pipeline (DRY-RUN ONLY)
 Target Window: Past 3 Days | Nominal 3-Hourly Sampling (00, 03, 06, 09, 12, 15, 18, 21 UTC)
==============================================================================

[01/2] Fetching Delhi (Lat: 28.6139, Lon: 77.209)...
   [✓] Retrieved 24 nominal 3-hour timesteps (2026-11-09T00:00:00Z -> 2026-11-11T21:00:00Z) [assumed CAMS alignment]
   [✓] Rolling AQI estimates validated: 18/24 steps meet 24h/8h criteria
   [✓] Weather aligned: 24/24 steps (24 with Ventilation Coefficient)
   [i] Sample [2026-11-11T21:00:00Z]: PM2.5=161.6 µg/m³, Roll24hPM2.5=130.72 µg/m³, EstimatedRollingAQI=308 (Very Poor), Dominant=PM2.5, Temp=20.2°C, BLH=60.0m, Vc=87.6 m²/s

[02/2] Fetching Mumbai (Lat: 19.076, Lon: 72.8777)...
   [✓] Retrieved 24 nominal 3-hour timesteps (2026-11-09T00:00:00Z -> 2026-11-11T21:00:00Z) [assumed CAMS alignment]
   [✓] Rolling AQI estimates validated: 18/24 steps meet 24h/8h criteria
   [✓] Weather aligned: 24/24 steps (24 with Ventilation Coefficient)
   [i] Sample [2026-11-11T21:00:00Z]: PM2.5=34.5 µg/m³, Roll24hPM2.5=49.37 µg/m³, EstimatedRollingAQI=149 (Moderate), Dominant=O3, Temp=26.1°C, BLH=115.0m, Vc=124.2 m²/s

==============================================================================
 FINAL PIPELINE EXECUTION SUMMARY
==============================================================================
 Successful cities (2/2): Delhi, Mumbai
 Total 3-hour records processed: 48
 Mode: DRY RUN (0 database mutations)
==============================================================================
```

- **Python Byte-Compilation**: Passed (`python -m py_compile scripts/backfill_air_quality.py tests/test_phase3_backfill.py`).
- **Database Status**: Gated. 0 records inserted, 0 SQL statements executed against Supabase.
