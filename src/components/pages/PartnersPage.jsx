'use client';
import { useCallback, useEffect, useState } from 'react';
import { useActiveAffiliates } from '../../lib/hooks';
import { AffiliateCard } from '../affiliates/AffiliateCTA';

// Public partner directory. Lists every active affiliate, grouped by
// type. Partners that haven't moved past status='pending' don't appear
// (RLS already filters server-side, this is defence-in-depth).

const SECTIONS = [
  { type: 'finance',     title: 'Aircraft finance',         desc: 'Specialist lenders for piston, turbine, and jet purchases.' },
  { type: 'insurance',   title: 'Insurance',                desc: 'Hull and liability cover from underwriters who know aviation.' },
  { type: 'escrow',      title: 'Escrow & closing',         desc: 'Independent third parties who hold funds and title until both sides are happy.' },
  { type: 'inspection',  title: 'Pre-purchase inspection',  desc: 'Type-rated mechanics who can inspect before you sign.' },
  { type: 'maintenance', title: 'Maintenance & MRO',        desc: 'CASA-approved shops for routine maintenance, annuals, and overhauls.' },
  { type: 'training',    title: 'Training',                 desc: 'Type ratings, transition training, and refresher courses.' },
  { type: 'transport',   title: 'Transport & ferry',        desc: 'Pilots and logistics partners to move your aircraft to its new home.' },
  { type: 'other',       title: 'Other partners',           desc: 'Other services we recommend.' },
];

export default function PartnersPage() {
  // Each Section independently fetches its own type via useActiveAffiliates
  // (a real per-component hook call — required, since Rules of Hooks
  // forbids calling a hook in a loop in the parent). This bit of state
  // lets those 8 independent fetches report their settled status up so
  // the parent can tell "still loading" apart from "genuinely nothing
  // here yet" and show ONE friendly notice instead of a page that's just
  // the hero followed by silence.
  const [statusByType, setStatusByType] = useState({});
  const reportStatus = useCallback((type, loading, count) => {
    setStatusByType((prev) => {
      const existing = prev[type];
      if (existing && existing.loading === loading && existing.count === count) return prev;
      return { ...prev, [type]: { loading, count } };
    });
  }, []);

  const allSettled = SECTIONS.every((s) => statusByType[s.type] && !statusByType[s.type].loading);
  const allEmpty = allSettled && SECTIONS.every((s) => (statusByType[s.type]?.count ?? 0) === 0);

  return (
    <>
      <section className="fs-about-hero">
        <div className="fs-container">
          <p className="fs-hero-eyebrow">
            <span className="fs-hero-eyebrow-dot" />
            Partners we work with
          </p>
          <h1>Buying an aircraft involves more than the aircraft.</h1>
          <p className="fs-hero-sub" style={{ maxWidth: 640 }}>
            We&apos;ve vetted the businesses on this page so you don&apos;t have to start
            from scratch. Click any partner to send them an enquiry — they&apos;ll be
            in touch directly.
          </p>
        </div>
      </section>

      <section className="fs-section">
        <div className="fs-container">
          {SECTIONS.map((s) => (
            <Section key={s.type} {...s} onStatus={reportStatus} />
          ))}
          {allEmpty && (
            <div style={{
              padding: '48px 32px', textAlign: 'center',
              border: '1px solid var(--fs-line)', borderRadius: 'var(--fs-radius-lg)',
              background: 'var(--fs-bg-2)',
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No partners listed yet</h3>
              <p style={{ fontSize: 14, color: 'var(--fs-ink-3)', maxWidth: 480, margin: '0 auto', lineHeight: 1.5 }}>
                We&apos;re onboarding the first wave of finance, insurance, and maintenance
                partners. Check back soon, or <a href="/contact" className="fs-link">get in touch</a> if
                you run a business that should be on this page.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

// Skeleton matching the real .fs-affiliate-card grid areas (logo/body/cta)
// so the loading state doesn't read as a layout shift when data lands.
function AffiliateCardSkeleton() {
  return (
    <div className="fs-affiliate-card" style={{ pointerEvents: 'none' }}>
      <div className="fs-affiliate-card-logo" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="fs-skeleton-shimmer" style={{ position: 'absolute', inset: 0 }} />
      </div>
      <div style={{ gridArea: 'body', minWidth: 0 }}>
        <div className="fs-skeleton-line" style={{ width: '70%', height: 15, marginBottom: 6 }} />
        <div className="fs-skeleton-line" style={{ width: '90%', height: 12 }} />
      </div>
      <div style={{ gridArea: 'cta' }}>
        <div className="fs-skeleton-line" style={{ width: '50%', height: 11 }} />
      </div>
    </div>
  );
}

function Section({ type, title, desc, onStatus }) {
  const { affiliates, loading } = useActiveAffiliates({ type });

  useEffect(() => {
    onStatus(type, loading, affiliates.length);
  }, [type, loading, affiliates.length, onStatus]);

  // Previously this returned null only when !loading && empty — while
  // loading was still true, every section fell through to render its
  // heading + subtitle over an EMPTY grid (affiliates is [] until the
  // fetch resolves), so the page showed eight bare headings with no
  // visible content and no skeleton for however long the query took —
  // reads as broken, not "loading". Now: still-loading sections show a
  // skeleton so the page never looks empty; only a section confirmed to
  // have zero live partners collapses away (the parent's all-empty
  // notice covers the case where every section collapses).
  if (!loading && affiliates.length === 0) return null;
  return (
    <div style={{ marginBottom: 48 }}>
      <h2 className="fs-section-title" style={{ marginBottom: 4 }}>{title}</h2>
      <p className="fs-section-sub" style={{ marginBottom: 20 }}>{desc}</p>
      <div className="fs-affiliate-grid">
        {loading
          ? [1, 2].map((i) => <AffiliateCardSkeleton key={i} />)
          : affiliates.map((p) => <AffiliateCard key={p.id} partner={p} />)}
      </div>
    </div>
  );
}
