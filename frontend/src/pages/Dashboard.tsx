import { useEffect, useState } from 'react'
import { ArrowUpRight, CreditCard, Users, Wallet, AlertTriangle } from 'lucide-react'
import { api, money } from '../lib/api'

interface Dash { members:number; total_savings:number; total_loans:number; outstanding_loans:number; recent_contributions:{amount:number;paid_at:string}[] }
interface Group { id:number; name:string; contribution_amount:number }

export default function Dashboard() {
  const [dash, setDash] = useState<Dash | null>(null)
  const [group, setGroup] = useState<Group | null>(null)
  useEffect(() => { (async () => { const gs = await api<Group[]>('/api/groups'); const g = gs[0]; if (g) { setGroup(g); setDash(await api<Dash>(`/api/groups/${g.id}/dashboard`)) } })() }, [])
  if (!dash || !group) return <div className="loading">Loading your workspace…</div>
  const cards = [
    { title:'Total savings', value:money(dash.total_savings), icon:Wallet, trend:'+12.4%' },
    { title:'Outstanding loans', value:money(dash.outstanding_loans), icon:CreditCard, trend:'+8.1%' },
    { title:'Total members', value:String(dash.members), icon:Users, trend:'+5.0%' },
    { title:'Loan exposure', value:money(dash.total_loans), icon:AlertTriangle, trend:'Monitor' },
  ]
  return <>
    <div className="page-header"><div><div className="eyebrow">{group.name}</div><h1>Financial command center</h1><p className="muted">A real-time operating view of contributions, credit and group health.</p></div><button className="primary-button">Record contribution</button></div>
    <div className="stat-grid">{cards.map(c => <div className="stat-card" key={c.title}><div className="stat-head"><span>{c.title}</span><c.icon size={20}/></div><div className="stat-value">{c.value}</div><div className="trend"><ArrowUpRight size={15}/>{c.trend}</div></div>)}</div>
    <div className="content-grid two">
      <section className="panel"><div className="panel-head"><div><h2>Savings momentum</h2><p className="muted">Recent contribution activity</p></div></div><div className="mini-chart">{dash.recent_contributions.length ? dash.recent_contributions.map((x,i)=><div className="bar-wrap" key={i}><div className="bar" style={{height:`${Math.max(18, Math.min(160, x.amount/1000))}px`}} /><span>{new Date(x.paid_at).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</span></div>) : <span className="muted">No contributions yet.</span>}</div></section>
      <section className="panel"><div className="panel-head"><div><h2>AI watchlist</h2><p className="muted">Model-assisted member risk signals</p></div><a href="/ai">Open AI</a></div><div className="insight-box"><strong>Next best action</strong><p>Prioritize reminders for members with recurring late contributions before the next payout cycle.</p><span className="pill green">Explainable baseline model</span></div></section>
    </div>
  </>
}
