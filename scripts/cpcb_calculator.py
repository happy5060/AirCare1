"""
Official CPCB National Air Quality Index (NAQI 2014) Calculation Engine
Standards: Central Pollution Control Board (CPCB), MoEFCC, Government of India.
Piecewise linear interpolation breakpoints for criteria pollutants.
"""

import math
from typing import Dict, Any, Optional, Tuple, List

# Pollutant breakpoints table: [B_low, B_high, I_low, I_high]
BREAKPOINTS = {
    'pm2_5': [
        (0, 30, 0, 50),
        (30, 60, 50, 100),
        (60, 90, 100, 200),
        (90, 120, 200, 300),
        (120, 250, 300, 400),
        (250, 380, 400, 500),
    ],
    'pm10': [
        (0, 50, 0, 50),
        (50, 100, 50, 100),
        (100, 250, 100, 200),
        (250, 350, 200, 300),
        (350, 430, 300, 400),
        (430, 500, 400, 500),
    ],
    'no2': [
        (0, 40, 0, 50),
        (40, 80, 50, 100),
        (80, 180, 100, 200),
        (180, 280, 200, 300),
        (280, 400, 300, 400),
        (400, 1000, 400, 500),
    ],
    'so2': [
        (0, 40, 0, 50),
        (40, 80, 50, 100),
        (80, 380, 100, 200),
        (380, 800, 200, 300),
        (800, 1600, 300, 400),
        (1600, 2000, 400, 500),
    ],
    'co': [
        (0, 1.0, 0, 50),
        (1.0, 2.0, 50, 100),
        (2.0, 10.0, 100, 200),
        (10.0, 17.0, 200, 300),
        (17.0, 34.0, 300, 400),
        (34.0, 50.0, 400, 500),
    ],
    'o3': [
        (0, 50, 0, 50),
        (50, 100, 50, 100),
        (100, 168, 100, 200),
        (168, 208, 200, 300),
        (208, 748, 300, 400),
        (748, 1000, 400, 500),
    ],
    'nh3': [
        (0, 200, 0, 50),
        (200, 400, 50, 100),
        (400, 800, 100, 200),
        (800, 1200, 200, 300),
        (1200, 1800, 300, 400),
        (1800, 2400, 400, 500),
    ]
}

def sanitize_val(v: Any) -> Optional[float]:
    if v is None:
        return None
    try:
        val = float(v)
        if math.isnan(val) or math.isinf(val) or val < 0.0:
            return None
        return val
    except (ValueError, TypeError):
        return None

def calc_sub_index(pollutant: str, conc: float) -> Optional[int]:
    """Computes CPCB sub-index for a given pollutant and concentration."""
    val = sanitize_val(conc)
    if val is None or pollutant not in BREAKPOINTS:
        return None

    bp_list = BREAKPOINTS[pollutant]
    for b_low, b_high, i_low, i_high in bp_list:
        if b_low <= val <= b_high:
            sub = i_low + ((i_high - i_low) / (b_high - b_low)) * (val - b_low)
            return min(500, max(0, round(sub)))

    # If concentration exceeds highest breakpoint, cap at 500
    if val > bp_list[-1][1]:
        return 500
    return 0

def get_cpcb_category(aqi: Optional[int]) -> str:
    """Maps AQI integer to official CPCB health category."""
    if aqi is None:
        return "Insufficient Data"
    if aqi <= 50:
        return "Good"
    elif aqi <= 100:
        return "Satisfactory"
    elif aqi <= 200:
        return "Moderate"
    elif aqi <= 300:
        return "Poor"
    elif aqi <= 400:
        return "Very Poor"
    else:
        return "Severe"

def derive_cpcb_aqi(pollutant_concentrations: Dict[str, Optional[float]]) -> Dict[str, Any]:
    """
    Evaluates CPCB composite AQI from a dictionary of pollutant concentrations.
    Enforces CPCB minimum criteria:
      1. At least 3 valid criteria pollutants.
      2. At least one particulate matter pollutant (PM2.5 or PM10).
    Returns dict with sub_indices, composite_aqi, aqi_category, dominant_pollutant, is_valid.
    """
    sub_indices = {}
    valid_subs = []
    has_particulate = False

    name_mapping = {
        'pm2_5': 'PM2.5',
        'pm25': 'PM2.5',
        'pm10': 'PM10',
        'no2': 'NO2',
        'so2': 'SO2',
        'co': 'CO',
        'o3': 'O3',
        'nh3': 'NH3'
    }

    canonical_concs = {}
    for k, v in pollutant_concentrations.items():
        clean_k = k.lower().replace('.', '_').replace('-', '_')
        if clean_k in ('pm2_5', 'pm25'):
            canonical_concs['pm2_5'] = v
        elif clean_k in BREAKPOINTS:
            canonical_concs[clean_k] = v

    for pol, conc in canonical_concs.items():
        sub = calc_sub_index(pol, conc)
        sub_indices[pol] = sub
        if sub is not None:
            valid_subs.append((pol, sub))
            if pol in ('pm2_5', 'pm10'):
                has_particulate = True

    # Check minimum pollutant criteria
    is_valid = has_particulate and len(valid_subs) >= 3

    if not is_valid:
        dominant = max(valid_subs, key=lambda x: x[1])[0] if valid_subs else 'None'
        dominant_label = name_mapping.get(dominant, dominant)
        max_sub = max(x[1] for x in valid_subs) if valid_subs else None
        return {
            'composite_aqi': max_sub,
            'aqi_category': get_cpcb_category(max_sub) if max_sub is not None else 'Insufficient Data',
            'dominant_pollutant': dominant_label,
            'is_cpcb_compliant': False,
            'sub_indices': sub_indices,
            'valid_pollutant_count': len(valid_subs),
            'note': f"Insufficient pollutant coverage (evaluated {len(valid_subs)} pollutants; requires >=3 including PM2.5 or PM10)."
        }

    # Dominant pollutant is the one with the maximum sub-index
    sorted_subs = sorted(valid_subs, key=lambda x: x[1], reverse=True)
    dominant_pol, composite_aqi = sorted_subs[0]
    dominant_label = name_mapping.get(dominant_pol, dominant_pol)

    return {
        'composite_aqi': composite_aqi,
        'aqi_category': get_cpcb_category(composite_aqi),
        'dominant_pollutant': dominant_label,
        'is_cpcb_compliant': True,
        'sub_indices': sub_indices,
        'valid_pollutant_count': len(valid_subs),
        'note': f"Compliant with official CPCB NAQI standard ({len(valid_subs)} criteria pollutants evaluated)."
    }
