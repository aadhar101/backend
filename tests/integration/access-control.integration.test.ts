import request from 'supertest';
import app from '../../src/app';

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

const protectedRoutes: Array<{ method: HttpMethod; path: string }> = [
  { method: 'post', path: '/api/v1/auth/change-password' },
  { method: 'post', path: '/api/v1/auth/logout' },
  { method: 'get', path: '/api/v1/auth/me' },
  { method: 'post', path: '/api/v1/hotels' },
  { method: 'put', path: '/api/v1/hotels/123' },
  { method: 'delete', path: '/api/v1/hotels/123' },
  { method: 'patch', path: '/api/v1/hotels/123/featured' },
  { method: 'patch', path: '/api/v1/hotels/123/remove-image' },
  { method: 'post', path: '/api/v1/hotels/123/rooms' },
  { method: 'put', path: '/api/v1/hotels/123/rooms/123' },
  { method: 'delete', path: '/api/v1/hotels/123/rooms/123' },
  { method: 'patch', path: '/api/v1/hotels/123/rooms/123/status' },
  { method: 'post', path: '/api/v1/bookings' },
  { method: 'get', path: '/api/v1/bookings/my' },
  { method: 'get', path: '/api/v1/bookings/admin/stats' },
  { method: 'get', path: '/api/v1/bookings/reference/ABC123' },
  { method: 'get', path: '/api/v1/bookings/123' },
  { method: 'patch', path: '/api/v1/bookings/123/cancel' },
  { method: 'get', path: '/api/v1/bookings' },
  { method: 'patch', path: '/api/v1/bookings/123/status' },
  { method: 'post', path: '/api/v1/reviews' },
  { method: 'get', path: '/api/v1/reviews' },
  { method: 'patch', path: '/api/v1/reviews/123/approve' },
  { method: 'patch', path: '/api/v1/reviews/123/respond' },
  { method: 'delete', path: '/api/v1/reviews/123' },
  { method: 'get', path: '/api/v1/users/profile' },
  { method: 'put', path: '/api/v1/users/profile' },
  { method: 'get', path: '/api/v1/users' },
  { method: 'get', path: '/api/v1/users/123' },
  { method: 'patch', path: '/api/v1/users/123/toggle-status' },
  { method: 'patch', path: '/api/v1/users/123/role' },
  { method: 'delete', path: '/api/v1/users/123' },
  { method: 'get', path: '/api/v1/admin/dashboard' },
  { method: 'get', path: '/api/v1/admin/stats' },
];

describe('Protected routes access control', () => {
  it.each(protectedRoutes)('should reject unauthenticated $method $path', async ({ method, path }) => {
    const req = (request(app) as any)[method](path).send({});
    const response = await req;

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      message: 'No token provided',
    });
  });
});

