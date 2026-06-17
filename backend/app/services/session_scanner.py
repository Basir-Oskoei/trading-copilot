from datetime import datetime, timezone
from typing import List, Dict
from app.services.scanner import scan_symbols_with_claude


SESSIONS = {
    "london": {"hour": 8, "minute": 0, "name": "London Open"},
    "new_york": {"hour": 13, "minute": 0, "name": "New York Open"},
    "asian": {"hour": 0, "minute": 0, "name": "Asian Open"},
}

FOREX_PAIRS = ["EURUSD=X", "GBPUSD=X", "USDJPY=X", "AUDUSD=X", "USDCAD=X", "GBPJPY=X"]
FUTURES = ["ES=F", "NQ=F", "GC=F", "CL=F", "YM=F"]
STOCKS = ["AAPL", "MSFT", "NVDA", "TSLA", "SPY", "QQQ", "AMD", "META"]


def get_current_session() -> str:
    now_utc = datetime.now(timezone.utc)
    hour = now_utc.hour

    if 8 <= hour < 12:
        return "london"
    elif 13 <= hour < 17:
        return "new_york"
    elif 0 <= hour < 4:
        return "asian"
    else:
        return "off_hours"


def get_session_symbols(session: str, include_forex: bool = True,
                        include_futures: bool = True, include_stocks: bool = True) -> List[str]:
    symbols = []

    if session == "london":
        # London: best for forex and European stocks
        if include_forex:
            symbols += ["EURUSD=X", "GBPUSD=X", "EURGBP=X", "USDJPY=X", "GBPJPY=X"]
        if include_futures:
            symbols += ["ES=F", "GC=F", "CL=F"]
        if include_stocks:
            symbols += ["SPY", "QQQ"]

    elif session == "new_york":
        # New York: best for stocks and USD pairs
        if include_forex:
            symbols += ["EURUSD=X", "GBPUSD=X", "USDCAD=X", "USDJPY=X"]
        if include_futures:
            symbols += ["ES=F", "NQ=F", "YM=F", "GC=F", "CL=F"]
        if include_stocks:
            symbols += ["AAPL", "MSFT", "NVDA", "TSLA", "AMD", "META", "SPY", "QQQ"]

    elif session == "asian":
        # Asian: best for JPY pairs and gold
        if include_forex:
            symbols += ["USDJPY=X", "AUDUSD=X", "NZDUSD=X", "GBPJPY=X", "EURJPY=X"]
        if include_futures:
            symbols += ["GC=F", "SI=F"]
        if include_stocks:
            symbols += ["SPY", "QQQ"]

    else:
        # Off hours: daily bias check
        if include_forex:
            symbols += ["EURUSD=X", "GBPUSD=X", "USDJPY=X"]
        if include_futures:
            symbols += ["ES=F", "NQ=F", "GC=F"]
        if include_stocks:
            symbols += ["SPY", "QQQ", "AAPL", "NVDA"]

    return list(dict.fromkeys(symbols))  # deduplicate


def run_session_scan(session: str = None, timeframe: str = "1h",
                     include_forex: bool = True, include_futures: bool = True,
                     include_stocks: bool = True) -> Dict:
    if session is None:
        session = get_current_session()

    symbols = get_session_symbols(session, include_forex, include_futures, include_stocks)
    session_info = SESSIONS.get(session, {"name": "Off Hours"})

    now_utc = datetime.now(timezone.utc)

    result = scan_symbols_with_claude(symbols, timeframe)
    result["session"] = session
    result["session_name"] = session_info.get("name", "Off Hours")
    result["scan_time_utc"] = now_utc.isoformat()
    result["symbols_scanned"] = symbols

    return result
