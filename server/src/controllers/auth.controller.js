import User from '../models/User.js';
import { env } from '../config/env.js';
import { ROLES } from '../constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/token.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, inviteCode } = req.body;

  // Organizers can create debates and assign people, so they need an invite code.
  if (role === ROLES.ORGANIZER) {
    if (!env.organizerInviteCode || inviteCode !== env.organizerInviteCode) {
      throw new ApiError(403, 'Invalid organizer invite code');
    }
  }

  if (await User.exists({ email })) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const user = await User.create({ name, email, password, role });
  res.status(201).json({ token: signToken(user), user });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  // Same message for unknown email and wrong password so accounts cannot be enumerated.
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  res.json({ token: signToken(user), user });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
