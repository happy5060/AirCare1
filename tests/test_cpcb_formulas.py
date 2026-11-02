"""
AirCare Platform: CPCB NAQI Mathematical Formula & Validation Test Suite
Verifies:
1. Carbon Monoxide (CO) concentration unit conversion (ug/m3 -> mg/m3) and sub-index interpolation.
2. Ground-Level Ozone (O3) breakpoint piecewise linear interpolation.
3. Particulate Matter (PM2.5, PM10) sub-indices.
4. CPCB minimum 3-criteria pollutant validation rule.
"""

import sys

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def calc_cpcb_subindex_pm25(c):
    if c is None or c < 0: return 0
    if c <= 30: return round((c * 50) / 30)
    elif c <= 60: return round(50 + ((c - 30) * 50) / 30)
    elif c <= 90: return round(100 + ((c - 60) * 100) / 30)
    elif c <= 120: return round(200 + ((c - 90) * 100) / 30)
    elif c <= 250: return round(300 + ((c - 120) * 100) / 130)
    else: return min(500, round(400 + ((c - 250) * 100) / 130))

def calc_cpcb_subindex_pm10(c):
    if c is None or c < 0: return 0
    if c <= 50: return round(c)
    elif c <= 100: return round(c)
    elif c <= 250: return round(100 + ((c - 100) * 100) / 150)
    elif c <= 350: return round(200 + (c - 250))
    elif c <= 430: return round(300 + ((c - 350) * 100) / 80)
    else: return min(500, round(400 + ((c - 430) * 100) / 70))

def calc_cpcb_subindex_co(co_ug):
    if co_ug is None or co_ug < 0: return 0
    co_mg = co_ug / 1000.0
    if co_mg <= 1.0: return round(co_mg * 50)
    elif co_mg <= 2.0: return round(50 + (co_mg - 1.0) * 50)
    elif co_mg <= 10.0: return round(100 + ((co_mg - 2.0) * 100) / 8.0)
    elif co_mg <= 17.0: return round(200 + ((co_mg - 10.0) * 100) / 7.0)
    elif co_mg <= 34.0: return round(300 + ((co_mg - 17.0) * 100) / 17.0)
    else: return min(500, round(400 + ((co_mg - 34.0) * 100) / 16.0))

def calc_cpcb_subindex_o3(c):
    if c is None or c < 0: return 0
    if c <= 50: return round(c)
    elif c <= 100: return round(c)
    elif c <= 168: return round(100 + ((c - 100) * 100) / 68)
    elif c <= 208: return round(200 + ((c - 168) * 100) / 40)
    elif c <= 748: return round(300 + ((c - 208) * 100) / 540)
    else: return min(500, round(400 + ((c - 748) * 100) / 252))

def validate_cpcb_naqi(pollutants):
    has_particulates = 'PM2.5' in pollutants or 'PM10' in pollutants
    valid_count = len(pollutants)
    return has_particulates and valid_count >= 3

def main():
    print("=" * 65)
    print("RUNNING CPCB NAQI FORMULA & COMPLIANCE TESTS")
    print("=" * 65)

    # 1. CO Tests
    print("\n[TEST 1] Carbon Monoxide (CO in ug/m3 -> mg/m3):")
    co_cases = [
        (500, 25, "Good"),
        (1500, 75, "Satisfactory"),
        (6000, 150, "Moderate"),
        (13500, 250, "Poor"),
        (25500, 349, "Very Poor"),
        (42000, 450, "Severe")
    ]
    for ug, expected_sub, expected_cat in co_cases:
        sub = calc_cpcb_subindex_co(ug)
        assert abs(sub - expected_sub) <= 1, f"CO {ug}ug: expected ~{expected_sub}, got {sub}"
        print(f"  ✓ CO {ug:>5} ug/m3 ({ug/1000:>4.1f} mg/m3) -> Sub-index {sub:>3} ({expected_cat})")

    # 2. O3 Tests
    print("\n[TEST 2] Ground-Level Ozone (O3 in ug/m3):")
    o3_cases = [
        (25, 25, "Good"),
        (75, 75, "Satisfactory"),
        (134, 150, "Moderate"),
        (188, 250, "Poor"),
        (478, 350, "Very Poor"),
        (874, 450, "Severe")
    ]
    for ug, expected_sub, expected_cat in o3_cases:
        sub = calc_cpcb_subindex_o3(ug)
        assert abs(sub - expected_sub) <= 1, f"O3 {ug}ug: expected ~{expected_sub}, got {sub}"
        print(f"  ✓ O3 {ug:>3} ug/m3 -> Sub-index {sub:>3} ({expected_cat})")

    # 3. PM Tests
    print("\n[TEST 3] Particulate Matter (PM2.5 & PM10):")
    assert calc_cpcb_subindex_pm25(15) == 25, "PM2.5 15ug should be 25"
    assert calc_cpcb_subindex_pm25(45) == 75, "PM2.5 45ug should be 75"
    assert calc_cpcb_subindex_pm10(25) == 25, "PM10 25ug should be 25"
    assert calc_cpcb_subindex_pm10(175) == 150, "PM10 175ug should be 150"
    print("  ✓ PM2.5 & PM10 piecewise linear breakpoints verified.")

    # 4. Minimum Criteria
    print("\n[TEST 4] CPCB Minimum 3-Pollutant Validation Rule:")
    assert validate_cpcb_naqi(['PM2.5', 'PM10', 'NO2']) is True
    assert validate_cpcb_naqi(['NO2', 'SO2', 'CO']) is False  # Missing PM
    assert validate_cpcb_naqi(['PM2.5', 'NO2']) is False        # Only 2 pollutants
    assert validate_cpcb_naqi(['PM2.5', 'PM10', 'NO2', 'SO2', 'O3', 'CO']) is True
    print("  ✓ NAQI requires >=3 criteria pollutants with at least one PM fraction.")

    print("\n" + "=" * 65)
    print("ALL CPCB FORMULA & COMPLIANCE TESTS PASSED (100% SUCCESS)")
    print("=" * 65)

if __name__ == '__main__':
    main()
