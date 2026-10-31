import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { ShieldCheck, TriangleAlert } from 'lucide-react'

interface Group { id: number }
interface RiskRow { member_id: number; name: string; risk_score: number; risk_level: string; factors: string[] }

export default function AI() {
  const [rows, setRows] = useState<RiskRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadRisk = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const groups = await api<Group[]>('/api/groups')
      setRows(groups[0] ? (await api<{ members: RiskRow[] }>(`/api/ai/groups/${groups[0].id}/risk`)).members : [])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load risk insights')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadRisk() }, [loadRisk])

  return <>
    <div className="page-header"><div><div className="eyebrow">Explainable ML</div><h1>AI insights & predictions</h1><p className="muted">Use behavior signals to prioritize human follow-up — not to automate sensitive decisions.</p></div><span className="pill blue">Baseline RF v1</span></div>
    {error && <div className="error-box" role="alert">{error} <button className="link-button" onClick={() => void loadRisk()}>Retry</button></div>}
    {loading ? <div className="loading">Calculating member risk signals…</div> : <div className="content-grid two">
      {rows.map(row => <section className="panel" key={row.member_id}><div className="risk-head"><div><h2>{row.name}</h2><span className={`pill ${row.risk_level === 'high' ? 'red' : row.risk_level === 'medium' ? 'amber' : 'green'}`}>{row.risk_level} risk</span></div>{row.risk_level === 'high' ? <TriangleAlert aria-label="High risk" /> : <ShieldCheck aria-label="Low or moderate risk" />}</div><div className="risk-score">{Math.round(row.risk_score)}<span>/100</span></div><ul className="factor-list">{row.factors.map(factor => <li key={factor}>{factor}</li>)}</ul></section>)}
      {!rows.length && <section className="panel empty">No member signals available yet. Add contribution history to activate risk insights.</section>}
    </div>}
  </>
}
