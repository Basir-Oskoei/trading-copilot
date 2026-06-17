import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, BigInteger, UniqueConstraint
from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class MarketData(Base):
    __tablename__ = "market_data"

    id = Column(String, primary_key=True, default=generate_uuid)
    symbol = Column(String(20), nullable=False, index=True)
    timeframe = Column(String(10), nullable=False)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(BigInteger, nullable=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("symbol", "timeframe", "timestamp", name="uq_market_data"),
    )