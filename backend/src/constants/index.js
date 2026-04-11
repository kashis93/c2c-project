// Minimal constants for backend operation
module.exports = {
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },
  ERROR_MESSAGES: {
    FAILED_AUTH: 'Authentication failed',
    USER_NOT_FOUND: 'User not found',
    INVALID_PASSWORD: 'Invalid password',
    EMAIL_REQUIRED: 'Email is required',
    PASSWORD_REQUIRED: 'Password is required',
    INVALID_TOKEN: 'Invalid or expired token',
  },
};
