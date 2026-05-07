'use client';

import { useState, useEffect } from 'react';
import type { Review } from '@/lib/supabase/reviews';
import type { AdminUser } from '@/lib/supabase/admin';
import {
  getAdminReviewsAction,
  updateReviewAction,
  deleteReviewAction,
  getUsersAction,
  addReviewAction,
} from '@/app/[locale]/(app)/admin/actions';

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="admin-star-picker">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}
          className={`admin-star-btn${n <= value ? ' admin-star-btn--on' : ''}`}>
          ★
        </button>
      ))}
    </div>
  );
}

export function ReviewsSection({ spaceId }: { spaceId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editBody, setEditBody] = useState('');
  const [editAuthorId, setEditAuthorId] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      getAdminReviewsAction(spaceId),
      getUsersAction()
    ]).then(([r, u]) => { 
      setReviews(r); 
      setUsers(u.data);
      setLoading(false); 
    });
  }, [spaceId]);

  function startEdit(r: Review) {
    setEditingId(r.id);
    setEditRating(r.rating);
    setEditBody(r.body ?? '');
    setEditAuthorId(r.authorId);
  }

  function startAdd() {
    setAddingNew(true);
    setEditRating(5);
    setEditBody('');
    setEditAuthorId(users[0]?.id || '');
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    const r = reviews.find((x) => x.id === editingId)!;
    await updateReviewAction(editingId, r.spaceId, editRating, editBody || null, editAuthorId);
    
    // re-fetch reviews to get the updated emails and accurate authorIds
    const updatedReviews = await getAdminReviewsAction(spaceId);
    setReviews(updatedReviews);
    setEditingId(null);
    setSaving(false);
  }

  async function saveNew() {
    if (!editAuthorId) return;
    setSaving(true);
    await addReviewAction(spaceId, editAuthorId, editRating, editBody || null);
    
    const updatedReviews = await getAdminReviewsAction(spaceId);
    setReviews(updatedReviews);
    setAddingNew(false);
    setSaving(false);
  }

  async function confirmDelete(id: string) {
    const r = reviews.find((x) => x.id === id)!;
    await deleteReviewAction(id, r.spaceId);
    setReviews((prev) => prev.filter((x) => x.id !== id));
    setConfirmDeleteId(null);
  }

  if (loading) return <p className="field__hint">Carregant ressenyes…</p>;

  return (
    <div className="admin-reviews-section">
      <h3 className="admin-reviews-section__title">
        Ressenyes <span className="admin-reviews-section__count">({reviews.length})</span>
      </h3>
      {reviews.length === 0 ? (
        <p className="field__hint">Cap ressenya per a aquest espai.</p>
      ) : (
        <div className="admin-reviews">
          {reviews.map((r) => (
            <div key={r.id} className="admin-review-item">
              {editingId === r.id ? (
                <div className="admin-review-edit">
                  <div className="field">
                    <label className="field__label">Correu de l'autor</label>
                    <select
                      className="field__input field__select"
                      value={editAuthorId}
                      onChange={(e) => setEditAuthorId(e.target.value)}
                    >
                      {users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
                    </select>
                  </div>
                  <StarPicker value={editRating} onChange={setEditRating} />
                  <textarea
                    className="field__input field__textarea"
                    rows={3}
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                  />
                  <div className="admin-review-edit-actions">
                    <button type="button" data-variant="primary" onClick={saveEdit} disabled={saving}>
                      {saving ? 'Desant…' : 'Desa'}
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} disabled={saving}>
                      Cancel·la
                    </button>
                  </div>
                </div>
              ) : confirmDeleteId === r.id ? (
                <div className="admin-review-confirm-delete">
                  <span>Eliminar aquesta ressenya?</span>
                  <button type="button" data-variant="danger" onClick={() => confirmDelete(r.id)}>Sí</button>
                  <button type="button" onClick={() => setConfirmDeleteId(null)}>No</button>
                </div>
              ) : (
                <div className="admin-review-view">
                  <div className="admin-review-meta">
                    <span className="admin-review-author">{r.authorEmail}</span>
                    <span className="admin-review-stars">
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </span>
                    <span className="admin-review-date">
                      {new Date(r.createdAt).toLocaleDateString('ca-ES')}
                    </span>
                  </div>
                  {r.body && <p className="admin-review-body">{r.body}</p>}
                  <div className="admin-review-actions">
                    <button type="button" className="admin-action-btn" onClick={() => startEdit(r)}>
                      Editar
                    </button>
                    <button type="button" className="admin-action-btn admin-action-btn--delete"
                      onClick={() => setConfirmDeleteId(r.id)}>
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {addingNew ? (
        <div className="admin-review-item admin-review-edit">
          <h4 style={{ margin: '0 0 1rem 0' }}>Nova Ressenya</h4>
          <div className="field">
            <label className="field__label">Autore (Usuari registrat)</label>
            <select
              className="field__input field__select"
              value={editAuthorId}
              onChange={(e) => setEditAuthorId(e.target.value)}
            >
              <option value="" disabled>Selecciona un usuari</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
            </select>
          </div>
          <StarPicker value={editRating} onChange={setEditRating} />
          <textarea
            className="field__input field__textarea"
            rows={3}
            placeholder="Comentari (opcional)..."
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
          />
          <div className="admin-review-edit-actions" style={{ marginTop: '1rem' }}>
            <button type="button" data-variant="primary" onClick={saveNew} disabled={saving || !editAuthorId}>
              {saving ? 'Creant…' : 'Crear'}
            </button>
            <button type="button" onClick={() => setAddingNew(false)} disabled={saving}>
              Cancel·la
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={startAdd} style={{ marginTop: '1rem' }}>
          + Afegir ressenya
        </button>
      )}
    </div>
  );
}
