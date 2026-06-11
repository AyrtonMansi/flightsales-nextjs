'use client';
import { useState } from 'react';
import { useNewsArticles } from '../../../lib/hooks';
import { showToast } from '../../../lib/toast';
import useTableState from '../../../lib/useTableState';
import AdminTableToolbar, { SortHeader, Pager } from '../AdminTableToolbar';
import ConfirmDialog from '../ConfirmDialog';
import NewsEditor from '../NewsEditor';

export default function ContentTab() {
  const { articles, loading, createArticle, updateArticle, deleteArticle } = useNewsArticles();
  const [editing, setEditing] = useState(null); // article object | { isNew: true } | null
  const [deleteTarget, setDeleteTarget] = useState(null);

  const t = useTableState(articles, {
    pageSize: 25,
    searchFields: ['title', 'excerpt', 'category', 'slug'],
    defaultSort: { field: 'date', direction: 'desc' },
  });

  const handleSave = async (payload) => {
    try {
      if (editing?.id) {
        await updateArticle(editing.id, payload);
        showToast('Article updated');
      } else {
        await createArticle(payload);
        showToast('Article created');
      }
      setEditing(null);
    } catch (err) {
      showToast(err?.message ? `Failed: ${err.message}` : 'Failed');
    }
  };

  const handleDelete = async (id) => {
    try { await deleteArticle(id); showToast('Article deleted'); }
    catch (err) { showToast('Failed'); }
  };

  if (editing) {
    return (
      <NewsEditor
        article={editing.id ? editing : null}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
        onDelete={editing.id ? () => setDeleteTarget(editing) : null}
      />
    );
  }

  return (
    <>
      <AdminTableToolbar
        search={t.search} onSearch={t.setSearch}
        placeholder="Search title, excerpt, slug…"
        filteredCount={t.filteredCount} totalCount={articles.length}
        right={
          <button
            type="button"
            className="fs-confirm-btn fs-confirm-btn-primary fs-confirm-btn-sm"
            onClick={() => setEditing({})}
          >
            New article
          </button>
        }
      />

      {loading ? (
        <div className="fs-admin-loading">Loading articles…</div>
      ) : t.filteredCount === 0 ? (
        <div className="fs-admin-empty">
          <h3>No articles yet</h3>
          <p>Click "New article" to publish your first piece.</p>
        </div>
      ) : (
        <div className="fs-admin-tablewrap">
          <table className="fs-admin-table">
            <thead>
              <tr>
                <SortHeader field="title" sort={t.sort} onSortChange={t.setSort}>Title</SortHeader>
                <SortHeader field="category" sort={t.sort} onSortChange={t.setSort}>Category</SortHeader>
                <SortHeader field="date" sort={t.sort} onSortChange={t.setSort}>Date</SortHeader>
                <SortHeader field="published" sort={t.sort} onSortChange={t.setSort}>Visibility</SortHeader>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {t.pageRows.map(a => (
                <tr key={a.id}>
                  <td className="fs-admin-cell-strong">{a.title}</td>
                  <td className="fs-admin-cell-muted">{a.category}</td>
                  <td className="fs-admin-cell-muted">
                    {a.date ? new Date(a.date).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <span className={`fs-admin-pub${a.published ? ' on' : ''}`}>
                      {a.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="fs-admin-row-actions">
                      <button
                        type="button"
                        className="fs-confirm-btn fs-confirm-btn-secondary fs-confirm-btn-sm"
                        onClick={() => setEditing(a)}
                      >Edit</button>
                      <button
                        type="button"
                        className="fs-confirm-btn fs-confirm-btn-destructive fs-confirm-btn-sm"
                        onClick={() => setDeleteTarget(a)}
                      >Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager page={t.page} totalPages={t.totalPages} onChange={t.setPage} />
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.title}"?`}
        message="This permanently removes the article. Cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          await handleDelete(deleteTarget.id);
          if (editing?.id === deleteTarget.id) setEditing(null);
          setDeleteTarget(null);
        }}
      />
    </>
  );
}
