from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    from app.models.signal import Signal
    from app.models.trade import Trade
    from app.models.market_data import MarketData
    from app.models.backtest import BacktestResult
    from app.models.strategy import Strategy
    from app.models.analysis_session import AnalysisSession
    Base.metadata.create_all(bind=engine)