'use client';
import { useCallback, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import { useDialog } from '../../lib/useDialog';
import { cropImage } from '../../lib/imageProcessing';

// Hero-image cropper modal. The first photo in a listing's gallery
// is the hero — it's what shows on cards in /buy, on OG share
// previews, and as the lead image on the detail page. A landscape
// 3:2 aspect ratio is the universal listing-card convention and
// it's what AircraftImage.jsx renders at.
//
// react-easy-crop handles the pinch/drag/zoom interactions; cropImage
// (lib/imageProcessing.js) does the canvas draw and re-runs the
// processImage compression pipeline so the output sits inside the
// same 1.5 MB / 2400 px ceiling as a regular upload.
//
// The modal accepts a source URL + the caller's onCrop callback. On
// "Save crop" it fetches the source as a Blob, runs cropImage(),
// and hands the result back as a File. Caller is responsible for
// re-uploading to storage and swapping the URL in their list state.

const ASPECT = 3 / 2;

export default function HeroCropper({ srcUrl, onClose, onSave }) {
  const dialogRef = useRef(null);
  useDialog({ open: true, onClose, containerRef: dialogRef });

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedPixels(pixels);
  }, []);

  const handleSave = async () => {
    if (!croppedPixels) return;
    setSaving(true);
    setError(null);
    try {
      // Fetch the source as a Blob → File so cropImage can re-encode.
      const res = await fetch(srcUrl);
      const blob = await res.blob();
      const sourceFile = new File([blob], 'source.jpg', { type: blob.type || 'image/jpeg' });
      const cropped = await cropImage(sourceFile, croppedPixels);
      await onSave(cropped);
    } catch (err) {
      setError(err.message || 'Crop failed. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fs-modal-backdrop" onClick={onClose}>
      <div
        className="fs-modal"
        onClick={(e) => e.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fs-hero-crop-title"
        style={{ maxWidth: 640 }}
      >
        <div className="fs-modal-header">
          <h3 id="fs-hero-crop-title">Crop hero image</h3>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>

        <div className="fs-modal-body" style={{ padding: 0 }}>
          {/* Crop canvas — fixed 3:2 aspect, drag/pinch to position,
              slider to zoom. Black backdrop helps the user see the
              crop edges against any image. */}
          <div style={{ position: 'relative', width: '100%', height: 380, background: '#000' }}>
            <Cropper
              image={srcUrl}
              crop={crop}
              zoom={zoom}
              aspect={ASPECT}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              showGrid
            />
          </div>

          <div style={{ padding: '16px 20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--fs-ink-3)' }}>
              <span style={{ flexShrink: 0 }}>Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                aria-label="Zoom level"
                style={{ flex: 1 }}
              />
            </label>
            {error && (
              <p style={{ marginTop: 12, color: 'var(--fs-red)', fontSize: 13 }}>{error}</p>
            )}
            <p style={{ marginTop: 12, fontSize: 12, color: 'var(--fs-ink-4)' }}>
              Drag to reposition. 3:2 ratio — matches listing-card and OG-share crops, so
              what you set here is what buyers see everywhere.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid var(--fs-line)' }}>
          <button type="button" className="fs-form-cancel" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="fs-form-submit"
            onClick={handleSave}
            disabled={saving || !croppedPixels}
            style={{ width: 'auto', padding: '10px 22px' }}
          >
            {saving ? 'Saving crop…' : 'Save crop'}
          </button>
        </div>
      </div>
    </div>
  );
}
