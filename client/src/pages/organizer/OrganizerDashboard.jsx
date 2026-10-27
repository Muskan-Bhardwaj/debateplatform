import { useState } from 'react';
import { Link } from 'react-router-dom';
import { debatesApi } from '../../api/debates';
import { motionsApi } from '../../api/motions';
import { getErrorMessage } from '../../api/client';
import Alert from '../../components/Alert';
import { StatusBadge } from '../../components/Badges';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import Spinner from '../../components/Spinner';
import { DEBATE_STATUS } from '../../constants';
import { useFetch } from '../../hooks/useFetch';
import { formatDateTime } from '../../utils/format';

export default function OrganizerDashboard() {
  const { data, loading, error, reload } = useFetch(async () => {
    const [debates, motions] = await Promise.all([debatesApi.list(), motionsApi.list()]);
    return { debates, motions };
  }, []);
  const [actionError, setActionError] = useState('');

  const onDelete = async (debate) => {
    if (!window.confirm(`Delete "${debate.title}" and all of its scores? This cannot be undone.`)) return;
    setActionError('');
    try {
      await debatesApi.remove(debate._id);
      reload();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  if (loading && !data) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;

  const { debates, motions } = data;
  const scheduled = debates.filter((d) => d.status === DEBATE_STATUS.SCHEDULED).length;

  return (
    <>
      <PageHeader
        title="Debates"
        subtitle="Create debates, assign judges and participants, and publish results."
        actions={
          <Link className="btn btn-primary" to="/organizer/debates/new">
            New debate
          </Link>
        }
      />

      <div className="stats">
        <div className="card stat">
          <span className="stat-value">{motions.length}</span>
          <span className="muted">Motions</span>
        </div>
        <div className="card stat">
          <span className="stat-value">{debates.length}</span>
          <span className="muted">Debates</span>
        </div>
        <div className="card stat">
          <span className="stat-value">{scheduled}</span>
          <span className="muted">Scheduled</span>
        </div>
        <div className="card stat">
          <span className="stat-value">{debates.length - scheduled}</span>
          <span className="muted">Completed</span>
        </div>
      </div>

      <Alert>{actionError}</Alert>

      {debates.length === 0 ? (
        <EmptyState title="No debates yet">
          {motions.length === 0 ? (
            <>
              Start by <Link to="/organizer/motions">adding a motion</Link>, then create a debate.
            </>
          ) : (
            'Create your first debate to assign judges and participants.'
          )}
        </EmptyState>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Debate</th>
                <th>Date</th>
                <th>Status</th>
                <th>Scores in</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {debates.map((debate) => (
                <tr key={debate._id}>
                  <td>
                    <Link to={`/organizer/debates/${debate._id}`}>
                      <strong>{debate.title}</strong>
                    </Link>
                    <div className="muted small">{debate.motion?.title}</div>
                  </td>
                  <td>{formatDateTime(debate.scheduledAt)}</td>
                  <td>
                    <StatusBadge status={debate.status} />
                  </td>
                  <td>
                    {debate.progress.scored} / {debate.progress.expected}
                  </td>
                  <td className="row-actions">
                    <Link className="btn btn-sm" to={`/organizer/debates/${debate._id}`}>
                      View
                    </Link>
                    {debate.status === DEBATE_STATUS.SCHEDULED && (
                      <Link className="btn btn-sm" to={`/organizer/debates/${debate._id}/edit`}>
                        Edit
                      </Link>
                    )}
                    <button className="btn btn-sm btn-danger" onClick={() => onDelete(debate)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
