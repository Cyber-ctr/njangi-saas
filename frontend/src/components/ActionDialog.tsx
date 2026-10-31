import { FormEvent, ReactNode, useEffect } from 'react'

interface ActionDialogProps {
  title: string
  busy: boolean
  error: string
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  children: ReactNode
}

export function ActionDialog({ title, busy, error, onClose, onSubmit, children }: ActionDialogProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [busy, onClose])

  return (
    <div className="dialog-backdrop" onMouseDown={event => {
      if (event.target === event.currentTarget && !busy) onClose()
    }}>
      <form className="panel action-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onSubmit={onSubmit}>
        <div className="panel-head">
          <h2 id="dialog-title">{title}</h2>
          <button type="button" className="secondary-button" onClick={onClose} disabled={busy}>Close</button>
        </div>
        {children}
        {error && <div className="error-box" role="alert">{error}</div>}
        <div className="dialog-actions">
          <button type="button" className="secondary-button" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="primary-button" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  )
}
