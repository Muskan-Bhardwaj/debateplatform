import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { debatesApi } from '../../api/debates';
import { getErrorMessage } from '../../api/client';
import Alert from '../../components/Alert';
import { SideBadge, StatusBadge } from '../../components/Badges';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import { CRITERIA, DEBATE_STATUS, MAX_TOTAL, SIDES } from '../../constants';
import { useFetch } from '../../hooks/useFetch';
import { formatDateTime } from '../../utils/format';

export default function OrganizerDebateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useFetch(async () => {
    const [debate, results] = await Promise.all([debatesApi.get(id), debatesApi.results(id)]);
    return { debate, results };
  }, [id]);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const runAction = async (action, onDone) => {
    setActionError('');
    setBusy(true);
    try {
      await action();
      onDone();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onComplete = () => {
    const message =
      'Close this debate? Scores will be locked and participants will see their points on their profile.';
    if (window.confirm(message)) runAction(() => debatesApi.complete(id), reload);
  };

  const onDelete = () => {
    if (window.confirm('Delete this debate and all of its scores? This cannot be undone.')) {
      runAction(() => debatesApi.remove(id), () => navigate('/organizer'));
    }
  };

  if (loading && !data) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;

  const { debate, results } = data;
  const isOpen = debate.status === DEBATE_STATUS.SCHEDULED;
  const teamOf = (side) => debate.participants.filter((p) => p.side === side);
  const anyScores = results.some((r) => r.judgesScored > 0);

  return (
    <>
      <PageHeader
        title={debate.title}
        subtitle={`${formatDateTime(debate.scheduledAt)}${debate.venue ? ` · ${debate.venue}` : ''}`}
        actions={
          <>
            {isOpen && (
              <Link className="btn" to={`/organizer/debates/${id}/edit`}>
                Edit
              </Link>
            )}
            {isOpen && (
              <button className="btn btn-primary" onClick={onComplete} disabled={busy}>
                Close debate and publish results
              </button>
            )}
            <button className="btn btn-danger" onClick={onDelete} disabled={busy}>
              Delete
            </button>
          </>
        }
      />
      <Alert>{actionError}</Alert>

      <section className="card">
        <div className="debate-card-top">
          <h2>Motion</h2>
          <StatusBadge status={debate.status} />
        </div>
        <p className="motion-text">{debate.motion?.title}</p>
        {debate.motion?.description && <p className="muted">{debate.motion.description}</p>}
      </section>

      <div className="grid-3">
        <section className="card">
          <h3>Judges</h3>
          <ul className="plain-list">
            {debate.judges.map((judge) => (
              <li key={judge._id}>{judge.name}</li>
            ))}
          </ul>
        </section>
        {[SIDES.PROPOSITION, SIDES.OPPOSITION].map((side) => (
          <section className="card" key={side}>
            <h3>
              <SideBadge side={side} />
            </h3>
            <ul className="plain-list">
              {teamOf(side).map((p) => (
                <li key={p.user._id}>{p.user.name}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="card">
        <div className="debate-card-top">
          <h2>Results</h2>
          <span className="muted small">
            {debate.progress.scored} of {debate.progress.expected} scores submitted
          </span>
        </div>

        {!anyScores ? (
          <EmptyState title="No scores yet">Assigned judges can start scoring from their dashboard.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Side</th>
                  {CRITERIA.map((c) => (
                    <th key={c.key}>{c.label}</th>
                  ))}
                  <th>Points (out of {MAX_TOTAL})</th>
                  <th>Judges scored</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row) => (
                  <tr key={row.participant._id}>
                    <td>{row.participant.name}</td>
                    <td>
                      <SideBadge side={row.side} />
                    </td>
                    {CRITERIA.map((c) => (
                      <td key={c.key}>{row.breakdown[c.key]}</td>
                    ))}
                    <td>
                      <strong>{row.points}</strong>
                    </td>
                    <td>
                      {row.judgesScored} / {row.judgesTotal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted small">Points are the average of all judges' totals for each participant.</p>
      </section>
    </>
  );
}
