"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpsRedirect = httpsRedirect;
const env_1 = require("../config/env");
function httpsRedirect(req, res, next) {
    if (env_1.env.NODE_ENV !== 'production') {
        return next();
    }
    const proto = req.headers['x-forwarded-proto'];
    const isSecure = req.secure ||
        (typeof proto === 'string' && proto.split(',')[0].trim() === 'https');
    if (isSecure) {
        return next();
    }
    const host = req.headers.host;
    return res.redirect(301, `https://${host}${req.originalUrl}`);
}
