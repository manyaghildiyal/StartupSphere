export default function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', gap: '1rem',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '3px solid var(--border)',
        borderTopColor: 'var(--purple)',
        animation: 'spin 0.7s linear infinite',
      }} />
      <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
        Verifying session…
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}