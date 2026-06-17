import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react'
import { signalApi } from '../services/api'

const card = { backgroundColor: '#1a1d2e', border: '1px solid #2a2d3e', borderRadius: '12px', padding: '20px' }

function DirectionBadge({ direction }: { direction: string }) {
  const bg = direction === 'BUY' ? 'rgba(34,197,94,0.2)' : direction === 'SELL' ? 'rgba(239,68,68,0.2)' : '#2a2d3e'
  const color = direction === 'BUY' ? '#22c55e' : direction === 'SELL' ? '#ef4444' : '#64748b'
  return (
    <span style={{ backgroundColor: bg, color, display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700 }}>
      {direction === 'BUY' ? <TrendingUp size={11} /> : direction === 'SELL' ? <TrendingDown size={11} /> : <Minus size={11} />}
      {direction}
    </span>
  )
}

function OutcomeBadge({ outcome }: { outcome: string | null }) {
  if (!outcome) return <span style={{ color: '#64748b', fontSize: '12px' }}>Pending</span>
  const color = outcome === 'WIN' ? '#22c55e' : outcome === 'LOSS' ? '#ef4444' : '#f59e0b'
  return <span style={{ color, fontSize: '12px', fontWeight: 700 }}>{outcome}</span>
}

export default function Signals() {
  const [signals, setSignals] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await signalApi.getHistory(undefined, 50)
      setSignals(res.data.signals)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#e2e8f0' }}>Signal History</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>All generated trading signals</p>
        </div>
        <button onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {signals.length === 0 && !loading && (
        <div style={{ ...card, textAlign: 'center', padding: '48px' }}>
          <p style={{ color: '#64748b' }}>No signals yet. Go to Dashboard and click Analyze to generate signals.</p>
        </div>
      )}

      {signals.map(s => (
        <div key={s.id} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>{s.symbol}</span>
              <span style={{ color: '#64748b', fontSize: '13px' }}>{s.timeframe}</span>
              <DirectionBadge direction={s.direction} />
              <OutcomeBadge outcome={s.outcome} />
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <div style={{ fontSize: '13px', color: '#64748b' }}>{new Date(s.created_at).toLocaleString()}</div>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>Confidence: {s.confidence_score}/100</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Entry</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#3b82f6', marginTop: '2px' }}>{s.entry_price ? '$' + s.entry_price.toFixed(2) : 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Stop Loss</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444', marginTop: '2px' }}>{s.stop_loss ? '$' + s.stop_loss.toFixed(2) : 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Take Profit</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#22c55e', marginTop: '2px' }}>{s.take_profit_1 ? '$' + s.take_profit_1.toFixed(2) : 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>R:R Ratio</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0', marginTop: '2px' }}>{s.risk_reward_ratio ? s.risk_reward_ratio.toFixed(1) + ':1' : 'N/A'}</div>
            </div>
          </div>

          {s.confluences && s.confluences.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px', marginBottom: '12px' }}>
              {s.confluences.map((c: string) => (
                <span key={c} style={{ padding: '2px 8px', backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}>{c}</span>
              ))}
            </div>
          )}

          {s.reasoning && (
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>{s.reasoning}</p>
          )}
        </div>
      ))}
    </div>
  )
}
