'use client';
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
          {SECTIONS.map((s) => <Section key={s.type} {...s} />)}
        </div>
      </section>
    </>
  );
}

function Section({ type, title, desc }) {
  const { affiliates, loading } = useActiveAffiliates({ type });
  if (!loading && affiliates.length === 0) return null;
  return (
    <div style={{ marginBottom: 48 }}>
      <h2 className="fs-section-title" style={{ marginBottom: 4 }}>{title}</h2>
      <p className="fs-section-sub" style={{ marginBottom: 20 }}>{desc}</p>
      <div className="fs-affiliate-grid">
        {affiliates.map((p) => (
          <AffiliateCard key={p.id} partner={p} />
        ))}
      </div>
    </div>
  );
}
