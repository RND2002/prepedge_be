"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsletterService = void 0;
const newsletter_schema_1 = require("./newsletter.schema");
const errors_1 = require("../lib/errors");
class NewsletterService {
    static async signup(email, ipAddress) {
        // Check duplicate
        const existing = await newsletter_schema_1.Newsletter.findOne({ email });
        if (existing) {
            throw new Error(errors_1.ErrorCodes.DUPLICATE_EMAIL);
        }
        // Save document
        const newSignup = new newsletter_schema_1.Newsletter({
            email,
            ipAddress
        });
        await newSignup.save();
        return newSignup;
    }
}
exports.NewsletterService = NewsletterService;
//# sourceMappingURL=newsletter.service.js.map