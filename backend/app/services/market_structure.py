from typing import List, Dict, Optional, Tuple


def detect_swing_highs_and_lows(candles: List[Dict]) -> List[Dict]:
    result = []
    for i, candle in enumerate(candles):
        candle = dict(candle)
        candle["is_swing_high"] = False
        candle["is_swing_low"] = False
        result.append(candle)

    for i in range(1, len(result) - 1):
        prev = result[i - 1]
        curr = result[i]
        nxt = result[i + 1]

        if float(curr["high"]) > float(prev["high"]) and float(curr["high"]) > float(nxt["high"]):
            result[i]["is_swing_high"] = True

        if float(curr["low"]) < float(prev["low"]) and float(curr["low"]) < float(nxt["low"]):
            result[i]["is_swing_low"] = True

    return result


def get_recent_swing_high(candles: List[Dict], lookback: int = 50) -> Optional[Dict]:
    subset = candles[-lookback:] if len(candles) > lookback else candles
    for candle in reversed(subset[:-1]):
        if candle.get("is_swing_high"):
            return candle
    return None


def get_recent_swing_low(candles: List[Dict], lookback: int = 50) -> Optional[Dict]:
    subset = candles[-lookback:] if len(candles) > lookback else candles
    for candle in reversed(subset[:-1]):
        if candle.get("is_swing_low"):
            return candle
    return None


def determine_trend(candles: List[Dict], lookback: int = 50) -> str:
    subset = candles[-lookback:] if len(candles) > lookback else candles
    swing_highs = [c for c in subset if c.get("is_swing_high")]
    swing_lows = [c for c in subset if c.get("is_swing_low")]

    if len(swing_highs) < 2 or len(swing_lows) < 2:
        return "CONSOLIDATION"

    last_two_highs = swing_highs[-2:]
    last_two_lows = swing_lows[-2:]

    hh = float(last_two_highs[1]["high"]) > float(last_two_highs[0]["high"])
    hl = float(last_two_lows[1]["low"]) > float(last_two_lows[0]["low"])
    lh = float(last_two_highs[1]["high"]) < float(last_two_highs[0]["high"])
    ll = float(last_two_lows[1]["low"]) < float(last_two_lows[0]["low"])

    if hh and hl:
        return "UPTREND"
    elif lh and ll:
        return "DOWNTREND"
    else:
        return "CONSOLIDATION"


def detect_break_of_structure(candles: List[Dict], lookback: int = 50) -> List[Dict]:
    if len(candles) < 3:
        return []

    bos_events = []
    subset = candles[-lookback:] if len(candles) > lookback else candles

    swing_highs = [c for c in subset if c.get("is_swing_high")]
    swing_lows = [c for c in subset if c.get("is_swing_low")]

    for i in range(1, len(subset)):
        candle = subset[i]

        if swing_highs:
            recent_high = swing_highs[-1]
            recent_high_level = float(recent_high["high"])
            if float(candle["close"]) > recent_high_level:
                bos_events.append({
                    "type": "BOS_BULLISH",
                    "timestamp": candle["timestamp"],
                    "price": float(candle["close"]),
                    "broken_level": recent_high_level,
                    "candle_index": i,
                })
                swing_highs = [c for c in swing_highs if float(c["high"]) > recent_high_level]

        if swing_lows:
            recent_low = swing_lows[-1]
            recent_low_level = float(recent_low["low"])
            if float(candle["close"]) < recent_low_level:
                bos_events.append({
                    "type": "BOS_BEARISH",
                    "timestamp": candle["timestamp"],
                    "price": float(candle["close"]),
                    "broken_level": recent_low_level,
                    "candle_index": i,
                })
                swing_lows = [c for c in swing_lows if float(c["low"]) < recent_low_level]

    return bos_events


def detect_liquidity_sweeps(candles: List[Dict], lookback: int = 50) -> List[Dict]:
    if len(candles) < 3:
        return []

    sweeps = []
    subset = candles[-lookback:] if len(candles) > lookback else candles

    for i in range(2, len(subset)):
        candle = subset[i]
        prev = subset[i - 1]

        swing_highs_before = [c for c in subset[:i] if c.get("is_swing_high")]
        swing_lows_before = [c for c in subset[:i] if c.get("is_swing_low")]

        if swing_highs_before:
            recent_high = swing_highs_before[-1]
            high_level = float(recent_high["high"])
            if float(candle["high"]) > high_level and float(candle["close"]) < high_level:
                sweeps.append({
                    "type": "SWEEP_HIGH",
                    "timestamp": candle["timestamp"],
                    "swept_level": high_level,
                    "wick_high": float(candle["high"]),
                    "close": float(candle["close"]),
                    "candle_index": i,
                })

        if swing_lows_before:
            recent_low = swing_lows_before[-1]
            low_level = float(recent_low["low"])
            if float(candle["low"]) < low_level and float(candle["close"]) > low_level:
                sweeps.append({
                    "type": "SWEEP_LOW",
                    "timestamp": candle["timestamp"],
                    "swept_level": low_level,
                    "wick_low": float(candle["low"]),
                    "close": float(candle["close"]),
                    "candle_index": i,
                })

    return sweeps


def analyze_market_structure(candles: List[Dict], lookback: int = 50) -> Dict:
    candles_with_swings = detect_swing_highs_and_lows(candles)
    trend = determine_trend(candles_with_swings, lookback)
    bos_events = detect_break_of_structure(candles_with_swings, lookback)
    sweeps = detect_liquidity_sweeps(candles_with_swings, lookback)

    recent_high = get_recent_swing_high(candles_with_swings, lookback)
    recent_low = get_recent_swing_low(candles_with_swings, lookback)

    last_bos = bos_events[-1] if bos_events else None

    return {
        "trend": trend,
        "recent_swing_high": {
            "price": float(recent_high["high"]),
            "timestamp": recent_high["timestamp"],
        } if recent_high else None,
        "recent_swing_low": {
            "price": float(recent_low["low"]),
            "timestamp": recent_low["timestamp"],
        } if recent_low else None,
        "last_bos": last_bos,
        "bos_count": len(bos_events),
        "sweep_count": len(sweeps),
        "recent_sweeps": sweeps[-3:] if sweeps else [],
        "candles_analyzed": len(candles_with_swings),
    }