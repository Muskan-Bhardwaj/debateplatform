import Debate from '../models/Debate.js';
import Score from '../models/Score.js';
import { CRITERIA, DEBATE_STATUS, SCORE_MAX } from '../constants.js';
import { sameId } from '../utils/ids.js';

const round1 = (n) => Math.round(n * 10) / 10;

const average = (items, key) =>
  items.length === 0 ? 0 : round1(items.reduce((sum, item) => sum + item[key], 0) / items.length);

// Averages a participant's scores (one per judge) for a single debate.
function summarise(scores) {
  return {
    judgesScored: scores.length,
    points: average(scores, 'total'),
    breakdown: Object.fromEntries(CRITERIA.map((criterion) => [criterion, average(scores, criterion)])),
  };
}

// When judges or participants are removed from a debate, their scores must go too.
export function removeOrphanScores(debate) {
  return Score.deleteMany({
    debate: debate._id,
    $or: [
      { judge: { $nin: debate.judges } },
      { participant: { $nin: debate.participants.map((p) => p.user) } },
    ],
  });
}

// Organizer view: every participant's averaged result for one debate.
// `debate` must be a lean document with judges and participants.user populated.
export async function buildDebateResults(debate) {
  const scores = await Score.find({ debate: debate._id }).lean();

  return debate.participants
    .map((p) => ({
      participant: { _id: p.user._id, name: p.user.name },
      side: p.side,
      judgesTotal: debate.judges.length,
      ...summarise(scores.filter((s) => sameId(s.participant, p.user))),
    }))
    .sort((a, b) => b.points - a.points);
}

// Participant view. Points only count once the organizer has closed the debate.
// A debate is worth the AVERAGE of the judges' totals, so having more judges
// never inflates anyone's points. The profile total is the sum across debates.
export async function buildParticipantProfile(participantId) {
  const debates = await Debate.find({
    'participants.user': participantId,
    status: DEBATE_STATUS.COMPLETED,
  })
    .populate('motion', 'title')
    .sort({ scheduledAt: -1 })
    .lean();

  const scores = await Score.find({
    participant: participantId,
    debate: { $in: debates.map((d) => d._id) },
  })
    .populate('judge', 'name')
    .lean();

  const history = debates
    .map((debate) => {
      const mine = scores.filter((s) => sameId(s.debate, debate._id));
      const side = debate.participants.find((p) => sameId(p.user, participantId))?.side;
      return {
        debateId: debate._id,
        title: debate.title,
        motion: debate.motion?.title ?? 'Motion removed',
        scheduledAt: debate.scheduledAt,
        side,
        ...summarise(mine),
        feedback: mine
          .filter((s) => s.feedback)
          .map((s) => ({ judge: s.judge?.name ?? 'Judge', text: s.feedback })),
      };
    })
    .filter((entry) => entry.judgesScored > 0);

  // Sum the rounded per-debate points so the profile adds up exactly as displayed.
  const totalPoints = round1(history.reduce((sum, entry) => sum + entry.points, 0));

  return {
    totalPoints,
    debatesScored: history.length,
    averagePerDebate: history.length ? round1(totalPoints / history.length) : 0,
    maxPerDebate: CRITERIA.length * SCORE_MAX,
    history,
  };
}
