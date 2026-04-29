# Model Documentation — XGBoost Regressor

## Why XGBoost?
- Handles tabular time-series data with technical indicators natively
- Faster than ARIMA (no walk-forward retraining) and LSTM (no GPU needed)
- Built-in feature importance — shows which indicators drive predictions
- No stationarity requirement unlike ARIMA

---

## Problem Framing
| Item | Detail |
|---|---|
| Task | Supervised Regression |
| Target | Next day's Closing Price (1-step ahead) |
| Stocks | TCS, Reliance, Infosys, HDFC Bank, ICICI Bank |
| Data | 5 years daily OHLCV |

---

## Features Used (17 total)
| Category | Features |
|---|---|
| Lag | Close price 1, 2, 3, 5, 10 days ago |
| Trend | SMA 20/50, EMA 20/50 |
| Volatility | Bollinger Bands (Upper/Lower), Rolling Std |
| Price Action | Daily Return, High-Low Range, Open-Close Gap |
| Volume | Raw Volume, Volume MA 10 |

---

## Train-Test Split
- **80% train / 20% test — time ordered, no shuffling**
- Shuffling avoided to prevent data leakage

---

## Key Hyperparameters
| Parameter | Value |
|---|---|
| n_estimators | 500 |
| learning_rate | 0.05 |
| max_depth | 5 |
| subsample | 0.8 |

---

## Evaluation Metrics
| Metric | Formula | Interpretation |
|---|---|---|
| RMSE | √(Σ(actual-pred)²/n) | Penalizes large errors — in ₹ |
| MAE | Σ\|actual-pred\|/n | Average error — in ₹ |
| MAPE | Σ\|actual-pred\|/actual × 100 | Error as % — comparable across stocks |

## Results
| Symbol | RMSE (₹) | MAE (₹) | MAPE (%) |
|---|---|---|---|
| TCS.NS | 114.38 | 70.30 | 2.62% |
| RELIANCE.NS | 23.63 | 18.82 | 1.31% |
| INFY.NS | 27.47 | 20.20 | 1.38% |
| HDFCBANK.NS | 32.21 | 26.41 | 2.74% |
| ICICIBANK.NS | 34.27 | 27.28 | 1.99% |

> Train: 949 rows | Test: 238 rows per stock (80/20 split)

---

## Limitations
- Reliable for **1-day ahead only** — multi-day chaining causes flat predictions
- Does not factor in news, earnings, or macroeconomic events
- Trained on historical patterns — cannot predict black swan events
