import anthropic
import json
from typing import List, Dict
from datetime import datetime
from app.services.market_data import fetch_candles
from app.services.market_structure import analyze_market_structure
from app.services.fair_value_gap import get_active_fvgs
from app.services.order_block import get_active_order_blocks
from app.core.indicators import add_all_indicators


def make_serializable(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {k: make_serializable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [make_serializable(i) for i in obj]
    return obj


def build_symbol_summary(symbol: str, timeframe: str) -> Dict:
    try:
        candles = fetch_candles(symbol, timeframe, limit=100)
        if len(candles) < 30:
            return {"symbol": symbol, "error": "Not enough data"}

        structure = analyze_market_structure(candles)
        fvgs = get_active_fvgs(candles)
        obs = get_active_order_blocks(candles)
        candles_with_ind = add_all_indicators(candles)
        last = candles_with_ind[-1]

        raw = {
            "symbol": symbol,
            "timeframe": timeframe,
            "current_price": round(float(last["close"]), 4),
            "trend": structure["trend"],
            "bos_count": structure["bos_count"],
            "sweep_count": structure["sweep_count"],
            "last_bos": structure["last_bos"],
            "recent_sweeps": structure["recent_sweeps"],
            "recent_swing_high": structure["recent_swing_high"],
            "recent_swing_low": structure["recent_swing_low"],
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
        }
        return make_serializable(raw)
    except Exception as e:
        return {"symbol": symbol, "error": str(e)}


def scan_symbols_with_claude(symbols: List[str], timeframe: str = "1d") -> Dict:
    summaries = []
    errors = []

    for symbol in symbols:
        result = build_symbol_summary(symbol, timeframe)
        if "error" in result:
            errors.append(result)
        else:
            summaries.append(result)

    if not summaries:
        return {"error": "No valid data for any symbol", "errors": errors}

    data_str = json.dumps(summaries, indent=2)
    n = len(summaries)
    tf = timeframe

    prompt = f"""You are an expert Smart Money Concepts (SMC) trader. Analyze this market data for {n} symbols on the {tf} timeframe and return trading signals.

DATA:
{data_str}

SMC RULES:
1. Only trade in direction of trend (UPTREND=BUY bias, DOWNTREND=SELL bias)
2. Liquidity sweep + BOS confirmation = high probability setup
3. Price near FVG or Order Block = entry zone
4. RSI below 30 = oversold (BUY confluence), above 70 = overbought (SELL confluence)
5. EMA 9 above EMA 20 above EMA 50 = bullish alignment

Respond with ONLY a valid JSON object, no markdown, no explanation, just the JSON:

{{"top_buy":{{"symbol":"SYMBOL","confidence":85,"entry":123.45,"stop_loss":120.00,"take_profit":130.00,"risk_reward":2.5,"reasoning":"why this is best buy","confluences":["UPTREND","BOS_BULLISH"]}},"top_sell":{{"symbol":"SYMBOL","confidence":78,"entry":456.78,"stop_loss":460.00,"take_profit":448.00,"risk_reward":2.8,"reasoning":"why this is best sell","confluences":["DOWNTREND","SWEEP_HIGH"]}},"rankings":[{{"symbol":"SYMBOL","direction":"BUY","confidence":85,"trend":"UPTREND","key_reason":"one sentence","entry":123.45,"stop_loss":120.00,"take_profit":130.00,"risk_reward":2.5}}],"market_overview":"2-3 sentence market summary","avoid":["SYMBOL: reason"]}}

Include ALL {n} symbols in rankings array ordered by confidence descending."""

    from app.config import settings
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=3000,
        messages=[{"role": "user", "content": prompt}],
    )

    response_text = message.content[0].text.strip()

    # Strip markdown code blocks if present
    if "```" in response_text:
        start = response_text.find("{")
        end = response_text.rfind("}") + 1
        if start != -1 and end > start:
            response_text = response_text[start:end]

    try:
        result = json.loads(response_text)
        result["scanned_count"] = len(summaries)
        result["errors"] = errors
        return result
    except json.JSONDecodeError as e:
        return {
            "error": f"Could not parse Claude response: {str(e)}",
            "raw": response_text[:500],
            "scanned_count": 0,
            "errors": errors,
            "rankings": [],
        }
