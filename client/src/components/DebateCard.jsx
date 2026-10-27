import { formatDateTime } from '../utils/format';
import { SideBadge, StatusBadge } from './Badges';

// Summary card used on the judge and participant dashboards.
export default function DebateCard({ debate, side, children }) {
  return (
    <article className="card debate-card">
      <div className="debate-card-top">
        <h3>{debate.title}</h3>
        <div className="badge-row">
          {side && <SideBadge side={side} />}
          <StatusBadge status={debate.status} />
        </div>
      </div>
      <p className="motion-text">{debate.motion?.title}</p>
      {debate.motion?.description && <p className="muted small">{debate.motion.description}</p>}
      <p className="muted small">
        {formatDateTime(debate.scheduledAt)}
        {debate.venue ? ` · ${debate.venue}` : ''}
      </p>
      {children && <div className="debate-card-footer">{children}</div>}
    </article>
  );
}
