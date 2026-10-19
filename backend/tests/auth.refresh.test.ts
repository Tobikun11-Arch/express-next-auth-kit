import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import {env} from '../api/config/env';
import {authService} from '../api/services/auth.service';
import {ApiError} from '../api/utils/error';
import {refreshSessionRepository} from '../api/repositories/refreshSession.repository';
import {userRepository} from '../api/repositories/user.repository';
import {adminRepository} from '../api/repositories/admin.repository';

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
  emailService: {sendEmail: jest.fn()}
}));

const mockedSessions = jest.mocked(refreshSessionRepository);
const mockedUsers = jest.mocked(userRepository);
const mockedAdmins = jest.mocked(adminRepository);

const GRACE_MS = 60 * 1000;

const account = {
  id: 'user-1',
  email: 'user@example.com',
  isVerified: true
};

function signRefreshToken(payload: {
  userId: string;
  type: 'user' | 'admin';
  jti?: string;
  fid?: string;
}) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {expiresIn: '7d'});
}

function makeSession(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    jti: 'jti-1',
    userId: 'user-1',
    type: 'user' as const,
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

function decodeRefresh(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as jwt.JwtPayload & {
    jti?: string;
    fid?: string;
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedUsers.findById.mockResolvedValue(account as never);
  mockedAdmins.findById.mockResolvedValue(null as never);
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
    mockedSessions.findByJti.mockResolvedValue(session as never);
    mockedSessions.create.mockResolvedValue({} as never);
    mockedSessions.rotate.mockResolvedValue(
      makeSession({rotatedAt: new Date(), replacedByJti: 'jti-2'}) as never
    );

    const result = await authService.refreshAccessToken(token);

    expect(mockedSessions.rotate).toHaveBeenCalledWith('jti-1', expect.any(String));
    expect(mockedSessions.create).toHaveBeenCalledWith(
      expect.objectContaining({familyId: 'fam-1', userId: 'user-1'})
    );

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
    mockedSessions.findByJti.mockResolvedValue(
      makeSession({
        rotatedAt: new Date(Date.now() - 5 * 1000),
        replacedByJti: 'jti-2'
      }) as never
    );
    mockedSessions.create.mockResolvedValue({} as never);

    const result = await authService.refreshAccessToken(token);

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
      .mockResolvedValueOnce(makeSession() as never)
      .mockResolvedValueOnce(
        makeSession({
          rotatedAt: new Date(Date.now() - 1 * 1000),
          replacedByJti: 'jti-2'
        }) as never
      );
    mockedSessions.rotate.mockResolvedValue(null as never);
    mockedSessions.create.mockResolvedValue({} as never);

    const result = await authService.refreshAccessToken(token);

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
    mockedSessions.findByJti.mockResolvedValue(
      makeSession({
        rotatedAt: new Date(Date.now() - GRACE_MS - 5 * 1000),
        replacedByJti: 'jti-2'
      }) as never
    );

    await expect(authService.refreshAccessToken(token)).rejects.toMatchObject({
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
    mockedSessions.findByJti.mockResolvedValue(
      makeSession({revokedAt: new Date()}) as never
    );

    await expect(authService.refreshAccessToken(token)).rejects.toMatchObject({
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
    mockedSessions.findByJti.mockResolvedValue(
      makeSession({expiresAt: new Date(Date.now() - 1000)}) as never
    );

    await expect(authService.refreshAccessToken(token)).rejects.toMatchObject({
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
    mockedSessions.findByJti.mockResolvedValue(null as never);

    await expect(authService.refreshAccessToken(token)).rejects.toMatchObject({
      statusCode: 401
    });
  });

  it('rejects a token with an invalid signature with 401', async () => {
    const token = jwt.sign(
      {userId: 'user-1', type: 'user', jti: 'jti-1'},
      'wrong-secret',
      {expiresIn: '7d'}
    );

    await expect(authService.refreshAccessToken(token)).rejects.toMatchObject({
      statusCode: 401
    });
  });

  it('accepts a legacy token (no jti) once and creates a session', async () => {
    const token = signRefreshToken({userId: 'user-1', type: 'user'});
    mockedSessions.create.mockResolvedValue({} as never);

    const result = await authService.refreshAccessToken(token);

    expect(mockedSessions.create).toHaveBeenCalledWith(
      expect.objectContaining({userId: 'user-1', familyId: expect.any(String)})
    );

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
    mockedSessions.findByJti.mockResolvedValue(makeSession() as never);

    await authService.logout(token);

    expect(mockedSessions.revokeFamily).toHaveBeenCalledWith('fam-1');
  });

  it('swallows invalid tokens without throwing', async () => {
    await expect(
      authService.logout('not-a-jwt')
    ).resolves.toBeUndefined();
    expect(mockedSessions.revokeFamily).not.toHaveBeenCalled();
  });
});

describe('authService.login', () => {
  it('creates a session and embeds jti/familyId in the refresh token', async () => {
    const passwordHash = await bcrypt.hash('Password1!', 4);
    mockedUsers.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      isVerified: true,
      passwordHash
    } as never);
    mockedAdmins.findByEmailOrUsername.mockResolvedValue(null as never);
    mockedSessions.create.mockResolvedValue({} as never);

    const result = await authService.login('user@example.com', 'Password1!', {
      ip: '127.0.0.1',
      userAgent: 'jest'
    });

    expect(mockedSessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        userAgent: 'jest',
        ip: '127.0.0.1'
      })
    );

    const payload = decodeRefresh(result.refreshToken);
    expect(payload.jti).toBeDefined();
    expect(payload.fid).toBeDefined();
  });

  it('rejects invalid credentials with 401', async () => {
    const passwordHash = await bcrypt.hash('Password1!', 4);
    mockedUsers.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      isVerified: true,
      passwordHash
    } as never);
    mockedAdmins.findByEmailOrUsername.mockResolvedValue(null as never);

    await expect(
      authService.login('user@example.com', 'Wrong1!')
    ).rejects.toMatchObject({statusCode: 401});
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
    mockedSessions.findByJti.mockResolvedValue(null as never);

    try {
      await authService.refreshAccessToken(token);
      fail('expected refreshAccessToken to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).statusCode).toBe(401);
    }
  });
});
