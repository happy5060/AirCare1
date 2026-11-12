"""
Unit & Integration Tests for AirCare Machine Learning Forecasting Pipeline
Validates CPCB NAQI (2014) derivation, TimesFM forecast non-negativity,
chronological data preparation, and schema compliance.
"""

import os
import sys
import json
import unittest
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.cpcb_calculator import (
    calc_sub_index,
    get_cpcb_category,
    derive_cpcb_aqi,
    BREAKPOINTS
)
from scripts.forecast_engine import ForecastEngine, POLLUTANTS
from scripts.data_preparation import prepare_forecasting_context

class TestAirCareForecasting(unittest.TestCase):

    def setUp(self):
        self.engine = ForecastEngine()
        self.engine.load_model()

    def test_cpcb_sub_index_breakpoints(self):
        """Validates CPCB piecewise linear interpolation against official 2014 tables."""
        # PM2.5 breakpoints
        self.assertEqual(calc_sub_index('pm2_5', 30.0), 50)
        self.assertEqual(calc_sub_index('pm2_5', 60.0), 100)
        self.assertEqual(calc_sub_index('pm2_5', 90.0), 200)
        self.assertEqual(calc_sub_index('pm2_5', 120.0), 300)
        self.assertEqual(calc_sub_index('pm2_5', 250.0), 400)
        self.assertEqual(calc_sub_index('pm2_5', 380.0), 500)

        # PM10 breakpoints
        self.assertEqual(calc_sub_index('pm10', 50.0), 50)
        self.assertEqual(calc_sub_index('pm10', 100.0), 100)
        self.assertEqual(calc_sub_index('pm10', 250.0), 200)

        # CO in mg/m3
        self.assertEqual(calc_sub_index('co', 1.0), 50)
        self.assertEqual(calc_sub_index('co', 2.0), 100)

    def test_derive_cpcb_aqi_minimum_criteria(self):
        """Verifies enforcement of CPCB 3-pollutant minimum and particulate requirement."""
        # Case 1: Less than 3 pollutants -> is_cpcb_compliant False
        insufficient = derive_cpcb_aqi({'pm2_5': 60.0, 'no2': 40.0})
        self.assertFalse(insufficient['is_cpcb_compliant'])

        # Case 2: 3 gaseous pollutants, no particulate -> is_cpcb_compliant False
        no_particulate = derive_cpcb_aqi({'no2': 50.0, 'so2': 30.0, 'co': 1.5})
        self.assertFalse(no_particulate['is_cpcb_compliant'])

        # Case 3: 3 valid pollutants including PM2.5 -> is_cpcb_compliant True
        compliant = derive_cpcb_aqi({'pm2_5': 60.0, 'no2': 40.0, 'co': 1.0})
        self.assertTrue(compliant['is_cpcb_compliant'])
        self.assertEqual(compliant['composite_aqi'], 100)
        self.assertEqual(compliant['dominant_pollutant'], 'PM2.5')

    def test_forecast_non_negativity(self):
        """Guarantees that predicted pollutant concentrations and AQI are strictly non-negative."""
        test_series = np.array([10.0, 15.0, 8.0, 12.0, 14.0, 9.0])
        pt, q10, q90 = self.engine.predict_timesfm(test_series, horizon=7)

        self.assertTrue(np.all(pt >= 0.0), "Point forecast contains negative values!")
        self.assertTrue(np.all(q10 >= 0.0), "10th quantile contains negative values!")
        self.assertTrue(np.all(q90 >= 0.0), "90th quantile contains negative values!")

    def test_full_city_forecast_generation(self):
        """Tests end-to-end multi-horizon forecast generation for a tracked city."""
        context = prepare_forecasting_context('Delhi', context_len=32)
        self.assertTrue(context.get('valid', False))

        forecast = self.engine.generate_city_forecast('Delhi', context, max_horizon=7)
        self.assertEqual(forecast['city'], 'Delhi')
        self.assertEqual(len(forecast['daily_forecasts']), 7)

        # Check tomorrow forecast attributes
        tomorrow = forecast['daily_forecasts'][0]
        self.assertGreater(tomorrow['predicted_aqi'], 0)
        self.assertIn(tomorrow['predicted_category'], ['Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor', 'Severe'])
        self.assertIn('dominant_pollutant', tomorrow)
        self.assertEqual(len(tomorrow['uncertainty_range']), 2)

    def test_frontend_forecast_json_structure(self):
        """Verifies that frontend/public/data/forecasts.json exists and contains all 10 cities."""
        json_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public', 'data', 'forecasts.json')
        self.assertTrue(os.path.exists(json_path), "forecasts.json does not exist!")

        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        self.assertIn('metadata', data)
        self.assertIn('forecasts', data)
        forecasts = data['forecasts']
        for city in ['Delhi', 'Mumbai', 'Bengaluru', 'Kolkata', 'Chennai', 'Hyderabad', 'Ahmedabad', 'Pune', 'Jaipur', 'Lucknow']:
            self.assertIn(city, forecasts, f"City {city} missing from forecasts.json")
            city_fc = forecasts[city]
            self.assertEqual(len(city_fc['daily_forecasts']), 7)

    def test_model_evaluation_metrics_validity(self):
        """Verifies that model_evaluations.json exists and contains genuine evaluated metrics."""
        eval_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public', 'data', 'model_evaluations.json')
        self.assertTrue(os.path.exists(eval_path), "model_evaluations.json does not exist!")

        with open(eval_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        self.assertIn('horizon_summaries', data)
        self.assertIn('1_day', data['horizon_summaries'])
        self.assertIn('timesfm', data['horizon_summaries']['1_day'])
        tfm_1d = data['horizon_summaries']['1_day']['timesfm']
        self.assertIsNotNone(tfm_1d['mae'])
        self.assertIsNotNone(tfm_1d['rmse'])
        self.assertIsNotNone(tfm_1d['r2'])
        self.assertGreater(tfm_1d['r2'], 0.5, "TimesFM 1-day R2 should be positive and strong")

if __name__ == '__main__':
    unittest.main()

