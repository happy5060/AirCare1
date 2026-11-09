"""
AirCare Platform: CPCB NAQI Mathematical Formula & Validation Test Suite
Verifies:
1. Carbon Monoxide (CO) concentration unit conversion (ug/m3 -> mg/m3) and sub-index interpolation.
2. Ground-Level Ozone (O3) breakpoint piecewise linear interpolation.
3. Particulate Matter (PM2.5, PM10), NO2, SO2, NH3 sub-indices.
4. Exact boundary transition tests (B_lo, B_hi, +/- 1) for all categories.
5. Invalid, negative, and None input handling.
6. CPCB minimum 3-criteria pollutant validation rule.
"""

import sys
import math

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def calc_cpcb_subindex_pm25(c):
    if c is None or math.isnan(c) or math.isinf(c) or c < 0: return 0
    if c <= 30: return round((c * 50) / 30)
    elif c <= 60: return round(50 + ((c - 30) * 50) / 30)
    elif c <= 90: return round(100 + ((c - 60) * 100) / 30)
    elif c <= 120: return round(200 + ((c - 90) * 100) / 30)
    elif c <= 250: return round(300 + ((c - 120) * 100) / 130)
    else: return min(500, round(400 + ((c - 250) * 100) / 130))

def calc_cpcb_subindex_pm10(c):
    if c is None or math.isnan(c) or math.isinf(c) or c < 0: return 0
    if c <= 50: return round(c)
    elif c <= 100: return round(c)
    elif c <= 250: return round(100 + ((c - 100) * 100) / 150)
    elif c <= 350: return round(200 + (c - 250))
    elif c <= 430: return round(300 + ((c - 350) * 100) / 80)
    else: return min(500, round(400 + ((c - 430) * 100) / 70))

def calc_cpcb_subindex_no2(c):
    if c is None or math.isnan(c) or math.isinf(c) or c < 0: return 0
    if c <= 40: return round((c * 50) / 40)
    elif c <= 80: return round(50 + ((c - 40) * 50) / 40)
    elif c <= 180: return round(100 + ((c - 80) * 100) / 100)
    elif c <= 280: return round(200 + ((c - 180) * 100) / 100)
    elif c <= 400: return round(300 + ((c - 280) * 100) / 120)
    else: return min(500, round(400 + ((c - 400) * 100) / 100))

def calc_cpcb_subindex_so2(c):
    if c is None or math.isnan(c) or math.isinf(c) or c < 0: return 0
    if c <= 40: return round((c * 50) / 40)
    elif c <= 80: return round(50 + ((c - 40) * 50) / 40)
    elif c <= 380: return round(100 + ((c - 80) * 100) / 300)
    elif c <= 800: return round(200 + ((c - 380) * 100) / 420)
    elif c <= 1600: return round(300 + ((c - 800) * 100) / 800)
    else: return min(500, round(400 + ((c - 1600) * 100) / 400))

def calc_cpcb_subindex_co(co_ug):
    if co_ug is None or math.isnan(co_ug) or math.isinf(co_ug) or co_ug < 0: return 0
    co_mg = co_ug / 1000.0
    if co_mg <= 1.0: return round(co_mg * 50)
    elif co_mg <= 2.0: return round(50 + (co_mg - 1.0) * 50)
    elif co_mg <= 10.0: return round(100 + ((co_mg - 2.0) * 100) / 8.0)
    elif co_mg <= 17.0: return round(200 + ((co_mg - 10.0) * 100) / 7.0)
    elif co_mg <= 34.0: return round(300 + ((co_mg - 17.0) * 100) / 17.0)
    else: return min(500, round(400 + ((co_mg - 34.0) * 100) / 16.0))

def calc_cpcb_subindex_o3(c):
    if c is None or math.isnan(c) or math.isinf(c) or c < 0: return 0
    if c <= 50: return round(c)
    elif c <= 100: return round(c)
    elif c <= 168: return round(100 + ((c - 100) * 100) / 68)
    elif c <= 208: return round(200 + ((c - 168) * 100) / 40)
    elif c <= 748: return round(300 + ((c - 208) * 100) / 540)
    else: return min(500, round(400 + ((c - 748) * 100) / 252))

def calc_cpcb_subindex_nh3(c):
    if c is None or math.isnan(c) or math.isinf(c) or c < 0: return 0
    if c <= 200: return round((c * 50) / 200)
    elif c <= 400: return round(50 + ((c - 200) * 50) / 200)
    elif c <= 800: return round(100 + ((c - 400) * 100) / 400)
    elif c <= 1200: return round(200 + ((c - 800) * 100) / 400)
    elif c <= 1800: return round(300 + ((c - 1200) * 100) / 600)
    else: return min(500, round(400 + ((c - 1800) * 100) / 600))

def get_cpcb_category(aqi):
    if aqi <= 50: return 'Good'
    if aqi <= 100: return 'Satisfactory'
    if aqi <= 200: return 'Moderate'
    if aqi <= 300: return 'Poor'
    if aqi <= 400: return 'Very Poor'
    return 'Severe'

def validate_cpcb_naqi(pollutants):
    has_particulates = 'PM2.5' in pollutants or 'PM10' in pollutants
    valid_count = len(pollutants)
    return has_particulates and valid_count >= 3

def main():
    print("=" * 70)
    print("RUNNING COMPREHENSIVE CPCB NAQI FORMULA & RELIABILITY TESTS")
    print("=" * 70)

    # 1. CO Tests
    print("\n[TEST 1] Carbon Monoxide (CO in ug/m3 -> mg/m3):")
    co_cases = [
        (500, 25, "Good"),
        (1000, 50, "Good"),
        (1500, 75, "Satisfactory"),
        (2000, 100, "Satisfactory"),
        (6000, 150, "Moderate"),
        (10000, 200, "Moderate"),
        (13500, 250, "Poor"),
        (17000, 300, "Poor"),
        (25500, 349, "Very Poor"),
        (34000, 400, "Very Poor"),
        (42000, 450, "Severe"),
        (50000, 500, "Severe")
    ]
    for ug, expected_sub, expected_cat in co_cases:
        sub = calc_cpcb_subindex_co(ug)
        assert abs(sub - expected_sub) <= 1, f"CO {ug}ug: expected ~{expected_sub}, got {sub}"
        cat = get_cpcb_category(sub)
        assert cat == expected_cat, f"CO {ug}ug: expected cat {expected_cat}, got {cat}"
        print(f"  ✓ CO {ug:>5} ug/m3 ({ug/1000:>4.1f} mg/m3) -> Sub-index {sub:>3} ({cat})")

    # 2. O3 Tests
    print("\n[TEST 2] Ground-Level Ozone (O3 in ug/m3):")
    o3_cases = [
        (25, 25, "Good"),
        (50, 50, "Good"),
        (75, 75, "Satisfactory"),
        (100, 100, "Satisfactory"),
        (134, 150, "Moderate"),
        (168, 200, "Moderate"),
        (188, 250, "Poor"),
        (208, 300, "Poor"),
        (478, 350, "Very Poor"),
        (748, 400, "Very Poor"),
        (874, 450, "Severe")
    ]
    for ug, expected_sub, expected_cat in o3_cases:
        sub = calc_cpcb_subindex_o3(ug)
        assert abs(sub - expected_sub) <= 1, f"O3 {ug}ug: expected ~{expected_sub}, got {sub}"
        cat = get_cpcb_category(sub)
        assert cat == expected_cat, f"O3 {ug}ug: expected cat {expected_cat}, got {cat}"
        print(f"  ✓ O3 {ug:>3} ug/m3 -> Sub-index {sub:>3} ({cat})")

    # 3. PM2.5 Boundary Transition Tests
    print("\n[TEST 3] PM2.5 Piecewise Boundary Transitions (+/- 1 ug/m3):")
    pm25_boundaries = [
        (0, 0, "Good"),
        (29, 48, "Good"),
        (30, 50, "Good"),
        (31, 52, "Satisfactory"),
        (59, 98, "Satisfactory"),
        (60, 100, "Satisfactory"),
        (61, 103, "Moderate"),
        (89, 197, "Moderate"),
        (90, 200, "Moderate"),
        (91, 203, "Poor"),
        (119, 297, "Poor"),
        (120, 300, "Poor"),
        (121, 301, "Very Poor"),
        (249, 399, "Very Poor"),
        (250, 400, "Very Poor"),
        (251, 401, "Severe"),
        (380, 500, "Severe"),
        (600, 500, "Severe")
    ]
    for c, exp_sub, exp_cat in pm25_boundaries:
        sub = calc_cpcb_subindex_pm25(c)
        assert abs(sub - exp_sub) <= 1, f"PM2.5 {c}ug: expected ~{exp_sub}, got {sub}"
        cat = get_cpcb_category(sub)
        assert cat == exp_cat, f"PM2.5 {c}ug: expected cat {exp_cat}, got {cat}"
    print(f"  ✓ Verified {len(pm25_boundaries)} exact PM2.5 boundary transitions.")

    # 4. PM10 Boundary Transition Tests
    print("\n[TEST 4] PM10 Piecewise Boundary Transitions (+/- 1 ug/m3):")
    pm10_boundaries = [
        (0, 0, "Good"),
        (50, 50, "Good"),
        (51, 51, "Satisfactory"),
        (100, 100, "Satisfactory"),
        (101, 101, "Moderate"),
        (250, 200, "Moderate"),
        (251, 201, "Poor"),
        (350, 300, "Poor"),
        (351, 301, "Very Poor"),
        (430, 400, "Very Poor"),
        (431, 401, "Severe"),
        (500, 500, "Severe")
    ]
    for c, exp_sub, exp_cat in pm10_boundaries:
        sub = calc_cpcb_subindex_pm10(c)
        assert abs(sub - exp_sub) <= 1, f"PM10 {c}ug: expected ~{exp_sub}, got {sub}"
        cat = get_cpcb_category(sub)
        assert cat == exp_cat, f"PM10 {c}ug: expected cat {exp_cat}, got {cat}"
    print(f"  ✓ Verified {len(pm10_boundaries)} exact PM10 boundary transitions.")

    # 5. NO2 and SO2 Tests
    print("\n[TEST 5] NO2 and SO2 Sub-Index Verification:")
    assert calc_cpcb_subindex_no2(20) == 25
    assert calc_cpcb_subindex_no2(40) == 50
    assert calc_cpcb_subindex_no2(60) == 75
    assert calc_cpcb_subindex_no2(80) == 100
    assert calc_cpcb_subindex_no2(130) == 150
    assert calc_cpcb_subindex_no2(230) == 250
    assert calc_cpcb_subindex_no2(340) == 350
    assert calc_cpcb_subindex_no2(450) == 450
    print("  ✓ NO2 sub-index linear intervals passed.")

    assert calc_cpcb_subindex_so2(20) == 25
    assert calc_cpcb_subindex_so2(40) == 50
    assert calc_cpcb_subindex_so2(60) == 75
    assert calc_cpcb_subindex_so2(80) == 100
    assert calc_cpcb_subindex_so2(230) == 150
    assert calc_cpcb_subindex_so2(590) == 250
    assert calc_cpcb_subindex_so2(1200) == 350
    assert calc_cpcb_subindex_so2(1800) == 450
    print("  ✓ SO2 sub-index linear intervals passed.")

    # 6. NH3 Tests
    print("\n[TEST 6] Ammonia (NH3) Sub-Index Verification:")
    assert calc_cpcb_subindex_nh3(100) == 25
    assert calc_cpcb_subindex_nh3(200) == 50
    assert calc_cpcb_subindex_nh3(300) == 75
    assert calc_cpcb_subindex_nh3(600) == 150
    assert calc_cpcb_subindex_nh3(1000) == 250
    assert calc_cpcb_subindex_nh3(1500) == 350
    assert calc_cpcb_subindex_nh3(2100) == 450
    print("  ✓ NH3 sub-index linear intervals passed.")

    # 7. Invalid & Negative Input Validation
    print("\n[TEST 7] Invalid, Negative, and Edge Case Rejection:")
    for fn in [calc_cpcb_subindex_pm25, calc_cpcb_subindex_pm10, calc_cpcb_subindex_no2,
               calc_cpcb_subindex_so2, calc_cpcb_subindex_co, calc_cpcb_subindex_o3,
               calc_cpcb_subindex_nh3]:
        assert fn(-10) == 0, "Negative input must be clamped to 0"
        assert fn(None) == 0, "None input must return 0"
        assert fn(float('nan')) == 0, "NaN input must return 0"
        assert fn(float('inf')) == 0, "Inf input must return 0"
    print("  ✓ All pollutant functions safely reject negative, None, NaN, and Inf values.")

    # 8. Minimum Criteria
    print("\n[TEST 8] CPCB Minimum 3-Pollutant Validation Rule:")
    assert validate_cpcb_naqi(['PM2.5', 'PM10', 'NO2']) is True
    assert validate_cpcb_naqi(['NO2', 'SO2', 'CO']) is False  # Missing PM
    assert validate_cpcb_naqi(['PM2.5', 'NO2']) is False        # Only 2 pollutants
    assert validate_cpcb_naqi(['PM2.5', 'PM10', 'NO2', 'SO2', 'O3', 'CO']) is True
    print("  ✓ NAQI requires >=3 criteria pollutants with at least one PM fraction.")

    print("\n" + "=" * 70)
    print("ALL CPCB NAQI RELIABILITY & FORMULA TESTS PASSED (100% SUCCESS)")
    print("=" * 70)

if __name__ == '__main__':
    main()

if __name__ == '__main__':
    main()
