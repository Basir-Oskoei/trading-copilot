import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.models.market_data import MarketData


TIMEFRAME_MAP = {
    "1m": ("1m", 7),
    "5m": ("5m", 60),
    "15m": ("15m", 60),
    "30m": ("30m", 60),
    "1h": ("1h", 730),
    "4h": ("4h", 730),
    "1d": ("1d", 1825),
    "1w": ("1wk", 1825),
}


def fetch_candles(symbol: str, timeframe: str, limit: int = 200) -> List[Dict]:
    if timeframe not in TIMEFRAME_MAP:
        raise ValueError(f"Unsupported timeframe: {timeframe}. Use one of {list(TIMEFRAME_MAP.keys())}")

    yf_interval, max_days = TIMEFRAME_MAP[timeframe]
    end = datetime.utcnow()
    start = end - timedelta(days=min(max_days, 365))

    ticker = yf.Ticker(symbol)
    df = ticker.history(start=start, end=end, interval=yf_interval)

    if df.empty:
        return []

    df = df.tail(limit)
    df.index = pd.to_datetime(df.index)

    candles = []
    for ts, row in df.iterrows():
        ts_naive = ts.to_pydatetime()
        if ts_naive.tzinfo is not None:
            ts_naive = ts_naive.replace(tzinfo=None)
        candles.append({
            "timestamp": ts_naive,
            "open": float(row["Open"]),
            "high": float(row["High"]),
            "low": float(row["Low"]),
            "close": float(row["Close"]),
            "volume": int(row["Volume"]) if not pd.isna(row["Volume"]) else 0,
        })

    return candles


def get_candles_with_cache(
    symbol: str,
    timeframe: str,
    db: Session,
    limit: int = 200,
    force_refresh: bool = False,
) -> List[Dict]:
    if not force_refresh:
        cached = (
            db.query(MarketData)
            .filter(
                MarketData.symbol == symbol.upper(),
                MarketData.timeframe == timeframe,
            )
            .order_by(MarketData.timestamp.desc())
            .limit(limit)
            .all()
        )
        if len(cached) >= min(limit, 50):
            return [
                {
                    "timestamp": c.timestamp.isoformat(),
                    "open": c.open,
                    "high": c.high,
                    "low": c.low,
                    "close": c.close,
                    "volume": c.volume,
                }
                for c in reversed(cached)
            ]

    candles = fetch_candles(symbol.upper(), timeframe, limit)

    for c in candles:
        existing = (
            db.query(MarketData)
            .filter(
                MarketData.symbol == symbol.upper(),
                MarketData.timeframe == timeframe,
                MarketData.timestamp == c["timestamp"],
            )
            .first()
        )
        if not existing:
            db.add(
                MarketData(
                    symbol=symbol.upper(),
                    timeframe=timeframe,
                    open=c["open"],
                    high=c["high"],
                    low=c["low"],
                    close=c["close"],
                    volume=c["volume"],
                    timestamp=c["timestamp"],
                )
            )

    db.commit()

    return [
        {
            "timestamp": c["timestamp"].isoformat() if isinstance(c["timestamp"], datetime) else c["timestamp"],
            "open": c["open"],
            "high": c["high"],
            "low": c["low"],
            "close": c["close"],
            "volume": c["volume"],
        }
        for c in candles
    ]


def get_current_price(symbol: str) -> Optional[float]:
    try:
        ticker = yf.Ticker(symbol.upper())
        data = ticker.history(period="1d", interval="1m")
        if not data.empty:
            return float(data["Close"].iloc[-1])
        return None
    except Exception:
        return None