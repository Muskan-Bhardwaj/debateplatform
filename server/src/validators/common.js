import { z } from 'zod';

export const objectId = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-f\d]{24}$/, 'Invalid id');
