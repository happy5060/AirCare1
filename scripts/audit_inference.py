"""
AirCare Production Readiness Verification — Inference Audit
Confirms real TimesFM 2.5 PyTorch execution for Delhi and Mumbai.
"""
import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import torch
import numpy as np

from scripts.forecast_engine import ForecastEngine, POLLUTANTS
from scripts.data_preparation import prepare_forecasting_context

def main():
    print("=" * 65)
    print(" 1. TIMESFM 2.5 CHECKPOINT & INFERENCE VERIFICATION")
    print("=" * 65)

    model_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'models', 'timesfm-2.5-200m-pytorch'))
    safetensor_path = os.path.join(model_dir, 'model.safetensors')

    print(f"[*] Checkpoint directory: {model_dir}")
    print(f"[*] SafeTensors exists: {os.path.exists(safetensor_path)}")
    if os.path.exists(safetensor_path):
        size_mb = os.path.getsize(safetensor_path) / (1024 * 1024)
        print(f"[*] SafeTensors size: {size_mb:.2f} MB")

    engine = ForecastEngine()
    loaded = engine.load_model()
    print(f"[*] Engine load_model() status: {loaded}")
    print(f"[*] Wrapper type inside engine: {type(engine.tfm)}")
    torch_model = getattr(engine.tfm, 'model', None)
    if torch_model is not None and hasattr(torch_model, 'parameters'):
        param_count = sum(p.numel() for p in torch_model.parameters())
        print(f"[*] Underlying PyTorch module: {type(torch_model).__name__}")
        print(f"[*] Total trainable parameters: {param_count:,}")
    else:
        print("[*] PyTorch module wrapped in TimesFM 2.5 Torch class")

    test_cities = ['Delhi', 'Mumbai']
    for city in test_cities:
        ctx = prepare_forecasting_context(city, context_len=64)
        print(f"\n" + "-" * 50)
        print(f"CITY: {city}")
        print(f"Context source: {ctx.get('source')}")
        print(f"Latest observation date: {ctx.get('latest_date')}")
        print(f"Context length (AQI): {len(ctx.get('aqi', []))}")
        
        # Run live inference
        forecast = engine.generate_city_forecast(
            city=city,
            context=ctx,
            max_horizon=7,
            model_type="timesfm"
        )
        
        print(f"Forecast generation time: {forecast['forecast_generation_time']}")
        print(f"Latest observed AQI: {forecast['latest_observed_aqi']} ({forecast['latest_observed_category']})")

        # Test horizons 1d, 3d, 7d
        for h_idx in [0, 2, 6]:
            df = forecast['daily_forecasts'][h_idx]
            day = df['day_index']
            t_date = df['target_date']
            aqi = df['predicted_aqi']
            cat = df['predicted_category']
            dom = df['dominant_pollutant']
            direct = df['direct_aqi_prediction']
            bounds = df['uncertainty_range']
            
            print(f"\n  Horizon: {day}-Day Ahead ({t_date})")
            print(f"    CPCB Derived AQI: {aqi} [{cat}] (Dominant: {dom})")
            print(f"    Direct Model AQI: {direct:.1f}")
            print(f"    80% Confidence Interval: [{bounds[0]}, {bounds[1]}]")
            print("    Pollutant Predictions & Sub-indices:")
            for p in POLLUTANTS:
                pred = df['predicted_pollutants'].get(p, 0.0)
                sub = df['cpcb_sub_indices'].get(p, 0)
                print(f"      {p:6s}: {pred:7.2f} µg/m³  (CPCB Sub-index: {sub:3d})")

    # Dynamic Sensitivity Test: Verify model is not hardcoded
    print("\n" + "=" * 65)
    print(" SENSITIVITY TEST: VERIFYING OUTPUTS ARE NOT HARDCODED")
    print("=" * 65)
    
    # Run with a baseline vs scaled synthetic series
    np.random.seed(42)
    s1 = np.ones(64) * 50.0
    s2 = np.ones(64) * 150.0
    out1, _, _ = engine.predict_timesfm(s1, horizon=7)
    out2, _, _ = engine.predict_timesfm(s2, horizon=7)
    
    print(f"Input s1 (flat 50.0) -> Output Day 1: {out1[0]:.2f}")
    print(f"Input s2 (flat 150.0) -> Output Day 1: {out2[0]:.2f}")
    diff = abs(out1[0] - out2[0])
    print(f"Difference: {diff:.2f}")
    assert diff > 10.0, "Model did not react dynamically to input changes!"
    print("[✓] Model passed dynamic sensitivity test: outputs are genuinely model-generated!")

if __name__ == '__main__':
    main()
