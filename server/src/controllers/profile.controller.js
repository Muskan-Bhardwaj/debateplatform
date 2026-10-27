import { asyncHandler } from '../utils/asyncHandler.js';
import { buildParticipantProfile } from '../services/score.service.js';

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await buildParticipantProfile(req.user._id);
  res.json({ user: req.user, ...profile });
});
