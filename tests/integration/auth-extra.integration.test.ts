import request from 'supertest';
import app from '../../src/app';

describe('Auth additional integration cases', () => {
  it('POST /api/v1/auth/refresh-token should fail when token is missing', async () => {
    const response = await request(app).post('/api/v1/auth/refresh-token').send({});

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ success: false, message: 'No refresh token' });
  });

  it('POST /api/v1/auth/reset-password should reject invalid token', async () => {
    const response = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: 'invalid-token', password: 'NewPassword123' });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Invalid or expired reset token',
    });
  });

  it('POST /api/v1/auth/register should reject duplicate email', async () => {
    const payload = {
      firstName: 'Duplicate',
      lastName: 'User',
      email: 'duplicate@example.com',
      password: 'Password123',
    };

    await request(app).post('/api/v1/auth/register').send(payload);
    const response = await request(app).post('/api/v1/auth/register').send(payload);

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ success: false, message: 'Email already registered' });
  });

  it('POST /api/v1/auth/login should reject wrong password', async () => {
    await request(app).post('/api/v1/auth/register').send({
      firstName: 'Login',
      lastName: 'User',
      email: 'loginwrong@example.com',
      password: 'Password123',
    });

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'loginwrong@example.com', password: 'WrongPassword123' });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Invalid email or password',
    });
  });

  it('GET /api/v1/auth/me should reject malformed access token', async () => {
    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer this-is-not-a-jwt');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ success: false, message: 'Invalid token' });
  });
});

