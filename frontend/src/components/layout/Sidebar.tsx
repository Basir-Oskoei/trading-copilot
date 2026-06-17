import { NavLink } from 'react-router-dom'
import { LayoutDashboard, TrendingUp, BarChart2, BookOpen, Settings, Zap, Search } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/scanner', icon: Search, label: 'Scanner' },
  { to: '/analysis', icon: TrendingUp, label: 'AI Analysis' },
  { to: '/signals', icon: Zap, label: 'Signals' },
  { to: '/journal', icon: BookOpen, label: 'Journal' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  return (
    <aside style={{ position: 'fixed', left: 0, top: 0, height: '100vh', width: '64px', backgroundColor: '#1a1d2e', borderRight: '1px solid #2a2d3e', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: '8px', zIndex: 50 }}>
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', backgroundColor: '#3b82f6', borderRadius: '8px' }}>
        <BarChart2 size={20} color="white" />
      </div>
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          title={label}
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '40px', height: '40px', borderRadius: '8px',
            backgroundColor: isActive ? '#3b82f6' : 'transparent',
            color: isActive ? 'white' : '#64748b',
            textDecoration: 'none',
          })}
        >
          <Icon size={18} />
        </NavLink>
      ))}
    </aside>
  )
}
