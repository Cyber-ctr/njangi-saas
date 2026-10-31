import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, Users, Wallet, AlertTriangle } from 'lucide-react'
import { api, money } from '../lib/api'

interface Dash { members:number; total_savings:number; total_loans:number; outstanding_loans:number; recent_contributions:{amount:number;paid_at:string}[] }
interface Group { id:number; name:string; contribution_amount:number }

export default function Dashboard() {
  const [dash, setDash] = useState<Dash | null>(null)
  const [group, setGroup] = useState<Group | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const groups = await api<Group[]>('/api/groups')
        const currentGroup = groups[0]
        if (active && currentGroup) {
          setGroup(currentGroup)
          setDash(await api<Dash>(`/api/groups/${currentGroup.id}/dashboard`))
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load dashboard')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])
  if (loading) return <div className="loading">Loading your workspace…</div>
  if (error) return <div className="error-box" role="alert">{error}</div>
  if (!group || !dash) return <div className="empty">No group is connected to this account yet. Create a workspace group to get started.</div>
  const cards = [
    { title:'Total savings', value:money(dash.total_savings), icon:Wallet },
    { title:'Outstanding loans', value:money(dash.outstanding_loans), icon:CreditCard },
    { title:'Total members', value:String(dash.members), icon:Users },
    { title:'Total loans issued', value:money(dash.total_loans), icon:AlertTriangle },
  ]
  return <>
    <div className="page-header"><div><div className="eyebrow">{group.name}</div><h1>Financial command center</h1><p className="muted">A real-time operating view of contributions, credit and group health.</p></div><Link className="primary-button" to="/contributions?new=1">Record contribution</Link></div>
    <div className="stat-grid">{cards.map(c => <div className="stat-card" key={c.title}><div className="stat-head"><span>{c.title}</span><c.icon size={20}/></div><div className="stat-value">{c.value}</div><div className="trend">Current totals</div></div>)}</div>
    <div className="content-grid two">
      <section className="panel"><div className="panel-head"><div><h2>Savings momentum</h2><p className="muted">Recent contribution activity</p></div></div><div className="mini-chart">{dash.recent_contributions.length ? dash.recent_contributions.map((x,i)=><div className="bar-wrap" key={i}><div className="bar" style={{height:`${Math.max(18, Math.min(160, x.amount/1000))}px`}} /><span>{new Date(x.paid_at).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</span></div>) : <span className="muted">No contributions yet.</span>}</div></section>
      <section className="panel"><div className="panel-head"><div><h2>Member risk signals</h2><p className="muted">Model-assisted member risk indicators</p></div><Link to="/ai">Open AI insights</Link></div><div className="insight-box"><strong>Use insights as decision support</strong><p>Review member contribution histories and model factors before taking action. Risk scores are estimates, not decisions.</p><span className="pill green">Explainable baseline model</span></div></section>
    </div>
  </>
}
