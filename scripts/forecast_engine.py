"""
AirCare Machine-Learning Forecasting Engine
Primary Model: Google TimesFM 2.5 (200M PyTorch foundation model)
Baselines: Persistence, Seasonal Naive (7-day), XGBoost Regressor
Standards: CPCB NAQI (2014) piecewise linear breakpoint derivation
"""

import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import math
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta, timezone

from scripts.cpcb_calculator import derive_cpcb_aqi, get_cpcb_category, sanitize_val

POLLUTANTS = ['pm2_5', 'pm10', 'no2', 'so2', 'co', 'o3']

class ForecastEngine:
    def __init__(self, model_dir: Optional[str] = None):
        if model_dir is None:
            self.model_dir = os.path.join(os.path.dirname(__file__), '..', 'models', 'timesfm-2.5-200m-pytorch')
        else:
            self.model_dir = model_dir
        self.tfm = None
        self.model_name = "Google TimesFM 2.5 (200M Foundation Model)"
        self.model_version = "2.5-200m-pytorch"
        self._is_loaded = False

    def load_model(self) -> bool:
        """Loads TimesFM 2.5 PyTorch checkpoint from local model directory."""
        if self._is_loaded:
            return True

        weights_file = os.path.join(self.model_dir, "model.safetensors")
        if not os.path.exists(weights_file):
            print(f"[ForecastEngine] Local weights not found at {weights_file}. Attempting Hugging Face download...")
            try:
                from huggingface_hub import hf_hub_download
                os.makedirs(self.model_dir, exist_ok=True)
                hf_hub_download(
                    repo_id="google/timesfm-2.5-200m-pytorch",
                    filename="model.safetensors",
                    local_dir=self.model_dir
                )
                print(f"[ForecastEngine] Successfully downloaded TimesFM 2.5 weights to {self.model_dir}")
            except Exception as e:
                print(f"[ForecastEngine] Note: Could not download weights from Hugging Face: {e}")
                return False

        try:
            print(f"[ForecastEngine] Loading TimesFM 2.5 200M from {self.model_dir}...")
            from timesfm.timesfm_2p5.timesfm_2p5_torch import TimesFM_2p5_200M_torch
            from timesfm import ForecastConfig

            self.tfm = TimesFM_2p5_200M_torch(torch_compile=False)
            self.tfm.load_checkpoint(self.model_dir)

            # Context size multiple of 32 (e.g. 64), horizon multiple of 128 (e.g. 128)
            fc = ForecastConfig(
                max_context=64,
                max_horizon=128,
                infer_is_positive=True,
                normalize_inputs=False
            )
            self.tfm.compile(fc)
            self._is_loaded = True
            print("[ForecastEngine] TimesFM 2.5 loaded and compiled successfully!")
            return True
        except Exception as e:
            print(f"[ForecastEngine] Error initializing TimesFM: {e}")
            self.tfm = None
            return False

    def predict_timesfm(self, history: np.ndarray, horizon: int) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Runs TimesFM inference for a 1D time series.
        Returns: (point_forecast, lower_bound_10th, upper_bound_90th)
        """
        if self.tfm is None or not self._is_loaded:
            # Fallback to persistence if TimesFM is unavailable
            return self.predict_persistence(history, horizon)

        clean_history = np.array([float(x) for x in history if not (np.isnan(x) or np.isinf(x))])
        if len(clean_history) < 3:
            return self.predict_persistence(history, horizon)

        try:
            point, quantiles = self.tfm.forecast(horizon=horizon, inputs=[clean_history])
            pt = np.maximum(0.0, point[0])
            # quantiles shape: [batch, horizon, 10]
            # Quantile 1 is 10th percentile, quantile 9 is 90th percentile
            if quantiles.shape[-1] >= 10:
                q10 = np.maximum(0.0, quantiles[0, :, 1])
                q90 = np.maximum(0.0, quantiles[0, :, 9])
            else:
                q10 = np.maximum(0.0, pt * 0.85)
                q90 = pt * 1.15
            return pt, q10, q90
        except Exception as e:
            print(f"[ForecastEngine] TimesFM inference failed: {e}. Falling back to baseline.")
            return self.predict_persistence(clean_history, horizon)

    def predict_persistence(self, history: np.ndarray, horizon: int) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Baseline 1: Persistence (y_{t+h} = y_t)."""
        clean = [float(x) for x in history if not (np.isnan(x) or np.isinf(x))]
        last_val = clean[-1] if clean else 100.0
        pt = np.full(horizon, last_val, dtype=float)
        q10 = np.maximum(0.0, pt * 0.85)
        q90 = pt * 1.15
        return pt, q10, q90

    def predict_seasonal_naive(self, history: np.ndarray, horizon: int, season_len: int = 7) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Baseline 2: Seasonal Naive (y_{t+h} = y_{t+h-season_len})."""
        clean = [float(x) for x in history if not (np.isnan(x) or np.isinf(x))]
        if len(clean) < season_len:
            return self.predict_persistence(history, horizon)

        forecasts = []
        for h in range(horizon):
            idx = -(season_len - (h % season_len))
            forecasts.append(clean[idx])
        pt = np.array(forecasts, dtype=float)
        q10 = np.maximum(0.0, pt * 0.85)
        q90 = pt * 1.15
        return pt, q10, q90

    def predict_xgboost(self, history: np.ndarray, horizon: int) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Baseline 3: Tabular XGBoost Regressor trained on autoregressive lags."""
        clean = [float(x) for x in history if not (np.isnan(x) or np.isinf(x))]
        if len(clean) < 14:
            return self.predict_persistence(history, horizon)

        try:
            import xgboost as xgb
            # Build autoregressive tabular lags: 7 lags predicting step t
            X, y = [], []
            for i in range(7, len(clean)):
                X.append(clean[i-7:i])
                y.append(clean[i])

            X, y = np.array(X), np.array(y)
            model = xgb.XGBRegressor(n_estimators=50, max_depth=3, learning_rate=0.05, verbosity=0)
            model.fit(X, y)

            # Recursive multi-step forecasting
            current_window = list(clean[-7:])
            preds = []
            for _ in range(horizon):
                next_val = float(model.predict(np.array([current_window[-7:]]))[0])
                next_val = max(0.0, next_val)
                preds.append(next_val)
                current_window.append(next_val)

            pt = np.array(preds, dtype=float)
            q10 = np.maximum(0.0, pt * 0.85)
            q90 = pt * 1.15
            return pt, q10, q90
        except Exception as e:
            return self.predict_persistence(clean, horizon)

    def generate_city_forecast(
        self,
        city: str,
        context: Dict[str, Any],
        max_horizon: int = 7,
        model_type: str = "timesfm"
    ) -> Dict[str, Any]:
        """
        Generates full multi-horizon forecasts for a city:
        1. Predicts 6 criteria pollutants (PM2.5, PM10, NO2, SO2, CO, O3)
        2. Calculates mathematically consistent CPCB NAQI from predicted pollutants
        3. Predicts direct AQI for baseline comparison
        4. Generates trend direction and data-backed insights
        """
        latest_date_str = context.get('latest_date', datetime.now(timezone.utc).strftime('%Y-%m-%d'))
        latest_dt = datetime.strptime(latest_date_str, '%Y-%m-%d')

        pollutants_context = context.get('pollutants', {})
        aqi_context = context.get('aqi', np.array([]))

        latest_observed_aqi = int(round(aqi_context[-1])) if len(aqi_context) > 0 else 100
        latest_observed_cat = get_cpcb_category(latest_observed_aqi)

        # 1. Predict each pollutant
        predicted_pollutant_series = {}
        latest_observed_pollutants = {}

        for pol in POLLUTANTS:
            hist = pollutants_context.get(pol, np.array([]))
            if len(hist) > 0 and not np.all(np.isnan(hist)):
                last_val = round(float(hist[-1]), 2)
                latest_observed_pollutants[pol] = last_val
                if model_type == "timesfm" and self._is_loaded:
                    pt, q10, q90 = self.predict_timesfm(hist, max_horizon)
                elif model_type == "xgboost":
                    pt, q10, q90 = self.predict_xgboost(hist, max_horizon)
                else:
                    pt, q10, q90 = self.predict_persistence(hist, max_horizon)
                predicted_pollutant_series[pol] = {
                    'point': [round(float(v), 2) for v in pt],
                    'q10': [round(float(v), 2) for v in q10],
                    'q90': [round(float(v), 2) for v in q90],
                }
            else:
                predicted_pollutant_series[pol] = None
                latest_observed_pollutants[pol] = None

        # 2. Predict direct AQI series
        if len(aqi_context) > 0:
            if model_type == "timesfm" and self._is_loaded:
                direct_aqi_pt, aqi_q10, aqi_q90 = self.predict_timesfm(aqi_context, max_horizon)
            elif model_type == "xgboost":
                direct_aqi_pt, aqi_q10, aqi_q90 = self.predict_xgboost(aqi_context, max_horizon)
            else:
                direct_aqi_pt, aqi_q10, aqi_q90 = self.predict_persistence(aqi_context, max_horizon)
        else:
            direct_aqi_pt = np.full(max_horizon, 100.0)
            aqi_q10 = np.full(max_horizon, 85.0)
            aqi_q90 = np.full(max_horizon, 115.0)

        # 3. Derive daily composite AQI from predicted pollutants for each future day
        daily_forecasts = []
        for h in range(max_horizon):
            target_dt = latest_dt + timedelta(days=h + 1)
            target_date_str = target_dt.strftime('%Y-%m-%d')

            day_pollutants = {}
            for pol in POLLUTANTS:
                if predicted_pollutant_series[pol] is not None:
                    day_pollutants[pol] = predicted_pollutant_series[pol]['point'][h]
                else:
                    day_pollutants[pol] = None

            cpcb_derivation = derive_cpcb_aqi(day_pollutants)

            # Derived AQI takes precedence; fallback to direct AQI if pollutants insufficient
            if cpcb_derivation['is_cpcb_compliant'] and cpcb_derivation['composite_aqi'] is not None:
                final_aqi = cpcb_derivation['composite_aqi']
                final_cat = cpcb_derivation['aqi_category']
                dominant_pol = cpcb_derivation['dominant_pollutant']
            else:
                final_aqi = int(round(direct_aqi_pt[h]))
                final_cat = get_cpcb_category(final_aqi)
                dominant_pol = "PM2.5"

            lower_bound = max(0, int(round(aqi_q10[h])))
            upper_bound = min(500, int(round(aqi_q90[h])))
            delta = final_aqi - latest_observed_aqi

            daily_forecasts.append({
                'day_index': h + 1,
                'target_date': target_date_str,
                'predicted_aqi': final_aqi,
                'predicted_category': final_cat,
                'dominant_pollutant': dominant_pol,
                'uncertainty_range': [lower_bound, upper_bound],
                'change_from_latest': delta,
                'direct_aqi_prediction': int(round(direct_aqi_pt[h])),
                'predicted_pollutants': day_pollutants,
                'cpcb_sub_indices': cpcb_derivation.get('sub_indices', {}),
                'is_cpcb_compliant': cpcb_derivation.get('is_cpcb_compliant', False),
            })

        # 4. Synthesize measured narrative insights
        tomorrow_aqi = daily_forecasts[0]['predicted_aqi']
        aqi_diff = tomorrow_aqi - latest_observed_aqi

        if aqi_diff <= -35:
            trend_direction = "Noticeable Improvement Expected"
            trend_sentiment = "positive"
        elif aqi_diff <= -15:
            trend_direction = "Modest Improvement Expected"
            trend_sentiment = "positive"
        elif aqi_diff < 15:
            trend_direction = "Relatively Stable Air Quality"
            trend_sentiment = "neutral"
        elif aqi_diff <= 35:
            trend_direction = "Modest Increase in AQI"
            trend_sentiment = "negative"
        else:
            trend_direction = "Noticeable Increase in AQI"
            trend_sentiment = "negative"

        # Peak & lowest day in forecast
        highest_day = max(daily_forecasts, key=lambda x: x['predicted_aqi'])
        lowest_day = min(daily_forecasts, key=lambda x: x['predicted_aqi'])

        # Largest pollutant delta tomorrow
        max_delta_pol = "PM2.5"
        max_delta_val = 0.0
        for pol, data in predicted_pollutant_series.items():
            if data is not None and latest_observed_pollutants.get(pol) is not None:
                d = abs(data['point'][0] - latest_observed_pollutants[pol])
                if d > max_delta_val:
                    max_delta_val = d
                    max_delta_pol = pol.upper().replace('_', '.')

        insights = {
            'trend_direction': trend_direction,
            'trend_sentiment': trend_sentiment,
            'predicted_dominant_pollutant': daily_forecasts[0]['dominant_pollutant'],
            'highest_predicted_day': {
                'date': highest_day['target_date'],
                'aqi': highest_day['predicted_aqi'],
                'category': highest_day['predicted_category']
            },
            'lowest_predicted_day': {
                'date': lowest_day['target_date'],
                'aqi': lowest_day['predicted_aqi'],
                'category': lowest_day['predicted_category']
            },
            'largest_pollutant_shift': {
                'pollutant': max_delta_pol,
                'magnitude': round(max_delta_val, 2)
            }
        }

        # 5. Extract historical observed snippet for charting (last 14 days)
        chart_history = []
        if len(aqi_context) > 0:
            hist_len = min(14, len(aqi_context))
            for i in range(hist_len):
                d_idx = hist_len - 1 - i
                past_dt = latest_dt - timedelta(days=d_idx)
                val = int(round(aqi_context[-hist_len + i]))
                chart_history.append({
                    'date': past_dt.strftime('%Y-%m-%d'),
                    'aqi': val,
                    'category': get_cpcb_category(val),
                    'is_forecast': False
                })

        return {
            'city': city,
            'latest_observation_date': latest_date_str,
            'forecast_generation_time': datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            'model_name': self.model_name if model_type == "timesfm" else f"{model_type.upper()} Baseline",
            'model_version': self.model_version if model_type == "timesfm" else "1.0",
            'input_source': context.get('source', 'cpcb_historical_archive'),
            'latest_observed_aqi': latest_observed_aqi,
            'latest_observed_category': latest_observed_cat,
            'latest_observed_pollutants': latest_observed_pollutants,
            'predicted_pollutants_timeline': predicted_pollutant_series,
            'daily_forecasts': daily_forecasts,
            'insights': insights,
            'chart_history': chart_history,
            'supported_horizons': ['tomorrow', '3_days', '7_days']
        }
