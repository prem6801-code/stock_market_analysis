import numpy as np
import pandas as pd
import joblib
import logging
from pathlib import Path
from xgboost import XGBRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error
from constants import STOCKS, FEATURES

MODELS_DIR = Path(__file__).parent.parent / "models"
MODELS_DIR.mkdir(exist_ok=True, parents=True)

logger = logging.getLogger(__name__)


class ModelService:
    def __init__(self, data_service):
        self.data_service = data_service
        self.models: dict = {}
        self.metrics: dict = {}
        self.test_predictions: dict = {}
        self.next_predictions: dict = {}
        self._initialize()

    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy().sort_values("Date")
        for lag in [1, 2, 3, 5, 10]:
            df[f"Lag_{lag}"] = df["Close"].shift(lag)
        df["Volume_MA_10"] = df["Volume"].rolling(10).mean()
        df["Daily_Return"] = df["Close"].pct_change()
        df["High_Low_Range"] = df["High"] - df["Low"]
        df["Open_Close_Gap"] = df["Open"] - df["Close"].shift(1)
        return df.dropna()

    def _get_stock_df(self, symbol: str) -> pd.DataFrame:
        return self.data_service.processed_data[
            self.data_service.processed_data["Symbol"] == symbol
        ]

    def _train_stock(self, symbol: str):
        df = self._engineer_features(self._get_stock_df(symbol))
        X, y = df[FEATURES], df["Close"]

        split = int(len(df) * 0.8)
        X_train, X_test = X.iloc[:split], X.iloc[split:]
        y_train, y_test = y.iloc[:split], y.iloc[split:]

        model = XGBRegressor(
            n_estimators=500,
            learning_rate=0.05,
            max_depth=3,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
        )
        model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)
        self.models[symbol] = model
        joblib.dump(model, MODELS_DIR / f"{symbol.replace('.', '_')}.joblib")

        self._evaluate(symbol, df, split)

    def _evaluate(self, symbol: str, df: pd.DataFrame, split: int):
        X_test = df[FEATURES].iloc[split:]
        y_test = df["Close"].iloc[split:]
        preds = self.models[symbol].predict(X_test)

        rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
        mae = float(mean_absolute_error(y_test, preds))
        mape = float(np.mean(np.abs((y_test.values - preds) / y_test.values)) * 100)

        self.metrics[symbol] = {
            "rmse": round(rmse, 2),
            "mae": round(mae, 2),
            "mape": round(mape, 2),
        }
        test_dates = df["Date"].iloc[split:].tolist()
        self.test_predictions[symbol] = [
            {
                "date": d.strftime("%Y-%m-%d"),
                "actual": round(float(a), 2),
                "predicted": round(float(p), 2),
            }
            for d, a, p in zip(test_dates, y_test, preds)
        ]

    def _predict_next(self, symbol: str):
        if symbol not in self.models:
            return
        df = self._engineer_features(self._get_stock_df(symbol))
        last_features = df[FEATURES].iloc[-1].values.reshape(1, -1)
        pred = float(self.models[symbol].predict(last_features)[0])
        last_close = float(df["Close"].iloc[-1])

        self.next_predictions[symbol] = {
            "symbol": symbol,
            "predicted_price": round(pred, 2),
            "last_close": round(last_close, 2),
            "change": round(pred - last_close, 2),
            "change_pct": round((pred - last_close) / last_close * 100, 2),
            **self.metrics.get(symbol, {}),
        }

    def _initialize(self):
        for symbol in STOCKS:
            model_path = MODELS_DIR / f"{symbol.replace('.', '_')}.joblib"
            try:
                if model_path.exists():
                    self.models[symbol] = joblib.load(model_path)
                    df = self._engineer_features(self._get_stock_df(symbol))
                    split = int(len(df) * 0.8)
                    self._evaluate(symbol, df, split)
                else:
                    logger.info(f"Training model for {symbol}...")
                    self._train_stock(symbol)
                self._predict_next(symbol)
            except Exception as e:
                logger.error(f"Failed to initialize model for {symbol}: {e}")

    def retrain_all(self):
        for symbol in STOCKS:
            logger.info(f"Retraining {symbol}...")
            self._train_stock(symbol)
            self._predict_next(symbol)

    def update_predictions(self):
        for symbol in STOCKS:
            if symbol in self.models:
                try:
                    self._predict_next(symbol)
                except Exception as e:
                    logger.error(f"Prediction update failed for {symbol}: {e}")
