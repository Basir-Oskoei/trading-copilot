import { useState, useRef } from 'react'
import { Upload, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react'
import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:8000', timeout: 60000 })
const card = { backgroundColor: '#1a1d2e', border: '1px solid #2a2d3e', borderRadius: '12px', padding: '20px' }
const inputStyle = { backgroundColor: '#0f1117', border: '1px solid #2a2d3e', color: '#e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '14px' }

export default function Analysis() {
  const [symbol, setSymbol] = useState('')
  const [timeframe, setTimeframe] = useState('1h')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(f: File) {
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setError(null)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  async function handleAnalyze() {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const params: any = {}
      if (symbol) params.symbol = symbol.toUpperCase()
      if (timeframe) params.timeframe = timeframe
      const res = await api.post('/api/v1/analysis/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params,
      })
      setResult(res.data)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Analysis failed. Check your Anthropic API key in Settings.')
    } finally {
      setLoading(false)
    }
  }

  const analysis = result?.analysis

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#e2e8f0' }}>AI Chart Analysis</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Upload a chart screenshot for Claude SMC analysis</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={card}>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>CHART DETAILS (optional)</div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Symbol</label>
                <input style={{ ...inputStyle, width: '100%' }} placeholder="AAPL" value={symbol} onChange={e => setSymbol(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Timeframe</label>
                <select style={{ ...inputStyle, width: '100%' }} value={timeframe} onChange={e => setTimeframe(e.target.value)}>
                  {['1m','5m','15m','30m','1h','4h','1d','1w'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div
            style={{ ...card, border: '2px dashed #2a2d3e', cursor: 'pointer', textAlign: 'center', padding: '32px' }}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <Upload size={32} color="#3b82f6" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#e2e8f0', fontSize: '14px', marginBottom: '4px' }}>Drop chart screenshot here</p>
            <p style={{ color: '#64748b', fontSize: '12px' }}>or click to browse — JPG, PNG, WebP</p>
            {file && <p style={{ color: '#22c55e', fontSize: '12px', marginTop: '8px' }}>Selected: {file.name}</p>}
          </div>

          {preview && (
            <div style={{ ...card, padding: '8px' }}>
              <img src={preview} alt="Chart preview" style={{ width: '100%', borderRadius: '8px', maxHeight: '300px', objectFit: 'contain' }} />
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={!file || loading}
            style={{ padding: '12px', backgroundColor: file && !loading ? '#3b82f6' : '#2a2d3e', color: file && !loading ? 'white' : '#64748b', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: file && !loading ? 'pointer' : 'not-allowed', transition: 'background 0.2s' }}
          >
            {loading ? 'Analyzing with Claude AI...' : 'Analyze Chart'}
          </button>

          {error && (
            <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px', color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
              {error}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!analysis && !loading && (
            <div style={{ ...card, textAlign: 'center', padding: '48px' }}>
              <TrendingUp size={40} color="#2a2d3e" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: '#64748b', fontSize: '14px' }}>Upload a chart to get AI-powered SMC analysis</p>
              <p style={{ color: '#2a2d3e', fontSize: '12px', marginTop: '8px' }}>Requires Anthropic API key in Settings</p>
            </div>
          )}

          {loading && (
            <div style={{ ...card, textAlign: 'center', padding: '48px' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid #2a2d3e', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>Claude is analyzing your chart...</p>
              <p style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>This may take 10-20 seconds</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {analysis && (
            <>
              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      {result.symbol && <span style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>{result.symbol}</span>}
                      {result.timeframe && <span style={{ color: '#64748b', fontSize: '13px' }}>{result.timeframe}</span>}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700,
                        backgroundColor: analysis.direction === 'BUY' ? 'rgba(34,197,94,0.2)' : analysis.direction === 'SELL' ? 'rgba(239,68,68,0.2)' : '#2a2d3e',
                        color: analysis.direction === 'BUY' ? '#22c55e' : analysis.direction === 'SELL' ? '#ef4444' : '#64748b'
                      }}>
                        {analysis.direction === 'BUY' ? <TrendingUp size={11} /> : analysis.direction === 'SELL' ? <TrendingDown size={11} /> : <Minus size={11} />}
                        {analysis.direction}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Trend: <span style={{ color: analysis.trend === 'UPTREND' ? '#22c55e' : analysis.trend === 'DOWNTREND' ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>{analysis.trend}</span></div>
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

              {(analysis.entry || analysis.stop_loss || analysis.take_profit) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
                  <div style={{ ...card, padding: '16px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>ENTRY</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>{analysis.entry ? '$' + analysis.entry.toFixed(2) : 'N/A'}</div>
                  </div>
                  <div style={{ ...card, padding: '16px', borderColor: 'rgba(239,68,68,0.3)' }}>
                    <div style={{ fontSize: '11px', color: '#ef4444', marginBottom: '6px' }}>STOP LOSS</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#ef4444' }}>{analysis.stop_loss ? '$' + analysis.stop_loss.toFixed(2) : 'N/A'}</div>
                  </div>
                  <div style={{ ...card, padding: '16px', borderColor: 'rgba(34,197,94,0.3)' }}>
                    <div style={{ fontSize: '11px', color: '#22c55e', marginBottom: '6px' }}>TAKE PROFIT</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#22c55e' }}>{analysis.take_profit ? '$' + analysis.take_profit.toFixed(2) : 'N/A'}</div>
                    {analysis.risk_reward && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>RR {analysis.risk_reward.toFixed(1)}:1</div>}
                  </div>
                </div>
              )}

              {analysis.confluences && analysis.confluences.length > 0 && (
                <div style={card}>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>CONFLUENCES FOUND</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
                    {analysis.confluences.map((c: string) => (
                      <span key={c} style={{ padding: '2px 8px', backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}>{c}</span>
                    ))}
                  </div>
                </div>
              )}

              <div style={card}>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>AI REASONING</div>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>{analysis.reasoning}</p>
              </div>

              {analysis.warnings && analysis.warnings.length > 0 && (
                <div style={{ ...card, borderColor: 'rgba(245,158,11,0.3)', backgroundColor: 'rgba(245,158,11,0.05)' }}>
                  <div style={{ fontSize: '11px', color: '#f59e0b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={12} /> WARNINGS</div>
                  {analysis.warnings.map((w: string, i: number) => (
                    <p key={i} style={{ fontSize: '13px', color: '#f59e0b', marginBottom: '4px' }}>• {w}</p>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
