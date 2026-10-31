import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { ActionDialog } from '../components/ActionDialog'

interface Member { member_id: number; name: string; email: string; role: string }
interface Group { id: number; name: string }

export default function Members() {
  const [searchParams] = useSearchParams()
  const search = (searchParams.get('search') || '').trim().toLowerCase()
  const [members, setMembers] = useState<Member[]>([])
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogError, setDialogError] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const loadMembers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const groups = await api<Group[]>('/api/groups')
      const currentGroup = groups[0]
      setGroup(currentGroup || null)
      setMembers(currentGroup ? await api<Member[]>(`/api/groups/${currentGroup.id}/members`) : [])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load members')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadMembers() }, [loadMembers])
  const filteredMembers = members.filter(member =>
    `${member.name} ${member.email} ${member.role}`.toLowerCase().includes(search),
  )

  const invite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!group) return
    setBusy(true)
    setDialogError('')
    try {
      await api(`/api/groups/${group.id}/members`, {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), role: 'member' }),
      })
      setDialogOpen(false)
      setEmail('')
      await loadMembers()
    } catch (cause) {
      setDialogError(cause instanceof Error ? cause.message : 'Unable to add member')
    } finally {
      setBusy(false)
    }
  }

  return <>
    <div className="page-header">
      <div><h1>Members</h1><p className="muted">Roster, roles and participation across your njangi.</p></div>
      <button className="primary-button" onClick={() => { setDialogError(''); setDialogOpen(true) }} disabled={!group}>Add registered member</button>
    </div>
    {error && <div className="error-box" role="alert">{error} <button className="link-button" onClick={() => void loadMembers()}>Retry</button></div>}
    <section className="panel">
      {loading ? <div className="loading">Loading members…</div> : <>
        <div className="table-wrap"><table><thead><tr><th>Member</th><th>Email</th><th>Role</th><th>Member ID</th></tr></thead><tbody>
          {filteredMembers.map(member => <tr key={member.member_id}><td><strong>{member.name}</strong></td><td>{member.email}</td><td><span className="pill blue">{member.role}</span></td><td>#{member.member_id}</td></tr>)}
        </tbody></table></div>
        {!filteredMembers.length && <div className="empty">{search ? `No members match “${searchParams.get('search')}”.` : group ? `No members in ${group.name} yet.` : 'No group is connected to this account.'}</div>}
      </>}
    </section>
    {dialogOpen && <ActionDialog title="Add a member" busy={busy} error={dialogError} onClose={() => setDialogOpen(false)} onSubmit={invite}>
      <p className="muted">Add someone who already has an account. They must register before they can be added.</p>
      <label>Email address<input type="email" required autoFocus value={email} onChange={event => setEmail(event.target.value)} /></label>
    </ActionDialog>}
  </>
}
