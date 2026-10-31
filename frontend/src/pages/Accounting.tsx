import { FormEvent, useCallback, useEffect, useState } from 'react'
import { api, money } from '../lib/api'
import { ActionDialog } from '../components/ActionDialog'

interface Group { id: number; name: string }
interface Expense { id: number; amount: number; category: string; description: string; paid_at: string }

export default function Accounting() {
  const [group, setGroup] = useState<Group | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogError, setDialogError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')

  const loadExpenses = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const groups = await api<Group[]>('/api/groups')
      const currentGroup = groups[0]
      setGroup(currentGroup || null)
      setExpenses(currentGroup ? await api<Expense[]>(`/api/expenses?group_id=${currentGroup.id}`) : [])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load expenses')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadExpenses() }, [loadExpenses])

  const recordExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!group) return
    setBusy(true)
    setDialogError('')
    try {
      await api('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          group_id: group.id,
          amount: Number(amount),
          category: category.trim(),
          description: description.trim(),
        }),
      })
      setDialogOpen(false)
      setAmount('')
      setCategory('')
      setDescription('')
      await loadExpenses()
    } catch (cause) {
      setDialogError(cause instanceof Error ? cause.message : 'Unable to record expense')
    } finally {
      setBusy(false)
    }
  }

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  return <>
    <div className="page-header"><div><h1>Accounting & ledger</h1><p className="muted">Double-entry-ready operating expenses and finance controls.</p></div><button className="primary-button" disabled={!group} onClick={() => { setDialogError(''); setDialogOpen(true) }}>+ Record expense</button></div>
    {error && <div className="error-box" role="alert">{error} <button className="link-button" onClick={() => void loadExpenses()}>Retry</button></div>}
    <div className="stat-grid two-stats"><div className="stat-card"><div className="stat-head"><span>Recorded expenses</span></div><div className="stat-value">{money(total)}</div><div className="trend">{expenses.length} records loaded</div></div></div>
    <section className="panel" style={{ marginTop: 16 }}>
      {loading ? <div className="loading">Loading expenses…</div> : <>
        <div className="table-wrap"><table><thead><tr><th>Category</th><th>Description</th><th>Amount</th><th>Date</th></tr></thead><tbody>
          {expenses.map(expense => <tr key={expense.id}><td>{expense.category}</td><td>{expense.description}</td><td><strong>{money(expense.amount)}</strong></td><td>{new Date(expense.paid_at).toLocaleString()}</td></tr>)}
        </tbody></table></div>
        {!expenses.length && <div className="empty">{group ? `No expenses recorded for ${group.name}.` : 'No group is connected to this account.'}</div>}
      </>}
    </section>
    {dialogOpen && <ActionDialog title="Record an expense" busy={busy} error={dialogError} onClose={() => setDialogOpen(false)} onSubmit={recordExpense}>
      <label>Category<input required minLength={2} maxLength={80} value={category} onChange={event => setCategory(event.target.value)} /></label>
      <label>Description<input required minLength={2} maxLength={255} value={description} onChange={event => setDescription(event.target.value)} /></label>
      <label>Amount<input type="number" min="0.01" step="0.01" required value={amount} onChange={event => setAmount(event.target.value)} /></label>
    </ActionDialog>}
  </>
}
