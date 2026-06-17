from typing import List, Dict, Optional
from app.services.market_structure import analyze_market_structure
from app.services.fair_value_gap import get_active_fvgs
from app.services.order_block import get_active_order_blocks
from app.services.risk_calculator import build_trade_levels


MIN_CONFIDENCE = 30
MIN_RR = 1.5


def generate_signal(candles: List[Dict]) -> Dict:
    if len(candles) < 30:
        return _no_trade("Not enough candle data for analysis.")

    structure = analyze_market_structure(candles)
    fvgs = get_active_fvgs(candles)
    obs = get_active_order_blocks(candles)

    trend = structure["trend"]
    current_price = float(candles[-1]["close"])
    recent_high = structure.get("recent_swing_high")
    recent_low = structure.get("recent_swing_low")
    recent_sweeps = structure.get("recent_sweeps", [])
    last_bos = structure.get("last_bos")

    confluences = []
    confidence = 0
    direction = None
    reasoning_parts = []

    # Step 1: Determine bias from trend
    if trend == "UPTREND":
        direction = "BUY"
        confidence += 20
        confluences.append("UPTREND_BIAS")
        reasoning_parts.append("Market is in an uptrend (higher highs and higher lows).")
    elif trend == "DOWNTREND":
        direction = "SELL"
        confidence += 20
        confluences.append("DOWNTREND_BIAS")
        reasoning_parts.append("Market is in a downtrend (lower highs and lower lows).")
    else:
        reasoning_parts.append("Market is in consolidation. No clear directional bias.")
        return _no_trade(" ".join(reasoning_parts))

    # Step 2: Check for recent liquidity sweep confirming direction
    sweep_confirmed = False
    for sweep in reversed(recent_sweeps):
        if direction == "BUY" and sweep["type"] == "SWEEP_LOW":
            confidence += 20
            confluences.append("LIQUIDITY_SWEEP_LOW")
            reasoning_parts.append(f"Recent liquidity sweep below {sweep['swept_level']:.2f} confirms bullish reversal potential.")
            sweep_confirmed = True
            break
        elif direction == "SELL" and sweep["type"] == "SWEEP_HIGH":
            confidence += 20
            confluences.append("LIQUIDITY_SWEEP_HIGH")
            reasoning_parts.append(f"Recent liquidity sweep above {sweep['swept_level']:.2f} confirms bearish reversal potential.")
            sweep_confirmed = True
            break

    # Step 3: Check BOS in direction
    if last_bos:
        if direction == "BUY" and last_bos["type"] == "BOS_BULLISH":
            confidence += 15
            confluences.append("BOS_CONFIRMED")
            reasoning_parts.append(f"Bullish break of structure confirmed at {last_bos['price']:.2f}.")
        elif direction == "SELL" and last_bos["type"] == "BOS_BEARISH":
            confidence += 15
            confluences.append("BOS_CONFIRMED")
            reasoning_parts.append(f"Bearish break of structure confirmed at {last_bos['price']:.2f}.")

    # Step 4: Check for FVG confluence
    fvg_match = None
    for fvg in reversed(fvgs):
        if direction == "BUY" and fvg["type"] == "FVG_BULLISH":
            if fvg["bottom"] <= current_price <= fvg["top"]:
                fvg_match = fvg
                confidence += 20
                confluences.append("PRICE_IN_FVG")
                reasoning_parts.append(f"Price is currently inside a bullish FVG ({fvg['bottom']:.2f} - {fvg['top']:.2f}).")
                break
            elif current_price > fvg["top"]:
                fvg_match = fvg
                confidence += 10
                confluences.append("FVG_BELOW")
                reasoning_parts.append(f"Bullish FVG present below at ({fvg['bottom']:.2f} - {fvg['top']:.2f}).")
                break
        elif direction == "SELL" and fvg["type"] == "FVG_BEARISH":
            if fvg["bottom"] <= current_price <= fvg["top"]:
                fvg_match = fvg
                confidence += 20
                confluences.append("PRICE_IN_FVG")
                reasoning_parts.append(f"Price is currently inside a bearish FVG ({fvg['bottom']:.2f} - {fvg['top']:.2f}).")
                break
            elif current_price < fvg["bottom"]:
                fvg_match = fvg
                confidence += 10
                confluences.append("FVG_ABOVE")
                reasoning_parts.append(f"Bearish FVG present above at ({fvg['bottom']:.2f} - {fvg['top']:.2f}).")
                break

    # Step 5: Check for Order Block confluence
    ob_match = None
    for ob in reversed(obs):
        if direction == "BUY" and ob["type"] == "OB_BULLISH":
            if ob["bottom"] <= current_price <= ob["top"]:
                ob_match = ob
                confidence += 15
                confluences.append("PRICE_IN_OB")
                reasoning_parts.append(f"Price is in a bullish order block ({ob['bottom']:.2f} - {ob['top']:.2f}).")
                break
        elif direction == "SELL" and ob["type"] == "OB_BEARISH":
            if ob["bottom"] <= current_price <= ob["top"]:
                ob_match = ob
                confidence += 15
                confluences.append("PRICE_IN_OB")
                reasoning_parts.append(f"Price is in a bearish order block ({ob['bottom']:.2f} - {ob['top']:.2f}).")
                break

    # Step 6: Build trade levels
    stop_loss = None
    entry = current_price

    if direction == "BUY":
        sl_level = float(recent_low["price"]) if recent_low else entry * 0.98
        stop_loss = round(sl_level * 0.999, 4)
        tp_level = float(recent_high["price"]) if recent_high else None
    else:
        sl_level = float(recent_high["price"]) if recent_high else entry * 1.02
        stop_loss = round(sl_level * 1.001, 4)
        tp_level = float(recent_low["price"]) if recent_low else None

    levels = build_trade_levels(
        direction=direction,
        entry=entry,
        stop_loss=stop_loss,
        swing_high=float(recent_high["price"]) if recent_high else None,
        swing_low=float(recent_low["price"]) if recent_low else None,
        current_price=current_price,
    )

    # Step 7: Final decision
    min_rr = levels["risk_reward_1"]
    confidence = min(confidence, 100)

    if confidence < MIN_CONFIDENCE:
        return _no_trade(f"Confidence too low ({confidence}/100). " + " ".join(reasoning_parts))

    if min_rr < MIN_RR:
        return _no_trade(f"Risk/reward too low ({min_rr}:1, minimum {MIN_RR}:1). " + " ".join(reasoning_parts))

    reasoning_parts.append(f"Signal confidence: {confidence}/100. Risk/reward: {min_rr}:1.")

    return {
        "direction": direction,
        "signal_type": "SMC_ANALYSIS",
        "confidence_score": confidence,
        "confluences": confluences,
        "reasoning": " ".join(reasoning_parts),
        "entry_price": levels["entry"],
        "stop_loss": levels["stop_loss"],
        "take_profit_1": levels["take_profit_1"],
        "take_profit_2": levels["take_profit_2"],
        "take_profit_3": levels["take_profit_3"],
        "risk_reward_ratio": levels["risk_reward_1"],
        "risk_per_unit": levels["risk_per_unit"],
        "market_structure": {
            "trend": trend,
            "recent_swing_high": recent_high,
            "recent_swing_low": recent_low,
        },
        "is_valid": True,
    }


def _no_trade(reason: str) -> Dict:
    return {
        "direction": "NO_TRADE",
        "signal_type": "NO_TRADE",
        "confidence_score": 0,
        "confluences": [],
        "reasoning": reason,
        "entry_price": None,
        "stop_loss": None,
        "take_profit_1": None,
        "take_profit_2": None,
        "take_profit_3": None,
        "risk_reward_ratio": None,
        "risk_per_unit": None,
        "market_structure": None,
        "is_valid": False,
    }