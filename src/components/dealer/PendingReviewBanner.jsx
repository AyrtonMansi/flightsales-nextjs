'use client';

// Thin app-wide banner shown when the signed-in user has submitted a
// business / dealer application that's awaiting admin review.
//
// Two conditions satisfy "pending":
//   profiles.pending_dealer === true
//   profiles.role !== 'dealer' && profiles.role !== 'admin'
//
// Once admin approves, role flips to 'dealer' and pending_dealer clears
// (DealerAppsTab.jsx handles that transition); the banner self-hides.
//
// Renders nothing for non-pending users so it's safe to mount globally.

export default function PendingReviewBanner({ user, onContinue }) {
  if (!user?.pending_dealer) return null;
  if (user.role === 'dealer' || user.role === 'admin') return null;

  return (
    <div className="fs-pending-banner" role="status" aria-live="polite">
      <div className="fs-pending-banner-inner">
        <span className="fs-pending-banner-dot" aria-hidden="true" />
        <span className="fs-pending-banner-text">
          <strong>Business application under review.</strong>{' '}
          We&apos;ll email you once approved (typically within 24–48 hours).
          You can browse and save aircraft in the meantime.
        </span>
        {onContinue && (
          <button
            type="button"
            className="fs-pending-banner-action"
            onClick={onContinue}
          >
            View status
          </button>
        )}
      </div>
    </div>
  );
}
