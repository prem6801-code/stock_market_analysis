import yfinance as yf
import pandas as pd
import os
from datetime import datetime

# ---------------- CONFIG ---------------- #
STOCKS = ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS"]
DATA_DIR = "data/raw"
FILE_NAME = "stock_data.csv"
FILE_PATH = os.path.join(DATA_DIR, FILE_NAME)


# ---------------- FETCH ---------------- #
def fetch_stock_data(symbol: str, period: str = "5y", interval: str = "1d") -> pd.DataFrame:
    """
    Fetch historical stock data for a single symbol
    """
    try:
        print(f"📥 Fetching {symbol}...")
        df = yf.download(symbol, period=period, interval=interval)

        if df.empty:
            print(f"⚠️ No data for {symbol}")
            return None

        df.reset_index(inplace=True)
        df["Symbol"] = symbol

        return df

    except Exception as e:
        print(f"❌ Error fetching {symbol}: {e}")
        return None


def fetch_all_stocks() -> pd.DataFrame:
    """
    Fetch data for all stocks and combine
    """
    all_data = []

    for stock in STOCKS:
        df = fetch_stock_data(stock)
        if df is not None:
            all_data.append(df)

    if not all_data:
        print("❌ No data fetched")
        return None

    final_df = pd.concat(all_data, ignore_index=True)

    # Ensure proper sorting
    final_df.sort_values(by=["Symbol", "Date"], inplace=True)

    return final_df


# ---------------- CLEAN (basic) ---------------- #
def basic_clean(df: pd.DataFrame) -> pd.DataFrame:
    """
    Basic cleaning: remove nulls, ensure types
    """
    df.dropna(inplace=True)

    df["Date"] = pd.to_datetime(df["Date"])

    return df


# ---------------- DEDUP ---------------- #
def remove_duplicates(new_df: pd.DataFrame) -> pd.DataFrame:
    """
    Avoid duplicate entries using Date + Symbol
    """
    if os.path.exists(FILE_PATH):
        existing_df = pd.read_csv(FILE_PATH)
        existing_df["Date"] = pd.to_datetime(existing_df["Date"])

        combined = pd.concat([existing_df, new_df], ignore_index=True)

        combined.drop_duplicates(subset=["Date", "Symbol"], inplace=True)

        combined.sort_values(by=["Symbol", "Date"], inplace=True)

        return combined

    return new_df


# ---------------- SAVE ---------------- #
def save_to_csv(df: pd.DataFrame) -> None:
    """
    Save data to CSV (with deduplication)
    """
    os.makedirs(DATA_DIR, exist_ok=True)

    df = remove_duplicates(df)

    df.to_csv(FILE_PATH, index=False)

    print(f"✅ Data saved to {FILE_PATH}")


# ---------------- RUN PIPELINE ---------------- #
def run_fetch_pipeline():
    """
    Full pipeline: fetch → clean → save
    """
    data = fetch_all_stocks()

    if data is not None:
        data = basic_clean(data)
        save_to_csv(data)
    else:
        print("⚠️ Pipeline skipped (no data)")


# ---------------- ENTRY (optional direct run) ---------------- #
if __name__ == "__main__":
    run_fetch_pipeline()