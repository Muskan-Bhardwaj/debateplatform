import { ApiError } from '../utils/ApiError.js';

// Validates req[source] against a zod schema and replaces it with the parsed value.
export const validate =
  (schema, source = 'body') =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new ApiError(400, details[0]?.message || 'Invalid input', details));
    }
    req[source] = result.data;
    next();
  };

const OBJECT_ID = /^[a-f\d]{24}$/i;

// Rejects malformed ids in route params before they reach the database.
export const validateObjectId =
  (...params) =>
  (req, res, next) => {
    for (const param of params) {
      if (!OBJECT_ID.test(req.params[param] || '')) {
        return next(new ApiError(400, `Invalid ${param}`));
      }
    }
    next();
  };
