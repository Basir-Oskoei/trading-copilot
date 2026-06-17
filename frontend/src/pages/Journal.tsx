import { useState, useEffect } from 'react'
import { Plus, TrendingUp, TrendingDown } from 'lucide-react'
import axios from 'axios'

const card = { backgroundColor: '#1a1d2e', border: '1px solid #2a2d3e', borderRadius: '12px', padding: '20px' }
const input = { backgroundColor: '#0f1117', border: '1px solid #2a2d3e', color: '#e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', width: '100%' }
const api = axios.create({ baseURL: 'http://localhost:8000', timeout: 30000 })

interface Trade {
  id: string
  symbol: string
  direction: string
  entry_price: number
  exit_price: number | null
  stop_loss: number
  take_profit: number
  quantity: number
  profit_loss: number | null
  status: string
  notes: string | null
  created_at: string
}

export default function Journal() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ symbol: '', direction: 'BUY', entry_price: '', stop_loss: '', take_profit: '', quantity: '', notes: '' })
  const [loading, setLoading] = useState(false)

  async function loadTrades() {
    try {
      const res = await api.get('/api/v1/trades')
      setTrades(res.data.trades || [])
    } catch (e) { console.error(e) }
  }

  useEffect(() => { loadTrades() }, [])

  async function handleSubmit() {
    if (!form.symbol || !form.entry_price || !form.stop_loss || !form.take_profit) return
    setLoading(true)
    try {
      await api.post('/api/v1/trades', {
        symbol: form.symbol.toUpperCase(),
        direction: form.direction,
        entry_price: parseFloat(form.entry_price),
        stop_loss: parseFloat(form.stop_loss),
        take_profit: parseFloat(form.take_profit),
        quantity: parseFloat(form.quantity) || 1,
        notes: form.notes || null,
        status: 'OPEN',
        entry_time: new Date().toISOString(),
      })
      setForm({ symbol: '', direction: 'BUY', entry_price: '', stop_loss: '', take_profit: '', quantity: '', notes: '' })
      setShowForm(false)
      loadTrades()
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const totalPL = trades.reduce((sum, t) => sum + (t.profit_loss || 0), 0)
  const wins = trades.filter(t => t.profit_loss && t.profit_loss > 0).length
  const losses = trades.filter(t => t.profit_loss && t.profit_loss < 0).length
  const winRate = trades.length > 0 ? Math.round((wins / trades.filter(t => t.profit_loss !== null).length) * 100) || 0 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#e2e8f0' }}>Trade Journal</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Track and review your trades</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
          <Plus size={14} />
          Log Trade
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
        {[
          { label: 'Total Trades', value: trades.length, color: '#e2e8f0' },
          { label: 'Win Rate', value: winRate + '%', color: '#22c55e' },
          { label: 'Wins / Losses', value: wins + ' / ' + losses, color: '#94a3b8' },
          { label: 'Total P&L', value: (totalPL >= 0 ? '+' : '') + '$' + totalPL.toFixed(2), color: totalPL >= 0 ? '#22c55e' : '#ef4444' },
        ].map(stat => (
          <div key={stat.label} style={card}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>{stat.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={card}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0', marginBottom: '16px' }}>Log New Trade</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Symbol</label>
              <input style={input} placeholder="AAPL" value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Direction</label>
              <select style={input} value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value })}>
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Entry Price</label>
              <input style={input} placeholder="295.00" value={form.entry_price} onChange={e => setForm({ ...form, entry_price: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Stop Loss</label>
              <input style={input} placeholder="290.00" value={form.stop_loss} onChange={e => setForm({ ...form, stop_loss: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Take Profit</label>
              <input style={input} placeholder="305.00" value={form.take_profit} onChange={e => setForm({ ...form, take_profit: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Quantity</label>
              <input style={input} placeholder="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Notes</label>
              <input style={input} placeholder="Optional notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button onClick={handleSubmit} disabled={loading} style={{ padding: '8px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
              {loading ? 'Saving...' : 'Save Trade'}
            </button>
            <button onClick={() => setShowForm(false)} style={{ padding: '8px 20px', backgroundColor: 'transparent', color: '#64748b', border: '1px solid #2a2d3e', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {trades.length === 0 && !showForm && (
        <div style={{ ...card, textAlign: 'center', padding: '48px' }}>
          <p style={{ color: '#64748b' }}>No trades logged yet. Click Log Trade to add your first trade.</p>
        </div>
      )}

      {trades.map(t => (
        <div key={t.id} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0' }}>{t.symbol}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, backgroundColor: t.direction === 'BUY' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', color: t.direction === 'BUY' ? '#22c55e' : '#ef4444' }}>
                {t.direction === 'BUY' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {t.direction}
              </span>
              <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', backgroundColor: t.status === 'OPEN' ? 'rgba(59,130,246,0.15)' : '#2a2d3e', color: t.status === 'OPEN' ? '#3b82f6' : '#64748b' }}>{t.status}</span>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              {t.profit_loss !== null && (
                <div style={{ fontSize: '18px', fontWeight: 700, color: t.profit_loss >= 0 ? '#22c55e' : '#ef4444' }}>
                  {t.profit_loss >= 0 ? '+' : ''}${t.profit_loss.toFixed(2)}
                </div>
              )}
              <div style={{ fontSize: '12px', color: '#64748b' }}>{new Date(t.created_at).toLocaleDateString()}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
            <div><div style={{ fontSize: '11px', color: '#64748b' }}>Entry</div><div style={{ fontSize: '14px', fontWeight: 600, color: '#3b82f6', marginTop: '2px' }}>${t.entry_price?.toFixed(2)}</div></div>
            <div><div style={{ fontSize: '11px', color: '#64748b' }}>Stop Loss</div><div style={{ fontSize: '14px', fontWeight: 600, color: '#ef4444', marginTop: '2px' }}>${t.stop_loss?.toFixed(2)}</div></div>
            <div><div style={{ fontSize: '11px', color: '#64748b' }}>Take Profit</div><div style={{ fontSize: '14px', fontWeight: 600, color: '#22c55e', marginTop: '2px' }}>${t.take_profit?.toFixed(2)}</div></div>
          </div>
          {t.notes && <p style={{ fontSize: '13px', color: '#64748b', marginTop: '10px' }}>{t.notes}</p>}
        </div>
      ))}
    </div>
  )
}
