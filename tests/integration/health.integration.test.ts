import request from 'supertest';
import app from '../../src/app';

describe('Health endpoint integration', () => {
  it('GET /health should return service status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('env', 'test');
  });
});

