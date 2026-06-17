import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON
from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class AnalysisSession(Base):
    __tablename__ = "analysis_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    image_path = Column(String(500), nullable=True)
    symbol = Column(String(20), nullable=True)
    timeframe = Column(String(10), nullable=True)
    ai_response = Column(JSON, nullable=True)
    rules_response = Column(JSON, nullable=True)
    combined_signal = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)