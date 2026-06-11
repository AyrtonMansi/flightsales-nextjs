'use client';
import { useRef, useState } from 'react';

// Bulk-import flow for dealer dashboards. Three states:
//   1. Drop zone — paste CSV or upload a file
//   2. Preview grid — AI-cleaned rows, inline-editable, status flags
//   3. Result summary — what landed in pending review and what didn't
//
// Server contract:
//   POST /api/bulk-import/parse  { csv } -> { ok, listings: [...] }
//   POST /api/bulk-import/submit { listings } -> { ok, inserted, results }
// All listings created here go in as status='pending' so the existing
// admin moderation flow handles the final approve/reject step.

const STATE_OPTIONS = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];
const CONDITION_OPTIONS = ['New', 'Pre-Owned', 'Project/Restoration'];
const CATEGORY_OPTIONS = [
  'Single Engine Piston', 'Multi Engine Piston', 'Turboprop',
  'Light Jet', 'Midsize Jet', 'Heavy Jet', 'Helicopter',
  'Gyrocopter', 'Ultralight', 'LSA', 'Warbird', 'Glider',
  'Amphibious/Seaplane', 'Drone & eVTOL',
];

const SAMPLE_CSV = [
  'Year,Make,Model,Price,Rego,Category,Condition,State,City,TTAF,Eng Hours,Description',
  '2018,Cessna,172S Skyhawk,295000,VH-XYZ,Single Engine Piston,Pre-Owned,NSW,Bankstown,1240,540,Garmin G1000 NXi panel; logs complete; no damage history',
  '2012,Cirrus,SR22 G3,485000,VH-ABC,Single Engine Piston,Pre-Owned,VIC,Moorabbin,1820,420,Perspective avionics; CAPS recently repacked',
].join('\n');

export default function BulkImportTab({ user }) {
  const [phase, setPhase] = useState('drop');     // drop | preview | submitting | done
  const [csv, setCsv]     = useState('');
  const [rows, setRows]   = useState([]);
  const [parseError, setParseError] = useState('');
  const [submitResult, setSubmitResult] = useState(null);
  const fileRef = useRef(null);

  // ── Drop zone handlers ──────────────────────────────────────────────
  const onFile = async (file) => {
    if (!file) return;
    const text = await file.text();
    setCsv(text);
  };

  const handleParse = async () => {
    if (!csv.trim()) { setParseError('Paste CSV or upload a file first.'); return; }
    setParseError('');
    setPhase('parsing');
    try {
      const r = await fetch('/api/bulk-import/parse', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ csv }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) {
        const msg = j.error === 'too_many_rows' ? `Too many rows (max ${j.max}). Split the file.`
                  : j.error === 'forbidden'      ? 'Bulk import is dealer-only. Upgrade your account first.'
                  : j.error === 'empty_csv'      ? 'The file looks empty.'
                  : j.error === 'need_header_plus_data' ? 'Need a header row plus at least one data row.'
                  : 'Parse failed. Check the CSV format and try again.';
        setParseError(msg);
        setPhase('drop');
        return;
      }
      setRows(j.listings.map((r, i) => ({ ...r, _id: i, _selected: true })));
      setPhase('preview');
    } catch {
      setParseError('Network error. Try again.');
      setPhase('drop');
    }
  };

  // ── Preview grid handlers ───────────────────────────────────────────
  const updateRow = (id, patch) => {
    setRows((prev) => prev.map((r) => r._id === id ? { ...r, ...patch } : r));
  };
  const toggleSelected = (id) => {
    setRows((prev) => prev.map((r) => r._id === id ? { ...r, _selected: !r._selected } : r));
  };
  const toggleAll = (next) => {
    setRows((prev) => prev.map((r) => ({ ...r, _selected: next })));
  };

  const handleSubmit = async () => {
    const selected = rows.filter((r) => r._selected);
    if (selected.length === 0) return;
    setPhase('submitting');
    try {
      const r = await fetch('/api/bulk-import/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          listings: selected.map(({ _id, _selected, _flags, _ai, _matchedFamily, model_slug, ...rest }) => rest),
        }),
      });
      const j = await r.json();
      setSubmitResult({ ok: !!j.ok, ...j, submittedCount: selected.length });
      setPhase('done');
    } catch {
      setSubmitResult({ ok: false, error: 'network' });
      setPhase('done');
    }
  };

  const reset = () => {
    setCsv(''); setRows([]); setSubmitResult(null);
    setPhase('drop'); setParseError('');
  };

  // ── Render ──────────────────────────────────────────────────────────
  const selectedCount = rows.filter((r) => r._selected).length;
  const flaggedCount  = rows.filter((r) => (r._flags?.length || 0) > 0).length;
  const aiCount       = rows.filter((r) => r._ai).length;

  return (
    <>
      <h2 className="fs-section-title" style={{ marginBottom: 8 }}>Bulk import</h2>
      <p style={{ color: 'var(--fs-ink-3)', marginBottom: 24 }}>
        Upload a CSV of your inventory. We&apos;ll auto-clean the rows with AI assistance,
        let you review them, then queue everything for admin approval — same as a
        single listing. Max 200 rows per upload.
      </p>

      {phase === 'drop' || phase === 'parsing' ? (
        <div className="fs-bulk-drop">
          <div className="fs-bulk-drop-icon" aria-hidden="true">↑</div>
          <h3 style={{ margin: '8px 0' }}>Drop a CSV file or paste below</h3>
          <p style={{ color: 'var(--fs-ink-3)', marginBottom: 16 }}>
            Headers we recognise: <code>year, make, model, price, rego, category,
            condition, state, city, ttaf, eng hours, description</code>.
          </p>

          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            ref={fileRef}
            style={{ display: 'none' }}
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
            <button
              type="button"
              className="fs-form-submit"
              onClick={() => fileRef.current?.click()}
              disabled={phase === 'parsing'}
            >
              Choose file
            </button>
            <button
              type="button"
              className="fs-bulk-btn-secondary"
              onClick={() => setCsv(SAMPLE_CSV)}
              disabled={phase === 'parsing'}
            >
              Load sample
            </button>
          </div>

          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder="Year,Make,Model,Price,Rego,..."
            className="fs-bulk-textarea"
            rows={10}
            disabled={phase === 'parsing'}
          />

          {parseError && <p className="fs-bulk-error">{parseError}</p>}

          <button
            type="button"
            className="fs-form-submit"
            style={{ marginTop: 16, width: '100%' }}
            onClick={handleParse}
            disabled={phase === 'parsing' || !csv.trim()}
          >
            {phase === 'parsing' ? 'Parsing & cleaning…' : 'Parse & preview →'}
          </button>
        </div>
      ) : null}

      {phase === 'preview' ? (
        <>
          <div className="fs-bulk-summary">
            <div>
              <strong>{rows.length}</strong> rows parsed ·{' '}
              <strong>{aiCount}</strong> AI-cleaned ·{' '}
              <strong style={{ color: flaggedCount ? 'var(--fs-warning, #c2410c)' : 'inherit' }}>
                {flaggedCount}
              </strong> need review
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="fs-bulk-btn-secondary" onClick={reset}>
                Start over
              </button>
              <button
                type="button"
                className="fs-form-submit"
                onClick={handleSubmit}
                disabled={selectedCount === 0}
              >
                Submit {selectedCount} for approval →
              </button>
            </div>
          </div>

          <div className="fs-bulk-grid-wrap">
            <table className="fs-bulk-grid">
              <thead>
                <tr>
                  <th style={{ width: 32 }}>
                    <input
                      type="checkbox"
                      checked={selectedCount === rows.length && rows.length > 0}
                      onChange={(e) => toggleAll(e.target.checked)}
                    />
                  </th>
                  <th>Status</th>
                  <th>Make</th>
                  <th>Model</th>
                  <th>Year</th>
                  <th>Price (AUD)</th>
                  <th>Category</th>
                  <th>Cond.</th>
                  <th>State</th>
                  <th>City</th>
                  <th>Rego</th>
                  <th>TTAF</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const flags = r._flags || [];
                  const status = flags.length === 0 ? 'ok'
                               : flags.some((f) => /missing/.test(f)) ? 'warn'
                               : 'info';
                  return (
                    <tr key={r._id} className={`fs-bulk-row fs-bulk-row-${status}${r._selected ? '' : ' fs-bulk-row-off'}`}>
                      <td>
                        <input
                          type="checkbox"
                          checked={r._selected}
                          onChange={() => toggleSelected(r._id)}
                        />
                      </td>
                      <td>
                        <span className={`fs-bulk-status fs-bulk-status-${status}`}>
                          {status === 'ok' ? 'Ready' : 'Review'}
                        </span>
                        {r._ai && <span className="fs-bulk-ai-tag" title="AI-normalised">AI</span>}
                      </td>
                      <td><Cell value={r.manufacturer} onChange={(v) => updateRow(r._id, { manufacturer: v })} /></td>
                      <td><Cell value={r.model}        onChange={(v) => updateRow(r._id, { model: v })} /></td>
                      <td><Cell value={r.year}         onChange={(v) => updateRow(r._id, { year: Number(v) || null })} type="number" /></td>
                      <td><Cell value={r.price}        onChange={(v) => updateRow(r._id, { price: Number(v) || null })} type="number" /></td>
                      <td>
                        <SelectCell
                          value={r.category}
                          options={CATEGORY_OPTIONS}
                          onChange={(v) => updateRow(r._id, { category: v })}
                        />
                      </td>
                      <td>
                        <SelectCell
                          value={r.condition || 'Pre-Owned'}
                          options={CONDITION_OPTIONS}
                          onChange={(v) => updateRow(r._id, { condition: v })}
                        />
                      </td>
                      <td>
                        <SelectCell
                          value={r.state}
                          options={STATE_OPTIONS}
                          onChange={(v) => updateRow(r._id, { state: v })}
                        />
                      </td>
                      <td><Cell value={r.city} onChange={(v) => updateRow(r._id, { city: v })} /></td>
                      <td><Cell value={r.rego} onChange={(v) => updateRow(r._id, { rego: v })} /></td>
                      <td><Cell value={r.ttaf} onChange={(v) => updateRow(r._id, { ttaf: Number(v) || 0 })} type="number" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {flaggedCount > 0 && (
            <p className="fs-bulk-hint">
              Rows marked <strong>Review</strong> are missing fields the listing needs.
              Fill them inline or untick the row to skip it for this batch.
            </p>
          )}
        </>
      ) : null}

      {phase === 'submitting' ? (
        <div className="fs-bulk-drop">
          <p>Submitting {rows.filter((r) => r._selected).length} listings…</p>
        </div>
      ) : null}

      {phase === 'done' && submitResult ? (
        <div className="fs-bulk-drop">
          {submitResult.ok ? (
            <>
              <h3 style={{ margin: '8px 0' }}>
                {submitResult.inserted} listing{submitResult.inserted === 1 ? '' : 's'} queued for admin approval
              </h3>
              <p style={{ color: 'var(--fs-ink-3)', marginBottom: 16 }}>
                We&apos;ll email you as each one goes live. Approval usually takes under 24 hours.
              </p>
              <button type="button" className="fs-form-submit" onClick={reset}>
                Import another batch
              </button>
            </>
          ) : (
            <>
              <h3 style={{ margin: '8px 0', color: 'var(--fs-warning, #c2410c)' }}>
                Submit failed
              </h3>
              <p style={{ color: 'var(--fs-ink-3)', marginBottom: 16 }}>
                {submitResult.error === 'rego_conflict'
                  ? 'One or more registrations are already on the platform. Edit the conflicting rows and try again.'
                  : 'Something went wrong on our side. Your data is still in the preview — try again.'}
              </p>
              <button
                type="button"
                className="fs-form-submit"
                onClick={() => setPhase('preview')}
              >
                Back to preview
              </button>
            </>
          )}
        </div>
      ) : null}
    </>
  );
}

// Inline-editable text/number cell. Bare-bones — controlled value, blurs
// commit. We don't validate-on-keypress; the row's status flag updates
// from the server on next parse, but for the submit path the API
// re-validates anyway.
function Cell({ value, onChange, type = 'text' }) {
  return (
    <input
      type={type}
      className="fs-bulk-cell"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function SelectCell({ value, options, onChange }) {
  return (
    <select
      className="fs-bulk-cell"
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <option value="">—</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
