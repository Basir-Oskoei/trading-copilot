from typing import List, Dict, Optional
from datetime import datetime, timedelta
from app.services.market_data import fetch_candles
from app.services.market_structure import analyze_market_structure
from app.services.fair_value_gap import get_active_fvgs
from app.services.order_block import get_active_order_blocks
from app.core.indicators import add_all_indicators
import statistics


def run_backtest(symbol: str, timeframe: str = "1d", lookback_days: int = 180) -> Dict:
    try:
        candles = fetch_candles(symbol, timeframe, limit=500)
        if len(candles) < 50:
            return {"error": "Not enough data for backtest"}

        trades = []
        wins = 0
        losses = 0
        total_rr = 0.0
        equity = 10000.0
        peak_equity = 10000.0
        max_drawdown = 0.0
        risk_per_trade = 0.01  # 1% risk per trade

        # Walk forward through candles
        for i in range(50, len(candles) - 5):
            subset = candles[:i]
            structure = analyze_market_structure(subset)
            fvgs = get_active_fvgs(subset)
            obs = get_active_order_blocks(subset)
            ind = add_all_indicators(subset)
            last = ind[-1]

            trend = structure["trend"]
            if trend == "CONSOLIDATION":
                continue

            last_bos = structure.get("last_bos")
            recent_sweeps = structure.get("recent_sweeps", [])
            if not last_bos or not recent_sweeps:
                continue

            direction = "BUY" if trend == "UPTREND" else "SELL"
            sweep = recent_sweeps[-1]

            # Check sweep matches direction
            if direction == "BUY" and sweep["type"] != "SWEEP_LOW":
                continue
            if direction == "SELL" and sweep["type"] != "SWEEP_HIGH":
                continue

            # Check BOS matches direction
            if direction == "BUY" and last_bos["type"] != "BOS_BULLISH":
                continue
            if direction == "SELL" and last_bos["type"] != "BOS_BEARISH":
                continue

            # Need FVG in direction
            matching_fvgs = [f for f in fvgs if (
                direction == "BUY" and f["type"] == "FVG_BULLISH" or
                direction == "SELL" and f["type"] == "FVG_BEARISH"
            )]
            if not matching_fvgs:
                continue

            # Entry at close of signal candle
            entry = float(last["close"])
            swing_high = structure.get("recent_swing_high")
            swing_low = structure.get("recent_swing_low")

            if direction == "BUY":
                if not swing_low:
                    continue
                stop_loss = float(swing_low["price"]) * 0.999
                take_profit = float(swing_high["price"]) * 0.999 if swing_high else entry * 1.04
            else:
                if not swing_high:
                    continue
                stop_loss = float(swing_high["price"]) * 1.001
                take_profit = float(swing_low["price"]) * 1.001 if swing_low else entry * 0.96

            risk = abs(entry - stop_loss)
            reward = abs(take_profit - entry)
            if risk == 0:
                continue

            rr = reward / risk
            if rr < 1.5:
                continue

            # Simulate trade on next 5 candles
            future = candles[i:i+5]
            outcome = "OPEN"
            exit_price = None

            for future_candle in future:
                high = float(future_candle["high"])
                low = float(future_candle["low"])

                if direction == "BUY":
                    if low <= stop_loss:
                        outcome = "LOSS"
                        exit_price = stop_loss
                        break
                    if high >= take_profit:
                        outcome = "WIN"
                        exit_price = take_profit
                        break
                else:
                    if high >= stop_loss:
                        outcome = "LOSS"
                        exit_price = stop_loss
                        break
                    if low <= take_profit:
                        outcome = "WIN"
                        exit_price = take_profit
                        break

            if outcome == "OPEN":
                continue

            # Calculate P&L
            risk_amount = equity * risk_per_trade
            units = risk_amount / risk if risk > 0 else 0

            if outcome == "WIN":
                pnl = units * reward
                wins += 1
            else:
                pnl = -units * risk
                losses += 1

            equity += pnl
            peak_equity = max(peak_equity, equity)
            drawdown = (peak_equity - equity) / peak_equity * 100
            max_drawdown = max(max_drawdown, drawdown)
            total_rr += rr if outcome == "WIN" else -1

            trades.append({
                "index": i,
                "direction": direction,
                "entry": round(entry, 4),
                "stop_loss": round(stop_loss, 4),
                "take_profit": round(take_profit, 4),
                "risk_reward": round(rr, 2),
                "outcome": outcome,
                "pnl": round(pnl, 2),
                "equity": round(equity, 2),
                "timestamp": candles[i]["timestamp"] if isinstance(candles[i]["timestamp"], str) else str(candles[i]["timestamp"]),
            })

        total_trades = wins + losses
        win_rate = (wins / total_trades * 100) if total_trades > 0 else 0
        avg_rr = (total_rr / total_trades) if total_trades > 0 else 0
        total_return = ((equity - 10000) / 10000) * 100

        profit_trades = [t["pnl"] for t in trades if t["outcome"] == "WIN"]
        loss_trades = [abs(t["pnl"]) for t in trades if t["outcome"] == "LOSS"]
        avg_win = statistics.mean(profit_trades) if profit_trades else 0
        avg_loss = statistics.mean(loss_trades) if loss_trades else 0
        profit_factor = (sum(profit_trades) / sum(loss_trades)) if sum(loss_trades) > 0 else 0

        return {
            "symbol": symbol,
            "timeframe": timeframe,
            "total_trades": total_trades,
            "wins": wins,
            "losses": losses,
            "win_rate": round(win_rate, 1),
            "avg_risk_reward": round(avg_rr, 2),
            "profit_factor": round(profit_factor, 2),
            "total_return_pct": round(total_return, 1),
            "max_drawdown_pct": round(max_drawdown, 1),
            "starting_equity": 10000,
            "ending_equity": round(equity, 2),
            "avg_win": round(avg_win, 2),
            "avg_loss": round(avg_loss, 2),
            "recent_trades": trades[-20:],
            "all_trades": trades,
        }
    except Exception as e:
        return {"error": str(e)}
