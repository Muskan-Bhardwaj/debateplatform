import { z } from 'zod';
import { ROLES } from '../constants.js';

const email = z.string().trim().toLowerCase().email('Enter a valid email address');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80, 'Name is too long'),
  email,
  // bcrypt only uses the first 72 bytes, so longer passwords are rejected up front
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be 72 characters or fewer'),
  role: z.enum(Object.values(ROLES), { errorMap: () => ({ message: 'Choose a valid role' }) }),
  inviteCode: z.string().optional(),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});
