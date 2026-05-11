'use client';
import { Icons } from '../../Icons';

// Discounts tab — promo codes the user has earned. Empty state for
// now until a discounts table lands; the grid markup is preserved so
// switching to live data is a one-line change in DashboardPage.

export default function DiscountsTab({ discounts = [] }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Discounts</h3>
          <p style={{ fontSize: 14, color: 'var(--fs-gray-500)' }}>Your available promo codes</p>
        </div>
      </div>

      {discounts.length === 0 ? (
        <div className="fs-detail-specs" style={{ padding: '64px', textAlign: 'center', borderRadius: 12 }}>
          <div style={{ fontSize: 56, marginBottom: 20, opacity: 0.5 }}>{Icons.gift}</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No discounts</h3>
          <p style={{ fontSize: 15, color: 'var(--fs-gray-500)', maxWidth: 400, margin: '0 auto' }}>
            Check back for special offers and promotions.
          </p>
        </div>
      ) : (
        <div className="fs-grid-2">
          {discounts.map((discount) => (
            <div
              key={discount.id}
              className="fs-detail-specs"
              style={{
                padding: '24px',
                borderRadius: 'var(--fs-radius-lg)',
                position: 'relative',
                opacity: discount.used ? 0.6 : 1,
              }}
            >
              {discount.used && (
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  padding: '4px 8px', background: 'var(--fs-gray-200)',
                  borderRadius: 4, fontSize: 11, fontWeight: 600,
                }}>USED</div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--fs-radius-lg)',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff',
                }}>
                  {Icons.gift}
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700 }}>{discount.discount}</h4>
                  <p style={{ fontSize: 13, color: 'var(--fs-gray-500)' }}>Expires: {discount.expiry}</p>
                </div>
              </div>
              <div style={{
                padding: '12px', background: 'var(--fs-gray-100)',
                borderRadius: 'var(--fs-radius)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <code style={{ fontSize: 14, fontWeight: 600, letterSpacing: 1 }}>{discount.code}</code>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
