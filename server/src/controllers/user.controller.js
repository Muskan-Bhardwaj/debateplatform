import User from '../models/User.js';
import { ROLES } from '../constants.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Used by the organizer to pick judges and participants for a debate.
export const listUsers = asyncHandler(async (req, res) => {
  const filter = req.query.role
    ? { role: req.query.role }
    : { role: { $in: [ROLES.JUDGE, ROLES.PARTICIPANT] } };

  const users = await User.find(filter)
    .select('name email role')
    .sort({ name: 1 })
    .collation({ locale: 'en' })
    .lean();

  res.json({ users });
});
