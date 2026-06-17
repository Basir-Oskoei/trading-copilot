from typing import List, Dict, Optional


def detect_fair_value_gaps(candles: List[Dict], min_gap_percent: float = 0.0) -> List[Dict]:
    fvgs = []

    for i in range(1, len(candles) - 1):
        c0 = candles[i - 1]
        c1 = candles[i]
        c2 = candles[i + 1]

        c0_high = float(c0["high"])
        c0_low = float(c0["low"])
        c2_high = float(c2["high"])
        c2_low = float(c2["low"])
        c1_close = float(c1["close"])

        # Bullish FVG: top of candle[0] wick is below bottom of candle[2] wick
        if c0_high < c2_low:
            gap_size = c2_low - c0_high
            gap_percent = (gap_size / c1_close) * 100
            if gap_percent >= min_gap_percent:
                fvgs.append({
                    "type": "FVG_BULLISH",
                    "top": round(c2_low, 4),
                    "bottom": round(c0_high, 4),
                    "midpoint": round((c2_low + c0_high) / 2, 4),
                    "gap_size": round(gap_size, 4),
                    "gap_percent": round(gap_percent, 3),
                    "timestamp": c1["timestamp"],
                    "candle_index": i,
                    "is_valid": True,
                })

        # Bearish FVG: bottom of candle[0] wick is above top of candle[2] wick
        if c0_low > c2_high:
            gap_size = c0_low - c2_high
            gap_percent = (gap_size / c1_close) * 100
            if gap_percent >= min_gap_percent:
                fvgs.append({
                    "type": "FVG_BEARISH",
                    "top": round(c0_low, 4),
                    "bottom": round(c2_high, 4),
                    "midpoint": round((c0_low + c2_high) / 2, 4),
                    "gap_size": round(gap_size, 4),
                    "gap_percent": round(gap_percent, 3),
                    "timestamp": c1["timestamp"],
                    "candle_index": i,
                    "is_valid": True,
                })

    return fvgs


def validate_fvgs(fvgs: List[Dict], candles: List[Dict]) -> List[Dict]:
    validated = []
    for fvg in fvgs:
        fvg = dict(fvg)
        idx = fvg["candle_index"]
        subsequent = candles[idx + 2:] if idx + 2 < len(candles) else []

        for future_candle in subsequent:
            fvg_top = fvg["top"]
            fvg_bottom = fvg["bottom"]
            close = float(future_candle["close"])

            if fvg["type"] == "FVG_BULLISH" and close < fvg_bottom:
                fvg["is_valid"] = False
                fvg["invalidated_at"] = future_candle["timestamp"]
                break
            elif fvg["type"] == "FVG_BEARISH" and close > fvg_top:
                fvg["is_valid"] = False
                fvg["invalidated_at"] = future_candle["timestamp"]
                break

        validated.append(fvg)
    return validated


def get_active_fvgs(candles: List[Dict], min_gap_percent: float = 0.05) -> List[Dict]:
    fvgs = detect_fair_value_gaps(candles, min_gap_percent)
    fvgs = validate_fvgs(fvgs, candles)
    active = [f for f in fvgs if f["is_valid"]]
    return active


def find_nearest_fvg(price: float, fvgs: List[Dict], fvg_type: str = None) -> Optional[Dict]:
    candidates = fvgs
    if fvg_type:
        candidates = [f for f in fvgs if f["type"] == fvg_type]

    if not candidates:
        return None

    def distance(fvg):
        mid = fvg["midpoint"]
        return abs(price - mid)

    return min(candidates, key=distance)