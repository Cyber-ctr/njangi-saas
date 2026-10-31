import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { Brand } from '../components/Brand'

export default function Login() {
  const nav = useNavigate()
  const [email, setEmail] = useState('admin@njangi.local')
  const [password, setPassword] = useState('ChangeMe123!')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true)
    try {
      const data = await api<{ access_token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
      localStorage.setItem('njangi_token', data.access_token)
      nav('/dashboard')
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to sign in') }
    finally { setBusy(false) }
  }
  return <div className="auth-page">
    <div className="auth-card">
      <Brand />
      <h1>Welcome back</h1>
      <p className="muted">Run your community finance operations from one secure workspace.</p>
      <form onSubmit={submit} className="form-stack">
        <label>Email<input value={email} onChange={e => setEmail(e.target.value)} type="email" required /></label>
        <label>Password<input value={password} onChange={e => setPassword(e.target.value)} type="password" required /></label>
        {error && <div className="error-box">{error}</div>}
        <button className="primary-button" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  </div>
}
