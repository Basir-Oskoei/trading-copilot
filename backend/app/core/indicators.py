import pandas as pd
import numpy as np
from typing import List, Dict, Optional


def candles_to_df(candles: List[Dict]) -> pd.DataFrame:
    df = pd.DataFrame(candles)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values("timestamp").reset_index(drop=True)
    for col in ["open", "high", "low", "close"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df["volume"] = pd.to_numeric(df["volume"], errors="coerce").fillna(0)
    return df


def calculate_ema(df: pd.DataFrame, period: int, column: str = "close") -> pd.Series:
    return df[column].ewm(span=period, adjust=False).mean()


def calculate_vwap(df: pd.DataFrame) -> pd.Series:
    typical_price = (df["high"] + df["low"] + df["close"]) / 3
    cumulative_tp_vol = (typical_price * df["volume"]).cumsum()
    cumulative_vol = df["volume"].cumsum()
    vwap = cumulative_tp_vol / cumulative_vol
    return vwap


def calculate_macd(
    df: pd.DataFrame,
    fast: int = 12,
    slow: int = 26,
    signal: int = 9,
    column: str = "close",
) -> Dict[str, pd.Series]:
    ema_fast = df[column].ewm(span=fast, adjust=False).mean()
    ema_slow = df[column].ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line
    return {
        "macd": macd_line,
        "signal": signal_line,
        "histogram": histogram,
    }


def calculate_atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    high = df["high"]
    low = df["low"]
    close = df["close"]
    prev_close = close.shift(1)
    tr = pd.concat([
        high - low,
        (high - prev_close).abs(),
        (low - prev_close).abs(),
    ], axis=1).max(axis=1)
    return tr.ewm(span=period, adjust=False).mean()


def calculate_rsi(df: pd.DataFrame, period: int = 14, column: str = "close") -> pd.Series:
    delta = df[column].diff()
    gain = delta.clip(lower=0)
    loss = (-delta).clip(lower=0)
    avg_gain = gain.ewm(span=period, adjust=False).mean()
    avg_loss = loss.ewm(span=period, adjust=False).mean()
    rs = avg_gain / avg_loss.replace(0, float("nan"))
    rsi = 100 - (100 / (1 + rs))
    return rsi.fillna(50)


def add_all_indicators(candles: List[Dict]) -> List[Dict]:
    if len(candles) < 30:
        return candles

    df = candles_to_df(candles)

    df["ema_9"] = calculate_ema(df, 9)
    df["ema_20"] = calculate_ema(df, 20)
    df["ema_50"] = calculate_ema(df, 50)
    df["ema_200"] = calculate_ema(df, 200)
    df["vwap"] = calculate_vwap(df)
    df["atr"] = calculate_atr(df, 14)
    df["rsi"] = calculate_rsi(df, 14)

    macd = calculate_macd(df)
    df["macd"] = macd["macd"]
    df["macd_signal"] = macd["signal"]
    df["macd_histogram"] = macd["histogram"]

    result = []
    for _, row in df.iterrows():
        candle = {
            "timestamp": row["timestamp"].isoformat(),
            "open": round(float(row["open"]), 4),
            "high": round(float(row["high"]), 4),
            "low": round(float(row["low"]), 4),
            "close": round(float(row["close"]), 4),
            "volume": int(row["volume"]),
            "ema_9": round(float(row["ema_9"]), 4) if not pd.isna(row["ema_9"]) else None,
            "ema_20": round(float(row["ema_20"]), 4) if not pd.isna(row["ema_20"]) else None,
            "ema_50": round(float(row["ema_50"]), 4) if not pd.isna(row["ema_50"]) else None,
            "ema_200": round(float(row["ema_200"]), 4) if not pd.isna(row["ema_200"]) else None,
            "vwap": round(float(row["vwap"]), 4) if not pd.isna(row["vwap"]) else None,
            "atr": round(float(row["atr"]), 4) if not pd.isna(row["atr"]) else None,
            "rsi": round(float(row["rsi"]), 2) if not pd.isna(row["rsi"]) else None,
            "macd": round(float(row["macd"]), 4) if not pd.isna(row["macd"]) else None,
            "macd_signal": round(float(row["macd_signal"]), 4) if not pd.isna(row["macd_signal"]) else None,
            "macd_histogram": round(float(row["macd_histogram"]), 4) if not pd.isna(row["macd_histogram"]) else None,
        }
        result.append(candle)

    return result