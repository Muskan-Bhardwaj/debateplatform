import Motion from '../models/Motion.js';
import User from '../models/User.js';
import Score from '../models/Score.js';
import { ROLES, SIDES } from '../constants.js';
import { ApiError } from '../utils/ApiError.js';
import { sameId } from '../utils/ids.js';

// Populates the references a debate needs on every screen.
// Only organizers get email addresses; judges and participants just see names.
export const withRelations = (query, user) => {
  const fields = user?.role === ROLES.ORGANIZER ? 'name email' : 'name';
  return query
    .populate('motion', 'title description')
    .populate('judges', fields)
    .populate('participants.user', fields);
};

// Organizers see every debate; judges and participants only the ones they are assigned to.
export function canAccessDebate(user, debate) {
  switch (user.role) {
    case ROLES.ORGANIZER:
      return true;
    case ROLES.JUDGE:
      return debate.judges.some((judge) => sameId(judge, user._id));
    case ROLES.PARTICIPANT:
      return debate.participants.some((p) => sameId(p.user, user._id));
    default:
      return false;
  }
}

// Adds `progress: { scored, expected }` to each (lean) debate.
// Judges see their own progress; organizers see overall progress.
export async function attachProgress(debates, user) {
  if (user.role === ROLES.PARTICIPANT || debates.length === 0) return debates;

  const isJudge = user.role === ROLES.JUDGE;
  const match = { debate: { $in: debates.map((d) => d._id) } };
  if (isJudge) match.judge = user._id;

  const rows = await Score.aggregate([
    { $match: match },
    { $group: { _id: '$debate', count: { $sum: 1 } } },
  ]);
  const counts = new Map(rows.map((row) => [String(row._id), row.count]));

  for (const debate of debates) {
    debate.progress = {
      scored: counts.get(String(debate._id)) || 0,
      expected: isJudge
        ? debate.participants.length
        : debate.participants.length * debate.judges.length,
    };
  }
  return debates;
}

// Checks the motion exists and the assigned people really are judges/participants.
export async function validateAssignments({ motion, judges, participants }) {
  if (!(await Motion.exists({ _id: motion }))) {
    throw new ApiError(400, 'The selected motion does not exist');
  }

  if (new Set(judges).size !== judges.length) {
    throw new ApiError(400, 'A judge is listed more than once');
  }

  const participantIds = participants.map((p) => p.user);
  if (new Set(participantIds).size !== participantIds.length) {
    throw new ApiError(400, 'A participant can only be assigned to one side');
  }

  const hasSide = (side) => participants.some((p) => p.side === side);
  if (!hasSide(SIDES.PROPOSITION) || !hasSide(SIDES.OPPOSITION)) {
    throw new ApiError(400, 'Each side needs at least one participant');
  }

  const [judgeCount, participantCount] = await Promise.all([
    User.countDocuments({ _id: { $in: judges }, role: ROLES.JUDGE }),
    User.countDocuments({ _id: { $in: participantIds }, role: ROLES.PARTICIPANT }),
  ]);
  if (judgeCount !== judges.length) {
    throw new ApiError(400, 'One or more selected judges are invalid');
  }
  if (participantCount !== participantIds.length) {
    throw new ApiError(400, 'One or more selected participants are invalid');
  }
}
