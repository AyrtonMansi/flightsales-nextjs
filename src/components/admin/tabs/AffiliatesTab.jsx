'use client';
import { useState } from 'react';
import { useAffiliates, useAffiliateLeads } from '../../../lib/hooks';
import { Icons } from '../../Icons';
import { showToast } from '../../../lib/toast';
import StatusBadge from '../StatusBadge';
import ConfirmDialog from '../ConfirmDialog';

// Two views in one tab — partner CRUD on the left, lead pipeline on
// the right. Top tab-switcher keeps both reachable without a second
// admin route.

const TYPES = [
  { value: 'finance',     label: 'Finance' },
  { value: 'insurance',   label: 'Insurance' },
  { value: 'escrow',      label: 'Escrow' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'training',    label: 'Training' },
  { value: 'inspection',  label: 'Pre-purchase inspection' },
  { value: 'transport',   label: 'Transport / ferry' },
  { value: 'other',       label: 'Other' },
];

const DELIVERY_METHODS = [
  { value: 'email',   label: 'Email — partner receives lead at lead_email' },
  { value: 'webhook', label: 'Webhook — POST JSON to lead_webhook_url' },
  { value: 'api',     label: 'API — POST to api_endpoint_url with Bearer auth' },
];

export default function AffiliatesTab() {
  const [subTab, setSubTab] = useState('partners'); // 'partners' | 'leads'

  return (
    <div>
      <div className="fs-admin-subtabs" role="tablist">
        <button
          role="tab"
          aria-selected={subTab === 'partners'}
          className={`fs-admin-subtab${subTab === 'partners' ? ' on' : ''}`}
          onClick={() => setSubTab('partners')}
        >Partners</button>
        <button
          role="tab"
          aria-selected={subTab === 'leads'}
          className={`fs-admin-subtab${subTab === 'leads' ? ' on' : ''}`}
          onClick={() => setSubTab('leads')}
        >Lead pipeline</button>
      </div>

      {subTab === 'partners' ? <PartnersList /> : <LeadsPipeline />}
    </div>
  );
}

function PartnersList() {
  const { affiliates, loading, create, update, remove } = useAffiliates();
  const [editing, setEditing] = useState(null);   // partner row or 'new'
  const [confirmDelete, setConfirmDelete] = useState(null);

  if (loading && affiliates.length === 0) {
    return <p style={{ padding: 24, color: 'var(--fs-ink-3)' }}>Loading affiliates…</p>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ color: 'var(--fs-ink-3)', fontSize: 14, margin: 0 }}>
          {affiliates.length} partner{affiliates.length === 1 ? '' : 's'} —
          {' '}{affiliates.filter(a => a.status === 'active').length} active.
        </p>
        <button className="fs-form-submit" onClick={() => setEditing('new')}>
          + New partner
        </button>
      </div>

      <div className="fs-admin-table">
        <div className="fs-admin-table-row fs-admin-table-head">
          <div style={{ flex: '1 1 200px' }}>Partner</div>
          <div style={{ width: 110 }}>Type</div>
          <div style={{ width: 90 }}>Status</div>
          <div style={{ width: 90 }}>Method</div>
          <div style={{ width: 80, textAlign: 'right' }}>Priority</div>
          <div style={{ width: 60 }} />
        </div>
        {affiliates.map((a) => (
          <div key={a.id} className="fs-admin-table-row">
            <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: 10 }}>
              {a.logo_url ? (
                <img src={a.logo_url} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain', background: '#fff', border: '1px solid var(--fs-line)' }} />
              ) : (
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--fs-bg-2)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 600, color: 'var(--fs-ink-3)' }}>
                  {a.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 600 }}>{a.name}</div>
                <div style={{ fontSize: 12, color: 'var(--fs-ink-4)' }}>{a.slug}</div>
              </div>
            </div>
            <div style={{ width: 110, fontSize: 13, color: 'var(--fs-ink-3)' }}>
              {TYPES.find(t => t.value === a.type)?.label || a.type}
            </div>
            <div style={{ width: 90 }}>
              <StatusBadge status={a.status} />
            </div>
            <div style={{ width: 90, fontSize: 12, color: 'var(--fs-ink-3)' }}>
              {a.lead_capture_method}
            </div>
            <div style={{ width: 80, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
              {a.display_priority}
            </div>
            <div style={{ width: 60, textAlign: 'right' }}>
              <button
                onClick={() => setEditing(a)}
                style={{ background: 'none', border: 0, padding: '4px 8px', color: 'var(--fs-ink)', cursor: 'pointer', fontSize: 13 }}
              >Edit</button>
            </div>
          </div>
        ))}
        {affiliates.length === 0 && (
          <p style={{ padding: 24, textAlign: 'center', color: 'var(--fs-ink-3)' }}>
            No partners yet. Click <strong>+ New partner</strong> to add your first.
          </p>
        )}
      </div>

      {editing && (
        <PartnerEditor
          partner={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={async (patch) => {
            try {
              if (editing === 'new') {
                await create(patch);
                showToast('Partner created');
              } else {
                await update(editing.id, patch);
                showToast('Partner updated');
              }
              setEditing(null);
            } catch (err) {
              showToast(err.message || 'Save failed');
            }
          }}
          onDelete={editing !== 'new' ? () => setConfirmDelete(editing) : null}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete partner?"
          message={`This will permanently remove ${confirmDelete.name} and all of their lead history.`}
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            try {
              await remove(confirmDelete.id);
              showToast('Partner deleted');
              setConfirmDelete(null);
              setEditing(null);
            } catch (err) {
              showToast(err.message || 'Delete failed');
            }
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

function PartnerEditor({ partner, onClose, onSave, onDelete }) {
  const [f, setF] = useState({
    slug:                  partner?.slug                  || '',
    name:                  partner?.name                  || '',
    type:                  partner?.type                  || 'finance',
    status:                partner?.status                || 'pending',
    logo_url:              partner?.logo_url              || '',
    website_url:           partner?.website_url           || '',
    description:           partner?.description           || '',
    cta_text:              partner?.cta_text              || 'Get a quote',
    min_listing_price:     partner?.min_listing_price     || '',
    max_listing_price:     partner?.max_listing_price     || '',
    categories:            (partner?.categories || []).join(', '),
    states:                (partner?.states     || []).join(', '),
    display_priority:      partner?.display_priority      ?? 100,
    lead_capture_method:   partner?.lead_capture_method   || 'email',
    lead_email:            partner?.lead_email            || '',
    lead_webhook_url:      partner?.lead_webhook_url      || '',
    api_endpoint_url:      partner?.api_endpoint_url      || '',
    api_credential_secret: partner?.api_credential_secret || '',
    commission_pct:        partner?.commission_pct        || '',
    contract_url:          partner?.contract_url          || '',
    contact_name:          partner?.contact_name          || '',
    contact_email:         partner?.contact_email         || '',
    notes:                 partner?.notes                 || '',
  });

  const set = (k, v) => setF((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!f.slug.trim() || !f.name.trim()) {
      showToast('Slug and name are required');
      return;
    }
    onSave({
      slug: f.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
      name: f.name.trim(),
      type: f.type,
      status: f.status,
      logo_url: f.logo_url.trim() || null,
      website_url: f.website_url.trim() || null,
      description: f.description.trim() || null,
      cta_text: f.cta_text.trim() || null,
      min_listing_price: f.min_listing_price ? Number(f.min_listing_price) : null,
      max_listing_price: f.max_listing_price ? Number(f.max_listing_price) : null,
      categories: f.categories.split(',').map(s => s.trim()).filter(Boolean),
      states:     f.states.split(',').map(s => s.trim()).filter(Boolean),
      display_priority: Number(f.display_priority) || 100,
      lead_capture_method: f.lead_capture_method,
      lead_email: f.lead_email.trim() || null,
      lead_webhook_url: f.lead_webhook_url.trim() || null,
      api_endpoint_url: f.api_endpoint_url.trim() || null,
      api_credential_secret: f.api_credential_secret.trim() || null,
      commission_pct: f.commission_pct ? Number(f.commission_pct) : null,
      contract_url: f.contract_url.trim() || null,
      contact_name: f.contact_name.trim() || null,
      contact_email: f.contact_email.trim() || null,
      notes: f.notes.trim() || null,
    });
  };

  return (
    <div className="fs-modal-backdrop" onClick={onClose}>
      <div className="fs-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
        <div className="fs-modal-header">
          <h3>{partner ? `Edit: ${partner.name}` : 'New partner'}</h3>
          <button onClick={onClose} aria-label="Close">{Icons.x}</button>
        </div>
        <form onSubmit={handleSubmit} className="fs-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Section title="Identity">
            <Row>
              <Field label="Name *">
                <input className="fs-form-input" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Aircraft Finance Australia" required />
              </Field>
              <Field label="Slug *">
                <input className="fs-form-input" value={f.slug} onChange={(e) => set('slug', e.target.value)} placeholder="aircraft-finance-au" required />
              </Field>
            </Row>
            <Row>
              <Field label="Type">
                <select className="fs-form-select" value={f.type} onChange={(e) => set('type', e.target.value)}>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select className="fs-form-select" value={f.status} onChange={(e) => set('status', e.target.value)}>
                  <option value="pending">Pending — not yet live</option>
                  <option value="active">Active — CTAs visible to users</option>
                  <option value="paused">Paused — temporarily hidden</option>
                  <option value="terminated">Terminated — archived</option>
                </select>
              </Field>
            </Row>
          </Section>

          <Section title="Public branding">
            <Row>
              <Field label="Logo URL">
                <input className="fs-form-input" value={f.logo_url} onChange={(e) => set('logo_url', e.target.value)} placeholder="https://…/logo.svg" />
              </Field>
              <Field label="Website">
                <input className="fs-form-input" value={f.website_url} onChange={(e) => set('website_url', e.target.value)} placeholder="https://example.com" />
              </Field>
            </Row>
            <Field label="Description (shown on partner card)">
              <textarea className="fs-form-input" rows={2} value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="Specialist aircraft finance — pre-approval in 24h." />
            </Field>
            <Field label="Call to action text">
              <input className="fs-form-input" value={f.cta_text} onChange={(e) => set('cta_text', e.target.value)} placeholder="Get a finance quote" />
            </Field>
          </Section>

          <Section title="Targeting (when this CTA appears)">
            <Row>
              <Field label="Min listing price">
                <input className="fs-form-input" type="number" value={f.min_listing_price} onChange={(e) => set('min_listing_price', e.target.value)} placeholder="100000" />
              </Field>
              <Field label="Max listing price">
                <input className="fs-form-input" type="number" value={f.max_listing_price} onChange={(e) => set('max_listing_price', e.target.value)} placeholder="5000000" />
              </Field>
              <Field label="Display priority">
                <input className="fs-form-input" type="number" value={f.display_priority} onChange={(e) => set('display_priority', e.target.value)} />
              </Field>
            </Row>
            <Field label="Categories (comma-separated, blank = all)">
              <input className="fs-form-input" value={f.categories} onChange={(e) => set('categories', e.target.value)} placeholder="Single Engine Piston, Multi Engine Piston, Turboprop" />
            </Field>
            <Field label="States (comma-separated AU codes, blank = all)">
              <input className="fs-form-input" value={f.states} onChange={(e) => set('states', e.target.value)} placeholder="NSW, VIC, QLD" />
            </Field>
          </Section>

          <Section title="Lead delivery">
            <Field label="Method">
              <select className="fs-form-select" value={f.lead_capture_method} onChange={(e) => set('lead_capture_method', e.target.value)}>
                {DELIVERY_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </Field>
            {f.lead_capture_method === 'email' && (
              <Field label="Lead email *">
                <input className="fs-form-input" type="email" value={f.lead_email} onChange={(e) => set('lead_email', e.target.value)} placeholder="leads@partner.com" />
              </Field>
            )}
            {f.lead_capture_method === 'webhook' && (
              <Field label="Webhook URL *">
                <input className="fs-form-input" value={f.lead_webhook_url} onChange={(e) => set('lead_webhook_url', e.target.value)} placeholder="https://partner.com/api/leads" />
              </Field>
            )}
            {f.lead_capture_method === 'api' && (
              <>
                <Field label="API endpoint *">
                  <input className="fs-form-input" value={f.api_endpoint_url} onChange={(e) => set('api_endpoint_url', e.target.value)} placeholder="https://partner.com/api/v1/leads" />
                </Field>
                <Field label="API credential (Bearer token, encrypted at rest)">
                  <input className="fs-form-input" type="password" value={f.api_credential_secret} onChange={(e) => set('api_credential_secret', e.target.value)} />
                </Field>
              </>
            )}
          </Section>

          <Section title="Business terms">
            <Row>
              <Field label="Commission %">
                <input className="fs-form-input" type="number" step="0.01" value={f.commission_pct} onChange={(e) => set('commission_pct', e.target.value)} placeholder="2.50" />
              </Field>
              <Field label="Contract URL">
                <input className="fs-form-input" value={f.contract_url} onChange={(e) => set('contract_url', e.target.value)} placeholder="https://…/agreement.pdf" />
              </Field>
            </Row>
            <Row>
              <Field label="Contact name">
                <input className="fs-form-input" value={f.contact_name} onChange={(e) => set('contact_name', e.target.value)} />
              </Field>
              <Field label="Contact email">
                <input className="fs-form-input" type="email" value={f.contact_email} onChange={(e) => set('contact_email', e.target.value)} />
              </Field>
            </Row>
            <Field label="Internal notes (admin-only)">
              <textarea className="fs-form-input" rows={2} value={f.notes} onChange={(e) => set('notes', e.target.value)} />
            </Field>
          </Section>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            {onDelete ? (
              <button type="button" onClick={onDelete} style={{ background: 'none', border: 0, color: 'var(--fs-red)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                Delete partner
              </button>
            ) : <span />}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={onClose} className="fs-form-cancel">Cancel</button>
              <button type="submit" className="fs-form-submit">{partner ? 'Save changes' : 'Create partner'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ borderTop: '1px solid var(--fs-line)', paddingTop: 14 }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fs-ink-3)', margin: '0 0 10px' }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  );
}
function Row({ children }) { return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${children?.length || 1}, minmax(0, 1fr))`, gap: 10 }}>{children}</div>; }
function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--fs-ink-3)' }}>
      <span style={{ fontWeight: 600, color: 'var(--fs-ink)' }}>{label}</span>
      {children}
    </label>
  );
}

// ── Lead pipeline ───────────────────────────────────────────────
const LEAD_STATUSES = [
  { value: 'sent',       label: 'New' },
  { value: 'contacted',  label: 'Contacted' },
  { value: 'quoted',     label: 'Quoted' },
  { value: 'converted',  label: 'Converted' },
  { value: 'dead',       label: 'Dead' },
];

function LeadsPipeline() {
  const { leads, loading, updateStatus } = useAffiliateLeads();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? leads
    : leads.filter((l) => l.status === filter);

  if (loading && leads.length === 0) {
    return <p style={{ padding: 24, color: 'var(--fs-ink-3)' }}>Loading leads…</p>;
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
          All ({leads.length})
        </FilterChip>
        {LEAD_STATUSES.map(s => (
          <FilterChip
            key={s.value}
            active={filter === s.value}
            onClick={() => setFilter(s.value)}
          >
            {s.label} ({leads.filter(l => l.status === s.value).length})
          </FilterChip>
        ))}
      </div>

      <div className="fs-admin-table">
        <div className="fs-admin-table-row fs-admin-table-head">
          <div style={{ flex: '1 1 200px' }}>Buyer</div>
          <div style={{ width: 140 }}>Partner</div>
          <div style={{ width: 110 }}>Status</div>
          <div style={{ width: 100 }}>Delivery</div>
          <div style={{ width: 110, textAlign: 'right' }}>Submitted</div>
        </div>
        {filtered.map(lead => (
          <div key={lead.id} className="fs-admin-table-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
              <div style={{ flex: '1 1 200px' }}>
                <div style={{ fontWeight: 600 }}>{lead.user_name}</div>
                <div style={{ fontSize: 12, color: 'var(--fs-ink-3)' }}>
                  {lead.user_email}{lead.user_phone ? ` · ${lead.user_phone}` : ''}
                </div>
              </div>
              <div style={{ width: 140, fontSize: 13 }}>
                {lead.affiliate?.name || '—'}
                <div style={{ fontSize: 11, color: 'var(--fs-ink-4)' }}>{lead.affiliate?.type}</div>
              </div>
              <div style={{ width: 110 }}>
                <select
                  value={lead.status}
                  onChange={(e) => updateStatus(lead.id, { status: e.target.value })}
                  style={{ width: '100%', padding: '4px 6px', fontSize: 12, border: '1px solid var(--fs-line)', borderRadius: 6 }}
                >
                  {LEAD_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div style={{ width: 100 }}>
                <StatusBadge status={lead.delivery_status} />
              </div>
              <div style={{ width: 110, textAlign: 'right', fontSize: 12, color: 'var(--fs-ink-3)' }}>
                {new Date(lead.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
              </div>
            </div>
            {(lead.message || lead.delivery_error || lead.status === 'converted') && (
              <div style={{ paddingLeft: 0, fontSize: 13 }}>
                {lead.message && (
                  <p style={{ margin: '2px 0', color: 'var(--fs-ink-3)' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--fs-ink-4)' }}>Message: </span>
                    {lead.message}
                  </p>
                )}
                {lead.delivery_error && (
                  <p style={{ margin: '2px 0', color: 'var(--fs-red)' }}>
                    Delivery error: {lead.delivery_error}
                  </p>
                )}
                {lead.status === 'converted' && (
                  <ConvertedFields lead={lead} updateStatus={updateStatus} />
                )}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p style={{ padding: 24, textAlign: 'center', color: 'var(--fs-ink-3)' }}>
            No leads {filter === 'all' ? 'yet' : `with status "${filter}"`}.
          </p>
        )}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 999,
        border: '1px solid ' + (active ? 'var(--fs-ink)' : 'var(--fs-line)'),
        background: active ? 'var(--fs-ink)' : 'var(--fs-white)',
        color: active ? 'var(--fs-white)' : 'var(--fs-ink)',
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
      }}
    >{children}</button>
  );
}

function ConvertedFields({ lead, updateStatus }) {
  const [val,  setVal]  = useState(lead.conversion_value  || '');
  const [comm, setComm] = useState(lead.commission_amount || '');

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--fs-ink-4)' }}>Conversion</span>
      <input
        type="number"
        placeholder="Deal $"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => updateStatus(lead.id, { conversion_value: val ? Number(val) : null })}
        style={{ width: 110, padding: '4px 6px', fontSize: 12, border: '1px solid var(--fs-line)', borderRadius: 6 }}
      />
      <input
        type="number"
        placeholder="Commission $"
        value={comm}
        onChange={(e) => setComm(e.target.value)}
        onBlur={() => updateStatus(lead.id, { commission_amount: comm ? Number(comm) : null })}
        style={{ width: 110, padding: '4px 6px', fontSize: 12, border: '1px solid var(--fs-line)', borderRadius: 6 }}
      />
    </div>
  );
}
