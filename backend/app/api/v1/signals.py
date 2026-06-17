from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.market_data import get_candles_with_cache
from app.services.signal_engine import generate_signal
from app.models.signal import Signal
import uuid
from datetime import datetime

router = APIRouter()


@router.get("/generate")
async def generate_trading_signal(
    symbol: str = Query(..., description="Trading symbol e.g. AAPL"),
    timeframe: str = Query("1d", description="Timeframe"),
    save: bool = Query(False, description="Save signal to database"),
    db: Session = Depends(get_db),
):
    try:
        candles = get_candles_with_cache(
            symbol=symbol,
            timeframe=timeframe,
            db=db,
            limit=200,
        )
        if len(candles) < 30:
            raise HTTPException(status_code=400, detail="Not enough candle data")

        signal_data = generate_signal(candles)

        if save and signal_data["direction"] != "NO_TRADE":
            signal_record = Signal(
                id=str(uuid.uuid4()),
                symbol=symbol.upper(),
                timeframe=timeframe,
                direction=signal_data["direction"],
                signal_type=signal_data["signal_type"],
                bias=signal_data["market_structure"]["trend"] if signal_data["market_structure"] else None,
                entry_price=signal_data["entry_price"],
                stop_loss=signal_data["stop_loss"],
                take_profit_1=signal_data["take_profit_1"],
                take_profit_2=signal_data["take_profit_2"],
                take_profit_3=signal_data["take_profit_3"],
                risk_reward_ratio=signal_data["risk_reward_ratio"],
                confidence_score=signal_data["confidence_score"],
                confluences=signal_data["confluences"],
                reasoning=signal_data["reasoning"],
                created_at=datetime.utcnow(),
            )
            db.add(signal_record)
            db.commit()
            signal_data["saved_id"] = signal_record.id

        return {
            "success": True,
            "symbol": symbol.upper(),
            "timeframe": timeframe,
            "signal": signal_data,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Signal generation failed: {str(e)}")


@router.get("/history")
async def get_signal_history(
    symbol: str = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Signal)
    if symbol:
        query = query.filter(Signal.symbol == symbol.upper())
    signals = query.order_by(Signal.created_at.desc()).limit(limit).all()

    return {
        "success": True,
        "count": len(signals),
        "signals": [
            {
                "id": s.id,
                "symbol": s.symbol,
                "timeframe": s.timeframe,
                "direction": s.direction,
                "confidence_score": s.confidence_score,
                "entry_price": s.entry_price,
                "stop_loss": s.stop_loss,
                "take_profit_1": s.take_profit_1,
                "risk_reward_ratio": s.risk_reward_ratio,
                "confluences": s.confluences,
                "reasoning": s.reasoning,
                "outcome": s.outcome,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in signals
        ],
    }


@router.get("/health")
async def signals_health():
    return {"status": "signals router ok"}