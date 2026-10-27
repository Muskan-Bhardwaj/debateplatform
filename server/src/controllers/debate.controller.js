import Debate from '../models/Debate.js';
import Score from '../models/Score.js';
import { DEBATE_STATUS, ROLES } from '../constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  attachProgress,
  canAccessDebate,
  validateAssignments,
  withRelations,
} from '../services/debate.service.js';
import { buildDebateResults, removeOrphanScores } from '../services/score.service.js';

const findPopulated = (id, user) => withRelations(Debate.findById(id), user).lean();

// Role-aware list: organizers get everything, others only their own debates.
export const listDebates = asyncHandler(async (req, res) => {
  const { user } = req;
  const filter = {};
  if (user.role === ROLES.JUDGE) filter.judges = user._id;
  if (user.role === ROLES.PARTICIPANT) filter['participants.user'] = user._id;

  const debates = await withRelations(Debate.find(filter).sort({ scheduledAt: -1 }), user).lean();
  await attachProgress(debates, user);
  res.json({ debates });
});

export const getDebate = asyncHandler(async (req, res) => {
  const debate = await findPopulated(req.params.id, req.user);
  if (!debate) throw new ApiError(404, 'Debate not found');
  if (!canAccessDebate(req.user, debate)) {
    throw new ApiError(403, 'You are not assigned to this debate');
  }

  await attachProgress([debate], req.user);
  res.json({ debate });
});

export const createDebate = asyncHandler(async (req, res) => {
  await validateAssignments(req.body);

  const debate = await Debate.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ debate: await findPopulated(debate._id, req.user) });
});

export const updateDebate = asyncHandler(async (req, res) => {
  const debate = await Debate.findById(req.params.id);
  if (!debate) throw new ApiError(404, 'Debate not found');
  if (debate.status === DEBATE_STATUS.COMPLETED) {
    throw new ApiError(409, 'Completed debates can no longer be edited');
  }

  await validateAssignments(req.body);

  debate.set(req.body);
  await debate.save();
  await removeOrphanScores(debate);

  res.json({ debate: await findPopulated(debate._id, req.user) });
});

// Closing a debate locks the scores and publishes points to participants.
export const completeDebate = asyncHandler(async (req, res) => {
  const debate = await Debate.findById(req.params.id);
  if (!debate) throw new ApiError(404, 'Debate not found');
  if (debate.status === DEBATE_STATUS.COMPLETED) {
    throw new ApiError(409, 'This debate is already closed');
  }
  if (!(await Score.exists({ debate: debate._id }))) {
    throw new ApiError(409, 'No scores have been submitted yet, so there is nothing to publish');
  }

  debate.status = DEBATE_STATUS.COMPLETED;
  debate.completedAt = new Date();
  await debate.save();

  res.json({ debate: await findPopulated(debate._id, req.user) });
});

export const deleteDebate = asyncHandler(async (req, res) => {
  const debate = await Debate.findById(req.params.id);
  if (!debate) throw new ApiError(404, 'Debate not found');

  await Score.deleteMany({ debate: debate._id });
  await debate.deleteOne();
  res.json({ message: 'Debate deleted' });
});

export const getDebateResults = asyncHandler(async (req, res) => {
  const debate = await findPopulated(req.params.id, req.user);
  if (!debate) throw new ApiError(404, 'Debate not found');

  res.json({ results: await buildDebateResults(debate) });
});
