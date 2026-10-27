import Debate from '../models/Debate.js';
import Score from '../models/Score.js';
import { CRITERIA, DEBATE_STATUS } from '../constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sameId } from '../utils/ids.js';

// Loads the debate and makes sure the logged-in judge is assigned to it.
async function loadDebateForJudge(debateId, judgeId) {
  const debate = await Debate.findById(debateId).lean();
  if (!debate) throw new ApiError(404, 'Debate not found');
  if (!debate.judges.some((judge) => sameId(judge, judgeId))) {
    throw new ApiError(403, 'You are not assigned to judge this debate');
  }
  return debate;
}

// The scores this judge has already submitted for a debate.
export const getMyScores = asyncHandler(async (req, res) => {
  const { debateId } = req.params;
  await loadDebateForJudge(debateId, req.user._id);

  const scores = await Score.find({ debate: debateId, judge: req.user._id }).lean();
  res.json({ scores });
});

// Create or update this judge's score for one participant (idempotent upsert).
export const saveScore = asyncHandler(async (req, res) => {
  const { debateId, participantId } = req.params;
  const debate = await loadDebateForJudge(debateId, req.user._id);

  if (debate.status === DEBATE_STATUS.COMPLETED) {
    throw new ApiError(409, 'This debate is closed. Scores can no longer be changed.');
  }
  if (!debate.participants.some((p) => sameId(p.user, participantId))) {
    throw new ApiError(404, 'That participant is not part of this debate');
  }

  const { feedback } = req.body;
  const marks = Object.fromEntries(CRITERIA.map((criterion) => [criterion, req.body[criterion]]));
  const total = CRITERIA.reduce((sum, criterion) => sum + marks[criterion], 0);

  const score = await Score.findOneAndUpdate(
    { debate: debateId, judge: req.user._id, participant: participantId },
    { $set: { ...marks, total, feedback } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();

  res.json({ score });
});
