"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_1 = require("./api/config/env");
const index_1 = __importDefault(require("./api/routes/index"));
const errorHandler_1 = require("./api/middleware/errorHandler");
const sanitize_1 = require("./api/middleware/sanitize");
const requestLogger_1 = require("./api/middleware/requestLogger");
const csrf_1 = require("./api/middleware/csrf");
const httpsRedirect_1 = require("./api/middleware/httpsRedirect");
const app = (0, express_1.default)();
const allowedOrigins = env_1.env.CORS_ORIGINS
    ? env_1.env.CORS_ORIGINS.split(',').map(o => o.trim().replace(/\/+$/, ''))
    : ['http://localhost:3000'];
app.use((0, helmet_1.default)());
app.use(httpsRedirect_1.httpsRedirect);
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'x-csrf-token']
}));
app.use(express_1.default.json({ limit: '10kb' }));
app.use((0, cookie_parser_1.default)());
app.use(sanitize_1.sanitize);
app.use(requestLogger_1.requestLogger);
app.use(csrf_1.csrfProtection);
app.use('/api', index_1.default);
app.get('/', async (_req, res) => {
    res.send('test production!');
});
app.use(errorHandler_1.errorHandler);
exports.default = app;
