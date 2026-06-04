"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsletterController = void 0;
const newsletter_service_1 = require("./newsletter.service");
const errors_1 = require("../lib/errors");
class NewsletterController {
    static async signup(req, res) {
        try {
            const { email } = req.body;
            const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
            await newsletter_service_1.NewsletterService.signup(email, ipAddress);
            res.status(201).json({ success: true, message: 'Successfully signed up for newsletter' });
        }
        catch (error) {
            if (error.message === errors_1.ErrorCodes.DUPLICATE_EMAIL) {
                res.status(409).json({
                    success: false,
                    errorCode: errors_1.ErrorCodes.DUPLICATE_EMAIL,
                    error: errors_1.ErrorMessages[errors_1.ErrorCodes.DUPLICATE_EMAIL]
                });
                return;
            }
            console.error('Newsletter signup error:', error);
            res.status(500).json({
                success: false,
                errorCode: errors_1.ErrorCodes.INTERNAL_ERROR,
                error: errors_1.ErrorMessages[errors_1.ErrorCodes.INTERNAL_ERROR]
            });
        }
    }
}
exports.NewsletterController = NewsletterController;
//# sourceMappingURL=newsletter.controller.js.map