export const ErrorCodes = {
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export const ErrorMessages = {
  [ErrorCodes.DUPLICATE_EMAIL]: 'Email is already subscribed',
  [ErrorCodes.INTERNAL_ERROR]: 'Internal server error',
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',
  [ErrorCodes.VALIDATION_ERROR]: 'Invalid input provided.',
} as const;
