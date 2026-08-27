"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blocklistService = void 0;
const revokedTokens = new Set();
function cleanupExpiredTokens() {
    const now = Date.now();
    for (const token of revokedTokens) {
        try {
            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            if (payload.exp && payload.exp * 1000 < now) {
                revokedTokens.delete(token);
            }
        }
        catch {
            revokedTokens.delete(token);
        }
    }
}
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);
exports.blocklistService = {
    revoke(token) {
        revokedTokens.add(token);
    },
    isRevoked(token) {
        return revokedTokens.has(token);
    }
};
