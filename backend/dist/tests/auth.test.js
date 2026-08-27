"use strict";
// import request from 'supertest';
// import {app} from '../../backend/index';
// describe('Login route', () => {
//   it('should reject invalid credentials', async () => {
//     const res = await request(app)
//       .post('/api/auth/login')
//       .send({email: 'fake@test.com', password: 'wrongpass'});
//     expect(res.status).toBe(401);
//     expect(res.body).toHaveProperty('error');
//   });
//   it('should accept valid credentials', async () => {
//     const res = await request(app)
//       .post('/api/auth/login')
//       .send({email: 'valid@test.com', password: 'correctpass'});
//     expect(res.status).toBe(200);
//     expect(res.body).toHaveProperty('token'); 
//   });
// });
