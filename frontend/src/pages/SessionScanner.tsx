import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, RefreshCw, Zap, AlertTriangle, Clock } from 'lucide-react'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const api = axios.create({ baseURL: BASE_URL, timeout: 120000 })
const card = { backgroundColor: '#1a1d2e', border: '1px solid #2a2d3e', borderRadius: '12px', padding: '20px' }

const SESSION_COLORS: any = {
  london: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.4)', color: '#3b82f6', label: '🇬🇧 London Open' },
  new_york: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.4)', color: '#22c55e', label: '🇺🇸 New York Open' },
  asian: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.4)', color: '#f59e0b', label: '🌏 Asian Session' },
  off_hours: { bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.4)', color: '#64748b', label: '🌙 Off Hours' },
}

function DirectionBadge({ direction }: { direction: string }) {
  const bg = direction === 'BUY' ? 'rgba(34,197,94,0.2)' : direction === 'SELL' ? 'rgba(239,68,68,0.2)' : '#2a2d3e'
  const color = direction === 'BUY' ? '#22c55e' : direction === 'SELL' ? '#ef4444' : '#64748b'
  return <span style={{ backgroundColor: bg, color, display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700 }}>
    {direction === 'BUY' ? <TrendingUp size={10} /> : direction === 'SELL' ? <TrendingDown size={10} /> : <Minus size={10} />}{direction}
  </span>
}

function ConfBar({ score }: { score: number }) {
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'
  return <div style={{ width: '100%', backgroundColor: '#0f1117', borderRadius: '999px', height: '3px', marginTop: '4px' }}>
    <div style={{ width: score + '%', backgroundColor: color, height: '3px', borderRadius: '999px' }} />
  </div>
}

export default function SessionScanner() {
  const [session, setSession] = useState('auto')
  const [timeframe, setTimeframe] = useState('1h')
  const [includeForex, setIncludeForex] = useState(true)
  const [includeFutures, setIncludeFutures] = useState(true)
  const [includeStocks, setIncludeStocks] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentSession, setCurrentSession] = useState<any>(null)
  const [lastScanned, setLastScanned] = useState<string | null>(null)

  useEffect(() => {
    api.get('/api/v1/pro/current-session').then(r => setCurrentSession(r.data)).catch(() => {})
  }, [])

  async function handleScan() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/v1/pro/session-scan', {
        params: { session: session === 'auto' ? undefined : session, timeframe, include_forex: includeForex, include_futures: includeFutures, include_stocks: includeStocks }
      })
      setResult(res.data.result)
      setLastScanned(new Date().toLocaleTimeString())
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Session scan failed')
    } finally {
      setLoading(false)
    }
  }

  const sessionKey = result?.session || currentSession?.session || 'off_hours'
  const sessionStyle = SESSION_COLORS[sessionKey] || SESSION_COLORS.off_hours
  const rankings = result?.rankings || []
  const topBuy = result?.top_buy
  const topSell = result?.top_sell

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#e2e8f0' }}>Session Scanner</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Smart scan based on London, New York, and Asian sessions</p>
        </div>
        {lastScanned && <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={12} />Last scan: {lastScanned}</div>}
      </div>

      {currentSession && (
        <div style={{ ...card, backgroundColor: sessionStyle.bg, borderColor: sessionStyle.border }}>
          <div style={{ display: 'flex', align: 'center', gap: '12px' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: sessionStyle.color }}>{sessionStyle.label}</div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>{currentSession.description}</div>
          </div>
        </div>
      )}

      <div style={{ ...card, display: 'flex', flexWrap: 'wrap' as const, gap: '12px', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Session</label>
          <select value={session} onChange={e => setSession(e.target.value)} style={{ backgroundColor: '#0f1117', border: '1px solid #2a2d3e', color: '#e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '14px' }}>
            <option value="auto">Auto-detect</option>
            <option value="london">London Open</option>
            <option value="new_york">New York Open</option>
            <option value="asian">Asian Session</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Timeframe</label>
          <select value={timeframe} onChange={e => setTimeframe(e.target.value)} style={{ backgroundColor: '#0f1117', border: '1px solid #2a2d3e', color: '#e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '14px' }}>
            {['15m','30m','1h','4h','1d'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {[['Forex', includeForex, setIncludeForex], ['Futures', includeFutures, setIncludeFutures], ['Stocks', includeStocks, setIncludeStocks]].map(([label, val, setter]: any) => (
            <label key={label as string} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#94a3b8' }}>
              <input type="checkbox" checked={val} onChange={e => setter(e.target.checked)} />
              {label}
            </label>
          ))}
        </div>
        <button onClick={handleScan} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 20px', backgroundColor: loading ? '#2a2d3e' : '#3b82f6', color: loading ? '#64748b' : 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? <RefreshCw size={14} /> : <Zap size={14} />}
          {loading ? 'Scanning...' : 'Run Session Scan'}
        </button>
      </div>

      {loading && (
        <div style={{ ...card, textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>🤖</div>
          <p style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Scanning session-specific markets...</p>
          <p style={{ color: '#64748b', fontSize: '13px' }}>Claude is analyzing the best instruments for this session</p>
        </div>
      )}

      {error && <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '16px', color: '#ef4444', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={16} />{error}</div>}

      {result && !loading && (
        <>
          {result.market_overview && (
            <div style={{ ...card, borderColor: sessionStyle.border, backgroundColor: sessionStyle.bg }}>
              <div style={{ fontSize: '11px', color: sessionStyle.color, marginBottom: '8px' }}>{result.session_name?.toUpperCase()} — MARKET OVERVIEW</div>
              <p style={{ fontSize: '14px', color: '#e2e8f0', lineHeight: 1.6 }}>{result.market_overview}</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {topBuy && (
              <div style={{ ...card, borderColor: 'rgba(34,197,94,0.4)', backgroundColor: 'rgba(34,197,94,0.05)' }}>
                <div style={{ fontSize: '11px', color: '#22c55e', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingUp size={12} />BEST BUY — {result.session_name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: '#e2e8f0' }}>{topBuy.symbol}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Confidence: {topBuy.confidence}/100</div>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#22c55e' }}>RR {topBuy.risk_reward?.toFixed(1)}:1</div>
                </div>
                <ConfBar score={topBuy.confidence} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', margin: '12px 0' }}>
                  <div><div style={{ fontSize: '10px', color: '#64748b' }}>Entry</div><div style={{ fontSize: '14px', fontWeight: 700, color: '#3b82f6' }}>${topBuy.entry?.toFixed(2)}</div></div>
                  <div><div style={{ fontSize: '10px', color: '#64748b' }}>SL</div><div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>${topBuy.stop_loss?.toFixed(2)}</div></div>
                  <div><div style={{ fontSize: '10px', color: '#64748b' }}>TP</div><div style={{ fontSize: '14px', fontWeight: 700, color: '#22c55e' }}>${topBuy.take_profit?.toFixed(2)}</div></div>
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>{topBuy.reasoning}</p>
              </div>
            )}
            {topSell && (
              <div style={{ ...card, borderColor: 'rgba(239,68,68,0.4)', backgroundColor: 'rgba(239,68,68,0.05)' }}>
                <div style={{ fontSize: '11px', color: '#ef4444', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingDown size={12} />BEST SELL — {result.session_name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: '#e2e8f0' }}>{topSell.symbol}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Confidence: {topSell.confidence}/100</div>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#ef4444' }}>RR {topSell.risk_reward?.toFixed(1)}:1</div>
                </div>
                <ConfBar score={topSell.confidence} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', margin: '12px 0' }}>
                  <div><div style={{ fontSize: '10px', color: '#64748b' }}>Entry</div><div style={{ fontSize: '14px', fontWeight: 700, color: '#3b82f6' }}>${topSell.entry?.toFixed(2)}</div></div>
                  <div><div style={{ fontSize: '10px', color: '#64748b' }}>SL</div><div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>${topSell.stop_loss?.toFixed(2)}</div></div>
                  <div><div style={{ fontSize: '10px', color: '#64748b' }}>TP</div><div style={{ fontSize: '14px', fontWeight: 700, color: '#22c55e' }}>${topSell.take_profit?.toFixed(2)}</div></div>
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>{topSell.reasoning}</p>
              </div>
            )}
          </div>

          {rankings.length > 0 && (
            <div style={card}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>ALL INSTRUMENTS RANKED ({rankings.length} scanned)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {rankings.map((r: any, i: number) => (
                  <div key={r.symbol} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', backgroundColor: '#0f1117', borderRadius: '8px' }}>
                    <div style={{ fontSize: '13px', color: '#64748b', width: '24px' }}>#{i + 1}</div>
                    <div style={{ width: '80px', fontWeight: 700, color: '#e2e8f0', fontSize: '14px' }}>{r.symbol}</div>
                    <DirectionBadge direction={r.direction} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>{r.key_reason}</span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>{r.confidence}/100</span>
                      </div>
                      <ConfBar score={r.confidence} />
                    </div>
                    {r.entry && <div style={{ fontSize: '12px', color: '#e2e8f0', minWidth: '130px', textAlign: 'right' as const }}>${r.entry?.toFixed(2)} / <span style={{ color: '#ef4444' }}>${r.stop_loss?.toFixed(2)}</span> / <span style={{ color: '#22c55e' }}>${r.take_profit?.toFixed(2)}</span></div>}
                    {r.risk_reward && <div style={{ fontSize: '12px', fontWeight: 700, color: r.risk_reward >= 2 ? '#22c55e' : '#f59e0b', minWidth: '40px', textAlign: 'right' as const }}>{r.risk_reward?.toFixed(1)}:1</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!result && !loading && !error && (
        <div style={{ ...card, textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🕐</div>
          <p style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Session-Based Market Scanner</p>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Automatically scans the right instruments for the current trading session</p>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '8px' }}>London (8am UTC): EUR/GBP pairs + Gold<br/>New York (1pm UTC): Stocks + Futures + USD pairs<br/>Asian (12am UTC): JPY pairs + Gold</p>
        </div>
      )}
    </div>
  )
}
