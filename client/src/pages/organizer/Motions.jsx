import { useState } from 'react';
import { motionsApi } from '../../api/motions';
import { getErrorMessage } from '../../api/client';
import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import { useFetch } from '../../hooks/useFetch';
import { formatDate } from '../../utils/format';

const EMPTY_FORM = { title: '', description: '' };

export default function Motions() {
  const { data: motions, loading, error, reload } = useFetch(() => motionsApi.list(), []);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [listError, setListError] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setListError('');
    setSaving(true);
    try {
      if (editingId) await motionsApi.update(editingId, form);
      else await motionsApi.create(form);
      resetForm();
      reload();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (motion) => {
    setEditingId(motion._id);
    setForm({ title: motion.title, description: motion.description || '' });
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onDelete = async (motion) => {
    if (!window.confirm('Delete this motion?')) return;
    setListError('');
    try {
      await motionsApi.remove(motion._id);
      if (editingId === motion._id) resetForm();
      reload();
    } catch (err) {
      setListError(getErrorMessage(err));
    }
  };

  return (
    <>
      <PageHeader title="Motions" subtitle="The topics your debates are about." />

      <form className="card form-card" onSubmit={onSubmit}>
        <h2>{editingId ? 'Edit motion' : 'New motion'}</h2>
        <Alert>{formError}</Alert>
        <label>
          Motion
          <input
            name="title"
            value={form.title}
            onChange={onChange}
            placeholder="This House believes that..."
            required
            minLength={5}
            maxLength={300}
          />
        </label>
        <label>
          Context for debaters (optional)
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            rows={3}
            maxLength={1000}
            placeholder="Definitions, assumptions or background information"
          />
        </label>
        <div className="form-actions">
          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add motion'}
          </button>
          {editingId && (
            <button type="button" className="btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2>All motions</h2>
      <Alert>{listError}</Alert>
      {loading && !motions && <Spinner />}
      {error && <Alert>{error}</Alert>}
      {motions && motions.length === 0 && (
        <EmptyState title="No motions yet">Add your first motion using the form above.</EmptyState>
      )}
      {motions && motions.length > 0 && (
        <div className="stack">
          {motions.map((motion) => (
            <article key={motion._id} className="card motion-item">
              <div>
                <p className="motion-text">{motion.title}</p>
                {motion.description && <p className="muted small">{motion.description}</p>}
                <p className="muted small">Added {formatDate(motion.createdAt)}</p>
              </div>
              <div className="row-actions">
                <button className="btn btn-sm" onClick={() => onEdit(motion)}>
                  Edit
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => onDelete(motion)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
