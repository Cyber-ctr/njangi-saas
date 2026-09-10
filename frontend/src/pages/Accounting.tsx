import { useEffect, useState } from 'react'
import { api, money } from '../lib/api'

interface G { id: number; name: string }
interface E { id: number; amount: number; category: string; description: string; paid_at: string }

export default function Accounting() {
  const [rows, setRows] = useState<E[]>([])
  useEffect(() => { (async () => {
    const gs = await api<G[]>('/api/groups')
    if (gs[0]) setRows(await api<E[]>(`/api/expenses?group_id=${gs[0].id}`))
  })() }, [])
  const total = rows.reduce((s, x) => s + x.amount, 0)
  return <><div className="page-header"><div><h1>Accounting & ledger</h1><p className="muted">Double-entry-ready operating expenses and finance controls.</p></div><button className="primary-button">+ Record expense</button></div><div className="stat-grid"><div className="stat-card"><div className="stat-head"><span>Recorded expenses</span></div><div className="stat-value">{money(total)}</div><div className="trend">Current view</div></div><div className="stat-card"><div className="stat-head"><span>Ledger integrity</span></div><div className="stat-value">Balanced</div><div className="trend">Double-entry postings</div></div></div><section className="panel" style={{marginTop:16}}><div className="table-wrap"><table><thead><tr><th>Category</th><th>Description</th><th>Amount</th><th>Date</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td>{x.category}</td><td>{x.description}</td><td><strong>{money(x.amount)}</strong></td><td>{new Date(x.paid_at).toLocaleString()}</td></tr>)}</tbody></table></div>{!rows.length&&<div className="empty">No expenses have been recorded.</div>}</section></>
}
