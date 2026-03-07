import request from 'supertest';
import app from '../../src/app';
import { UserModel } from '../../src/models/user.model';

describe('Auth integration', () => {
  const registerPayload = {
    firstName: 'Integration',
    lastName: 'Tester',
    email: 'integration.user@example.com',
    password: 'Password123',
    phone: '+9779800000000',
  };

  it('POST /api/v1/auth/register should create user and return access token', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(registerPayload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data.user).toHaveProperty('email', registerPayload.email);
    expect(response.body.data.user).toHaveProperty('password');
    expect(response.body.data.user.password).not.toBe(registerPayload.password);

    const savedUser = await UserModel.findOne({ email: registerPayload.email }).select('+password');
    expect(savedUser).not.toBeNull();
    expect(savedUser?.password).not.toBe(registerPayload.password);
  });

  it('POST /api/v1/auth/login should authenticate existing user', async () => {
    await request(app).post('/api/v1/auth/register').send({
      ...registerPayload,
      email: 'login.user@example.com',
    });

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login.user@example.com', password: registerPayload.password });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data.user).toHaveProperty('email', 'login.user@example.com');
  });

  it('GET /api/v1/auth/me should return current user when token is valid', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      ...registerPayload,
      email: 'me.user@example.com',
    });

    const token = registerResponse.body.data.accessToken as string;

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('email', 'me.user@example.com');
  });
});

