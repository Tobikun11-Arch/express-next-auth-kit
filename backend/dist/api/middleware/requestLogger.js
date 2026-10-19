"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
const logger_1 = require("../logging/logger");
function requestLogger(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        const durationMs = Date.now() - start;
        logger_1.logger.info({
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            durationMs
        }, 'request');
    });
    next();
}
