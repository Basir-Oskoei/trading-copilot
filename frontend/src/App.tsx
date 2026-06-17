import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './pages/Dashboard'
import Analysis from './pages/Analysis'
import Scanner from './pages/Scanner'
import Signals from './pages/Signals'
import Journal from './pages/Journal'
import AppSettings from './pages/AppSettings'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f1117', color: '#e2e8f0' }}>
        <Sidebar />
        <main style={{ flex: 1, marginLeft: '64px', padding: '24px' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/signals" element={<Signals />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/settings" element={<AppSettings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
