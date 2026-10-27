import { z } from 'zod';
import { ROLES } from '../constants.js';

export const listUsersQuery = z.object({
  role: z.enum([ROLES.JUDGE, ROLES.PARTICIPANT]).optional(),
});
