from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.market_data import get_candles_with_cache, get_current_price
from app.core.indicators import add_all_indicators
from app.services.market_structure import analyze_market_structure, detect_swing_highs_and_lows

router = APIRouter()


@router.get("/candles")
async def get_candles(
    symbol: str = Query(..., description="Trading symbol e.g. AAPL, MSFT, ES=F"),
    timeframe: str = Query("1h", description="Timeframe: 1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w"),
    limit: int = Query(200, ge=10, le=500),
    force_refresh: bool = Query(False),
    include_indicators: bool = Query(False),
    db: Session = Depends(get_db),
):
    try:
        candles = get_candles_with_cache(
            symbol=symbol,
            timeframe=timeframe,
            db=db,
            limit=limit,
            force_refresh=force_refresh,
        )
        if include_indicators and len(candles) >= 30:
            candles = add_all_indicators(candles)
        return {
            "success": True,
            "symbol": symbol.upper(),
            "timeframe": timeframe,
            "count": len(candles),
            "candles": candles,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch market data: {str(e)}")


@router.get("/structure")
async def get_market_structure(
    symbol: str = Query(..., description="Trading symbol"),
    timeframe: str = Query("1h"),
    lookback: int = Query(50, ge=20, le=200),
    db: Session = Depends(get_db),
):
    try:
        candles = get_candles_with_cache(
            symbol=symbol,
            timeframe=timeframe,
            db=db,
            limit=200,
        )
        if len(candles) < 10:
            raise HTTPException(status_code=400, detail="Not enough candles for structure analysis")

        structure = analyze_market_structure(candles, lookback)
        return {
            "success": True,
            "symbol": symbol.upper(),
            "timeframe": timeframe,
            "structure": structure,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Structure analysis failed: {str(e)}")


@router.get("/quote/{symbol}")
async def get_quote(symbol: str):
    price = get_current_price(symbol)
    if price is None:
        raise HTTPException(status_code=404, detail=f"Could not fetch price for {symbol}")
    return {
        "success": True,
        "symbol": symbol.upper(),
        "price": price,
    }


@router.get("/health")
async def market_data_health():
    return {"status": "market data router ok"}