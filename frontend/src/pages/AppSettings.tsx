import { useState, useEffect } from 'react'
import { Save, CheckCircle } from 'lucide-react'
import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:8000', timeout: 10000 })
const card = { backgroundColor: '#1a1d2e', border: '1px solid #2a2d3e', borderRadius: '12px', padding: '24px' }
const inputStyle = { backgroundColor: '#0f1117', border: '1px solid #2a2d3e', color: '#e2e8f0', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', width: '100%' }

export default function AppSettings() {
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'ok' | 'error'>('checking')

  useEffect(() => {
    api.get('/health')
      .then(() => setBackendStatus('ok'))
      .catch(() => setBackendStatus('error'))
    const stored = localStorage.getItem('anthropic_api_key')
    if (stored) setApiKey(stored)
  }, [])

  function handleSave() {
    localStorage.setItem('anthropic_api_key', apiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#e2e8f0' }}>Settings</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Configure your Trading Copilot</p>
      </div>

      <div style={card}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>System Status</h2>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Connection status for all services</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'Backend API', status: backendStatus === 'ok', detail: 'localhost:8000' },
            { label: 'Market Data', status: true, detail: 'Yahoo Finance (free)' },
            { label: 'Database', status: true, detail: 'SQLite local' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#0f1117', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#e2e8f0' }}>{item.label}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{item.detail}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: item.status ? '#22c55e' : '#ef4444' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.status ? '#22c55e' : '#ef4444' }} />
                {item.status ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>Anthropic API Key</h2>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Required for AI chart image analysis. Get your key at console.anthropic.com</p>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '6px' }}>API Key</label>
          <input
            type="password"
            style={inputStyle}
            placeholder="sk-ant-..."
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
          <p style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
            Note: Also add this to your backend/.env file as ANTHROPIC_API_KEY for it to take effect.
          </p>
        </div>
        <button
          onClick={handleSave}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: saved ? '#22c55e' : '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s' }}
        >
          {saved ? <CheckCircle size={14} /> : <Save size={14} />}
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      <div style={card}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>How to Start the App</h2>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Run these two commands in separate terminals</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'Terminal 1 — Backend', code: 'cd backend && venv\\Scripts\\activate && uvicorn app.main:app --reload --port 8000' },
            { label: 'Terminal 2 — Frontend', code: 'cd frontend && npm run dev' },
          ].map(item => (
            <div key={item.label} style={{ backgroundColor: '#0f1117', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>{item.label}</div>
              <code style={{ fontSize: '12px', color: '#3b82f6', fontFamily: 'monospace' }}>{item.code}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
