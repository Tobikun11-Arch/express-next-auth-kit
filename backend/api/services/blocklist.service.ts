const revokedTokens = new Set<string>();

function cleanupExpiredTokens() {
  const now = Date.now();
  for (const token of revokedTokens) {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      if (payload.exp && payload.exp * 1000 < now) {
        revokedTokens.delete(token);
      }
    } catch {
      revokedTokens.delete(token);
    }
  }
}

setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

export const blocklistService = {
  revoke(token: string) {
    revokedTokens.add(token);
  },

  isRevoked(token: string) {
    return revokedTokens.has(token);
  }
};
