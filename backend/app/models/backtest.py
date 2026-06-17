import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Integer, Float, DateTime, Date, JSON
from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class BacktestResult(Base):
    __tablename__ = "backtest_results"

    id = Column(String, primary_key=True, default=generate_uuid)
    strategy_name = Column(String(100), nullable=True)
    symbol = Column(String(20), nullable=True)
    timeframe = Column(String(10), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    total_trades = Column(Integer, nullable=True)
    winning_trades = Column(Integer, nullable=True)
    losing_trades = Column(Integer, nullable=True)
    win_rate = Column(Float, nullable=True)
    avg_winner = Column(Float, nullable=True)
    avg_loser = Column(Float, nullable=True)
    profit_factor = Column(Float, nullable=True)
    max_drawdown = Column(Float, nullable=True)
    total_return = Column(Float, nullable=True)
    sharpe_ratio = Column(Float, nullable=True)
    parameters = Column(JSON, nullable=True)
    trades_detail = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)