from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.trade import Trade
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

router = APIRouter()

class TradeCreate(BaseModel):
    symbol: str
    direction: str
    entry_price: float
    stop_loss: float
    take_profit: float
    quantity: float = 1.0
    notes: Optional[str] = None
    status: str = "OPEN"
    entry_time: Optional[str] = None

@router.get("")
async def get_trades(db: Session = Depends(get_db)):
    trades = db.query(Trade).order_by(Trade.created_at.desc()).limit(100).all()
    return {
        "success": True,
        "count": len(trades),
        "trades": [
            {
                "id": t.id,
                "symbol": t.symbol,
                "direction": t.direction,
                "entry_price": t.entry_price,
                "exit_price": t.exit_price,
                "stop_loss": t.stop_loss,
                "take_profit": t.take_profit,
                "quantity": t.quantity,
                "profit_loss": t.profit_loss,
                "status": t.status,
                "notes": t.notes,
                "entry_time": t.entry_time.isoformat() if t.entry_time else None,
                "exit_time": t.exit_time.isoformat() if t.exit_time else None,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in trades
        ],
    }

@router.post("")
async def create_trade(trade: TradeCreate, db: Session = Depends(get_db)):
    new_trade = Trade(
        id=str(uuid.uuid4()),
        symbol=trade.symbol.upper(),
        direction=trade.direction,
        entry_price=trade.entry_price,
        stop_loss=trade.stop_loss,
        take_profit=trade.take_profit,
        quantity=trade.quantity,
        notes=trade.notes,
        status=trade.status,
        entry_time=datetime.fromisoformat(trade.entry_time.replace('Z','')) if trade.entry_time else datetime.utcnow(),
        created_at=datetime.utcnow(),
    )
    db.add(new_trade)
    db.commit()
    return {"success": True, "data": {"id": new_trade.id}}

@router.get("/health")
async def trades_health():
    return {"status": "trades router ok"}