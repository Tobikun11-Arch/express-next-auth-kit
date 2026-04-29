"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const error_1 = require("../utils/error");
const logger_1 = require("../logging/logger");
function errorHandler(err, _req, res, _next) {
    if (err instanceof error_1.ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            code: err.code,
            message: err.message,
            details: err.details
        });
    }
    logger_1.logger.error({ err }, 'Unhandled error');
    res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'Unexpected error occurred',
        details: 'An unexpected error occurred'
    });
}
