import { useEffect, useState } from 'react'
import { api } from '../lib/api'

interface UserProfile { full_name: string; email: string; phone?: string }

export default function Settings() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadProfile = () => {
    setLoading(true)
    setError('')
    void api<UserProfile>('/api/auth/me')
      .then(setUser)
      .catch(cause => setError(cause instanceof Error ? cause.message : 'Unable to load profile'))
      .finally(() => setLoading(false))
  }

  useEffect(loadProfile, [])

  return <>
    <div className="page-header"><div><h1>Settings</h1><p className="muted">Identity, security and operating controls.</p></div></div>
    {error && <div className="error-box" role="alert">{error} <button className="link-button" onClick={loadProfile}>Retry</button></div>}
    <div className="content-grid two">
      <section className="panel"><h2>Profile</h2>{loading ? <div className="loading">Loading profile…</div> : <><label>Full name<input value={user?.full_name || ''} readOnly /></label><label>Email<input value={user?.email || ''} readOnly /></label><label>Phone<input value={user?.phone || ''} readOnly /></label><p className="muted">Profile editing is not available yet.</p></>}</section>
      <section className="panel"><h2>Security</h2><div className="setting-row"><div><strong>Role-based access</strong><p className="muted">Owners, admins, treasurers, secretaries, auditors and members.</p></div><span className="pill green">Enabled</span></div><div className="setting-row"><div><strong>Audit logging</strong><p className="muted">High-value actions are captured with actor and entity references.</p></div><span className="pill green">Enabled</span></div><div className="setting-row"><div><strong>PWA install</strong><p className="muted">Install from supported mobile or desktop browsers.</p></div><span className="pill blue">Ready</span></div></section>
    </div>
  </>
}
