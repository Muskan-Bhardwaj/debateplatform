import { DEBATE_STATUS } from '../constants';
import { capitalize } from '../utils/format';

export function StatusBadge({ status }) {
  const label = status === DEBATE_STATUS.COMPLETED ? 'Completed' : 'Scheduled';
  return <span className={`badge badge-${status}`}>{label}</span>;
}

export function SideBadge({ side }) {
  return <span className={`badge badge-${side}`}>{capitalize(side)}</span>;
}
