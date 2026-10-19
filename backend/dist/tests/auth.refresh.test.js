"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const env_1 = require("../api/config/env");
const auth_service_1 = require("../api/services/auth.service");
const error_1 = require("../api/utils/error");
const refreshSession_repository_1 = require("../api/repositories/refreshSession.repository");
const user_repository_1 = require("../api/repositories/user.repository");
const admin_repository_1 = require("../api/repositories/admin.repository");
jest.mock('../api/repositories/refreshSession.repository', () => ({
    refreshSessionRepository: {
        create: jest.fn(),
        findByJti: jest.fn(),
        rotate: jest.fn(),
        revokeFamily: jest.fn()
    }
}));
jest.mock('../api/repositories/user.repository', () => ({
    userRepository: {
        findByEmail: jest.fn(),
        findById: jest.fn(),
        create: jest.fn()
    }
}));
jest.mock('../api/repositories/admin.repository', () => ({
    adminRepository: {
        findByEmailOrUsername: jest.fn(),
        findById: jest.fn()
    }
}));
jest.mock('../api/services/email.service', () => ({
    emailService: { sendEmail: jest.fn() }
}));
const mockedSessions = jest.mocked(refreshSession_repository_1.refreshSessionRepository);
const mockedUsers = jest.mocked(user_repository_1.userRepository);
const mockedAdmins = jest.mocked(admin_repository_1.adminRepository);
const GRACE_MS = 60 * 1000;
const account = {
    id: 'user-1',
    email: 'user@example.com',
    isVerified: true
};
function signRefreshToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}
function makeSession(overrides = {}) {
    return {
        jti: 'jti-1',
        userId: 'user-1',
        type: 'user',
        familyId: 'fam-1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        revokedAt: null,
        rotatedAt: null,
        replacedByJti: null,
        userAgent: null,
        ip: null,
        ...overrides
    };
}
function decodeRefresh(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.JWT_REFRESH_SECRET);
}
beforeEach(() => {
    jest.clearAllMocks();
    mockedUsers.findById.mockResolvedValue(account);
    mockedAdmins.findById.mockResolvedValue(null);
});
describe('authService.refreshAccessToken', () => {
    it('rotates an active session and embeds jti/familyId in the new token', async () => {
        const token = signRefreshToken({
            userId: 'user-1',
            type: 'user',
            jti: 'jti-1',
            fid: 'fam-1'
        });
        const session = makeSession();
        mockedSessions.findByJti.mockResolvedValue(session);
        mockedSessions.create.mockResolvedValue({});
        mockedSessions.rotate.mockResolvedValue(makeSession({ rotatedAt: new Date(), replacedByJti: 'jti-2' }));
        const result = await auth_service_1.authService.refreshAccessToken(token);
        expect(mockedSessions.rotate).toHaveBeenCalledWith('jti-1', expect.any(String));
        expect(mockedSessions.create).toHaveBeenCalledWith(expect.objectContaining({ familyId: 'fam-1', userId: 'user-1' }));
        const payload = decodeRefresh(result.refreshToken);
        expect(payload.jti).toBeDefined();
        expect(payload.jti).not.toBe('jti-1');
        expect(payload.fid).toBe('fam-1');
    });
    it('issues a fresh pair within the grace window instead of 401 (tab race)', async () => {
        const token = signRefreshToken({
            userId: 'user-1',
            type: 'user',
            jti: 'jti-1',
            fid: 'fam-1'
        });
        mockedSessions.findByJti.mockResolvedValue(makeSession({
            rotatedAt: new Date(Date.now() - 5 * 1000),
            replacedByJti: 'jti-2'
        }));
        mockedSessions.create.mockResolvedValue({});
        const result = await auth_service_1.authService.refreshAccessToken(token);
        expect(mockedSessions.rotate).not.toHaveBeenCalled();
        expect(mockedSessions.revokeFamily).not.toHaveBeenCalled();
        const payload = decodeRefresh(result.refreshToken);
        expect(payload.jti).toBeDefined();
        expect(payload.fid).toBe('fam-1');
    });
    it('treats a concurrent rotation loss within the grace window as a race, not reuse', async () => {
        const token = signRefreshToken({
            userId: 'user-1',
            type: 'user',
            jti: 'jti-1',
            fid: 'fam-1'
        });
        mockedSessions.findByJti
            .mockResolvedValueOnce(makeSession())
            .mockResolvedValueOnce(makeSession({
            rotatedAt: new Date(Date.now() - 1 * 1000),
            replacedByJti: 'jti-2'
        }));
        mockedSessions.rotate.mockResolvedValue(null);
        mockedSessions.create.mockResolvedValue({});
        const result = await auth_service_1.authService.refreshAccessToken(token);
        expect(mockedSessions.revokeFamily).not.toHaveBeenCalled();
        const payload = decodeRefresh(result.refreshToken);
        expect(payload.fid).toBe('fam-1');
    });
    it('revokes the whole family when a token rotated beyond the grace window is reused', async () => {
        const token = signRefreshToken({
            userId: 'user-1',
            type: 'user',
            jti: 'jti-1',
            fid: 'fam-1'
        });
        mockedSessions.findByJti.mockResolvedValue(makeSession({
            rotatedAt: new Date(Date.now() - GRACE_MS - 5 * 1000),
            replacedByJti: 'jti-2'
        }));
        await expect(auth_service_1.authService.refreshAccessToken(token)).rejects.toMatchObject({
            statusCode: 401
        });
        expect(mockedSessions.revokeFamily).toHaveBeenCalledWith('fam-1');
        expect(mockedSessions.create).not.toHaveBeenCalled();
    });
    it('rejects a revoked session with 401', async () => {
        const token = signRefreshToken({
            userId: 'user-1',
            type: 'user',
            jti: 'jti-1',
            fid: 'fam-1'
        });
        mockedSessions.findByJti.mockResolvedValue(makeSession({ revokedAt: new Date() }));
        await expect(auth_service_1.authService.refreshAccessToken(token)).rejects.toMatchObject({
            statusCode: 401
        });
        expect(mockedSessions.rotate).not.toHaveBeenCalled();
    });
    it('rejects an expired session with 401', async () => {
        const token = signRefreshToken({
            userId: 'user-1',
            type: 'user',
            jti: 'jti-1',
            fid: 'fam-1'
        });
        mockedSessions.findByJti.mockResolvedValue(makeSession({ expiresAt: new Date(Date.now() - 1000) }));
        await expect(auth_service_1.authService.refreshAccessToken(token)).rejects.toMatchObject({
            statusCode: 401
        });
    });
    it('rejects a token whose session record is missing with 401', async () => {
        const token = signRefreshToken({
            userId: 'user-1',
            type: 'user',
            jti: 'missing',
            fid: 'fam-1'
        });
        mockedSessions.findByJti.mockResolvedValue(null);
        await expect(auth_service_1.authService.refreshAccessToken(token)).rejects.toMatchObject({
            statusCode: 401
        });
    });
    it('rejects a token with an invalid signature with 401', async () => {
        const token = jsonwebtoken_1.default.sign({ userId: 'user-1', type: 'user', jti: 'jti-1' }, 'wrong-secret', { expiresIn: '7d' });
        await expect(auth_service_1.authService.refreshAccessToken(token)).rejects.toMatchObject({
            statusCode: 401
        });
    });
    it('accepts a legacy token (no jti) once and creates a session', async () => {
        const token = signRefreshToken({ userId: 'user-1', type: 'user' });
        mockedSessions.create.mockResolvedValue({});
        const result = await auth_service_1.authService.refreshAccessToken(token);
        expect(mockedSessions.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', familyId: expect.any(String) }));
        const payload = decodeRefresh(result.refreshToken);
        expect(payload.jti).toBeDefined();
        expect(payload.fid).toBeDefined();
    });
});
describe('authService.logout', () => {
    it('revokes the session family for a valid token', async () => {
        const token = signRefreshToken({
            userId: 'user-1',
            type: 'user',
            jti: 'jti-1',
            fid: 'fam-1'
        });
        mockedSessions.findByJti.mockResolvedValue(makeSession());
        await auth_service_1.authService.logout(token);
        expect(mockedSessions.revokeFamily).toHaveBeenCalledWith('fam-1');
    });
    it('swallows invalid tokens without throwing', async () => {
        await expect(auth_service_1.authService.logout('not-a-jwt')).resolves.toBeUndefined();
        expect(mockedSessions.revokeFamily).not.toHaveBeenCalled();
    });
});
describe('authService.login', () => {
    it('creates a session and embeds jti/familyId in the refresh token', async () => {
        const passwordHash = await bcrypt_1.default.hash('Password1!', 4);
        mockedUsers.findByEmail.mockResolvedValue({
            id: 'user-1',
            email: 'user@example.com',
            isVerified: true,
            passwordHash
        });
        mockedAdmins.findByEmailOrUsername.mockResolvedValue(null);
        mockedSessions.create.mockResolvedValue({});
        const result = await auth_service_1.authService.login('user@example.com', 'Password1!', {
            ip: '127.0.0.1',
            userAgent: 'jest'
        });
        expect(mockedSessions.create).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'user-1',
            userAgent: 'jest',
            ip: '127.0.0.1'
        }));
        const payload = decodeRefresh(result.refreshToken);
        expect(payload.jti).toBeDefined();
        expect(payload.fid).toBeDefined();
    });
    it('rejects invalid credentials with 401', async () => {
        const passwordHash = await bcrypt_1.default.hash('Password1!', 4);
        mockedUsers.findByEmail.mockResolvedValue({
            id: 'user-1',
            email: 'user@example.com',
            isVerified: true,
            passwordHash
        });
        mockedAdmins.findByEmailOrUsername.mockResolvedValue(null);
        await expect(auth_service_1.authService.login('user@example.com', 'Wrong1!')).rejects.toMatchObject({ statusCode: 401 });
        expect(mockedSessions.create).not.toHaveBeenCalled();
    });
});
describe('ApiError shape', () => {
    it('uses statusCode for 401 auth failures', async () => {
        const token = signRefreshToken({
            userId: 'user-1',
            type: 'user',
            jti: 'missing',
            fid: 'fam-1'
        });
        mockedSessions.findByJti.mockResolvedValue(null);
        try {
            await auth_service_1.authService.refreshAccessToken(token);
            fail('expected refreshAccessToken to throw');
        }
        catch (error) {
            expect(error).toBeInstanceOf(error_1.ApiError);
            expect(error.statusCode).toBe(401);
        }
    });
});
