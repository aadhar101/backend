import { Response, NextFunction } from 'express';
import { roomService } from '../services/room.service';
import { AuthenticatedRequest } from '../types/user.type';

export class RoomController {
  async createRoom(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = (req.files as Express.Multer.File[]) || [];
      const images = files.map((f) => f.path);
      const room = await roomService.createRoom(req.params.hotelId, req.body, images);
      res.status(201).json({ success: true, message: 'Room created', data: room });
    } catch (error) { next(error); }
  }

  async getRoomsByHotel(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = req.query;
      const result = await roomService.getRoomsByHotel(req.params.hotelId, Number(page) || 1, Number(limit) || 10);
      res.json({ success: true, data: result.data, pagination: { ...result, data: undefined } });
    } catch (error) { next(error); }
  }

  async getRoomById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const room = await roomService.getRoomById(req.params.id);
      res.json({ success: true, data: room });
    } catch (error) { next(error); }
  }

  async updateRoom(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = (req.files as Express.Multer.File[]) || [];
      const newImages = files.map((f) => f.path);
      const room = await roomService.updateRoom(req.params.id, req.body, newImages);
      res.json({ success: true, message: 'Room updated', data: room });
    } catch (error) { next(error); }
  }

  async deleteRoom(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await roomService.deleteRoom(req.params.id);
      res.json({ success: true, message: 'Room deleted' });
    } catch (error) { next(error); }
  }

  async updateRoomStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const room = await roomService.updateRoomStatus(req.params.id, req.body.status);
      res.json({ success: true, data: room });
    } catch (error) { next(error); }
  }

  async getAvailableRooms(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { checkIn, checkOut, adults, children } = req.query;
      const rooms = await roomService.getAvailableRooms(
        req.params.hotelId,
        new Date(checkIn as string),
        new Date(checkOut as string),
        Number(adults) || 1,
        Number(children) || 0
      );
      res.json({ success: true, data: rooms });
    } catch (error) { next(error); }
  }
}

export const roomController = new RoomController();

