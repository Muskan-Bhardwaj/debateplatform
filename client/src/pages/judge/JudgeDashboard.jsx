import { Link } from 'react-router-dom';
import { debatesApi } from '../../api/debates';
import Alert from '../../components/Alert';
import DebateCard from '../../components/DebateCard';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import { DEBATE_STATUS } from '../../constants';
import { useFetch } from '../../hooks/useFetch';

function DebateList({ debates, actionLabel }) {
  return (
    <div className="stack">
      {debates.map((debate) => (
        <DebateCard key={debate._id} debate={debate}>
          <span className="muted small">
            Scored {debate.progress.scored} of {debate.progress.expected} participants
          </span>
          <Link className="btn btn-primary btn-sm" to={`/judge/debates/${debate._id}`}>
            {actionLabel}
          </Link>
        </DebateCard>
      ))}
    </div>
  );
}

export default function JudgeDashboard() {
  const { data: debates, loading, error } = useFetch(() => debatesApi.list(), []);

  if (loading && !debates) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;

  const toScore = debates
    .filter((d) => d.status === DEBATE_STATUS.SCHEDULED)
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  const completed = debates.filter((d) => d.status === DEBATE_STATUS.COMPLETED);

  return (
    <>
      <PageHeader title="My debates" subtitle="Debates you have been assigned to judge." />

      {debates.length === 0 && (
        <EmptyState title="No debates assigned yet">
          The organizer will assign you to debates. They will appear here.
        </EmptyState>
      )}

      {toScore.length > 0 && (
        <>
          <h2>Open for scoring</h2>
          <DebateList debates={toScore} actionLabel="Score participants" />
        </>
      )}

      {completed.length > 0 && (
        <>
          <h2>Completed</h2>
          <DebateList debates={completed} actionLabel="View my scores" />
        </>
      )}
    </>
  );
}
