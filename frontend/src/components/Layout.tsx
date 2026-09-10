import { NavLink, useNavigate } from 'react-router-dom'
import { BrainCircuit, CreditCard, LayoutDashboard, LogOut, Settings, Users, WalletCards, FileText } from 'lucide-react'
import { Brand } from './Brand'

const items = [
  ['/dashboard', 'Dashboard', LayoutDashboard],
  ['/members', 'Members', Users],
  ['/contributions', 'Savings', WalletCards],
  ['/loans', 'Loans', CreditCard],
  ['/ai', 'AI Insights', BrainCircuit],
  ['/reports', 'Reports', FileText],
  ['/accounting', 'Accounting', WalletCards],
  ['/settings', 'Settings', Settings],
] as const

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <nav>
          {items.map(([href, label, Icon]) => (
            <NavLink key={href} to={href} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Icon size={18} /> <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="ghost-button" onClick={() => { localStorage.removeItem('njangi_token'); navigate('/login') }}>
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div className="top-search">Search members, loans, transactions…</div>
          <div className="top-user">Community Finance Admin</div>
        </header>
        <div className="page-content">{children}</div>
        <nav className="mobile-nav">{items.slice(0,5).map(([href,label,Icon])=><NavLink key={href} to={href} className={({isActive})=>isActive?'active':''}><Icon size={17}/><div>{label}</div></NavLink>)}</nav>
      </main>
    </div>
  )
}
