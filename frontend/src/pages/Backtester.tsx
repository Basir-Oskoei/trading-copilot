import { useState } from 'react'
import { RefreshCw, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const api = axios.create({ baseURL: BASE_URL, timeout: 120000 })
const card = { backgroundColor: '#1a1d2e', border: '1px solid #2a2d3e', borderRadius: '12px', padding: '20px' }

const SYMBOLS = ['AAPL','MSFT','NVDA','TSLA','SPY','QQQ','AMD','META','EURUSD=X','GBPUSD=X','USDJPY=X','ES=F','NQ=F','GC=F']
const TIMEFRAMES = ['1d', '4h', '1h']

export default function Backtester() {
  const [symbol, setSymbol] = useState('AAPL')
  const [timeframe, setTimeframe] = useState('1d')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleBacktest() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await api.get('/api/v1/pro/backtest/' + symbol, { params: { timeframe } })
      setResult(res.data.backtest)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Backtest failed')
    } finally {
      setLoading(false)
    }
  }

  const equity_change = result ? result.ending_equity - result.starting_equity : 0
  const profitable = equity_change > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#e2e8f0' }}>Strategy Backtester</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Test the SMC strategy on historical data — see real win rate and R:R</p>
      </div>

      <div style={{ ...card, display: 'flex', flexWrap: 'wrap' as const, gap: '12px', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Symbol</label>
          <select value={symbol} onChange={e => setSymbol(e.target.value)} style={{ backgroundColor: '#0f1117', border: '1px solid #2a2d3e', color: '#e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '14px' }}>
            {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Timeframe</label>
          <select value={timeframe} onChange={e => setTimeframe(e.target.value)} style={{ backgroundColor: '#0f1117', border: '1px solid #2a2d3e', color: '#e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '14px' }}>
            {TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button onClick={handleBacktest} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 20px', backgroundColor: loading ? '#2a2d3e' : '#3b82f6', color: loading ? '#64748b' : 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
          <RefreshCw size={14} />
          {loading ? 'Running backtest...' : 'Run Backtest'}
        </button>
      </div>

      {loading && (
        <div style={{ ...card, textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Running backtest on historical data...</p>
          <p style={{ color: '#64748b', fontSize: '13px' }}>Simulating every SMC signal over the last 6 months</p>
        </div>
      )}

      {error && <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '16px', color: '#ef4444', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={16} />{error}</div>}

      {result && !loading && (
        <>
          {result.error ? (
            <div style={{ ...card, color: '#ef4444' }}>{result.error}</div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
                {[
                  { label: 'Total Trades', value: result.total_trades, color: '#e2e8f0' },
                  { label: 'Win Rate', value: result.win_rate + '%', color: result.win_rate >= 50 ? '#22c55e' : '#ef4444' },
                  { label: 'Profit Factor', value: result.profit_factor?.toFixed(2) + 'x', color: result.profit_factor >= 1.5 ? '#22c55e' : result.profit_factor >= 1 ? '#f59e0b' : '#ef4444' },
                  { label: 'Total Return', value: (result.total_return_pct >= 0 ? '+' : '') + result.total_return_pct + '%', color: result.total_return_pct >= 0 ? '#22c55e' : '#ef4444' },
                  { label: 'Avg R:R', value: result.avg_risk_reward?.toFixed(2) + ':1', color: result.avg_risk_reward >= 1.5 ? '#22c55e' : '#f59e0b' },
                  { label: 'Max Drawdown', value: result.max_drawdown_pct + '%', color: result.max_drawdown_pct <= 10 ? '#22c55e' : result.max_drawdown_pct <= 20 ? '#f59e0b' : '#ef4444' },
                  { label: 'Wins / Losses', value: result.wins + ' / ' + result.losses, color: '#94a3b8' },
                  { label: 'Final Equity', value: '$' + result.ending_equity?.toLocaleString(), color: profitable ? '#22c55e' : '#ef4444' },
                ].map(stat => (
                  <div key={stat.label} style={card}>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>{stat.label}</div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ ...card, padding: '16px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>VERDICT</div>
                <div style={{ fontSize: '15px', color: '#e2e8f0', lineHeight: 1.6 }}>
                  {result.win_rate >= 50 && result.profit_factor >= 1.5
                    ? '✅ Strong edge detected. Win rate and profit factor both positive. Consider trading this setup live with proper risk management.'
                    : result.win_rate >= 40 && result.profit_factor >= 1.0
                    ? '⚠️ Marginal edge. Positive but not strong. Consider refining entry rules or waiting for higher timeframe confluence.'
                    : '❌ Weak or no edge on this timeframe/symbol combination. Do not trade this setup live without further optimization.'}
                </div>
              </div>

              {result.recent_trades?.length > 0 && (
                <div style={card}>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>RECENT TRADES (last 20)</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {result.recent_trades.map((t: any, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', backgroundColor: '#0f1117', borderRadius: '8px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '1px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, backgroundColor: t.direction === 'BUY' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', color: t.direction === 'BUY' ? '#22c55e' : '#ef4444' }}>
                          {t.direction === 'BUY' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}{t.direction}
                        </span>
                        <span style={{ fontSize: '12px', color: '#64748b', flex: 1 }}>{t.timestamp?.slice(0, 10)}</span>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Entry ${t.entry} → SL ${t.stop_loss} → TP ${t.take_profit}</span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>RR {t.risk_reward}:1</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: t.outcome === 'WIN' ? '#22c55e' : '#ef4444', minWidth: '60px', textAlign: 'right' as const }}>
                          {t.outcome === 'WIN' ? '+' : ''}{t.pnl > 0 ? '+' : ''}${t.pnl?.toFixed(0)}
                        </span>
                        <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '4px', backgroundColor: t.outcome === 'WIN' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: t.outcome === 'WIN' ? '#22c55e' : '#ef4444' }}>{t.outcome}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {!result && !loading && !error && (
        <div style={{ ...card, textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📈</div>
          <p style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Strategy Backtester</p>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Select a symbol and timeframe to see historical performance</p>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Tests the SMC strategy on real historical data with 1% risk per trade</p>
        </div>
      )}
    </div>
  )
}
