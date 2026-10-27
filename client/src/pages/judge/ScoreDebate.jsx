import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { debatesApi, scoresApi } from '../../api/debates';
import { getErrorMessage } from '../../api/client';
import Alert from '../../components/Alert';
import { SideBadge, StatusBadge } from '../../components/Badges';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import { CRITERIA, DEBATE_STATUS, MAX_TOTAL, SCORE_MAX, SIDES } from '../../constants';
import { useFetch } from '../../hooks/useFetch';
import { formatDateTime } from '../../utils/format';

const toFormValues = (score) => ({
  argument: score?.argument ?? '',
  rebuttal: score?.rebuttal ?? '',
  delivery: score?.delivery ?? '',
  feedback: score?.feedback ?? '',
});

// One participant's scoring form. Saving again simply updates the score.
function ScoreCard({ debateId, participant, side, savedScore, locked, onSaved }) {
  const [values, setValues] = useState(toFormValues(savedScore));
  const [status, setStatus] = useState('idle'); // idle | saving | saved
  const [error, setError] = useState('');

  const onChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
    if (status === 'saved') setStatus('idle');
  };

  const total = CRITERIA.reduce((sum, c) => sum + (Number(values[c.key]) || 0), 0);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('saving');
    try {
      const score = await scoresApi.save(debateId, participant._id, {
        argument: Number(values.argument),
        rebuttal: Number(values.rebuttal),
        delivery: Number(values.delivery),
        feedback: values.feedback,
      });
      onSaved(score);
      setStatus('saved');
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus('idle');
    }
  };

  return (
    <form className="card score-card" onSubmit={onSubmit}>
      <div className="debate-card-top">
        <h3>{participant.name}</h3>
        <div className="badge-row">
          <SideBadge side={side} />
          {savedScore ? (
            <span className="badge badge-completed">
              Scored {savedScore.total}/{MAX_TOTAL}
            </span>
          ) : (
            <span className="badge badge-pending">Not scored</span>
          )}
        </div>
      </div>

      <Alert>{error}</Alert>

      <div className="score-inputs">
        {CRITERIA.map((c) => (
          <label key={c.key}>
            {c.label} (0-{SCORE_MAX})
            <input
              type="number"
              name={c.key}
              min={0}
              max={SCORE_MAX}
              step={1}
              required
              disabled={locked}
              value={values[c.key]}
              onChange={onChange}
            />
          </label>
        ))}
        <div className="score-total">
          <span className="muted small">Total</span>
          <strong>
            {total} / {MAX_TOTAL}
          </strong>
        </div>
      </div>

      <label>
        Feedback (optional)
        <textarea
          name="feedback"
          rows={2}
          maxLength={1000}
          disabled={locked}
          value={values.feedback}
          onChange={onChange}
          placeholder="What went well? What could improve?"
        />
      </label>

      {!locked && (
        <div className="form-actions">
          <button className="btn btn-primary btn-sm" disabled={status === 'saving'}>
            {status === 'saving' ? 'Saving...' : savedScore ? 'Update score' : 'Save score'}
          </button>
          {status === 'saved' && <span className="success-text small">Saved</span>}
        </div>
      )}
    </form>
  );
}

export default function ScoreDebate() {
  const { id } = useParams();
  const { data, loading, error } = useFetch(async () => {
    const [debate, scores] = await Promise.all([debatesApi.get(id), scoresApi.mine(id)]);
    return { debate, scores };
  }, [id]);
  // Scores saved during this visit, keyed by participant id.
  const [savedByParticipant, setSavedByParticipant] = useState({});

  if (loading && !data) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;

  const { debate, scores } = data;
  const locked = debate.status === DEBATE_STATUS.COMPLETED;

  const scoreFor = (participantId) =>
    savedByParticipant[participantId] || scores.find((s) => s.participant === participantId);

  const scoredCount = debate.participants.filter((p) => scoreFor(p.user._id)).length;

  return (
    <>
      <PageHeader
        title={debate.title}
        subtitle={`${formatDateTime(debate.scheduledAt)}${debate.venue ? ` · ${debate.venue}` : ''}`}
        actions={<Link className="btn" to="/judge">Back to my debates</Link>}
      />

      <section className="card">
        <div className="debate-card-top">
          <h2>Motion</h2>
          <StatusBadge status={debate.status} />
        </div>
        <p className="motion-text">{debate.motion?.title}</p>
        {debate.motion?.description && <p className="muted">{debate.motion.description}</p>}
      </section>

      {locked ? (
        <Alert type="info">This debate is closed. Your scores are locked.</Alert>
      ) : (
        <p className="muted">
          Scored {scoredCount} of {debate.participants.length} participants. You can update a score until
          the organizer closes the debate.
        </p>
      )}

      <div className="stack">
        {[SIDES.PROPOSITION, SIDES.OPPOSITION].flatMap((side) =>
          debate.participants
            .filter((p) => p.side === side)
            .map((p) => (
              <ScoreCard
                key={p.user._id}
                debateId={debate._id}
                participant={p.user}
                side={p.side}
                savedScore={scoreFor(p.user._id)}
                locked={locked}
                onSaved={(score) =>
                  setSavedByParticipant((prev) => ({ ...prev, [p.user._id]: score }))
                }
              />
            ))
        )}
      </div>
    </>
  );
}
