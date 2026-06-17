from fastapi import APIRouter, HTTPException, Query
from typing import List
from app.services.scanner import scan_symbols_with_claude
from app.config import settings

router = APIRouter()

DEFAULT_SYMBOLS = [
    "AAPL", "MSFT", "NVDA", "TSLA", "AMZN",
    "SPY", "QQQ", "META", "GOOGL", "AMD",
]

@router.get("/scan")
async def run_scan(
    symbols: str = Query(None, description="Comma-separated symbols e.g. AAPL,TSLA,NVDA"),
    timeframe: str = Query("1d", description="Timeframe: 1d, 4h, 1h, 15m"),
):
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(status_code=400, detail="Anthropic API key not configured")

    symbol_list = [s.strip().upper() for s in symbols.split(",")] if symbols else DEFAULT_SYMBOLS

    if len(symbol_list) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 symbols per scan")

    try:
        result = scan_symbols_with_claude(symbol_list, timeframe)
        return {"success": True, "timeframe": timeframe, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")

@router.get("/health")
async def scanner_health():
    return {"status": "scanner router ok"}
