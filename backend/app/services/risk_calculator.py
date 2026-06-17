from typing import Optional, Dict, Tuple


def calculate_risk_reward(
    entry: float,
    stop_loss: float,
    take_profit: float,
) -> float:
    risk = abs(entry - stop_loss)
    reward = abs(take_profit - entry)
    if risk == 0:
        return 0.0
    return round(reward / risk, 2)


def calculate_stop_loss(
    direction: str,
    entry: float,
    swing_level: float,
    buffer_percent: float = 0.001,
) -> float:
    buffer = entry * buffer_percent
    if direction == "BUY":
        return round(swing_level - buffer, 4)
    else:
        return round(swing_level + buffer, 4)


def calculate_take_profit(
    direction: str,
    entry: float,
    next_level: float,
    buffer_percent: float = 0.001,
) -> float:
    buffer = entry * buffer_percent
    if direction == "BUY":
        return round(next_level - buffer, 4)
    else:
        return round(next_level + buffer, 4)


def calculate_position_size(
    account_size: float,
    risk_percent: float,
    entry: float,
    stop_loss: float,
) -> Dict:
    risk_amount = account_size * (risk_percent / 100)
    price_risk = abs(entry - stop_loss)
    if price_risk == 0:
        return {"shares": 0, "risk_amount": 0, "position_value": 0}
    shares = risk_amount / price_risk
    position_value = shares * entry
    return {
        "shares": round(shares, 2),
        "risk_amount": round(risk_amount, 2),
        "position_value": round(position_value, 2),
        "price_risk_per_share": round(price_risk, 4),
    }


def build_trade_levels(
    direction: str,
    entry: float,
    stop_loss: float,
    swing_high: Optional[float],
    swing_low: Optional[float],
    current_price: float,
) -> Dict:
    if direction == "BUY":
        tp1 = swing_high if swing_high else entry * 1.02
        tp2 = tp1 * 1.01
        tp3 = tp1 * 1.02
    else:
        tp1 = swing_low if swing_low else entry * 0.98
        tp2 = tp1 * 0.99
        tp3 = tp1 * 0.98

    tp1 = round(float(tp1), 4)
    tp2 = round(float(tp2), 4)
    tp3 = round(float(tp3), 4)

    rr1 = calculate_risk_reward(entry, stop_loss, tp1)
    rr2 = calculate_risk_reward(entry, stop_loss, tp2)
    rr3 = calculate_risk_reward(entry, stop_loss, tp3)

    return {
        "entry": round(entry, 4),
        "stop_loss": round(stop_loss, 4),
        "take_profit_1": tp1,
        "take_profit_2": tp2,
        "take_profit_3": tp3,
        "risk_reward_1": rr1,
        "risk_reward_2": rr2,
        "risk_reward_3": rr3,
        "risk_per_unit": round(abs(entry - stop_loss), 4),
    }