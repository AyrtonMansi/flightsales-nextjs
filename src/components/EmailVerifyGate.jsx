'use client';
import { supabase } from '../lib/supabase';
import { useState } from 'react';
import { showToast } from '../lib/toast';

// Inline gate that renders ONLY when the supplied user object exists but
// has no email_confirmed_at timestamp. Wraps a child slot — if the gate
// is active, the child is hidden and the user sees the "verify your
// email" prompt with a resend button. If verified (or no user — anon
// flows handle their own gating), the child renders normally.
//
// Usage:
//   <EmailVerifyGate user={user}>
//     <SellForm ... />
//   </EmailVerifyGate>
//
// The check is `user.email_confirmed_at` (Supabase auth user). Some
// older sessions store it as `email_verified` in app_metadata — we
// fall back to either source.
function isVerified(user) {
  if (!user) return true; // not logged in — caller handles separately
  if (user.email_confirmed_at) return true;
  if (user.confirmed_at) return true;
  if (user.app_metadata?.email_verified) return true;
  if (user.user_metadata?.email_verified) return true;
  return false;
}

export default function EmailVerifyGate({ user, children }) {
  const [resending, setResending] = useState(false);

  if (isVerified(user)) return children;

  const resend = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });
      if (error) throw error;
      showToast('Confirmation email sent — check your inbox.');
    } catch (err) {
      showToast(err?.message ? `Failed: ${err.message}` : 'Failed to resend');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fs-verify-gate">
      <h3>Verify your email first</h3>
      <p>
        We sent a confirmation link to <strong>{user.email}</strong>.
        Click it to unlock listing creation, enquiries, and dealer applications.
      </p>
      <p className="fs-verify-gate-sub">
        Didn't get it? Check spam, or{' '}
        <button type="button" onClick={resend} disabled={resending}>
          {resending ? 'sending…' : 'resend'}
        </button>.
      </p>
    </div>
  );
}

export { isVerified };
