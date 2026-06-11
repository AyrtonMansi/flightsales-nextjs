export default function NotFoundPage() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center', fontFamily: 'var(--fs-font, system-ui)' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fs-ink-3, #545454)', marginBottom: 16 }}>404</div>
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em', color: 'var(--fs-ink, #000)' }}>Page not found</h1>
      <p style={{ color: 'var(--fs-ink-3, #545454)', marginBottom: 24, maxWidth: 400, lineHeight: 1.5 }}>
        The page you are looking for doesn't exist, or has moved.
      </p>
      <a
        href="/"
        style={{
          padding: '12px 24px',
          background: 'var(--fs-ink, #000)',
          color: 'white',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 600
        }}
      >
        Return home
      </a>
    </div>
  );
}
