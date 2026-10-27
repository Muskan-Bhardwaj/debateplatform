import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { debatesApi } from '../../api/debates';
import { motionsApi } from '../../api/motions';
import { usersApi } from '../../api/users';
import { getErrorMessage } from '../../api/client';
import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import { DEBATE_STATUS, ROLES, SIDES } from '../../constants';
import { useFetch } from '../../hooks/useFetch';
import { toLocalInputValue } from '../../utils/format';

const EMPTY_FORM = {
  title: '',
  motion: '',
  scheduledAt: '',
  venue: '',
  judges: [],
  proposition: [],
  opposition: [],
};

// A scrollable checkbox list of people.
function PeoplePicker({ title, users, selected, onToggle, disabledIds = [], emptyText }) {
  return (
    <fieldset className="picker">
      <legend>
        {title} <span className="muted">({selected.length} selected)</span>
      </legend>
      {users.length === 0 ? (
        <p className="muted small">{emptyText}</p>
      ) : (
        <div className="picker-list">
          {users.map((person) => {
            const disabled = disabledIds.includes(person._id);
            return (
              <label key={person._id} className={`check ${disabled ? 'check-disabled' : ''}`}>
                <input
                  type="checkbox"
                  checked={selected.includes(person._id)}
                  disabled={disabled}
                  onChange={() => onToggle(person._id)}
                />
                <span>
                  {person.name} <span className="muted small">{person.email}</span>
                </span>
              </label>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}

export default function DebateForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data, loading, error } = useFetch(async () => {
    const [motions, judges, participants, debate] = await Promise.all([
      motionsApi.list(),
      usersApi.list(ROLES.JUDGE),
      usersApi.list(ROLES.PARTICIPANT),
      isEdit ? debatesApi.get(id) : null,
    ]);
    return { motions, judges, participants, debate };
  }, [id]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Pre-fill the form when editing an existing debate.
  useEffect(() => {
    const debate = data?.debate;
    if (!debate) return;
    setForm({
      title: debate.title,
      motion: debate.motion._id,
      scheduledAt: toLocalInputValue(debate.scheduledAt),
      venue: debate.venue || '',
      judges: debate.judges.map((j) => j._id),
      proposition: debate.participants.filter((p) => p.side === SIDES.PROPOSITION).map((p) => p.user._id),
      opposition: debate.participants.filter((p) => p.side === SIDES.OPPOSITION).map((p) => p.user._id),
    });
  }, [data]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggle = (field, value) =>
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.motion) return setFormError('Choose a motion for this debate.');
    if (form.judges.length === 0) return setFormError('Assign at least one judge.');
    if (form.proposition.length === 0 || form.opposition.length === 0) {
      return setFormError('Each side needs at least one participant.');
    }
    const scheduled = new Date(form.scheduledAt);
    if (Number.isNaN(scheduled.getTime())) return setFormError('Enter a valid date and time.');

    const payload = {
      title: form.title,
      motion: form.motion,
      scheduledAt: scheduled.toISOString(),
      venue: form.venue,
      judges: form.judges,
      participants: [
        ...form.proposition.map((user) => ({ user, side: SIDES.PROPOSITION })),
        ...form.opposition.map((user) => ({ user, side: SIDES.OPPOSITION })),
      ],
    };

    setSaving(true);
    try {
      const debate = isEdit ? await debatesApi.update(id, payload) : await debatesApi.create(payload);
      navigate(`/organizer/debates/${debate._id}`);
    } catch (err) {
      setFormError(getErrorMessage(err));
      setSaving(false);
    }
  };

  if (loading && !data) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;

  const { motions, judges, participants, debate } = data;

  if (debate?.status === DEBATE_STATUS.COMPLETED) {
    return (
      <>
        <Alert>This debate has been completed and can no longer be edited.</Alert>
        <Link to={`/organizer/debates/${id}`}>Back to debate</Link>
      </>
    );
  }

  if (motions.length === 0) {
    return (
      <EmptyState title="Add a motion first">
        Every debate needs a motion. <Link to="/organizer/motions">Create one</Link> and come back.
      </EmptyState>
    );
  }

  return (
    <>
      <PageHeader title={isEdit ? 'Edit debate' : 'New debate'} />

      <form className="card form-card" onSubmit={onSubmit}>
        <Alert>{formError}</Alert>

        <label>
          Debate title
          <input
            name="title"
            value={form.title}
            onChange={onChange}
            placeholder="Round 1, Room A"
            required
            minLength={3}
            maxLength={120}
          />
        </label>

        <label>
          Motion
          <select name="motion" value={form.motion} onChange={onChange} required>
            <option value="">Select a motion...</option>
            {motions.map((m) => (
              <option key={m._id} value={m._id}>
                {m.title}
              </option>
            ))}
          </select>
        </label>

        <div className="grid-2">
          <label>
            Date and time
            <input type="datetime-local" name="scheduledAt" value={form.scheduledAt} onChange={onChange} required />
          </label>
          <label>
            Venue (optional)
            <input name="venue" value={form.venue} onChange={onChange} maxLength={120} />
          </label>
        </div>

        <PeoplePicker
          title="Judges"
          users={judges}
          selected={form.judges}
          onToggle={(userId) => toggle('judges', userId)}
          emptyText="No judges have registered yet."
        />

        <div className="grid-2">
          <PeoplePicker
            title="Proposition"
            users={participants}
            selected={form.proposition}
            disabledIds={form.opposition}
            onToggle={(userId) => toggle('proposition', userId)}
            emptyText="No participants have registered yet."
          />
          <PeoplePicker
            title="Opposition"
            users={participants}
            selected={form.opposition}
            disabledIds={form.proposition}
            onToggle={(userId) => toggle('opposition', userId)}
            emptyText="No participants have registered yet."
          />
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create debate'}
          </button>
          <Link className="btn" to={isEdit ? `/organizer/debates/${id}` : '/organizer'}>
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
