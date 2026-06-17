from typing import List, Dict, Optional
from app.services.market_structure import detect_swing_highs_and_lows


def detect_order_blocks(candles: List[Dict], lookback: int = 50) -> List[Dict]:
    if len(candles) < 5:
        return []

    candles_with_swings = detect_swing_highs_and_lows(candles)
    subset = candles_with_swings[-lookback:] if len(candles_with_swings) > lookback else candles_with_swings
    order_blocks = []

    for i in range(2, len(subset) - 1):
        candle = subset[i]

        # Bearish Order Block:
        # A bullish move (up candles) before a swing high is swept and a bearish BOS occurs
        if candle.get("is_swing_high"):
            # Look back for the move that caused this high
            j = i - 1
            ob_candles = []
            while j >= 0 and float(subset[j]["close"]) > float(subset[j]["open"]):
                ob_candles.append(subset[j])
                j -= 1

            if ob_candles:
                ob_candle = ob_candles[-1]  # Last bullish candle before the swing high
                order_blocks.append({
                    "type": "OB_BEARISH",
                    "top": round(float(ob_candle["high"]), 4),
                    "bottom": round(float(ob_candle["open"]), 4),
                    "midpoint": round((float(ob_candle["high"]) + float(ob_candle["open"])) / 2, 4),
                    "timestamp": ob_candle["timestamp"],
                    "swing_timestamp": candle["timestamp"],
                    "candle_index": j + 1,
                    "is_valid": True,
                })

        # Bullish Order Block:
        # A bearish move (down candles) before a swing low is swept and a bullish BOS occurs
        if candle.get("is_swing_low"):
            j = i - 1
            ob_candles = []
            while j >= 0 and float(subset[j]["close"]) < float(subset[j]["open"]):
                ob_candles.append(subset[j])
                j -= 1

            if ob_candles:
                ob_candle = ob_candles[-1]  # Last bearish candle before the swing low
                order_blocks.append({
                    "type": "OB_BULLISH",
                    "top": round(float(ob_candle["open"]), 4),
                    "bottom": round(float(ob_candle["low"]), 4),
                    "midpoint": round((float(ob_candle["open"]) + float(ob_candle["low"])) / 2, 4),
                    "timestamp": ob_candle["timestamp"],
                    "swing_timestamp": candle["timestamp"],
                    "candle_index": j + 1,
                    "is_valid": True,
                })

    return order_blocks


def validate_order_blocks(order_blocks: List[Dict], candles: List[Dict]) -> List[Dict]:
    validated = []
    for ob in order_blocks:
        ob = dict(ob)
        idx = ob["candle_index"]
        subsequent = candles[idx + 1:] if idx + 1 < len(candles) else []

        for future_candle in subsequent:
            close = float(future_candle["close"])
            if ob["type"] == "OB_BULLISH" and close < ob["bottom"]:
                ob["is_valid"] = False
                ob["invalidated_at"] = future_candle["timestamp"]
                break
            elif ob["type"] == "OB_BEARISH" and close > ob["top"]:
                ob["is_valid"] = False
                ob["invalidated_at"] = future_candle["timestamp"]
                break

        validated.append(ob)
    return validated


def get_active_order_blocks(candles: List[Dict], lookback: int = 50) -> List[Dict]:
    obs = detect_order_blocks(candles, lookback)
    obs = validate_order_blocks(obs, candles)
    return [ob for ob in obs if ob["is_valid"]]