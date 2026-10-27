import { Link } from 'react-router-dom';
import { debatesApi } from '../../api/debates';
import { profileApi } from '../../api/profile';
import Alert from '../../components/Alert';
import DebateCard from '../../components/DebateCard';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import { DEBATE_STATUS } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';

export default function ParticipantDashboard() {
  const { user } = useAuth();
  const { data, loading, error } = useFetch(async () => {
    const [debates, profile] = await Promise.all([debatesApi.list(), profileApi.get()]);
    return { debates, profile };
  }, []);

  if (loading && !data) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;

  const { debates, profile } = data;
  const sideOf = (debate) => debate.participants.find((p) => p.user._id === user._id)?.side;

  const upcoming = debates
    .filter((d) => d.status === DEBATE_STATUS.SCHEDULED)
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  const completed = debates.filter((d) => d.status === DEBATE_STATUS.COMPLETED);

  const renderCard = (debate) => (
    <DebateCard key={debate._id} debate={debate} side={sideOf(debate)}>
      <span className="muted small">Judges: {debate.judges.map((j) => j.name).join(', ')}</span>
    </DebateCard>
  );

  return (
    <>
      <PageHeader title="My debates" subtitle="Motions you have been assigned to." />

      <Link to="/participant/profile" className="card points-banner">
        <div>
          <span className="muted small">Your total points</span>
          <div className="points-value">{profile.totalPoints}</div>
        </div>
        <span className="small">
          From {profile.debatesScored} scored debate{profile.debatesScored === 1 ? '' : 's'}. View profile
        </span>
      </Link>

      {debates.length === 0 && (
        <EmptyState title="No debates yet">
          The organizer has not assigned you to a motion. Check back soon.
        </EmptyState>
      )}

      {upcoming.length > 0 && (
        <>
          <h2>Upcoming</h2>
          <div className="stack">{upcoming.map(renderCard)}</div>
        </>
      )}

      {completed.length > 0 && (
        <>
          <h2>Completed</h2>
          <div className="stack">{completed.map(renderCard)}</div>
        </>
      )}
    </>
  );
}
