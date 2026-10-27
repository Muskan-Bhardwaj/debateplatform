import { profileApi } from '../../api/profile';
import Alert from '../../components/Alert';
import { SideBadge } from '../../components/Badges';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import { CRITERIA } from '../../constants';
import { useFetch } from '../../hooks/useFetch';
import { formatDate } from '../../utils/format';

export default function Profile() {
  const { data, loading, error } = useFetch(() => profileApi.get(), []);

  if (loading && !data) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;

  const { user, totalPoints, debatesScored, averagePerDebate, maxPerDebate, history } = data;

  return (
    <>
      <PageHeader title={user.name} subtitle={user.email} />

      <div className="stats">
        <div className="card stat">
          <span className="stat-value">{totalPoints}</span>
          <span className="muted">Total points</span>
        </div>
        <div className="card stat">
          <span className="stat-value">{debatesScored}</span>
          <span className="muted">Debates scored</span>
        </div>
        <div className="card stat">
          <span className="stat-value">
            {averagePerDebate}
            <span className="stat-max"> / {maxPerDebate}</span>
          </span>
          <span className="muted">Average per debate</span>
        </div>
      </div>

      <h2>Debate history</h2>
      <p className="muted small">
        Points appear here once the organizer closes a debate. Each debate is worth the average of your
        judges' scores.
      </p>

      {history.length === 0 ? (
        <EmptyState title="No points yet">
          Your results will show up after your first debate has been scored and closed.
        </EmptyState>
      ) : (
        <div className="stack">
          {history.map((entry) => (
            <article className="card" key={entry.debateId}>
              <div className="debate-card-top">
                <h3>{entry.title}</h3>
                <div className="badge-row">
                  <SideBadge side={entry.side} />
                  <span className="badge badge-completed">
                    {entry.points} / {maxPerDebate}
                  </span>
                </div>
              </div>
              <p className="motion-text">{entry.motion}</p>
              <p className="muted small">
                {formatDate(entry.scheduledAt)} · Averaged from {entry.judgesScored} judge
                {entry.judgesScored === 1 ? '' : 's'}
              </p>

              <div className="breakdown">
                {CRITERIA.map((c) => (
                  <div key={c.key}>
                    <span className="muted small">{c.label}</span>
                    <strong>{entry.breakdown[c.key]}</strong>
                  </div>
                ))}
              </div>

              {entry.feedback.length > 0 && (
                <ul className="feedback-list">
                  {entry.feedback.map((f, i) => (
                    <li key={i}>
                      <span className="muted small">{f.judge}</span>
                      <p>{f.text}</p>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
