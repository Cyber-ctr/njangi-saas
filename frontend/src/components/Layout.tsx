import { FormEvent, useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { BrainCircuit, CreditCard, LayoutDashboard, LogOut, Settings, Users, WalletCards, FileText } from 'lucide-react'
import { Brand } from './Brand'
import { api } from '../lib/api'

interface UserProfile { full_name: string; email: string }

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
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true
    void api<UserProfile>('/api/auth/me')
      .then(user => { if (active) setProfile(user) })
      .catch(() => {
        if (active) setProfile({ full_name: 'Account', email: '' })
      })
    return () => { active = false }
  }, [navigate])

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    navigate(`/members?search=${encodeURIComponent(search.trim())}`)
  }

  const signOut = () => {
    localStorage.removeItem('njangi_token')
    navigate('/login', { replace: true })
  }

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
          <button className="ghost-button" onClick={signOut}>
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <form className="top-search" onSubmit={submitSearch}><input aria-label="Search members" placeholder="Search members…" value={search} onChange={event => setSearch(event.target.value)} /><button className="link-button">Search</button></form>
          <div className="topbar-user"><div className="top-user">{profile?.full_name || profile?.email || 'Loading account…'}</div><button className="topbar-signout" onClick={signOut}><LogOut size={16}/> Sign out</button></div>
        </header>
        <div className="page-content">{children}</div>
        <nav className="mobile-nav">{items.map(([href,label,Icon])=><NavLink key={href} to={href} className={({isActive})=>isActive?'active':''}><Icon size={17}/><div>{label}</div></NavLink>)}</nav>
      </main>
    </div>
  )
}
