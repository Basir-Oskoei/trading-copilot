from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.market_data import get_candles_with_cache
from app.services.fair_value_gap import get_active_fvgs
from app.services.order_block import get_active_order_blocks
from app.services.market_structure import analyze_market_structure
from app.models.analysis_session import AnalysisSession
from app.config import settings
import uuid
import os
import aiofiles
from datetime import datetime

router = APIRouter()


@router.post("/image")
async def analyze_chart_image(
    file: UploadFile = File(...),
    symbol: str = Query(None),
    timeframe: str = Query(None),
    db: Session = Depends(get_db),
):
    if not settings.ANTHROPIC_API_KEY or settings.ANTHROPIC_API_KEY == "your_anthropic_api_key_here":
        raise HTTPException(status_code=400, detail="Anthropic API key not configured. Please add it in Settings.")

    allowed = {".jpg", ".jpeg", ".png", ".webp"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, and WebP images are supported.")

    os.makedirs("uploads", exist_ok=True)
    file_id = str(uuid.uuid4())
    file_path = f"uploads/{file_id}{ext}"

    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    try:
        from app.services.chart_analyzer import analyze_chart_image
        ai_result = analyze_chart_image(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

    session = AnalysisSession(
        id=file_id,
        image_path=file_path,
        symbol=symbol,
        timeframe=timeframe,
        ai_response=ai_result,
        created_at=datetime.utcnow(),
    )
    db.add(session)
    db.commit()

    return {
        "success": True,
        "session_id": file_id,
        "symbol": symbol,
        "timeframe": timeframe,
        "image_path": f"/uploads/{file_id}{ext}",
        "analysis": ai_result,
    }


@router.get("/sessions")
async def get_analysis_sessions(limit: int = Query(20), db: Session = Depends(get_db)):
    sessions = db.query(AnalysisSession).order_by(AnalysisSession.created_at.desc()).limit(limit).all()
    return {
        "success": True,
        "count": len(sessions),
        "sessions": [
            {
                "id": s.id,
                "symbol": s.symbol,
                "timeframe": s.timeframe,
                "image_path": s.image_path,
                "ai_response": s.ai_response,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in sessions
        ],
    }


@router.get("/fvg")
async def get_fair_value_gaps(
    symbol: str = Query(...),
    timeframe: str = Query("1h"),
    min_gap_percent: float = Query(0.05),
    db: Session = Depends(get_db),
):
    try:
        candles = get_candles_with_cache(symbol=symbol, timeframe=timeframe, db=db, limit=200)
        if len(candles) < 10:
            raise HTTPException(status_code=400, detail="Not enough candles")
        fvgs = get_active_fvgs(candles, min_gap_percent)
        return {"success": True, "symbol": symbol.upper(), "timeframe": timeframe, "active_fvg_count": len(fvgs), "fvgs": fvgs}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/order-blocks")
async def get_order_blocks(
    symbol: str = Query(...),
    timeframe: str = Query("1h"),
    lookback: int = Query(50, ge=10, le=200),
    db: Session = Depends(get_db),
):
    try:
        candles = get_candles_with_cache(symbol=symbol, timeframe=timeframe, db=db, limit=200)
        if len(candles) < 10:
            raise HTTPException(status_code=400, detail="Not enough candles")
        obs = get_active_order_blocks(candles, lookback)
        return {"success": True, "symbol": symbol.upper(), "timeframe": timeframe, "active_ob_count": len(obs), "order_blocks": obs}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/full")
async def get_full_analysis(
    symbol: str = Query(...),
    timeframe: str = Query("1h"),
    db: Session = Depends(get_db),
):
    try:
        candles = get_candles_with_cache(symbol=symbol, timeframe=timeframe, db=db, limit=200)
        if len(candles) < 20:
            raise HTTPException(status_code=400, detail="Not enough candles")
        structure = analyze_market_structure(candles)
        fvgs = get_active_fvgs(candles)
        obs = get_active_order_blocks(candles)
        current_price = float(candles[-1]["close"])
        return {
            "success": True,
            "symbol": symbol.upper(),
            "timeframe": timeframe,
            "current_price": current_price,
            "market_structure": structure,
            "active_fvgs": fvgs,
            "active_order_blocks": obs,
            "summary": {
                "trend": structure["trend"],
                "bullish_fvgs": len([f for f in fvgs if f["type"] == "FVG_BULLISH"]),
                "bearish_fvgs": len([f for f in fvgs if f["type"] == "FVG_BEARISH"]),
                "bullish_obs": len([o for o in obs if o["type"] == "OB_BULLISH"]),
                "bearish_obs": len([o for o in obs if o["type"] == "OB_BEARISH"]),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def analysis_health():
    return {"status": "analysis router ok"}
