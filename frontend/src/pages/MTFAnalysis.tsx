import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus, RefreshCw, AlertTriangle } from 'lucide-react'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const api = axios.create({ baseURL: BASE_URL, timeout: 120000 })
const card = { backgroundColor: '#1a1d2e', border: '1px solid #2a2d3e', borderRadius: '12px', padding: '20px' }

const SYMBOLS = ['AAPL','MSFT','NVDA','TSLA','SPY','QQQ','AMD','META','GOOGL','AMZN','EURUSD=X','GBPUSD=X','USDJPY=X','AUDUSD=X','ES=F','NQ=F','GC=F','CL=F']

function BiasTag({ bias }: { bias: string }) {
  const colors: any = {
    STRONG_BULLISH: { bg: 'rgba(34,197,94,0.3)', color: '#22c55e' },
    BULLISH: { bg: 'rgba(34,197,94,0.15)', color: '#86efac' },
    STRONG_BEARISH: { bg: 'rgba(239,68,68,0.3)', color: '#ef4444' },
    BEARISH: { bg: 'rgba(239,68,68,0.15)', color: '#fca5a5' },
    NEUTRAL: { bg: '#2a2d3e', color: '#64748b' },
  }
  const c = colors[bias] || colors.NEUTRAL
  return <span style={{ backgroundColor: c.bg, color: c.color, padding: '2px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700 }}>{bias}</span>
}

function TFCard({ label, data }: { label: string, data: any }) {
  if (!data || data.error) return (
    <div style={{ ...card, padding: '16px' }}>
      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>{label}</div>
      <div style={{ color: '#ef4444', fontSize: '13px' }}>{data?.error || 'No data'}</div>
    </div>
  )
  return (
    <div style={{ ...card, padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>{label}</div>
        <BiasTag bias={data.bias || 'NEUTRAL'} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div><div style={{ fontSize: '10px', color: '#64748b' }}>Trend</div><div style={{ fontSize: '13px', color: data.trend === 'UPTREND' ? '#22c55e' : data.trend === 'DOWNTREND' ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>{data.trend}</div></div>
        <div><div style={{ fontSize: '10px', color: '#64748b' }}>Price</div><div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: 600 }}>${data.current_price}</div></div>
        <div><div style={{ fontSize: '10px', color: '#64748b' }}>RSI</div><div style={{ fontSize: '13px', color: (data.rsi > 70 || data.rsi < 30) ? '#f59e0b' : '#e2e8f0', fontWeight: 600 }}>{data.rsi?.toFixed(1)}</div></div>
        <div><div style={{ fontSize: '10px', color: '#64748b' }}>BOS Count</div><div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: 600 }}>{data.bos_count}</div></div>
        <div><div style={{ fontSize: '10px', color: '#64748b' }}>Bull FVGs</div><div style={{ fontSize: '13px', color: '#22c55e', fontWeight: 600 }}>{data.active_bullish_fvgs}</div></div>
        <div><div style={{ fontSize: '10px', color: '#64748b' }}>Bear FVGs</div><div style={{ fontSize: '13px', color: '#ef4444', fontWeight: 600 }}>{data.active_bearish_fvgs}</div></div>
      </div>
    </div>
  )
}

export default function MTFAnalysis() {
  const [symbol, setSymbol] = useState('AAPL')
  const [customSymbol, setCustomSymbol] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleAnalyze() {
    const sym = customSymbol.trim().toUpperCase() || symbol
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await api.get('/api/v1/pro/mtf/' + sym)
      setResult(res.data)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const analysis = result?.analysis
  const direction = analysis?.direction
  const mtf = analysis?.mtf_alignment
  const tfData = analysis?.timeframe_data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#e2e8f0' }}>Multi-Timeframe Analysis</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Daily bias + 4H structure + 1H entry confirmation</p>
      </div>

      <div style={{ ...card, display: 'flex', flexWrap: 'wrap' as const, gap: '12px', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Symbol</label>
          <select value={symbol} onChange={e => setSymbol(e.target.value)} style={{ backgroundColor: '#0f1117', border: '1px solid #2a2d3e', color: '#e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '14px' }}>
            {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Or type any symbol</label>
          <input value={customSymbol} onChange={e => setCustomSymbol(e.target.value)} placeholder="e.g. GBPJPY=X" style={{ backgroundColor: '#0f1117', border: '1px solid #2a2d3e', color: '#e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '14px' }} />
        </div>
        <button onClick={handleAnalyze} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 20px', backgroundColor: loading ? '#2a2d3e' : '#3b82f6', color: loading ? '#64748b' : 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
          <RefreshCw size={14} />
          {loading ? 'Analyzing 3 timeframes...' : 'Run MTF Analysis'}
        </button>
      </div>

      {loading && (
        <div style={{ ...card, textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>📊</div>
          <p style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Analyzing Daily, 4H, and 1H...</p>
          <p style={{ color: '#64748b', fontSize: '13px' }}>Claude is checking all 3 timeframes for confluence</p>
        </div>
      )}

      {error && <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '16px', color: '#ef4444', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={16} />{error}</div>}

      {analysis && !loading && (
        <>
          {/* MTF Alignment Banner */}
          <div style={{ ...card, borderColor: mtf?.all_agree ? (direction === 'BUY' ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)') : '#2a2d3e', backgroundColor: mtf?.all_agree ? (direction === 'BUY' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)') : '#1a1d2e' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#e2e8f0' }}>{result.symbol}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 12px', borderRadius: '999px', fontSize: '13px', fontWeight: 700, backgroundColor: direction === 'BUY' ? 'rgba(34,197,94,0.2)' : direction === 'SELL' ? 'rgba(239,68,68,0.2)' : '#2a2d3e', color: direction === 'BUY' ? '#22c55e' : direction === 'SELL' ? '#ef4444' : '#64748b' }}>
                    {direction === 'BUY' ? <TrendingUp size={12} /> : direction === 'SELL' ? <TrendingDown size={12} /> : <Minus size={12} />}
                    {direction}
                  </span>
                  {mtf?.all_agree && <span style={{ backgroundColor: 'rgba(59,130,246,0.2)', color: '#3b82f6', padding: '2px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700 }}>ALL 3 AGREE ✓</span>}
                </div>
                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, maxWidth: '700px' }}>{analysis.reasoning}</p>
              </div>
              <div style={{ textAlign: 'right' as const }}>
                <div style={{ fontSize: '36px', fontWeight: 700, color: '#e2e8f0' }}>{analysis.confidence}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>/ 100</div>
              </div>
            </div>
            <div style={{ width: '100%', backgroundColor: '#2a2d3e', borderRadius: '999px', height: '6px' }}>
              <div style={{ width: analysis.confidence + '%', backgroundColor: analysis.confidence >= 70 ? '#22c55e' : analysis.confidence >= 40 ? '#f59e0b' : '#ef4444', height: '6px', borderRadius: '999px' }} />
            </div>
          </div>

          {/* 3 Timeframe Cards */}
          {tfData && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
              <TFCard label="Daily — Directional Bias" data={tfData.daily} />
              <TFCard label="4H — Market Structure" data={tfData.h4} />
              <TFCard label="1H — Entry Confirmation" data={tfData.h1} />
            </div>
          )}

          {/* Trade Levels */}
          {analysis.entry && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
              <div style={{ ...card, padding: '16px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>ENTRY (1H)</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#3b82f6' }}>${analysis.entry?.toFixed(2)}</div>
              </div>
              <div style={{ ...card, padding: '16px', borderColor: 'rgba(239,68,68,0.3)' }}>
                <div style={{ fontSize: '11px', color: '#ef4444', marginBottom: '8px' }}>STOP LOSS</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#ef4444' }}>${analysis.stop_loss?.toFixed(2)}</div>
              </div>
              <div style={{ ...card, padding: '16px', borderColor: 'rgba(34,197,94,0.3)' }}>
                <div style={{ fontSize: '11px', color: '#22c55e', marginBottom: '8px' }}>TP 1</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#22c55e' }}>${analysis.take_profit_1?.toFixed(2)}</div>
              </div>
              <div style={{ ...card, padding: '16px', borderColor: 'rgba(34,197,94,0.3)' }}>
                <div style={{ fontSize: '11px', color: '#22c55e', marginBottom: '8px' }}>TP 2</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#22c55e' }}>${analysis.take_profit_2?.toFixed(2)}</div>
                {analysis.risk_reward && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>RR {analysis.risk_reward?.toFixed(1)}:1</div>}
              </div>
            </div>
          )}

          {/* Confluences */}
          {analysis.confluences?.length > 0 && (
            <div style={card}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>CONFLUENCES</div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
                {analysis.confluences.map((c: string) => <span key={c} style={{ padding: '2px 8px', backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}>{c}</span>)}
              </div>
            </div>
          )}

          {/* Warnings */}
          {analysis.warnings?.length > 0 && (
            <div style={{ ...card, borderColor: 'rgba(245,158,11,0.3)' }}>
              <div style={{ fontSize: '11px', color: '#f59e0b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={12} />WARNINGS</div>
              {analysis.warnings.map((w: string, i: number) => <p key={i} style={{ fontSize: '13px', color: '#f59e0b', marginBottom: '4px' }}>• {w}</p>)}
            </div>
          )}
        </>
      )}

      {!analysis && !loading && !error && (
        <div style={{ ...card, textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
          <p style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Multi-Timeframe Analysis</p>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Select a symbol and run analysis to see Daily + 4H + 1H confluence</p>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Only trades when at least 2 of 3 timeframes agree</p>
        </div>
      )}
    </div>
  )
}
