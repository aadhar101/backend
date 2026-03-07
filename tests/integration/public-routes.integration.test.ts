import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../src/app';
import { createHotelDoc, createRoomDoc, createUserWithToken } from './helpers';

describe('Public and route-level integration cases', () => {
  it('GET /api/v1/hotels should return paginated hotels', async () => {
    const { user: admin } = await createUserWithToken({ role: 'admin' as any });
    await createHotelDoc(admin._id.toString());

    const response = await request(app).get('/api/v1/hotels');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body).toHaveProperty('pagination');
  });

  it('GET /api/v1/hotels should support city filter', async () => {
    const { user: admin } = await createUserWithToken({ role: 'admin' as any });
    await createHotelDoc(admin._id.toString());

    const response = await request(app).get('/api/v1/hotels?city=Kathmandu');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/v1/hotels/featured should return only featured hotels', async () => {
    const { user: admin } = await createUserWithToken({ role: 'admin' as any });
    await createHotelDoc(admin._id.toString(), true);
    await createHotelDoc(admin._id.toString(), false);

    const response = await request(app).get('/api/v1/hotels/featured');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.every((h: any) => h.isFeatured === true)).toBe(true);
  });

  it('GET /api/v1/hotels/:id should return hotel details', async () => {
    const { user: admin } = await createUserWithToken({ role: 'admin' as any });
    const hotel = await createHotelDoc(admin._id.toString());

    const response = await request(app).get(`/api/v1/hotels/${hotel._id.toString()}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('_id', hotel._id.toString());
  });

  it('GET /api/v1/hotels/:id should return 404 for missing hotel', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const response = await request(app).get(`/api/v1/hotels/${id}`);

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ success: false, message: 'Hotel not found' });
  });

  it('GET /api/v1/hotels/:id should return 400 for invalid hotel id', async () => {
    const response = await request(app).get('/api/v1/hotels/not-a-valid-id');

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ success: false, message: 'Invalid ID format' });
  });

  it('GET /api/v1/hotels/:hotelId/rooms should return room list', async () => {
    const { user: admin } = await createUserWithToken({ role: 'admin' as any });
    const hotel = await createHotelDoc(admin._id.toString());
    await createRoomDoc(hotel._id.toString());

    const response = await request(app).get(`/api/v1/hotels/${hotel._id.toString()}/rooms`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/v1/hotels/:hotelId/rooms/available should return available rooms', async () => {
    const { user: admin } = await createUserWithToken({ role: 'admin' as any });
    const hotel = await createHotelDoc(admin._id.toString());
    await createRoomDoc(hotel._id.toString());

    const response = await request(app).get(
      `/api/v1/hotels/${hotel._id.toString()}/rooms/available?checkIn=2099-01-10&checkOut=2099-01-12&adults=2`
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('GET unknown route should return 404 with route message', async () => {
    const response = await request(app).get('/api/v1/unknown/resource');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('not found');
  });
});

