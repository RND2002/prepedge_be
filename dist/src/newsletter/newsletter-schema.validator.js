"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNewsletterSignup = void 0;
const express_validator_1 = require("express-validator");
const errors_1 = require("../lib/errors");
exports.validateNewsletterSignup = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Please enter a valid email address.')
        .normalizeEmail(),
    // Middleware to handle validation results
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                errorCode: errors_1.ErrorCodes.VALIDATION_ERROR,
                error: errors.array()[0]?.msg || 'Invalid input'
            });
            return;
        }
        next();
    }
];
//# sourceMappingURL=newsletter-schema.validator.js.map