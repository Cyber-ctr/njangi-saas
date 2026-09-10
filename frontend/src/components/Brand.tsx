export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <img src="/logo-mark.png" alt="Njangi logo" className="brand-mark" />
      {!compact && (
        <div>
          <div className="brand-name">Njangi</div>
          <div className="brand-tagline">Manage. Grow. Prosper.</div>
        </div>
      )}
    </div>
  )
}
