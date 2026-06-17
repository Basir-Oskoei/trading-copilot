import anthropic
import json
from typing import Dict, List
from app.services.market_data import fetch_candles
from app.services.market_structure import analyze_market_structure
from app.services.fair_value_gap import get_active_fvgs
from app.services.order_block import get_active_order_blocks
from app.core.indicators import add_all_indicators
from datetime import datetime


def make_serializable(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {k: make_serializable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [make_serializable(i) for i in obj]
    return obj


def analyze_single_timeframe(symbol: str, timeframe: str) -> Dict:
    try:
        candles = fetch_candles(symbol, timeframe, limit=100)
        if len(candles) < 30:
            return {"error": "Not enough data", "timeframe": timeframe}

        structure = analyze_market_structure(candles)
        fvgs = get_active_fvgs(candles)
        obs = get_active_order_blocks(candles)
        candles_ind = add_all_indicators(candles)
        last = candles_ind[-1]

        # Determine bias from this timeframe
        trend = structure["trend"]
        last_bos = structure.get("last_bos")
        recent_sweeps = structure.get("recent_sweeps", [])

        bias = "NEUTRAL"
        if trend == "UPTREND":
            bias = "BULLISH"
        elif trend == "DOWNTREND":
            bias = "BEARISH"

        # Check EMA alignment
        ema_9 = last.get("ema_9") or 0
        ema_20 = last.get("ema_20") or 0
        ema_50 = last.get("ema_50") or 0
        close = float(last["close"])

        ema_bullish = ema_9 > ema_20 > ema_50 and close > ema_9
        ema_bearish = ema_9 < ema_20 < ema_50 and close < ema_9

        if ema_bullish and bias == "BULLISH":
            bias = "STRONG_BULLISH"
        elif ema_bearish and bias == "BEARISH":
            bias = "STRONG_BEARISH"

        return make_serializable({
            "timeframe": timeframe,
            "trend": trend,
            "bias": bias,
            "current_price": round(float(close), 4),
            "bos_count": structure["bos_count"],
            "sweep_count": structure["sweep_count"],
            "last_bos": last_bos,
            "recent_sweeps": recent_sweeps[-2:] if recent_sweeps else [],
            "recent_swing_high": structure.get("recent_swing_high"),
            "recent_swing_low": structure.get("recent_swing_low"),
            "active_bullish_fvgs": len([f for f in fvgs if f["type"] == "FVG_BULLISH"]),
            "active_bearish_fvgs": len([f for f in fvgs if f["type"] == "FVG_BEARISH"]),
            "nearest_bullish_fvg": next((f for f in fvgs if f["type"] == "FVG_BULLISH"), None),
            "nearest_bearish_fvg": next((f for f in fvgs if f["type"] == "FVG_BEARISH"), None),
            "active_bullish_obs": len([o for o in obs if o["type"] == "OB_BULLISH"]),
            "active_bearish_obs": len([o for o in obs if o["type"] == "OB_BEARISH"]),
            "rsi": last.get("rsi"),
            "macd": last.get("macd"),
            "macd_signal": last.get("macd_signal"),
            "ema_9": last.get("ema_9"),
            "ema_20": last.get("ema_20"),
            "ema_50": last.get("ema_50"),
            "ema_bullish_aligned": ema_bullish,
            "ema_bearish_aligned": ema_bearish,
        })
    except Exception as e:
        return {"error": str(e), "timeframe": timeframe}


def get_mtf_alignment(daily: Dict, h4: Dict, h1: Dict) -> Dict:
    biases = {
        "1d": daily.get("bias", "NEUTRAL"),
        "4h": h4.get("bias", "NEUTRAL"),
        "1h": h1.get("bias", "NEUTRAL"),
    }

    bullish_count = sum(1 for b in biases.values() if "BULLISH" in b)
    bearish_count = sum(1 for b in biases.values() if "BEARISH" in b)

    if bullish_count == 3:
        alignment = "STRONG_BUY"
        confidence_bonus = 30
    elif bullish_count == 2:
        alignment = "BUY"
        confidence_bonus = 15
    elif bearish_count == 3:
        alignment = "STRONG_SELL"
        confidence_bonus = 30
    elif bearish_count == 2:
        alignment = "SELL"
        confidence_bonus = 15
    else:
        alignment = "NO_TRADE"
        confidence_bonus = 0

    return {
        "alignment": alignment,
        "confidence_bonus": confidence_bonus,
        "biases": biases,
        "bullish_count": bullish_count,
        "bearish_count": bearish_count,
        "all_agree": bullish_count == 3 or bearish_count == 3,
    }


def analyze_mtf(symbol: str) -> Dict:
    daily = analyze_single_timeframe(symbol, "1d")
    h4 = analyze_single_timeframe(symbol, "4h")
    h1 = analyze_single_timeframe(symbol, "1h")

    alignment = get_mtf_alignment(daily, h4, h1)

    from app.config import settings
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    prompt = f"""You are an expert SMC trader analyzing {symbol} across 3 timeframes.

DAILY (bias, trend, key levels):
{json.dumps(daily, indent=2)}

4H (bias, trend, key levels):
{json.dumps(h4, indent=2)}

1H (bias, trend, key levels):
{json.dumps(h1, indent=2)}

MTF ALIGNMENT: {alignment["alignment"]} ({alignment["bullish_count"]}/3 bullish, {alignment["bearish_count"]}/3 bearish)

SMC RULES:
- Daily = directional bias only
- 4H = market structure and draw on liquidity
- 1H = entry confirmation (FVG, OB, sweep + BOS)
- Only trade when at least 2/3 timeframes agree
- Entry on 1H after liquidity sweep and BOS confirmed
- Stop loss beyond the sweep high/low
- Target next draw on liquidity

Respond ONLY with this JSON:
{{
  "direction": "BUY" or "SELL" or "NO_TRADE",
  "confidence": 0-100,
  "entry": price or null,
  "stop_loss": price or null,
  "take_profit_1": price or null,
  "take_profit_2": price or null,
  "risk_reward": number or null,
  "confluences": ["list of confluences"],
  "reasoning": "clear explanation referencing all 3 timeframes",
  "daily_bias": "BULLISH/BEARISH/NEUTRAL",
  "h4_structure": "brief description",
  "h1_entry": "brief description of entry setup",
  "warnings": ["any concerns"]
}}"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )

    response_text = message.content[0].text.strip()
    if "```" in response_text:
        start = response_text.find("{")
        end = response_text.rfind("}") + 1
        if start != -1 and end > start:
            response_text = response_text[start:end]

    try:
        signal = json.loads(response_text)
        signal["mtf_alignment"] = alignment
        signal["timeframe_data"] = {
            "daily": daily,
            "h4": h4,
            "h1": h1,
        }
        return signal
    except json.JSONDecodeError:
        return {
            "direction": "NO_TRADE",
            "confidence": 0,
            "reasoning": response_text,
            "mtf_alignment": alignment,
            "error": "Parse error",
        }
