import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, money } from '../lib/api'
import { ActionDialog } from '../components/ActionDialog'

interface Group { id: number; name: string }
interface Member { member_id: number; name: string }
interface Contribution { id: number; member: string; amount: number; method: string; paid_at: string }

export default function Contributions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogError, setDialogError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [memberId, setMemberId] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const groups = await api<Group[]>('/api/groups')
      const currentGroup = groups[0]
      setGroup(currentGroup || null)
      if (currentGroup) {
        const [rows, groupMembers] = await Promise.all([
          api<Contribution[]>(`/api/contributions?group_id=${currentGroup.id}`),
          api<Member[]>(`/api/groups/${currentGroup.id}/members`),
        ])
        setContributions(rows)
        setMembers(groupMembers)
      } else {
        setContributions([])
        setMembers([])
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load contributions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadData() }, [loadData])
  useEffect(() => {
    if (searchParams.get('new') === '1' && !loading && group) setDialogOpen(true)
  }, [group, loading, searchParams])

  const closeDialog = () => {
    setDialogOpen(false)
    if (searchParams.has('new')) setSearchParams({}, { replace: true })
  }

  const recordContribution = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!group) return
    setBusy(true)
    setDialogError('')
    try {
      await api('/api/contributions', {
        method: 'POST',
        body: JSON.stringify({ group_id: group.id, member_id: Number(memberId), amount: Number(amount), method }),
      })
      closeDialog()
      setAmount('')
      await loadData()
    } catch (cause) {
      setDialogError(cause instanceof Error ? cause.message : 'Unable to record contribution')
    } finally {
      setBusy(false)
    }
  }

  return <>
    <div className="page-header"><div><h1>Savings & contributions</h1><p className="muted">Track inflows, collection methods and member history.</p></div><button className="primary-button" disabled={!group || !members.length} onClick={() => { setDialogError(''); setDialogOpen(true) }}>+ Record payment</button></div>
    {error && <div className="error-box" role="alert">{error} <button className="link-button" onClick={() => void loadData()}>Retry</button></div>}
    <section className="panel">
      {loading ? <div className="loading">Loading contributions…</div> : <>
        <div className="table-wrap"><table><thead><tr><th>Member</th><th>Amount</th><th>Method</th><th>Paid at</th></tr></thead><tbody>
          {contributions.map(contribution => <tr key={contribution.id}><td>{contribution.member}</td><td><strong>{money(contribution.amount)}</strong></td><td><span className="pill green">{contribution.method}</span></td><td>{new Date(contribution.paid_at).toLocaleString()}</td></tr>)}
        </tbody></table></div>
        {!contributions.length && <div className="empty">{group ? `No contribution records in ${group.name}.` : 'No group is connected to this account.'}</div>}
      </>}
    </section>
    {dialogOpen && <ActionDialog title="Record a contribution" busy={busy} error={dialogError} onClose={closeDialog} onSubmit={recordContribution}>
      {!members.length && <div className="error-box">Add a member to the group before recording a contribution.</div>}
      <label>Member<select required value={memberId} onChange={event => setMemberId(event.target.value)}><option value="">Select a member</option>{members.map(member => <option key={member.member_id} value={member.member_id}>{member.name}</option>)}</select></label>
      <label>Amount<input type="number" min="0.01" step="0.01" required value={amount} onChange={event => setAmount(event.target.value)} /></label>
      <label>Payment method<select value={method} onChange={event => setMethod(event.target.value)}><option value="cash">Cash</option><option value="momo">Mobile money</option><option value="orange">Orange Money</option><option value="bank">Bank transfer</option></select></label>
    </ActionDialog>}
  </>
}
