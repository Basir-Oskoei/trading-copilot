from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from app.services.mtf_analysis import analyze_mtf
from app.services.backtester import run_backtest
from app.services.session_scanner import run_session_scan, get_current_session
from app.config import settings

router = APIRouter()


@router.get("/mtf/{symbol}")
async def get_mtf_analysis(
    symbol: str,
):
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(status_code=400, detail="Anthropic API key not configured")
    try:
        result = analyze_mtf(symbol.upper())
        return {"success": True, "symbol": symbol.upper(), "analysis": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MTF analysis failed: {str(e)}")


@router.get("/backtest/{symbol}")
async def get_backtest(
    symbol: str,
    timeframe: str = Query("1d"),
):
    try:
        result = run_backtest(symbol.upper(), timeframe)
        return {"success": True, "symbol": symbol.upper(), "backtest": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backtest failed: {str(e)}")


@router.get("/session-scan")
async def get_session_scan(
    session: str = Query(None, description="london, new_york, asian, or auto"),
    timeframe: str = Query("1h"),
    include_forex: bool = Query(True),
    include_futures: bool = Query(True),
    include_stocks: bool = Query(True),
):
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(status_code=400, detail="Anthropic API key not configured")
    try:
        actual_session = session if session and session != "auto" else None
        result = run_session_scan(actual_session, timeframe, include_forex, include_futures, include_stocks)
        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Session scan failed: {str(e)}")


@router.get("/current-session")
async def get_current_session_info():
    session = get_current_session()
    sessions_map = {
        "london": "London Open (8am-12pm UTC) — Best for EUR, GBP pairs",
        "new_york": "New York Open (1pm-5pm UTC) — Best for stocks and USD pairs",
        "asian": "Asian Session (12am-4am UTC) — Best for JPY pairs and Gold",
        "off_hours": "Off Hours — Lower volume, wider spreads",
    }
    return {
        "session": session,
        "description": sessions_map.get(session, "Unknown"),
    }


@router.get("/health")
async def pro_health():
    return {"status": "pro router ok"}
