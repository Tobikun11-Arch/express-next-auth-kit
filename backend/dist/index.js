"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const db_1 = require("./api/config/db");
const env_1 = require("./api/config/env");
const index_1 = __importDefault(require("./api/routes/index"));
const errorHandler_1 = require("./api/middleware/errorHandler");
const sanitize_1 = require("./api/middleware/sanitize");
const app = (0, express_1.default)();
const allowedOrigins = env_1.env.CORS_ORIGINS
    ? env_1.env.CORS_ORIGINS.split(',').map(o => o.trim().replace(/\/+$/, ''))
    : ['http://localhost:3000'];
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));
app.use(express_1.default.json({ limit: '10kb' }));
app.use((0, cookie_parser_1.default)());
app.use(sanitize_1.sanitize);
app.use('/api', index_1.default);
app.get('/', async (req, res) => {
    res.send('test production!');
});
app.use(errorHandler_1.errorHandler);
let dbInitPromise = null;
const ensureDb = () => {
    if (!dbInitPromise) {
        dbInitPromise = (0, db_1.connectDb)();
    }
    return dbInitPromise;
};
async function handler(req, res) {
    try {
        await ensureDb();
        return app(req, res);
    }
    catch (error) {
        console.error('Failed to connect to database', error);
        return res.status(500).json({ message: 'Database connection failed' });
    }
}
if (process.env.VERCEL !== '1') {
    ensureDb()
        .then(() => {
        app.listen(env_1.env.PORT, () => {
            console.log(`Server listening on port ${env_1.env.PORT}`);
        });
    })
        .catch(error => {
        console.error('Failed to connect to database', error);
        process.exit(1);
    });
}
