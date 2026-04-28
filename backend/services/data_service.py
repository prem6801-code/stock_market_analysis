import time
import logging
import pandas as pd
import yfinance as yf
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from constants import STOCKS
import requests

logger = logging.getLogger(__name__)

# data/ lives two levels above backend/services/
DATA_DIR = Path(__file__).parent.parent.parent / "data"


class DataService:
    def __init__(self):
        self.stocks_data: pd.DataFrame = pd.DataFrame()
        self.processed_data: pd.DataFrame = pd.DataFrame()
        self.last_updated: Optional[datetime] = None
        self._load_from_disk()
        # self._session = self._build_session()

    def _load_from_disk(self):
        raw_path = DATA_DIR / "stocks_data.csv"
        if not raw_path.exists():
            return

        df = pd.read_csv(raw_path, parse_dates=["Date"])
        df["Date"] = pd.to_datetime(df["Date"], utc=False).dt.tz_localize(None)
        self.stocks_data = df
        self.processed_data = self._compute_indicators(df)
        self.last_updated = datetime.now()

    def _compute_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return df
        parts = []
        for symbol in df["Symbol"].unique():
            s = df[df["Symbol"] == symbol].copy().sort_values("Date")
            s["SMA_20"] = s["Close"].rolling(20).mean()
            s["SMA_50"] = s["Close"].rolling(50).mean()
            s["EMA_20"] = s["Close"].ewm(span=20, adjust=False).mean()
            s["EMA_50"] = s["Close"].ewm(span=50, adjust=False).mean()
            s["Rolling_Std"] = s["Close"].rolling(20).std()
            s["BB_Upper"] = s["SMA_20"] + 2 * s["Rolling_Std"]
            s["BB_Lower"] = s["SMA_20"] - 2 * s["Rolling_Std"]
            parts.append(s)
        return pd.concat(parts).reset_index(drop=True)

    def _fetch_one(self, symbol: str) -> Optional[pd.DataFrame]:
        # session = requests.Session()
        # session.headers.update({
        #     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        #     "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        #     "Accept-Language": "en-US,en;q=0.5",
        # })

        """Fetch 5y daily data for a single symbol using yf.download (mirrors eda.ipynb)."""
        try:
            logger.info(f"Fetching {symbol}...")
            df = yf.download(symbol, period="5y", interval="1d", auto_adjust=True)
            # df = yf.Ticker(symbol).history(period="5y",interval="1d",auto_adjust=True)
            if df.empty:
                logger.warning(f"No data returned for {symbol}")
                return None

            # yfinance >= 0.2.x returns MultiIndex columns when downloading one ticker
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)

            df.reset_index(inplace=True)

            # Intraday intervals use "Datetime" instead of "Date"
            if "Datetime" in df.columns:
                df.rename(columns={"Datetime": "Date"}, inplace=True)

            df["Symbol"] = symbol
            df = df[["Date", "Open", "High", "Low", "Close", "Volume", "Symbol"]]
            df["Date"] = pd.to_datetime(df["Date"]).dt.tz_localize(None)

            logger.info(f"{symbol} → {len(df)} rows fetched")
            return df

        except Exception as e:
            logger.error(f"Error fetching {symbol}: {e}")
            return None

    def fetch_latest(self) -> bool:
        dfs = []
        for symbol in STOCKS:
            df = self._fetch_one(symbol)
            if df is not None:
                dfs.append(df)
            time.sleep(3)  # avoid rate-limiting (matches eda.ipynb)

        if not dfs:
            logger.error(
                "fetch_latest: could not retrieve data for any symbol. "
                "Yahoo Finance may be unreachable. Keeping existing data."
            )
            return False

        raw = pd.concat(dfs, ignore_index=True)
        raw.sort_values(["Symbol", "Date"], inplace=True)
        raw.drop_duplicates(subset=["Symbol", "Date"], inplace=True)
        raw.reset_index(drop=True, inplace=True)
        raw.to_csv(DATA_DIR / "stocks_data.csv", index=False)

        self.stocks_data = raw
        self.processed_data = self._compute_indicators(raw)
        self.last_updated = datetime.now()
        return True

    def get_history(self, symbol: str, days: int = 365) -> List[Dict]:
        cutoff = datetime.now() - timedelta(days=days)
        df = self.processed_data[
            (self.processed_data["Symbol"] == symbol)
            & (self.processed_data["Date"] >= cutoff)
        ].sort_values("Date")

        def _safe(v):
            return round(float(v), 2) if pd.notna(v) else None

        return [
            {
                "date": row["Date"].strftime("%Y-%m-%d"),
                "open": _safe(row["Open"]),
                "high": _safe(row["High"]),
                "low": _safe(row["Low"]),
                "close": _safe(row["Close"]),
                "volume": int(row["Volume"]),
                "sma_20": _safe(row.get("SMA_20")),
                "sma_50": _safe(row.get("SMA_50")),
                "ema_20": _safe(row.get("EMA_20")),
                "ema_50": _safe(row.get("EMA_50")),
                "bb_upper": _safe(row.get("BB_Upper")),
                "bb_lower": _safe(row.get("BB_Lower")),
                "rolling_std": _safe(row.get("Rolling_Std")),
            }
            for _, row in df.iterrows()
        ]

    def get_correlation(self) -> Dict:
        pivot = self.processed_data.pivot_table(
            index="Date", columns="Symbol", values="Close"
        )
        corr = pivot.pct_change().dropna().corr()
        ordered = [s for s in STOCKS if s in corr.columns]
        corr = corr.loc[ordered, ordered]
        return {
            "stocks": list(corr.columns),
            "matrix": [[round(v, 4) for v in row] for row in corr.values.tolist()],
        }

    def get_performance(self) -> List[Dict]:
        result = []
        for symbol in STOCKS:
            df = self.processed_data[
                self.processed_data["Symbol"] == symbol
            ].sort_values("Date")
            if df.empty:
                continue
            first_close = df["Close"].iloc[0]
            last_close = df["Close"].iloc[-1]
            total_return = (last_close - first_close) / first_close * 100
            result.append(
                {
                    "symbol": symbol,
                    "current_price": round(float(last_close), 2),
                    "avg_price": round(float(df["Close"].mean()), 2),
                    "total_return": round(float(total_return), 2),
                    "volatility": round(float(df["Close"].std()), 2),
                    "max_price": round(float(df["Close"].max()), 2),
                    "min_price": round(float(df["Close"].min()), 2),
                }
            )
        print(result)
        return result
