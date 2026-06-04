"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMessages = exports.ErrorCodes = void 0;
exports.ErrorCodes = {
    DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
};
exports.ErrorMessages = {
    [exports.ErrorCodes.DUPLICATE_EMAIL]: 'Email is already subscribed',
    [exports.ErrorCodes.INTERNAL_ERROR]: 'Internal server error',
    [exports.ErrorCodes.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',
    [exports.ErrorCodes.VALIDATION_ERROR]: 'Invalid input provided.',
};
//# sourceMappingURL=errors.js.map