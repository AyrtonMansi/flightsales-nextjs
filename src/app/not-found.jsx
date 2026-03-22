export default function NotFoundPage() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: '80px', marginBottom: '16px' }}>✈️</div>
      <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' }}>Page Not Found</h1>
      <p style={{ color: 'var(--fs-gray-500)', marginBottom: '24px', maxWidth: '400px' }}>
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <a href="/" style={{ 
        padding: '12px 24px', 
        background: 'var(--fs-blue)', 
        color: 'white', 
        borderRadius: '8px', 
        textDecoration: 'none',
        fontWeight: 600
      }}>
        Return Home
      </a>
    </div>
  );
}
