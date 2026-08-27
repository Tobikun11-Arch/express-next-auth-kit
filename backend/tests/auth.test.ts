import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import {connectDb} from '../api/config/db';
import {userRepository} from '../api/repositories/user.repository';
import {UserModel} from '../api/models/User.model';

jest.mock('../api/services/email.service', () => ({
  emailService: {
    sendEmail: jest.fn().mockResolvedValue(undefined)
  }
}));

const BASE = '/api/auth';
const VALID_PASSWORD = 'Password1!';

type Agent = ReturnType<typeof request.agent>;

async function newAgent(): Promise<{agent: Agent; csrfToken: string}> {
  const agent = request.agent(app);
  const res = await agent.get(`${BASE}/csrf`);
  return {agent, csrfToken: res.body.csrfToken as string};
}

function authed(agent: Agent, csrfToken: string) {
  return {
    post(path: string, body: Record<string, unknown> | string) {
      return agent.post(path).set('x-csrf-token', csrfToken).send(body);
    },
    put(path: string, body: Record<string, unknown> | string) {
      return agent.put(path).set('x-csrf-token', csrfToken).send(body);
    },
    patch(path: string, body: Record<string, unknown> | string) {
      return agent.patch(path).set('x-csrf-token', csrfToken).send(body);
    },
    delete(path: string) {
      return agent.delete(path).set('x-csrf-token', csrfToken);
    }
  };
}

beforeAll(async () => {
  await connectDb();
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
}, 60000);

beforeEach(async () => {
  await UserModel.deleteMany({});
});

describe('Auth API', () => {
  describe('register', () => {
    it('creates a user and returns id/email (unverified)', async () => {
      const {agent, csrfToken} = await newAgent();
      const res = await authed(agent, csrfToken).post(`${BASE}/register`, {
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        username: 'juandc',
        email: 'juan@example.com',
        password: VALID_PASSWORD
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.email).toBe('juan@example.com');

      const user = await userRepository.findByEmail('juan@example.com');
      expect(user).not.toBeNull();
      expect(user?.isVerified).toBe(false);
    });

    it('rejects duplicate email with EMAIL_EXISTS', async () => {
      const {agent, csrfToken} = await newAgent();
      const payload = {
        firstName: 'A',
        lastName: 'B',
        username: 'user1',
        email: 'dup@example.com',
        password: VALID_PASSWORD
      };
      await authed(agent, csrfToken).post(`${BASE}/register`, payload);
      const res = await authed(agent, csrfToken).post(`${BASE}/register`, {
        ...payload,
        username: 'user2'
      });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('EMAIL_EXISTS');
    });

    it('rejects missing username with VALIDATION_ERROR (now required)', async () => {
      const {agent, csrfToken} = await newAgent();
      const res = await authed(agent, csrfToken).post(`${BASE}/register`, {
        firstName: 'A',
        lastName: 'B',
        email: 'nousername@example.com',
        password: VALID_PASSWORD
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('rejects a weak password with VALIDATION_ERROR', async () => {
      const {agent, csrfToken} = await newAgent();
      const res = await authed(agent, csrfToken).post(`${BASE}/register`, {
        firstName: 'A',
        lastName: 'B',
        username: 'weakpass',
        email: 'weak@example.com',
        password: 'short'
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('CSRF protection', () => {
    it('rejects state-changing requests without a CSRF token', async () => {
      const agent = request.agent(app);
      const res = await agent.post(`${BASE}/register`).send({
        firstName: 'A',
        lastName: 'B',
        username: 'csrf',
        email: 'csrf@example.com',
        password: VALID_PASSWORD
      });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('CSRF_TOKEN_INVALID');
    });
  });

  describe('verify', () => {
    it('verifies a user with the correct code', async () => {
      const {agent, csrfToken} = await newAgent();
      const email = 'verify@example.com';
      await authed(agent, csrfToken).post(`${BASE}/register`, {
        firstName: 'A',
        lastName: 'B',
        username: 'verifier',
        email,
        password: VALID_PASSWORD
      });

      const user = await userRepository.findByEmail(email);
      const code = user?.verificationCode as string;

      const res = await authed(agent, csrfToken).post(`${BASE}/verify`, {
        email,
        code
      });

      expect(res.status).toBe(200);

      const verified = await userRepository.findByEmail(email);
      expect(verified?.isVerified).toBe(true);
    });

    it('rejects an incorrect code', async () => {
      const {agent, csrfToken} = await newAgent();
      const email = 'wrongcode@example.com';
      await authed(agent, csrfToken).post(`${BASE}/register`, {
        firstName: 'A',
        lastName: 'B',
        username: 'wrongcoder',
        email,
        password: VALID_PASSWORD
      });

      const res = await authed(agent, csrfToken).post(`${BASE}/verify`, {
        email,
        code: '000000'
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_CODE');
    });
  });

  describe('login / session', () => {
    async function registerAndVerify() {
      const {agent, csrfToken} = await newAgent();
      const email = 'login@example.com';
      await authed(agent, csrfToken).post(`${BASE}/register`, {
        firstName: 'A',
        lastName: 'B',
        username: 'loginuser',
        email,
        password: VALID_PASSWORD
      });
      const user = await userRepository.findByEmail(email);
      await authed(agent, csrfToken).post(`${BASE}/verify`, {
        email,
        code: user?.verificationCode as string
      });
      return {agent, csrfToken, email};
    }

    it('logs in a verified user and sets cookies', async () => {
      const {agent} = await registerAndVerify();
      const res = await agent
        .post(`${BASE}/login`)
        .set('x-csrf-token', (await newAgent()).csrfToken)
        .send({email: 'login@example.com', password: VALID_PASSWORD});

      expect(res.status).toBe(200);
      expect(res.body.user.type).toBe('user');
    });

    it('rejects an unverified user with NOT_VERIFIED', async () => {
      const {agent, csrfToken} = await newAgent();
      await authed(agent, csrfToken).post(`${BASE}/register`, {
        firstName: 'A',
        lastName: 'B',
        username: 'unverified',
        email: 'unverified@example.com',
        password: VALID_PASSWORD
      });

      const res = await agent
        .post(`${BASE}/login`)
        .set('x-csrf-token', csrfToken)
        .send({email: 'unverified@example.com', password: VALID_PASSWORD});

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('NOT_VERIFIED');
    });

    it('rejects wrong credentials with INVALID_CREDENTIALS', async () => {
      const {agent} = await registerAndVerify();
      const {csrfToken: loginCsrf} = await newAgent();
      const res = await agent
        .post(`${BASE}/login`)
        .set('x-csrf-token', loginCsrf)
        .send({email: 'login@example.com', password: 'WrongPass1!'});

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('returns the current user from /me with a valid cookie', async () => {
      const {agent, csrfToken} = await registerAndVerify();
      await agent
        .post(`${BASE}/login`)
        .set('x-csrf-token', csrfToken)
        .send({email: 'login@example.com', password: VALID_PASSWORD});

      const me = await agent.get(`${BASE}/me`);
      expect(me.status).toBe(200);
      expect(me.body.user).toHaveProperty('id');
    });

    it('rejects /me without authentication', async () => {
      const me = await request(app).get(`${BASE}/me`);
      expect(me.status).toBe(401);
      expect(me.body.code).toBe('UNAUTHORIZED');
    });

    it('refreshes the access token', async () => {
      const {agent, csrfToken} = await registerAndVerify();
      await agent
        .post(`${BASE}/login`)
        .set('x-csrf-token', csrfToken)
        .send({email: 'login@example.com', password: VALID_PASSWORD});

      const res = await agent
        .post(`${BASE}/refresh`)
        .set('x-csrf-token', csrfToken)
        .send({});
      expect(res.status).toBe(200);
    });

    it('clears the session on logout', async () => {
      const {agent, csrfToken} = await registerAndVerify();
      await agent
        .post(`${BASE}/login`)
        .set('x-csrf-token', csrfToken)
        .send({email: 'login@example.com', password: VALID_PASSWORD});

      await agent
        .post(`${BASE}/logout`)
        .set('x-csrf-token', csrfToken)
        .send({});

      const me = await agent.get(`${BASE}/me`);
      expect(me.status).toBe(401);
    });
  });
});
