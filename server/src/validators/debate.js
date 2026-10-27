import { z } from 'zod';
import { SIDES } from '../constants.js';
import { objectId } from './common.js';

export const debateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(120, 'Title must be 120 characters or fewer'),
  motion: objectId,
  scheduledAt: z.coerce.date({ errorMap: () => ({ message: 'Enter a valid date and time' }) }),
  venue: z.string().trim().max(120, 'Venue must be 120 characters or fewer').optional().default(''),
  judges: z.array(objectId).min(1, 'Assign at least one judge'),
  participants: z
    .array(
      z.object({
        user: objectId,
        side: z.enum(Object.values(SIDES)),
      })
    )
    .min(2, 'Assign at least two participants'),
});
