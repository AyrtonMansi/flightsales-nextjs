'use client';
import { useEffect, useState } from 'react';

// Simple admin form for creating/editing a news article. No rich-text WYSIWYG
// — content is plaintext for v1. We can layer markdown rendering on /news/[slug]
// later without changing this form.
//
// Slugs auto-generate from the title on first save; admin can override.
function slugify(s) {
  return s.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const CATEGORIES = ['Regulation', 'Market', 'Industry', 'Infrastructure', 'Safety', 'Tech'];

export default function NewsEditor({ article, onSave, onCancel, onDelete }) {
  const isNew = !article;
  const [title, setTitle] = useState(article?.title || '');
  const [excerpt, setExcerpt] = useState(article?.excerpt || '');
  const [content, setContent] = useState(article?.content || '');
  const [category, setCategory] = useState(article?.category || 'Industry');
  const [date, setDate] = useState(article?.date || new Date().toISOString().slice(0, 10));
  const [readTime, setReadTime] = useState(article?.read_time || 5);
  const [imageUrl, setImageUrl] = useState(article?.image_url || '');
  const [slug, setSlug] = useState(article?.slug || '');
  const [published, setPublished] = useState(article?.published ?? false);
  const [submitting, setSubmitting] = useState(false);

  // Auto-fill slug from title for new articles only
  useEffect(() => {
    if (isNew && title && !slug) setSlug(slugify(title));
  }, [title, isNew, slug]);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !excerpt.trim()) return;
    setSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim() || null,
        category,
        date,
        read_time: Number(readTime) || 5,
        image_url: imageUrl.trim() || null,
        slug: (slug || slugify(title)).trim(),
        published,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="fs-news-editor" onSubmit={submit}>
      <div className="fs-news-editor-head">
        <h3>{isNew ? 'New article' : 'Edit article'}</h3>
        <div className="fs-news-editor-actions">
          {!isNew && onDelete && (
            <button
              type="button"
              className="fs-confirm-btn fs-confirm-btn-destructive"
              onClick={onDelete}
            >Delete</button>
          )}
          <button
            type="button"
            className="fs-confirm-btn fs-confirm-btn-secondary"
            onClick={onCancel}
          >Cancel</button>
          <button
            type="submit"
            className="fs-confirm-btn fs-confirm-btn-primary"
            disabled={submitting || !title.trim() || !excerpt.trim()}
          >{submitting ? 'Saving…' : 'Save'}</button>
        </div>
      </div>

      <div className="fs-news-editor-grid">
        <label>
          <span className="fs-form-label">Title *</span>
          <input className="fs-form-input" type="text" value={title} onChange={e => setTitle(e.target.value)} required />
        </label>
        <label>
          <span className="fs-form-label">Slug</span>
          <input className="fs-form-input" type="text" value={slug} onChange={e => setSlug(e.target.value)} placeholder="auto from title" />
        </label>
        <label>
          <span className="fs-form-label">Category</span>
          <select className="fs-form-input" value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>
          <span className="fs-form-label">Date</span>
          <input className="fs-form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </label>
        <label>
          <span className="fs-form-label">Read time (min)</span>
          <input className="fs-form-input" type="number" min={1} max={60} value={readTime} onChange={e => setReadTime(e.target.value)} />
        </label>
        <label>
          <span className="fs-form-label">Cover image URL</span>
          <input className="fs-form-input" type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://…" />
        </label>
      </div>

      <label>
        <span className="fs-form-label">Excerpt *</span>
        <textarea className="fs-form-input" rows={2} value={excerpt} onChange={e => setExcerpt(e.target.value)} required />
      </label>

      <label>
        <span className="fs-form-label">Body</span>
        <textarea className="fs-form-input" rows={12} value={content} onChange={e => setContent(e.target.value)} placeholder="Plain text. Markdown rendering can be added later." />
      </label>

      <label className="fs-news-editor-publish">
        <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} />
        <span>Published (visible on /news)</span>
      </label>
    </form>
  );
}
