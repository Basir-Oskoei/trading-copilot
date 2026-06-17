from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import settings
from app.database import create_tables
from app.api.v1 import analysis, signals, trades, backtest, market_data, app_settings, scanner, pro

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Trading Copilot and Market Analysis System",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["analysis"])
app.include_router(signals.router, prefix="/api/v1/signals", tags=["signals"])
app.include_router(trades.router, prefix="/api/v1/trades", tags=["trades"])
app.include_router(backtest.router, prefix="/api/v1/backtest", tags=["backtest"])
app.include_router(market_data.router, prefix="/api/v1/market", tags=["market"])
app.include_router(app_settings.router, prefix="/api/v1/settings", tags=["settings"])
app.include_router(scanner.router, prefix="/api/v1/scanner", tags=["scanner"])
app.include_router(pro.router, prefix="/api/v1/pro", tags=["pro"])


@app.on_event("startup")
async def startup_event():
    create_tables()
    print("Trading Copilot API started")


@app.get("/health")
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}