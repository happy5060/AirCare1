"""
AirCare Model Evaluation & Chronological Backtesting Suite
Evaluates Google TimesFM 2.5 against Persistence, Seasonal Naive, and XGBoost baselines.
Computes MAE, RMSE, R², and Severe Category Recall without lookahead leakage.
"""

import os
import sys
sys.stdout.reconfigure(line_buffering=True)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import json
import math
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple

from scripts.forecast_engine import ForecastEngine, POLLUTANTS
from scripts.cpcb_calculator import derive_cpcb_aqi, get_cpcb_category

def compute_metrics(y_true: List[float], y_pred: List[float]) -> Dict[str, float]:
    """Computes MAE, RMSE, R2, and MAPE between true and predicted arrays."""
    y_t = np.array(y_true, dtype=float)
    y_p = np.array(y_pred, dtype=float)

    mask = ~(np.isnan(y_t) | np.isnan(y_p) | np.isinf(y_t) | np.isinf(y_p))
    y_t, y_p = y_t[mask], y_p[mask]

    if len(y_t) == 0:
        return {'mae': None, 'rmse': None, 'r2': None, 'sample_count': 0}

    mae = float(np.mean(np.abs(y_t - y_p)))
    rmse = float(np.sqrt(np.mean((y_t - y_p) ** 2)))

    # R2 calculation vs historical mean benchmark
    ss_tot = np.sum((y_t - np.mean(y_t)) ** 2)
    ss_res = np.sum((y_t - y_p) ** 2)
    r2 = float(1.0 - (ss_res / ss_tot)) if ss_tot > 1e-6 else 0.0

    # Severe category recall (True AQI >= 401)
    severe_true = (y_t >= 401)
    if np.sum(severe_true) > 0:
        severe_pred = (y_p >= 350) # predicted within severe or high very poor
        severe_recall = float(np.sum(severe_true & severe_pred) / np.sum(severe_true))
    else:
        severe_recall = 1.0

    return {
        'mae': round(mae, 2),
        'rmse': round(rmse, 2),
        'r2': round(r2, 4),
        'severe_recall': round(severe_recall, 4),
        'sample_count': int(len(y_t))
    }

def run_chronological_backtesting(
    engine: ForecastEngine,
    cities: List[str] = ['Delhi', 'Bengaluru', 'Lucknow'],
    eval_window_count: int = 10,
    horizons: List[int] = [1, 3, 7]
) -> Dict[str, Any]:
    max_h = max(horizons)
    print("=" * 60)
    print("STARTING CHRONOLOGICAL ROLLING-ORIGIN BACKTESTING")
    print(f"Primary Model: {engine.model_name}")
    print(f"Target Cities: {cities}")
    print(f"Evaluation Folds: {eval_window_count} sliding origins per city")
    print(f"Horizons: {horizons} days")
    print("=" * 60)

    city_day_path = os.path.join(os.path.dirname(__file__), '..', 'processed_data', 'cleaned_city_day.csv')
    if not os.path.exists(city_day_path):
        raise FileNotFoundError(f"Historical file not found: {city_day_path}")

    df_raw = pd.read_csv(city_day_path, low_memory=False)
    df_raw['date'] = pd.to_datetime(df_raw['date'])

    models = ['timesfm', 'persistence', 'seasonal_naive', 'xgboost']
    results_by_horizon = {h: {m: {'aqi_true': [], 'aqi_pred': [], 'pollutants': {p: {'true': [], 'pred': []} for p in POLLUTANTS}} for m in models} for h in horizons}

    for city in cities:
        print(f"\nEvaluating City: {city}...")
        cdf = df_raw[df_raw['city'].str.lower() == city.lower()].sort_values('date').copy()
        cdf = cdf.dropna(subset=['aqi'])

        if len(cdf) < 100:
            print(f"Skipping {city}: Insufficient valid records ({len(cdf)})")
            continue

        # Holdout split: Use the final 15% of records for rolling origin evaluation
        holdout_start_idx = len(cdf) - eval_window_count - 10
        if holdout_start_idx < 64:
            holdout_start_idx = 64

        step = max(1, (len(cdf) - holdout_start_idx - max_h) // eval_window_count)
        test_origins = list(range(holdout_start_idx, len(cdf) - max_h, step))[:eval_window_count]
        print(f"  Total historical rows: {len(cdf)} | Test origin dates: {len(test_origins)}")

        for fold_idx, origin_idx in enumerate(test_origins):
            origin_row = cdf.iloc[origin_idx]
            origin_date = str(origin_row['date'].date())

            # Input context: strictly history <= origin_date
            history_df = cdf.iloc[:origin_idx + 1]
            aqi_hist = history_df['aqi'].ffill().bfill().values[-64:]

            pollutant_hists = {}
            for p in POLLUTANTS:
                if p in history_df.columns:
                    s = history_df[p].ffill().bfill().values[-64:]
                    pollutant_hists[p] = s
                else:
                    pollutant_hists[p] = np.array([])

            # Run each model ONCE for max_h
            model_aqi_preds = {}
            model_pol_preds = {m: {} for m in models}

            for m in models:
                if m == 'timesfm':
                    pt, _, _ = engine.predict_timesfm(aqi_hist, max_h)
                elif m == 'persistence':
                    pt, _, _ = engine.predict_persistence(aqi_hist, max_h)
                elif m == 'seasonal_naive':
                    pt, _, _ = engine.predict_seasonal_naive(aqi_hist, max_h)
                elif m == 'xgboost':
                    pt, _, _ = engine.predict_xgboost(aqi_hist, max_h)
                model_aqi_preds[m] = pt

                for p in POLLUTANTS:
                    p_hist = pollutant_hists.get(p, np.array([]))
                    if len(p_hist) > 0:
                        if m == 'timesfm':
                            p_pt, _, _ = engine.predict_timesfm(p_hist, max_h)
                        elif m == 'persistence':
                            p_pt, _, _ = engine.predict_persistence(p_hist, max_h)
                        elif m == 'seasonal_naive':
                            p_pt, _, _ = engine.predict_seasonal_naive(p_hist, max_h)
                        elif m == 'xgboost':
                            p_pt, _, _ = engine.predict_xgboost(p_hist, max_h)
                        model_pol_preds[m][p] = p_pt

            # Evaluate against true observations at t+h
            for h in horizons:
                target_idx = origin_idx + h
                ground_truth_row = cdf.iloc[target_idx]
                true_aqi = float(ground_truth_row['aqi'])

                for m in models:
                    pred_aqi = float(model_aqi_preds[m][h - 1])
                    results_by_horizon[h][m]['aqi_true'].append(true_aqi)
                    results_by_horizon[h][m]['aqi_pred'].append(pred_aqi)

                    for p in POLLUTANTS:
                        if p in ground_truth_row and not pd.isna(ground_truth_row[p]):
                            true_p = float(ground_truth_row[p])
                            if p in model_pol_preds[m]:
                                pred_p = float(model_pol_preds[m][p][h - 1])
                                results_by_horizon[h][m]['pollutants'][p]['true'].append(true_p)
                                results_by_horizon[h][m]['pollutants'][p]['pred'].append(pred_p)

            print(f"    Fold {fold_idx+1}/{len(test_origins)} (origin: {origin_date}): TimesFM 1d={model_aqi_preds['timesfm'][0]:.1f} vs True={cdf.iloc[origin_idx+1]['aqi']:.1f}")

    # Compute overall benchmark statistics
    evaluation_report = {
        'timestamp': datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        'evaluation_period': "Historical Rolling Holdout Evaluation (CPCB City-Day Archive)",
        'evaluation_cities': cities,
        'model_benchmarks': {},
        'pollutant_benchmarks': {},
        'horizon_summaries': {}
    }

    for h in horizons:
        horizon_label = f"{h}_day"
        evaluation_report['horizon_summaries'][horizon_label] = {}
        for m in models:
            m_stats = compute_metrics(
                results_by_horizon[h][m]['aqi_true'],
                results_by_horizon[h][m]['aqi_pred']
            )
            evaluation_report['horizon_summaries'][horizon_label][m] = m_stats

    # Pollutant level metrics for TimesFM across horizons
    for p in POLLUTANTS:
        evaluation_report['pollutant_benchmarks'][p] = {}
        for h in horizons:
            p_stats = compute_metrics(
                results_by_horizon[h]['timesfm']['pollutants'][p]['true'],
                results_by_horizon[h]['timesfm']['pollutants'][p]['pred']
            )
            evaluation_report['pollutant_benchmarks'][p][f"{h}_day"] = p_stats

    # Print summary table
    print("\n" + "=" * 70)
    print("CHRONOLOGICAL BACKTESTING BENCHMARK RESULTS")
    print("=" * 70)
    for h in horizons:
        print(f"\n--- Horizon: {h} Day(s) Ahead ---")
        print(f"{'Model':<25} | {'MAE':<8} | {'RMSE':<8} | {'R2':<8} | {'Severe Recall':<12}")
        print("-" * 70)
        for m in models:
            stats = evaluation_report['horizon_summaries'][f"{h}_day"][m]
            print(f"{m:<25} | {stats['mae']:<8} | {stats['rmse']:<8} | {stats['r2']:<8} | {stats['severe_recall']:<12}")

    return evaluation_report

if __name__ == "__main__":
    engine = ForecastEngine()
    engine.load_model()
    report = run_chronological_backtesting(engine, cities=['Delhi', 'Bengaluru', 'Lucknow'], eval_window_count=10)

    # Save to docs and frontend public data
    os.makedirs(os.path.join(os.path.dirname(__file__), '..', 'docs'), exist_ok=True)
    out_docs = os.path.join(os.path.dirname(__file__), '..', 'docs', 'model_evaluation_results.json')
    with open(out_docs, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)

    os.makedirs(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public', 'data'), exist_ok=True)
    out_frontend = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public', 'data', 'model_evaluations.json')
    with open(out_frontend, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)

    print(f"\nEvaluation results saved to {out_docs} and {out_frontend}")
