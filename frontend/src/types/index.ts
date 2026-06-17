export interface Signal {
  direction: 'BUY' | 'SELL' | 'NO_TRADE'
  signal_type: string
  confidence_score: number
  confluences: string[]
  reasoning: string
  entry_price: number | null
  stop_loss: number | null
  take_profit_1: number | null
  take_profit_2: number | null
  take_profit_3: number | null
  risk_reward_ratio: number | null
  risk_per_unit: number | null
  market_structure: {
    trend: string
    recent_swing_high: { price: number; timestamp: string } | null
    recent_swing_low: { price: number; timestamp: string } | null
  } | null
  is_valid: boolean
  saved_id?: string
}

export interface Candle {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}
