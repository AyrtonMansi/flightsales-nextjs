'use client';
import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AbnVerifyCard from '../dealer/AbnVerifyCard';

// New business signups land here first. We ensure account_type is
// stamped 'business' on the profile (so subsequent gates and the
// dashboard treat them correctly) and then show the ABN verification
// card. Active ABN auto-promotes them to dealer (server-side, in
// /api/abn-verify) and the AbnVerifyCard triggers a page reload that
// drops them into the proper dealer dashboard.
//
// Replaces the legacy multi-field "tell us about your business"
// form. ABN against the ABR is a stronger signal than self-reported
// business name + email, and the rest of the profile data (location,
// phone) is captured in the Business profile tab after promotion.

export default function BusinessOnboarding({ user, onComplete }) {
  // Idempotently stamp account_type='business' on the profile so the
  // dashboard's ABN gate triggers and the role-flip logic recognises
  // them as a business user.
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('profiles')
      .update({ account_type: 'business' })
      .eq('id', user.id)
      .then(() => { /* fire and forget */ });
  }, [user?.id]);

  return (
    <div className="fs-onboard-shell">
      <div className="fs-onboard-card" style={{ maxWidth: 640 }}>
        <div className="fs-onboard-header">
          <span className="fs-onboard-eyebrow">One step to go</span>
          <h1>Verify your business</h1>
          <p>
            We auto-verify dealers against the Australian Business Register
            so buyers know who they&apos;re dealing with. Takes about five
            seconds — no admin review required for an active ABN.
          </p>
        </div>

        <div style={{ marginTop: 24 }}>
          <AbnVerifyCard user={user} />
        </div>

        <p className="fs-onboard-foot" style={{ marginTop: 16 }}>
          Once your ABN comes back <strong>Active</strong>, you&apos;ll be redirected
          to the dealer dashboard automatically.
        </p>

        <div className="fs-onboard-actions" style={{ marginTop: 16, justifyContent: 'flex-start' }}>
          <button
            type="button"
            className="fs-onboard-skip"
            onClick={() => onComplete?.({ skipped: true })}
          >
            I&apos;ll do this later — take me to the dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
