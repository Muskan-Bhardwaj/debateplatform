// Error with an HTTP status code. Thrown from controllers/services and
// turned into a JSON response by the error middleware.
export class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}
