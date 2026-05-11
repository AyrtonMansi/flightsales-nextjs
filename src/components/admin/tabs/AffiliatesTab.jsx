'use client';
import { Fragment, useMemo, useState } from 'react';
import { useAffiliates, useAffiliateLeads } from '../../../lib/hooks';
import { Icons } from '../../Icons';
import { showToast } from '../../../lib/toast';
import StatusBadge from '../StatusBadge';
import ConfirmDialog from '../ConfirmDialog';
import useTableState from '../../../lib/useTableState';
import AdminTableToolbar, { SortHeader, Pager } from '../AdminTableToolbar';

// Two views in one tab — partner CRUD on the left, lead pipeline on
// the right. Top sub-tab switcher keeps both reachable without a
// second admin route. Both lists use the same useTableState +
// AdminTableToolbar + <table> + Pager pattern as the rest of /admin.

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

const LEAD_STATUSES = [
  { value: 'sent',       label: 'New' },
  { value: 'contacted',  label: 'Contacted' },
  { value: 'quoted',     label: 'Quoted' },
  { value: 'converted',  label: 'Converted' },
  { value: 'dead',       label: 'Dead' },
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

// ── Partners list ───────────────────────────────────────────────────

function PartnersList() {
  const { affiliates, loading, create, update, remove } = useAffiliates();
  const [editing, setEditing] = useState(null);   // partner row or 'new'
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  // Status counts power the toolbar pill row.
  const counts = useMemo(() => ({
    all:        affiliates.length,
    active:     affiliates.filter(a => a.status === 'active').length,
    pending:    affiliates.filter(a => a.status === 'pending').length,
    paused:     affiliates.filter(a => a.status === 'paused').length,
    terminated: affiliates.filter(a => a.status === 'terminated').length,
  }), [affiliates]);

  const filteredByStatus = useMemo(() => {
    if (statusFilter === 'all') return affiliates;
    return affiliates.filter(a => a.status === statusFilter);
  }, [affiliates, statusFilter]);

  const t = useTableState(filteredByStatus, {
    pageSize: 25,
    searchFields: ['name', 'slug', 'type', 'contact_email'],
    defaultSort: { field: 'display_priority', direction: 'asc' },
  });

  // Quick-toggle pause/active without opening the editor — the most
  // common admin action on a configured partner is "turn this CTA
  // off temporarily" or "turn it back on", so we surface it inline.
  const quickToggleStatus = async (partner) => {
    const next = partner.status === 'active' ? 'paused' : 'active';
    try {
      await update(partner.id, { status: next });
      showToast(next === 'active' ? `${partner.name} resumed` : `${partner.name} paused`);
    } catch (err) {
      showToast(err?.message ? `Failed: ${err.message}` : 'Failed');
    }
  };

  return (
    <>
      <AdminTableToolbar
        search={t.search} onSearch={t.setSearch}
        placeholder="Search by name, slug, type, contact email…"
        statusOptions={[
          { value: 'all',        label: 'All',        count: counts.all },
          { value: 'active',     label: 'Active',     count: counts.active },
          { value: 'pending',    label: 'Pending',    count: counts.pending },
          { value: 'paused',     label: 'Paused',     count: counts.paused },
          { value: 'terminated', label: 'Terminated', count: counts.terminated },
        ]}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        filteredCount={t.filteredCount}
        totalCount={affiliates.length}
        right={
          <button className="fs-form-submit fs-confirm-btn-sm" onClick={() => setEditing('new')}>
            + New partner
          </button>
        }
      />

      {loading && affiliates.length === 0 ? (
        <div className="fs-admin-loading">Loading partners…</div>
      ) : t.filteredCount === 0 ? (
        <div className="fs-admin-empty">
          <h3>No partners {statusFilter !== 'all' ? `with status "${statusFilter}"` : 'yet'}</h3>
          {affiliates.length === 0 && (
            <p>Click <strong>+ New partner</strong> to add the first finance, insurance, or service partner.</p>
          )}
        </div>
      ) : (
        <div className="fs-admin-tablewrap">
          <table className="fs-admin-table">
            <thead>
              <tr>
                <SortHeader field="name"             sort={t.sort} onSortChange={t.setSort}>Partner</SortHeader>
                <SortHeader field="type"             sort={t.sort} onSortChange={t.setSort}>Type</SortHeader>
                <SortHeader field="status"           sort={t.sort} onSortChange={t.setSort}>Status</SortHeader>
                <th>Delivery</th>
                <SortHeader field="display_priority" sort={t.sort} onSortChange={t.setSort} align="right">Priority</SortHeader>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {t.pageRows.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {a.logo_url ? (
                        <img
                          src={a.logo_url}
                          alt=""
                          style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain', background: '#fff', border: '1px solid var(--fs-line)', flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--fs-bg-2)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 600, color: 'var(--fs-ink-3)', flexShrink: 0 }}>
                          {a.name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <p className="fs-admin-cell-strong">{a.name}</p>
                        <p className="fs-admin-cell-muted">{a.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="fs-admin-cell-muted">
                    {TYPES.find(t => t.value === a.type)?.label || a.type}
                  </td>
                  <td><StatusBadge status={a.status} /></td>
                  <td className="fs-admin-cell-muted" style={{ fontSize: 12 }}>
                    {a.lead_capture_method}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {a.display_priority}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="fs-admin-row-actions">
                      {(a.status === 'active' || a.status === 'paused') && (
                        <button
                          type="button"
                          className="fs-confirm-btn fs-confirm-btn-secondary fs-confirm-btn-sm"
                          onClick={() => quickToggleStatus(a)}
                        >
                          {a.status === 'active' ? 'Pause' : 'Resume'}
                        </button>
                      )}
                      <button
                        type="button"
                        className="fs-confirm-btn fs-confirm-btn-secondary fs-confirm-btn-sm"
                        onClick={() => setEditing(a)}
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager page={t.page} totalPages={t.totalPages} onChange={t.setPage} />
        </div>
      )}

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

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete partner?"
        message={confirmDelete ? `This will permanently remove ${confirmDelete.name} and unlink every lead history row pointing at it. Existing lead rows stay (FK is SET NULL).` : ''}
        confirmLabel="Delete partner"
        destructive
        onConfirm={async () => {
          if (!confirmDelete) return;
          try {
            await remove(confirmDelete.id);
            showToast('Partner deleted');
            setConfirmDelete(null);
            setEditing(null);
          } catch (err) {
            showToast(err.message || 'Delete failed');
          }
        }}
      />
    </>
  );
}

// ── Partner editor (modal) — preserved from previous implementation ──

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

// ── Lead pipeline ───────────────────────────────────────────────────

function LeadsPipeline() {
  const { leads, loading, updateStatus } = useAffiliateLeads();
  const [statusFilter, setStatusFilter] = useState('all');
  const [openLead, setOpenLead] = useState(null);

  const counts = useMemo(() => {
    const c = { all: leads.length };
    for (const s of LEAD_STATUSES) c[s.value] = leads.filter(l => l.status === s.value).length;
    return c;
  }, [leads]);

  const filteredByStatus = useMemo(() => {
    if (statusFilter === 'all') return leads;
    return leads.filter(l => l.status === statusFilter);
  }, [leads, statusFilter]);

  const t = useTableState(filteredByStatus, {
    pageSize: 25,
    searchFields: ['user_name', 'user_email', 'user_phone', 'affiliate.name', 'message'],
    defaultSort: { field: 'created_at', direction: 'desc' },
  });

  return (
    <>
      <AdminTableToolbar
        search={t.search} onSearch={t.setSearch}
        placeholder="Search by buyer name, email, partner, message…"
        statusOptions={[
          { value: 'all', label: 'All', count: counts.all },
          ...LEAD_STATUSES.map(s => ({ value: s.value, label: s.label, count: counts[s.value] })),
        ]}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        filteredCount={t.filteredCount}
        totalCount={leads.length}
      />

      {loading && leads.length === 0 ? (
        <div className="fs-admin-loading">Loading leads…</div>
      ) : t.filteredCount === 0 ? (
        <div className="fs-admin-empty">
          <h3>No leads {statusFilter !== 'all' ? `with status "${statusFilter}"` : 'yet'}</h3>
        </div>
      ) : (
        <div className="fs-admin-tablewrap">
          <table className="fs-admin-table">
            <thead>
              <tr>
                <SortHeader field="user_name"       sort={t.sort} onSortChange={t.setSort}>Buyer</SortHeader>
                <SortHeader field="affiliate.name"  sort={t.sort} onSortChange={t.setSort}>Partner</SortHeader>
                <th>Status</th>
                <th>Delivery</th>
                <SortHeader field="created_at"      sort={t.sort} onSortChange={t.setSort} align="right">Submitted</SortHeader>
                <th style={{ textAlign: 'right' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {t.pageRows.map(lead => {
                const isOpen = openLead === lead.id;
                const hasExtra = lead.message || lead.delivery_error || lead.status === 'converted';
                return (
                  <Fragment key={lead.id}>
                    <tr>
                      <td>
                        <p className="fs-admin-cell-strong">{lead.user_name || '—'}</p>
                        <p className="fs-admin-cell-muted">
                          {lead.user_email}{lead.user_phone ? ` · ${lead.user_phone}` : ''}
                        </p>
                      </td>
                      <td>
                        <p className="fs-admin-cell-strong">{lead.affiliate?.name || '—'}</p>
                        <p className="fs-admin-cell-muted">{lead.affiliate?.type || ''}</p>
                      </td>
                      <td>
                        <select
                          value={lead.status}
                          onChange={(e) => updateStatus(lead.id, { status: e.target.value })}
                          style={{ padding: '4px 6px', fontSize: 12, border: '1px solid var(--fs-line)', borderRadius: 6, background: '#fff' }}
                        >
                          {LEAD_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </td>
                      <td><StatusBadge status={lead.delivery_status} /></td>
                      <td className="fs-admin-cell-muted" style={{ textAlign: 'right' }}>
                        {new Date(lead.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {hasExtra ? (
                          <button
                            type="button"
                            className="fs-confirm-btn fs-confirm-btn-secondary fs-confirm-btn-sm"
                            onClick={() => setOpenLead(isOpen ? null : lead.id)}
                            aria-expanded={isOpen}
                          >
                            {isOpen ? 'Hide' : 'Show'}
                          </button>
                        ) : (
                          <span className="fs-admin-cell-muted">—</span>
                        )}
                      </td>
                    </tr>
                    {isOpen && hasExtra && (
                      <tr className="fs-admin-row-detail">
                        <td colSpan={6}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '6px 0' }}>
                            {lead.message && (
                              <p style={{ margin: 0, fontSize: 13 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--fs-ink-3)' }}>Message: </span>
                                {lead.message}
                              </p>
                            )}
                            {lead.delivery_error && (
                              <p style={{ margin: 0, fontSize: 13, color: 'var(--fs-red)' }}>
                                <span style={{ fontWeight: 700 }}>Delivery error: </span>{lead.delivery_error}
                              </p>
                            )}
                            {lead.status === 'converted' && (
                              <ConvertedFields lead={lead} updateStatus={updateStatus} />
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          <Pager page={t.page} totalPages={t.totalPages} onChange={t.setPage} />
        </div>
      )}
    </>
  );
}

function ConvertedFields({ lead, updateStatus }) {
  const [val,  setVal]  = useState(lead.conversion_value  || '');
  const [comm, setComm] = useState(lead.commission_amount || '');

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--fs-ink-3)' }}>Conversion</span>
      <input
        type="number"
        placeholder="Deal $"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => updateStatus(lead.id, { conversion_value: val ? Number(val) : null })}
        style={{ width: 130, padding: '4px 6px', fontSize: 12, border: '1px solid var(--fs-line)', borderRadius: 6 }}
      />
      <input
        type="number"
        placeholder="Commission $"
        value={comm}
        onChange={(e) => setComm(e.target.value)}
        onBlur={() => updateStatus(lead.id, { commission_amount: comm ? Number(comm) : null })}
        style={{ width: 130, padding: '4px 6px', fontSize: 12, border: '1px solid var(--fs-line)', borderRadius: 6 }}
      />
    </div>
  );
}
