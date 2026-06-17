import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus, RefreshCw, Zap, AlertTriangle } from 'lucide-react'
import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:8000', timeout: 120000 })
const card = { backgroundColor: '#1a1d2e', border: '1px solid #2a2d3e', borderRadius: '12px', padding: '20px' }
const inputStyle = { backgroundColor: '#0f1117', border: '1px solid #2a2d3e', color: '#e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', width: '100%' }

const DEFAULT_SYMBOLS = 'AAPL,MSFT,NVDA,TSLA,AMZN,SPY,QQQ,META,GOOGL,AMD'
const TIMEFRAMES = ['1d', '4h', '1h', '15m']

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

function ConfidenceBar({ score }: { score: number }) {
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ width: '100%', backgroundColor: '#0f1117', borderRadius: '999px', height: '4px', marginTop: '6px' }}>
      <div style={{ width: score + '%', backgroundColor: color, height: '4px', borderRadius: '999px' }} />
    </div>
  )
}

export default function Scanner() {
  const [symbols, setSymbols] = useState(DEFAULT_SYMBOLS)
  const [timeframe, setTimeframe] = useState('1d')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastScanned, setLastScanned] = useState<string | null>(null)

  async function handleScan() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/v1/scanner/scan', { params: { symbols, timeframe } })
      setResult(res.data.result)
      setLastScanned(new Date().toLocaleTimeString())
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Scan failed. Make sure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const rankings = result?.rankings || []
  const topBuy = result?.top_buy
  const topSell = result?.top_sell

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#e2e8f0' }}>Claude Auto-Scanner</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>AI-powered SMC analysis across multiple symbols</p>
        </div>
        {lastScanned && <div style={{ fontSize: '12px', color: '#64748b' }}>Last scan: {lastScanned}</div>}
      </div>

      <div style={{ ...card, display: 'flex', flexWrap: 'wrap' as const, gap: '12px', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Symbols (comma-separated, max 20)</label>
          <input style={inputStyle} value={symbols} onChange={e => setSymbols(e.target.value)} placeholder="AAPL,TSLA,NVDA..." />
        </div>
        <div>
          <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Timeframe</label>
          <select style={{ ...inputStyle, width: 'auto' }} value={timeframe} onChange={e => setTimeframe(e.target.value)}>
            {TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button
          onClick={handleScan}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 20px', backgroundColor: loading ? '#2a2d3e' : '#3b82f6', color: loading ? '#64748b' : 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
          {loading ? 'Scanning...' : 'Run Scan'}
        </button>
      </div>

      {loading && (
        <div style={{ ...card, textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>🤖</div>
          <p style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Claude is analyzing the markets...</p>
          <p style={{ color: '#64748b', fontSize: '13px' }}>Fetching data and running SMC analysis on all symbols</p>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>This takes 15-30 seconds</p>
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '16px', color: '#ef4444', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {result && !loading && (
        <>
          {result.market_overview && (
            <div style={{ ...card, borderColor: 'rgba(59,130,246,0.3)', backgroundColor: 'rgba(59,130,246,0.05)' }}>
              <div style={{ fontSize: '11px', color: '#3b82f6', marginBottom: '8px' }}>MARKET OVERVIEW</div>
              <p style={{ fontSize: '14px', color: '#e2e8f0', lineHeight: 1.6 }}>{result.market_overview}</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {topBuy && (
              <div style={{ ...card, borderColor: 'rgba(34,197,94,0.4)', backgroundColor: 'rgba(34,197,94,0.05)' }}>
                <div style={{ fontSize: '11px', color: '#22c55e', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={12} /> BEST BUY SETUP
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#e2e8f0' }}>{topBuy.symbol}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Confidence: {topBuy.confidence}/100</div>
                  </div>
                  <div style={{ textAlign: 'right' as const }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#22c55e' }}>RR {topBuy.risk_reward?.toFixed(1)}:1</div>
                  </div>
                </div>
                <ConfidenceBar score={topBuy.confidence} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', margin: '12px 0' }}>
                  <div><div style={{ fontSize: '10px', color: '#64748b' }}>Entry</div><div style={{ fontSize: '14px', fontWeight: 700, color: '#3b82f6' }}>${topBuy.entry?.toFixed(2)}</div></div>
                  <div><div style={{ fontSize: '10px', color: '#64748b' }}>Stop Loss</div><div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>${topBuy.stop_loss?.toFixed(2)}</div></div>
                  <div><div style={{ fontSize: '10px', color: '#64748b' }}>Take Profit</div><div style={{ fontSize: '14px', fontWeight: 700, color: '#22c55e' }}>${topBuy.take_profit?.toFixed(2)}</div></div>
                </div>
                {topBuy.confluences && (
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px', marginBottom: '10px' }}>
                    {topBuy.confluences.map((c: string) => <span key={c} style={{ padding: '1px 6px', backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace' }}>{c}</span>)}
                  </div>
                )}
                <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>{topBuy.reasoning}</p>
              </div>
            )}

            {topSell && (
              <div style={{ ...card, borderColor: 'rgba(239,68,68,0.4)', backgroundColor: 'rgba(239,68,68,0.05)' }}>
                <div style={{ fontSize: '11px', color: '#ef4444', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingDown size={12} /> BEST SELL SETUP
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#e2e8f0' }}>{topSell.symbol}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Confidence: {topSell.confidence}/100</div>
                  </div>
                  <div style={{ textAlign: 'right' as const }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#ef4444' }}>RR {topSell.risk_reward?.toFixed(1)}:1</div>
                  </div>
                </div>
                <ConfidenceBar score={topSell.confidence} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', margin: '12px 0' }}>
                  <div><div style={{ fontSize: '10px', color: '#64748b' }}>Entry</div><div style={{ fontSize: '14px', fontWeight: 700, color: '#3b82f6' }}>${topSell.entry?.toFixed(2)}</div></div>
                  <div><div style={{ fontSize: '10px', color: '#64748b' }}>Stop Loss</div><div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>${topSell.stop_loss?.toFixed(2)}</div></div>
                  <div><div style={{ fontSize: '10px', color: '#64748b' }}>Take Profit</div><div style={{ fontSize: '14px', fontWeight: 700, color: '#22c55e' }}>${topSell.take_profit?.toFixed(2)}</div></div>
                </div>
                {topSell.confluences && (
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px', marginBottom: '10px' }}>
                    {topSell.confluences.map((c: string) => <span key={c} style={{ padding: '1px 6px', backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace' }}>{c}</span>)}
                  </div>
                )}
                <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>{topSell.reasoning}</p>
              </div>
            )}
          </div>

          <div style={card}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '16px' }}>ALL SYMBOLS RANKED BY CONFIDENCE ({rankings.length} scanned)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {rankings.map((r: any, i: number) => (
                <div key={r.symbol} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#0f1117', borderRadius: '8px' }}>
                  <div style={{ fontSize: '14px', color: '#64748b', width: '24px', textAlign: 'center' as const }}>#{i + 1}</div>
                  <div style={{ width: '70px', fontWeight: 700, color: '#e2e8f0', fontSize: '15px' }}>{r.symbol}</div>
                  <DirectionBadge direction={r.direction} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{r.key_reason}</span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{r.confidence}/100</span>
                    </div>
                    <ConfidenceBar score={r.confidence} />
                  </div>
                  {r.entry && (
                    <div style={{ textAlign: 'right' as const, minWidth: '120px' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Entry / SL / TP</div>
                      <div style={{ fontSize: '12px', color: '#e2e8f0' }}>${r.entry?.toFixed(2)} / <span style={{ color: '#ef4444' }}>${r.stop_loss?.toFixed(2)}</span> / <span style={{ color: '#22c55e' }}>${r.take_profit?.toFixed(2)}</span></div>
                    </div>
                  )}
                  {r.risk_reward && (
                    <div style={{ minWidth: '50px', textAlign: 'right' as const, fontSize: '13px', fontWeight: 700, color: r.risk_reward >= 2 ? '#22c55e' : '#f59e0b' }}>
                      {r.risk_reward?.toFixed(1)}:1
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {result.avoid && result.avoid.length > 0 && (
            <div style={{ ...card, borderColor: 'rgba(245,158,11,0.3)' }}>
              <div style={{ fontSize: '11px', color: '#f59e0b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={12} /> SYMBOLS TO AVOID</div>
              {result.avoid.map((a: string, i: number) => (
                <p key={i} style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>• {a}</p>
              ))}
            </div>
          )}
        </>
      )}

      {!result && !loading && !error && (
        <div style={{ ...card, textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
          <p style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Ready to scan the markets</p>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Add your symbols above and click Run Scan</p>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Claude will analyze all symbols and rank the best setups</p>
        </div>
      )}
    </div>
  )
}
