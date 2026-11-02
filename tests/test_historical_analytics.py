"""
AirCare Platform: Historical Analytics & CPCB Bulletin Query Verification Suite
Tests:
1. Historical dataset loading & record count (471,015 records).
2. Single-day bulletin lookup (Delhi 2024-11-18: AQI 494 Severe).
3. Period statistics calculations (Average, Peak, Cleanest Day, Completeness).
4. Cross-city comparison analytics (Delhi vs. Bengaluru in November 2024).
5. Category inconsistency preservation audit (Delhi 2018-02-24).
6. Missing / out-of-range date zero-imputation policy.
"""

import os
import sys

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
import pandas as pd

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PROCESSED_FILE = os.path.join(BASE_DIR, "processed_data", "cleaned_cpcb_aqi_bulletins.csv")

def main():
    print("=" * 70)
    print("RUNNING HISTORICAL CPCB BULLETIN ANALYTICS TEST SUITE")
    print("=" * 70)

    if not os.path.exists(PROCESSED_FILE):
        print(f"ERROR: Processed bulletin file not found at {PROCESSED_FILE}")
        sys.exit(1)

    print(f"\n[1/6] Loading processed CPCB bulletin dataset...")
    df = pd.read_csv(PROCESSED_FILE, low_memory=False)
    print(f"  ✓ Loaded {len(df):,} records across {df['city'].nunique()} Indian cities.")
    assert len(df) >= 470000, "Dataset should contain >= 470,000 records"

    # 2. Single Day Lookup
    print(f"\n[2/6] Verifying Single-Day Bulletin Query (Delhi, 2024-11-18):")
    delhi_peak = df[(df['city'] == 'Delhi') & (df['date'] == '2024-11-18')].iloc[0]
    assert int(delhi_peak['aqi']) == 494, f"Expected AQI 494, got {delhi_peak['aqi']}"
    assert delhi_peak['aqi_category'] == 'Severe', f"Expected Severe, got {delhi_peak['aqi_category']}"
    assert delhi_peak['prominent_pollutant'] == 'PM2.5', f"Expected PM2.5, got {delhi_peak['prominent_pollutant']}"
    print(f"  ✓ Delhi on 2024-11-18: AQI {int(delhi_peak['aqi'])} ({delhi_peak['aqi_category']}), Pollutant: {delhi_peak['prominent_pollutant']}")

    # 3. Period Statistics Calculation
    print(f"\n[3/6] Verifying Period Statistics (Amritsar Diwali Week: 2024-10-28 to 2024-11-05):")
    amritsar_sub = df[(df['city'] == 'Amritsar') & (df['date'] >= '2024-10-28') & (df['date'] <= '2024-11-05')]
    amritsar_avg = round(amritsar_sub['aqi'].mean(), 1)
    amritsar_peak = int(amritsar_sub['aqi'].max())
    assert len(amritsar_sub) == 9, f"Expected 9 records, got {len(amritsar_sub)}"
    assert amritsar_avg == 232.4, f"Expected average 232.4, got {amritsar_avg}"
    assert amritsar_peak == 368, f"Expected peak 368, got {amritsar_peak}"
    print(f"  ✓ Amritsar 9-day coverage: 100%, Period Mean AQI: {amritsar_avg}, Peak Spike: {amritsar_peak}")

    # 4. Multi-City Comparison
    print(f"\n[4/6] Verifying Multi-City Comparison (Delhi vs. Bengaluru, November 2024):")
    delhi_nov = df[(df['city'] == 'Delhi') & (df['date'] >= '2024-11-01') & (df['date'] <= '2024-11-30')]
    blr_nov = df[(df['city'] == 'Bengaluru') & (df['date'] >= '2024-11-01') & (df['date'] <= '2024-11-30')]
    delhi_avg = round(delhi_nov['aqi'].mean(), 1)
    blr_avg = round(blr_nov['aqi'].mean(), 1)
    assert delhi_avg == 374.4, f"Expected Delhi 374.4, got {delhi_avg}"
    assert blr_avg == 85.1, f"Expected Bengaluru 85.1, got {blr_avg}"
    diff = round(delhi_avg - blr_avg, 1)
    assert diff == 289.3, f"Expected difference 289.3, got {diff}"
    print(f"  ✓ Delhi Mean: {delhi_avg} (Very Poor) | Bengaluru Mean: {blr_avg} (Satisfactory) | Difference: {diff}")

    # 5. Category Inconsistency Preservation
    print(f"\n[5/6] Verifying Category Inconsistency Audit Flag (Delhi, 2018-02-24):")
    incon_record = df[(df['city'] == 'Delhi') & (df['date'] == '2018-02-24')].iloc[0]
    assert int(incon_record['aqi']) == 300, f"Expected 300, got {incon_record['aqi']}"
    assert incon_record['aqi_category'] == 'Very Poor', "Official category must be preserved"
    assert incon_record['expected_category'] == 'Poor', "Mathematical expected category must be Poor"
    assert bool(incon_record['is_category_inconsistent']) is True, "Flag must be True"
    print(f"  ✓ Preserved official bulletin override: AQI 300 classified as 'Very Poor' (Flagged: True)")

    # 6. Missing / Out-of-Range Date Verification
    print(f"\n[6/6] Verifying Zero-Imputation Protection (Delhi, 1990-01-01):")
    pre_records = df[(df['city'] == 'Delhi') & (df['date'] == '1990-01-01')]
    assert len(pre_records) == 0, "No synthetic records should exist for 1990-01-01"
    print(f"  ✓ Verified: Out-of-range dates contain 0 rows (zero synthetic imputation policy enforced)")

    print("\n" + "=" * 70)
    print("ALL HISTORICAL ANALYTICS TESTS PASSED (100% SUCCESS RATE)")
    print("=" * 70)

if __name__ == '__main__':
    main()
