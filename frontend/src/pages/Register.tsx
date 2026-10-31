import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { Brand } from '../components/Brand'

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [group, setGroup] = useState('My Njangi Circle')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const token = await api<{ access_token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ full_name: name, email, password }),
      })
      localStorage.setItem('njangi_token', token.access_token)
      const organization = await api<{ id: number }>('/api/organizations?name=' + encodeURIComponent(group.trim() || 'My Njangi Circle'), { method: 'POST' })
      await api('/api/groups', {
        method: 'POST',
        body: JSON.stringify({
          organization_id: organization.id,
          name: group.trim() || 'My Njangi Circle',
          contribution_amount: 0,
          contribution_frequency: 'monthly',
          payout_cycle: 'monthly',
        }),
      })
      navigate('/dashboard')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create account')
    } finally {
      setBusy(false)
    }
  }

  return <div className="auth-page"><div className="auth-card"><Brand /><h1>Create your workspace</h1><p className="muted">Start with a secure account and then configure your community finance group.</p>
    <form className="form-stack" onSubmit={submit}>
      <label>Full name<input required minLength={2} maxLength={120} value={name} onChange={event => setName(event.target.value)} /></label>
      <label>Email<input required type="email" value={email} onChange={event => setEmail(event.target.value)} /></label>
      <label>Password<input required minLength={8} maxLength={72} type="password" value={password} onChange={event => setPassword(event.target.value)} /></label>
      <label>Group name<input minLength={2} maxLength={160} value={group} onChange={event => setGroup(event.target.value)} /></label>
      {error && <div className="error-box" role="alert">{error}</div>}
      <button className="primary-button" disabled={busy}>{busy ? 'Creating workspace…' : 'Create account'}</button>
      <button type="button" className="link-button" disabled={busy} onClick={() => navigate('/login')}>Already have an account? Sign in</button>
    </form>
  </div></div>
}
