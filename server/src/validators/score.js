import { z } from 'zod';
import { SCORE_MAX } from '../constants.js';

const mark = z
  .number({ invalid_type_error: 'Scores must be numbers', required_error: 'All scores are required' })
  .int('Scores must be whole numbers')
  .min(0, 'Scores cannot be negative')
  .max(SCORE_MAX, `Scores cannot be higher than ${SCORE_MAX}`);

export const scoreSchema = z.object({
  argument: mark,
  rebuttal: mark,
  delivery: mark,
  feedback: z
    .string()
    .trim()
    .max(1000, 'Feedback must be 1000 characters or fewer')
    .optional()
    .default(''),
});
