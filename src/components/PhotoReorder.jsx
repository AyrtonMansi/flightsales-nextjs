'use client';
import { useRef, useState } from 'react';

// HTML5 drag-and-drop photo reorder. No external library — keeps the
// bundle clean. Touch devices fall back to "Move left / Move right"
// arrow buttons since HTML5 DnD is desktop-only.
//
// Props:
//   urls — string[] of image URLs (first = hero photo)
//   onChange(nextUrls) — fired with the new order
//   onRemove(url) — optional; renders a small × button per photo

export default function PhotoReorder({ urls = [], onChange, onRemove }) {
  const [draggingIndex, setDraggingIndex] = useState(null);
  const overIndexRef = useRef(null);

  if (!urls || urls.length === 0) return null;

  const reorder = (from, to) => {
    if (from === to || from < 0 || to < 0 || from >= urls.length || to >= urls.length) return;
    const next = [...urls];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div className="fs-photo-reorder">
      {urls.map((url, i) => (
        <div
          key={url + i}
          className={`fs-photo-tile${draggingIndex === i ? ' dragging' : ''}`}
          draggable
          onDragStart={() => setDraggingIndex(i)}
          onDragEnd={() => {
            const target = overIndexRef.current;
            setDraggingIndex(null);
            overIndexRef.current = null;
            if (target != null) reorder(i, target);
          }}
          onDragOver={(e) => { e.preventDefault(); overIndexRef.current = i; }}
          onDrop={(e) => { e.preventDefault(); reorder(draggingIndex, i); }}
        >
          <img src={url} alt={`Photo ${i + 1}`} />
          {i === 0 && <span className="fs-photo-tile-hero">Hero</span>}
          <div className="fs-photo-tile-actions">
            <button
              type="button"
              onClick={() => reorder(i, Math.max(0, i - 1))}
              disabled={i === 0}
              aria-label="Move left"
            >‹</button>
            <button
              type="button"
              onClick={() => reorder(i, Math.min(urls.length - 1, i + 1))}
              disabled={i === urls.length - 1}
              aria-label="Move right"
            >›</button>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(url)}
                aria-label="Remove"
                className="fs-photo-tile-remove"
              >×</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
