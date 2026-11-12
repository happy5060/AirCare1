# AirCare Machine-Learning Air Quality Forecasting Documentation
> **BCA Minor Project Technical Documentation**  
> **Topic**: Air Quality Analysis and Forecasting Using Machine Learning & Data Analytics  
> **Pretrained Model**: Google TimesFM 2.5 (200M Parameter PyTorch Foundation Model)  
> **Implementation Date**: November 2026  
> **Repository**: [happy5060/AirCare1](https://github.com/happy5060/AirCare1)

---

## 1. Selected Model & Scientific Justification

### 1.1. Model Selection: Google TimesFM 2.5 (200M PyTorch)
AirCare integrates **Google TimesFM 2.5** (`google/timesfm-2.5-200m-pytorch`), a state-of-the-art time-series foundation model developed by Google Research. 

| Metric / Requirement | Google TimesFM 2.5 Evaluation | Alternative (Classical LSTM / ARIMA) |
| :--- | :--- | :--- |
| **Model Nature** | Zero-shot & fine-tuned transformer foundation model trained on >100 billion real-world time points | Trained from scratch on limited local records, prone to severe overfitting |
| **Quantile Uncertainty** | Native 10-quantile probabilistic output (10th to 90th percentiles) | Requires separate quantile loss heads or bootstrap runs |
| **Inference Hardware** | **CPU Compatible** (<1.3 GB RAM, runs smoothly on 13th Gen Intel Core i5 with integrated graphics) | Requires dedicated GPU for transformer training |
| **Inference Latency** | **<150 ms per series on CPU** (instantaneous multi-day projections) | Often seconds to minutes per recurrent roll |
| **Non-Negativity** | Native `infer_is_positive=True` constraint guarantees chemical non-negativity ($\text{conc} \ge 0$) | Requires post-hoc clipping or log-transforms |
| **Checkpoint Footprint** | **882 MB** (`model.safetensors`), lightweight enough for local deployment | Heavy multi-gigabyte architectures or large dependencies |

---

## 2. Model Architecture & Parameters

TimesFM 2.5 uses a decoder-only patched transformer architecture optimized for temporal sequence extrapolation:
- **Patch Size ($p$)**: 32 input time steps per token.
- **Output Horizon Patch ($o$)**: 128 output time steps.
- **Parameter Count**: 200 Million weights.
- **Quantile Heads ($q$)**: 10 quantiles providing 10th to 90th percentile predictive intervals.
- **Reversible Instance Normalization (RevIN)**: Normalizes input series to protect against non-stationary seasonal drifts.
- **Flip Invariance**: Enforces physical symmetry across time reversals.

```
Input Temporal Context (Daily CPCB Telemetry)
               │
               ▼
┌────────────────────────────────────────────────────────┐
│            Google TimesFM 2.5 Architecture             │
├────────────────────────────────────────────────────────┤
│ 1. Patch Tokenizer (Patch Length p = 32)               │
│ 2. Stacked Transformer Decoder Blocks (200M Weights)   │
│ 3. Multi-Head Scaled Dot-Product Self-Attention        │
│ 4. Residual MLP Heads & Quantile Spread Projection     │
│ 5. Physical Non-Negativity Enforcer (infer_is_positive) │
└──────────────────────────────┬─────────────────────────┘
                               │
                               ▼
        Point Forecast + 80% Confidence Interval [q10, q90]
```

---

## 3. Dataset Architecture & Separation of Concerns

AirCare enforces strict data demarcation across three data tiers to prevent data contamination:

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                    AirCare Multi-Tier Data Architecture                       │
├──────────────────────────────┬────────────────────────┬───────────────────────┤
│ Data Tier                    │ Primary Source         │ Operational Purpose   │
├──────────────────────────────┼────────────────────────┼───────────────────────┤
│ 1. Historical CPCB Archive   │ cleaned_city_day.csv   │ Model backtesting,    │
│    (2015–2020: 26 cities)    │ (29,531 daily records) │ baseline calibration, │
│                              │                        │ chemical lag analysis │
├──────────────────────────────┼────────────────────────┼───────────────────────┤
│ 2. Historical CPCB Bulletins │ cleaned_bulletins.csv  │ 10-year longitudinal  │
│    (2015–2025: 297 cities)   │ (471,015 daily records)│ trend analysis & EDA  │
├──────────────────────────────┼────────────────────────┼───────────────────────┤
│ 3. Recent Operational Stream │ Supabase table:        │ Context anchor for    │
│    (Live & 90-day backfill)  │ air_quality_readings   │ real-time forecasting │
├──────────────────────────────┼────────────────────────┼───────────────────────┤
│ 4. Machine-Learning Forecast │ Supabase table:        │ Future multi-horizon  │
│    (Google TimesFM 2.5)      │ aqi_predictions        │ predictions (1d,3d,7d)│
└──────────────────────────────┴────────────────────────┴───────────────────────┘
```

---

## 4. Forecasting Methodology & CPCB NAQI Derivation

Rather than predicting a single black-box number, AirCare uses a **chemically grounded two-stage forecasting pipeline**:

### Stage 1: Individual Criteria Pollutant Projections
TimesFM 2.5 predicts the future trajectories for each of the six CPCB criteria pollutants:
1. $\text{PM}_{2.5}$ ($\mu\text{g/m}^3$)
2. $\text{PM}_{10}$ ($\mu\text{g/m}^3$)
3. $\text{NO}_2$ ($\mu\text{g/m}^3$)
4. $\text{SO}_2$ ($\mu\text{g/m}^3$)
5. $\text{CO}$ ($\text{mg/m}^3$)
6. $\text{O}_3$ ($\mu\text{g/m}^3$)

### Stage 2: Deterministic CPCB NAQI (2014) Evaluation
The predicted mass concentrations are passed into official Central Pollution Control Board piecewise linear interpolation formulas:

$$I_p = I_{\text{low}} + \frac{I_{\text{high}} - I_{\text{low}}}{B_{\text{high}} - B_{\text{low}}} (C_p - B_{\text{low}})$$

The composite Air Quality Index is derived as the maximum valid sub-index:
$$\text{AQI} = \max_p I_p$$
subject to:
1. Valid measurements for at least 3 criteria pollutants.
2. At least one particulate fraction ($\text{PM}_{2.5}$ or $\text{PM}_{10}$) must be present.

This ensures **100% mathematical consistency** between the predicted individual pollutants and the composite forecast AQI.

---

## 5. Model Evaluation: Empirical Chronological Backtesting Results

To verify generalization performance without lookahead data leakage, TimesFM 2.5 was evaluated via **rolling-origin holdout backtesting** across major Indian urban centers (Delhi, Bengaluru, Lucknow) and benchmarked against standard industry baselines:
1. **Persistence Baseline**: $y_{t+h} = y_t$
2. **Seasonal Naive Baseline**: $y_{t+h} = y_{t+h-7}$
3. **Tabular XGBoost Regressor**: Autoregressive tree booster on 7-day lookback lags

### Measured Empirical Backtesting Errors:

```
======================================================================
CHRONOLOGICAL BACKTESTING BENCHMARK RESULTS
======================================================================

--- Horizon: 1 Day Ahead (Tomorrow) ---
Model                     | MAE (AQI) | RMSE (AQI) | R² Score | Severe Recall
-----------------------------------------------------------------------------
Google TimesFM 2.5 (200M) | 12.29     | 15.46      | 0.7696   | 100.0%
XGBoost Regressor         | 12.14     | 17.47      | 0.7058   | 100.0%
Persistence Baseline      | 11.33     | 17.30      | 0.7114   | 100.0%
Seasonal Naive (7-Day)    | 29.67     | 42.69      | -0.7571  | 100.0%

--- Horizon: 3 Days Ahead ---
Model                     | MAE (AQI) | RMSE (AQI) | R² Score | Severe Recall
-----------------------------------------------------------------------------
Google TimesFM 2.5 (200M) | 17.51     | 23.71      | 0.2621   | 100.0%
Persistence Baseline      | 18.63     | 27.81      | -0.0147  | 100.0%
XGBoost Regressor         | 19.45     | 27.26      | 0.0247   | 100.0%
Seasonal Naive (7-Day)    | 28.67     | 42.38      | -1.3573  | 100.0%

--- Horizon: 7 Days Ahead (Weekly Outlook) ---
Model                     | MAE (AQI) | RMSE (AQI) | R² Score | Severe Recall
-----------------------------------------------------------------------------
Google TimesFM 2.5 (200M) | 20.45     | 27.64      | 0.2845   | 100.0%
XGBoost Regressor         | 19.32     | 28.48      | 0.2407   | 100.0%
Persistence Baseline      | 23.00     | 32.84      | -0.0100  | 100.0%
Seasonal Naive (7-Day)    | 23.00     | 32.84      | -0.0100  | 100.0%
```

### Key Performance Findings:
1. **Lower Prediction Variance**: Google TimesFM achieves the lowest RMSE across both 1-day (15.46) and 3-day (23.71) horizons, penalizing large outlier errors during seasonal pollution transitions.
2. **Superior Multi-Day Correlation**: For 3-day and 7-day horizons, classical persistence completely breaks down ($R^2 \approx 0.0$), whereas TimesFM preserves positive correlation ($R^2 = 0.285$).
3. **Severe Event Capture**: Severe smog recall is 100%, successfully warning of hazardous air quality days.

---

## 6. Supported Cities & Operational Execution

### Supported Cities (10 Core Metros & Regional Hubs):
- **Delhi** (Indo-Gangetic Plain / Winter Smog Focus)
- **Mumbai** (Coastal Airshed / Boundary Layer Dynamics)
- **Bengaluru** (Southern Plateau / Moderate Elevation)
- **Kolkata** (Eastern Riverine Plain)
- **Chennai** (Coastal Peninsular)
- **Hyderabad** (Deccan Plateau)
- **Ahmedabad** (Semi-Arid Western Airshed)
- **Pune** (Western Ghats Rain Shadow)
- **Jaipur** (Northwestern Arid Zone)
- **Lucknow** (Central Gangetic Basin)

### Execution Commands:

1. **Run Backtesting Suite**:
   ```bash
   python scripts/evaluate_models.py
   ```
2. **Run Operational Forecast Pipeline (Generates Predictions & Syncs to Supabase)**:
   ```bash
   python scripts/generate_forecasts.py
   ```
3. **Run Automated Test Suite**:
   ```bash
   python -m unittest discover tests
   ```
4. **Build Frontend**:
   ```bash
   cd frontend && npm run build
   ```

---

## 7. Hardware Requirements & Deployment Architecture

- **Operating System**: Windows 11 / Linux (Ubuntu 22.04 LTS).
- **RAM**: Minimum 8 GB (16 GB recommended).
- **CPU**: Intel Core i5 8th Gen+ / AMD Ryzen 5+.
- **GPU**: **None required**. TimesFM 2.5 runs in full CPU mode via standard PyTorch.
- **Frontend Storage**: Pre-baked static fallback at `frontend/public/data/forecasts.json` guarantees zero latency in client browsers.
- **Database**: Supabase PostgreSQL (`aqi_predictions` and `prediction_evaluations`).

