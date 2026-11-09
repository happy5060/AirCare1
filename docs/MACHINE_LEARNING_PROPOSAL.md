# AirCare Platform: Predictive Air Quality Machine Learning Proposal (Roadmap for v2.0)

## 1. Executive Summary & Academic Demarcation

### 1.1. Current AirCare v1.0 Operational Reality
In strict compliance with academic and professional honesty:
> **AirCare v1.0 does NOT contain a proprietary trained Machine Learning model.**
> - **Live Feed**: Computes instantaneous CPCB sub-indices by passing numerical atmospheric reanalysis concentrations (from Open-Meteo / ECMWF CAMS) into the Central Pollution Control Board's official 2014 piecewise linear formulas.
> - **Historical Analytics**: Evaluates genuine arithmetic summaries, monthly aggregations, and category distributions directly from official CPCB daily bulletins (2015–2025, 471,015 records).

### 1.2. Purpose of this Proposal
This document establishes the scientific design, data engineering, model architectures, and validation methodology for **AirCare ML v2.0**, designed to predict **24-hour and 72-hour ahead AQI trajectories** across major Indian urban airsheds. This serves as a portfolio piece showcasing end-to-end data science and applied time-series expertise.

---

## 2. Problem Formulation

Given a multivariate time-series of hourly air pollutants and meteorological covariates up to time $t$:
$$X_{1:t} = \{(\mathbf{p}_\tau, \mathbf{m}_\tau, \mathbf{c}_\tau)\}_{\tau=1}^t$$
where:
- $\mathbf{p}_\tau \in \mathbb{R}^6$: Pollutant concentrations ($\text{PM}_{2.5}, \text{PM}_{10}, \text{NO}_2, \text{SO}_2, \text{CO}, \text{O}_3$)
- $\mathbf{m}_\tau \in \mathbb{R}^7$: Meteorological variables (Temperature, Boundary Layer Height, Wind Speed, Wind Direction, Surface Pressure, Relative Humidity, Solar Radiation)
- $\mathbf{c}_\tau \in \mathbb{R}^k$: Cyclical and calendar encodings

**Objective**: Predict the future sequence of AQI values over a forecasting horizon $H \in \{24, 72\}$ hours:
$$\hat{\mathbf{y}}_{t+1:t+H} = f(X_{1:t}; \boldsymbol{\theta})$$
minimizing empirical forecasting error under non-stationary winter thermal inversions.

---

## 3. Feature Engineering Pipeline

```
Raw Telemetry (CAAQMS + Open-Meteo)
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│              Feature Engineering Layer                  │
├─────────────────────────────────────────────────────────┤
│ 1. Autoregressive Lag Features:                         │
│    p_{t-1}, p_{t-2}, p_{t-3}, p_{t-6}, p_{t-12}, p_{t-24}│
│                                                         │
│ 2. Rolling Window Dynamics:                             │
│    Rolling 6h, 12h, 24h Mean, Min, Max, Std             │
│    Rate of Change: Δ = p_t - p_{t-1}                     │
│                                                         │
│ 3. Meteorological & Dispersion Dynamics:                │
│    Ventilation Coefficient = Wind Speed × BLH           │
│    Wind Direction Vector Decomposition: sin(θ), cos(θ)  │
│    Temperature Inversion Proxy: T_{surface} - T_{925hPa}│
│                                                         │
│ 4. Cyclical Calendar Features:                          │
│    Hour: sin(2π h / 24), cos(2π h / 24)                 │
│    Day of Week, Month of Year                           │
│    Stubble Burning Season Binary Indicator (Oct 15–Nov 20)
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
            Tabular / Sequential Feature Matrix
```

### 3.1. Physical Dispersion Interaction Feature: Ventilation Index
In urban air pollution modeling across the Indo-Gangetic Plain, high emissions alone do not guarantee severe AQI. Ground pollution spikes catastrophically when the **Atmospheric Boundary Layer Height (BLH)** collapses below 100 meters during cold winter nights.

We define the **Ventilation Coefficient ($V_c$)**:
$$V_c = \text{BLH} \times U_{10} \quad (\text{m}^2/\text{s})$$
where:
- $\text{BLH}$ is planetary boundary layer height in meters.
- $U_{10}$ is horizontal wind speed at 10m height in m/s.
When $V_c < 2000 \text{ m}^2/\text{s}$, surface air becomes stagnant, trapping vehicular exhaust and agricultural smoke close to ground level.

---

## 4. Model Architectures & Selection

We propose a multi-tiered modeling hierarchy to benchmark increasing architectural complexity:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Model Architecture Comparison                        │
├──────────────────────┬─────────────────────────┬────────────────────────┤
│ Model Tier           │ Model Family            │ Strengths & Trade-offs │
├──────────────────────┼─────────────────────────┼────────────────────────┤
│ Baseline 1           │ Persistent 24h Rolling  │ Zero-compute benchmark │
│ Baseline 2           │ AutoRegressive (ARIMA)  │ Classical linear TS    │
│ Competitive Baseline │ LightGBM / XGBoost      │ SOTA on tabular lags,  │
│                      │                         │ fast inference (<5ms)  │
│ Deep Sequence        │ Bi-LSTM + Attention     │ Captures non-linear    │
│                      │                         │ diurnal temporal lags  │
│ State-of-the-Art     │ Temporal Fusion Transf. │ Interpretable attention│
│                      │ (TFT)                   │ weights, multi-horizon │
└──────────────────────┴─────────────────────────┴────────────────────────┘
```

### 4.1. Competitive Baseline: LightGBM
Using a multi-output regression or recursive multi-step forecasting strategy with gradient boosted decision trees:
- Hyperparameters: `max_depth: 7`, `num_leaves: 63`, `learning_rate: 0.03`, `colsample_bytree: 0.8`.
- Optimization: Quantile Loss for probabilistic intervals (10th, 50th, 90th percentiles).

### 4.2. Deep Sequence Model: Bidirectional LSTM with Multi-Head Self-Attention
- **Input Dimensions**: $(B, T=72, D=28)$ — 72 historical lookback hours with 28 engineered features.
- **Bi-LSTM Layers**: 2 stacked layers with 128 hidden units and dropout $p = 0.2$.
- **Attention Layer**: Multi-Head Scaled Dot-Product Attention capturing cross-hour dependencies (e.g., peak evening traffic impacting morning rush hours).
- **Dense Output Head**: Linear projection producing continuous AQI predictions for $t+1, \dots, t+24$.

---

## 5. Strict Chronological Validation (Zero Data Leakage)

Time-series forecasting cannot use random k-fold cross-validation, as future records would leak into training past states.

```
CPCB 10-Year Bulletin Archive (2015 – 2025)
┌──────────────────────────────────────────────┬───────────────┬───────────────┐
│            Training Set (8 Years)            │ Valid (1 Yr)  │ Test (1 Yr)   │
│            Jan 2015 – Dec 2022               │     2023      │  2024 – 2025  │
└──────────────────────────────────────────────┴───────────────┴───────────────┘
                                               ▲               ▲
                                               │               │
                            Temporal Split (No Lookahead Leakage)
```

- **Expanding Window Validation (Walk-Forward Analysis)**: Evaluated at 1-month intervals across 2024 to verify stability through monsoon (clean season) and winter inversion (severe season).

---

## 6. Evaluation Metrics

To thoroughly evaluate model performance across both continuous accuracy and public health alert relevance:

1. **Mean Absolute Error (MAE)**:
   $$\text{MAE} = \frac{1}{N} \sum_{i=1}^N |y_i - \hat{y}_i| \quad (\text{Target} < 18 \text{ AQI points})$$
2. **Root Mean Squared Error (RMSE)**: Penalizes severe smog under-predictions heavily:
   $$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^N (y_i - \hat{y}_i)^2}$$
3. **Severe Category Recall (Health Alert Reliability)**:
   $$\text{Recall}_{\text{Severe}} = \frac{\text{True Severe Forecasts}}{\text{Actual Severe Days}} \quad (\text{Target} \ge 88\%)$$
   A model that achieves low MAE by predicting 250 during a 450 AQI crisis fails public health requirements.

---

## 7. Viva & Technical Interview Summary

When asked during project defense:
> *"Does AirCare predict air quality using Machine Learning?"*

**Precise Answer**:
> *"AirCare v1.0 intentionally avoids fake AI demonstrations or hallucinated numbers. It currently computes authentic CPCB National Air Quality Index sub-indices deterministically from high-resolution Open-Meteo atmospheric reanalysis models and audits 10 years of official CPCB bulletins.
> 
> However, our research and architectural proposal (documented in `MACHINE_LEARNING_PROPOSAL.md`) outlines our validated roadmap for v2.0: using LightGBM and Temporal Fusion Transformers on 72-hour lag windows combined with planetary boundary layer height and ventilation coefficients to forecast 24-to-72 hour diurnal trajectories."*
