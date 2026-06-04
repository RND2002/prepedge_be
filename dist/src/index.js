"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const mongodb_1 = require("./lib/mongodb");
const rateLimiter_1 = require("./lib/rateLimiter");
const newsletter_route_1 = __importDefault(require("./newsletter/newsletter.route"));
const app = (0, express_1.default)();
// Security Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: process.env.FRONTEND_URL }));
// Body parser with 10kb limit
app.use(express_1.default.json({ limit: '10kb' }));
// Trust proxy for rate limiter to get actual IP if behind reverse proxy
app.set('trust proxy', 1);
// Routes
app.use('/api/newsletter', rateLimiter_1.rateLimiter, newsletter_route_1.default);
// Initialize and start server
const PORT = process.env.PORT || 8080;
const startServer = async () => {
    await (0, mongodb_1.connectToDatabase)();
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};
startServer();
//# sourceMappingURL=index.js.map