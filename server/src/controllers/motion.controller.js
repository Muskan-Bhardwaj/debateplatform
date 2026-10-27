import Motion from '../models/Motion.js';
import Debate from '../models/Debate.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listMotions = asyncHandler(async (req, res) => {
  const motions = await Motion.find().sort({ createdAt: -1 }).lean();
  res.json({ motions });
});

export const createMotion = asyncHandler(async (req, res) => {
  const motion = await Motion.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ motion });
});

export const updateMotion = asyncHandler(async (req, res) => {
  const motion = await Motion.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!motion) throw new ApiError(404, 'Motion not found');
  res.json({ motion });
});

export const deleteMotion = asyncHandler(async (req, res) => {
  const inUse = await Debate.countDocuments({ motion: req.params.id });
  if (inUse > 0) {
    throw new ApiError(
      409,
      `This motion is used by ${inUse} debate${inUse === 1 ? '' : 's'}. Delete or change those debates first.`
    );
  }

  const motion = await Motion.findByIdAndDelete(req.params.id);
  if (!motion) throw new ApiError(404, 'Motion not found');
  res.json({ message: 'Motion deleted' });
});
