"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitize = sanitize;
function sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') {
        return;
    }
    for (const key of Object.keys(obj)) {
        if (key.startsWith('$')) {
            delete obj[key];
            continue;
        }
        sanitizeObject(obj[key]);
    }
}
// I sanitize request payloads to reduce injection risks
function sanitize(req, _res, next) {
    sanitizeObject(req.body);
    sanitizeObject(req.query);
    sanitizeObject(req.params);
    next();
}
