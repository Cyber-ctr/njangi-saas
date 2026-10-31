import { FormEvent, useCallback, useEffect, useState } from 'react'
import { api, money } from '../lib/api'
import { ActionDialog } from '../components/ActionDialog'

interface Group { id: number; name: string }
interface Member { member_id: number; name: string }
interface Loan { id: number; borrower: string; principal: number; outstanding: number; status: string; purpose: string }

export default function Loans() {
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogError, setDialogError] = useState('')
  const [busy, setBusy] = useState(false)
  const [dialog, setDialog] = useState<'create' | 'repay' | null>(null)
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [borrowerId, setBorrowerId] = useState('')
  const [principal, setPrincipal] = useState('')
  const [purpose, setPurpose] = useState('')
  const [interestRate, setInterestRate] = useState('0')
  const [termMonths, setTermMonths] = useState('1')
  const [repayment, setRepayment] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const groups = await api<Group[]>('/api/groups')
      const currentGroup = groups[0]
      setGroup(currentGroup || null)
      if (currentGroup) {
        const [rows, groupMembers] = await Promise.all([
          api<Loan[]>(`/api/loans?group_id=${currentGroup.id}`),
          api<Member[]>(`/api/groups/${currentGroup.id}/members`),
        ])
        setLoans(rows)
        setMembers(groupMembers)
      } else {
        setLoans([])
        setMembers([])
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load loans')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadData() }, [loadData])

  const closeDialog = () => {
    setDialog(null)
    setSelectedLoan(null)
    setDialogError('')
  }

  const submitLoan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!group) return
    setBusy(true)
    setDialogError('')
    try {
      await api('/api/loans', {
        method: 'POST',
        body: JSON.stringify({
          group_id: group.id,
          borrower_id: Number(borrowerId),
          principal: Number(principal),
          interest_rate: Number(interestRate),
          term_months: Number(termMonths),
          purpose: purpose.trim() || 'General',
        }),
      })
      closeDialog()
      setPrincipal('')
      setPurpose('')
      await loadData()
    } catch (cause) {
      setDialogError(cause instanceof Error ? cause.message : 'Unable to create loan')
    } finally {
      setBusy(false)
    }
  }

  const submitRepayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedLoan) return
    setBusy(true)
    setDialogError('')
    try {
      await api(`/api/loans/${selectedLoan.id}/repay`, {
        method: 'POST',
        body: JSON.stringify({ amount: Number(repayment) }),
      })
      closeDialog()
      setRepayment('')
      await loadData()
    } catch (cause) {
      setDialogError(cause instanceof Error ? cause.message : 'Unable to record repayment')
    } finally {
      setBusy(false)
    }
  }

  return <>
    <div className="page-header"><div><h1>Loans & credit</h1><p className="muted">Originate, monitor and collect member credit from one ledger-backed workflow.</p></div><button className="primary-button" disabled={!group || !members.length} onClick={() => { setDialogError(''); setDialog('create') }}>+ New loan</button></div>
    {error && <div className="error-box" role="alert">{error} <button className="link-button" onClick={() => void loadData()}>Retry</button></div>}
    <section className="panel">
      {loading ? <div className="loading">Loading loans…</div> : <>
        <div className="table-wrap"><table><thead><tr><th>Borrower</th><th>Principal</th><th>Outstanding</th><th>Purpose</th><th>Status</th><th>Action</th></tr></thead><tbody>
          {loans.map(loan => <tr key={loan.id}><td>{loan.borrower}</td><td>{money(loan.principal)}</td><td><strong>{money(loan.outstanding)}</strong></td><td>{loan.purpose}</td><td><span className={`pill ${loan.status === 'repaid' ? 'green' : 'amber'}`}>{loan.status}</span></td><td>{loan.status === 'active' && <button className="link-button" onClick={() => { setSelectedLoan(loan); setDialogError(''); setDialog('repay') }}>Record repayment</button>}</td></tr>)}
        </tbody></table></div>
        {!loans.length && <div className="empty">{group ? `No loans recorded for ${group.name}.` : 'No group is connected to this account.'}</div>}
      </>}
    </section>
    {dialog === 'create' && <ActionDialog title="Create a loan" busy={busy} error={dialogError} onClose={closeDialog} onSubmit={submitLoan}>
      <label>Borrower<select required value={borrowerId} onChange={event => setBorrowerId(event.target.value)}><option value="">Select a member</option>{members.map(member => <option key={member.member_id} value={member.member_id}>{member.name}</option>)}</select></label>
      <label>Principal amount<input type="number" min="0.01" step="0.01" required value={principal} onChange={event => setPrincipal(event.target.value)} /></label>
      <label>Interest rate (%)<input type="number" min="0" max="100" step="0.01" value={interestRate} onChange={event => setInterestRate(event.target.value)} /></label>
      <label>Term (months)<input type="number" min="1" max="120" required value={termMonths} onChange={event => setTermMonths(event.target.value)} /></label>
      <label>Purpose<input maxLength={120} value={purpose} onChange={event => setPurpose(event.target.value)} /></label>
    </ActionDialog>}
    {dialog === 'repay' && selectedLoan && <ActionDialog title={`Record repayment · ${selectedLoan.borrower}`} busy={busy} error={dialogError} onClose={closeDialog} onSubmit={submitRepayment}>
      <p className="muted">Outstanding balance: {money(selectedLoan.outstanding)}</p>
      <label>Repayment amount<input type="number" min="0.01" max={selectedLoan.outstanding} step="0.01" required value={repayment} onChange={event => setRepayment(event.target.value)} /></label>
    </ActionDialog>}
  </>
}
