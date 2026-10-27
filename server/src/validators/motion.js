import { z } from 'zod';

export const motionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Motion must be at least 5 characters')
    .max(300, 'Motion must be 300 characters or fewer'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description must be 1000 characters or fewer')
    .optional()
    .default(''),
});
