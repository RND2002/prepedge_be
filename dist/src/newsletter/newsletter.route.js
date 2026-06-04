"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const newsletter_controller_1 = require("./newsletter.controller");
const newsletter_schema_validator_1 = require("./newsletter-schema.validator");
const router = (0, express_1.Router)();
router.post('/', newsletter_schema_validator_1.validateNewsletterSignup, newsletter_controller_1.NewsletterController.signup);
exports.default = router;
//# sourceMappingURL=newsletter.route.js.map