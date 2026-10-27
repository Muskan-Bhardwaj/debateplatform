import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getErrorMessage } from '../api/client';
import Alert from '../components/Alert';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants';

export default function Register() {
  const { user, register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: ROLES.PARTICIPANT,
    inviteCode: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={`/${user.role}`} replace />;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (payload.role !== ROLES.ORGANIZER) delete payload.inviteCode;
      await register(payload);
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={onSubmit}>
        <h1>Create an account</h1>
        <Alert>{error}</Alert>

        <label>
          Full name
          <input name="name" value={form.name} onChange={onChange} required minLength={2} maxLength={80} />
        </label>
        <label>
          Email
          <input type="email" name="email" value={form.email} onChange={onChange} required />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            required
            minLength={8}
            maxLength={72}
          />
          <span className="hint">At least 8 characters</span>
        </label>
        <label>
          I am a
          <select name="role" value={form.role} onChange={onChange}>
            <option value={ROLES.PARTICIPANT}>Participant (debater)</option>
            <option value={ROLES.JUDGE}>Judge</option>
            <option value={ROLES.ORGANIZER}>Organizer</option>
          </select>
        </label>
        {form.role === ROLES.ORGANIZER && (
          <label>
            Organizer invite code
            <input name="inviteCode" value={form.inviteCode} onChange={onChange} required />
            <span className="hint">Ask the event owner for this code.</span>
          </label>
        )}

        <button className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Sign up'}
        </button>
        <p className="small">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
