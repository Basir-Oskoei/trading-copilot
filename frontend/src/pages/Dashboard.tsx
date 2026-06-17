import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus, RefreshCw, Target, Shield, AlertTriangle, BarChart2 } from 'lucide-react'
import { signalApi } from '../services/api'
import type { Signal } from '../types/index'

const SYMBOLS = ['AAPL', 'MSFT', 'TSLA', 'SPY', 'QQQ', 'NVDA']
const TIMEFRAMES = ['1d', '4h', '1h', '15m', '5m']

const card = { backgroundColor: '#1a1d2e', border: '1px solid #2a2d3e', borderRadius: '12px', padding: '24px' }
const label = { fontSize: '11px', color: '#64748b', marginBottom: '4px', display: 'block' as const }
const selectStyle = { backgroundColor: '#0f1117', border: '1px solid #2a2d3e', color: '#e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '14px' }
const btnStyle = { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }

function DirectionBadge({ direction }: { direction: string }) {
  const bg = direction === 'BUY' ? 'rgba(34,197,94,0.2)' : direction === 'SELL' ? 'rgba(239,68,68,0.2)' : '#2a2d3e'
  const color = direction === 'BUY' ? '#22c55e' : direction === 'SELL' ? '#ef4444' : '#64748b'
  return (
    <span style={{ backgroundColor: bg, color, display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '999px', fontSize: '13px', fontWeight: 700 }}>
      {direction === 'BUY' ? <TrendingUp size={13} /> : direction === 'SELL' ? <TrendingDown size={13} /> : <Minus size={13} />}
      {direction}
    </span>
  )
}

function ConfidenceBar({ score }: { score: number }) {
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ width: '100%', backgroundColor: '#2a2d3e', borderRadius: '999px', height: '6px' }}>
      <div style={{ width: score + '%', backgroundColor: color, height: '6px', borderRadius: '999px' }} />
    </div>
  )
}

export default function Dashboard() {
  const [symbol, setSymbol] = useState('AAPL')
  const [timeframe, setTimeframe] = useState('1d')
  const [signal, setSignal] = useState<Signal | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAnalyze() {
    setLoading(true)
    setError(null)
    setSignal(null)
    try {
      const res = await signalApi.generateSignal(symbol, timeframe, true)
      setSignal(res.data.signal)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to generate signal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#e2e8f0' }}>Trading Copilot</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>SMC-based market analysis and signal generation</p>
      </div>
      <div style={{ ...card, display: 'flex', flexWrap: 'wrap' as const, gap: '12px', alignItems: 'flex-end' }}>
        <div><label style={label}>Symbol</label><select value={symbol} onChange={e => setSymbol(e.target.value)} style={selectStyle}>{SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
        <div><label style={label}>Timeframe</label><select value={timeframe} onChange={e => setTimeframe(e.target.value)} style={selectStyle}>{TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
        <button onClick={handleAnalyze} disabled={loading} style={btnStyle}><RefreshCw size={14} />{loading ? 'Analyzing...' : 'Analyze'}</button>
      </div>
      {error && <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '16px', color: '#ef4444', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={16} />{error}</div>}
      {signal && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#e2e8f0' }}>{symbol}</span>
                  <span style={{ color: '#64748b', fontSize: '14px' }}>{timeframe}</span>
                  <DirectionBadge direction={signal.direction} />
                </div>
                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, maxWidth: '600px' }}>{signal.reasoning}</p>
              </div>
              <div style={{ textAlign: 'right' as const }}>
                <div style={{ fontSize: '36px', fontWeight: 700, color: '#e2e8f0' }}>{signal.confidence_score}</div>
                <div style={{ color: '#64748b', fontSize: '12px' }}>/ 100 confidence</div>
              </div>
            </div>
            <ConfidenceBar score={signal.confidence_score} />
          </div>
          {signal.is_valid && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
              <div style={{ ...card, padding: '16px' }}>
                <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}><Target size={11} />ENTRY</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>${signal.entry_price?.toFixed(2)}</div>
              </div>
              <div style={{ ...card, padding: '16px', borderColor: 'rgba(239,68,68,0.3)' }}>
                <div style={{ color: '#ef4444', fontSize: '11px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}><Shield size={11} />STOP LOSS</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444' }}>${signal.stop_loss?.toFixed(2)}</div>
                <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>Risk: ${signal.risk_per_unit?.toFixed(2)} per unit</div>
              </div>
              <div style={{ ...card, padding: '16px', borderColor: 'rgba(34,197,94,0.3)' }}>
                <div style={{ color: '#22c55e', fontSize: '11px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingUp size={11} />TAKE PROFIT</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#22c55e' }}>${signal.take_profit_1?.toFixed(2)}</div>
                <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>RR {signal.risk_reward_ratio?.toFixed(1)}:1</div>
              </div>
            </div>
          )}
          {signal.confluences.length > 0 && (
            <div style={card}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>CONFLUENCES DETECTED</div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px' }}>
                {signal.confluences.map(c => <span key={c} style={{ padding: '2px 8px', backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}>{c}</span>)}
              </div>
            </div>
          )}
          {signal.market_structure && (
            <div style={card}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>MARKET STRUCTURE</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
                <div><div style={{ fontSize: '11px', color: '#64748b' }}>Trend</div><div style={{ fontSize: '14px', fontWeight: 700, marginTop: '4px', color: signal.market_structure.trend === 'UPTREND' ? '#22c55e' : signal.market_structure.trend === 'DOWNTREND' ? '#ef4444' : '#f59e0b' }}>{signal.market_structure.trend}</div></div>
                <div><div style={{ fontSize: '11px', color: '#64748b' }}>Swing High</div><div style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', marginTop: '4px' }}>${signal.market_structure.recent_swing_high?.price.toFixed(2) ?? 'N/A'}</div></div>
                <div><div style={{ fontSize: '11px', color: '#64748b' }}>Swing Low</div><div style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', marginTop: '4px' }}>${signal.market_structure.recent_swing_low?.price.toFixed(2) ?? 'N/A'}</div></div>
              </div>
            </div>
          )}
        </div>
      )}
      {!signal && !loading && !error && (
        <div style={{ ...card, padding: '48px', textAlign: 'center' as const }}>
          <div style={{ marginBottom: '12px' }}><BarChart2 size={40} color="#64748b" /></div>
          <p style={{ color: '#64748b' }}>Select a symbol and timeframe, then click Analyze to generate a signal.</p>
        </div>
      )}
    </div>
  )
}
