import anthropic
import base64
from pathlib import Path


SMC_SYSTEM_PROMPT = """You are an expert Smart Money Concepts (SMC) and ICT trading analyst.
You analyze trading charts and identify the following concepts:

MARKET STRUCTURE:
- Swing highs and lows (2-candle patterns)
- Higher highs/higher lows = uptrend
- Lower highs/lower lows = downtrend
- Break of Structure (BOS): candle CLOSE above recent high (bullish) or below recent low (bearish)

LIQUIDITY:
- Liquidity sweep: price moves past a high/low then reverses with BOS in opposite direction
- Buy-side liquidity: above recent highs (stop losses of shorts)
- Sell-side liquidity: below recent lows (stop losses of longs)

KEY ZONES:
- Fair Value Gap (FVG): 3-candle pattern where wick of candle 1 and candle 3 do not overlap
- Order Block: the candle(s) that caused the liquidity sweep
- Equilibrium: 50% midpoint of the most recent swing

TRADING RULES:
- Only trade in direction of 4H trend
- Wait for liquidity sweep + BOS confirmation
- Enter at FVG, Order Block, or Equilibrium
- Stop loss beyond the sweep high/low
- Take profit at next draw on liquidity (session high/low, prior swing)
- Minimum 1:2 risk/reward

When analyzing a chart, you must respond with a JSON object in this exact format:
{
  "trend": "UPTREND" | "DOWNTREND" | "CONSOLIDATION",
  "bias": "BULLISH" | "BEARISH" | "NEUTRAL",
  "direction": "BUY" | "SELL" | "NO_TRADE",
  "confidence": 0-100,
  "confluences": ["list", "of", "confluences", "found"],
  "key_levels": {
    "swing_high": price_or_null,
    "swing_low": price_or_null,
    "fvg_top": price_or_null,
    "fvg_bottom": price_or_null,
    "order_block_top": price_or_null,
    "order_block_bottom": price_or_null
  },
  "entry": price_or_null,
  "stop_loss": price_or_null,
  "take_profit": price_or_null,
  "risk_reward": number_or_null,
  "reasoning": "detailed explanation of the analysis",
  "warnings": ["any", "concerns", "or", "cautions"]
}

Only respond with the JSON object. No other text."""


def analyze_chart_image(image_path: str) -> dict:
    client = anthropic.Anthropic()

    img_data = Path(image_path).read_bytes()
    b64_image = base64.standard_b64encode(img_data).decode("utf-8")

    suffix = Path(image_path).suffix.lower()
    media_map = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
    media_type = media_map.get(suffix, "image/png")

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SMC_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": b64_image,
                        },
                    },
                    {
                        "type": "text",
                        "text": "Please analyze this trading chart using Smart Money Concepts (SMC) and provide your analysis in the required JSON format."
                    }
                ],
            }
        ],
    )

    import json
    response_text = message.content[0].text.strip()
    if response_text.startswith("```"):
        lines = response_text.split("\n")
        response_text = "\n".join(lines[1:-1])

    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        return {
            "trend": "UNKNOWN",
            "bias": "NEUTRAL",
            "direction": "NO_TRADE",
            "confidence": 0,
            "confluences": [],
            "key_levels": {},
            "entry": None,
            "stop_loss": None,
            "take_profit": None,
            "risk_reward": None,
            "reasoning": response_text,
            "warnings": ["Could not parse structured response"]
        }
