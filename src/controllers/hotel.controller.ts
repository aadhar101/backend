import { Response, NextFunction } from 'express';
import { hotelService } from '../services/hotel.service';
import { AuthenticatedRequest } from '../types/user.type';

export class HotelController {
  async createHotel(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = (req.files as Express.Multer.File[]) || [];
      const images = files.map((f) => f.path);
      const hotel = await hotelService.createHotel(req.body, req.user!._id.toString(), images);
      res.status(201).json({ success: true, message: 'Hotel created', data: hotel });
    } catch (error) { next(error); }
  }

  async getHotels(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await hotelService.getHotels(req.query as any);
      res.json({ success: true, data: result.data, pagination: { ...result, data: undefined } });
    } catch (error) { next(error); }
  }

  async getHotelById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const hotel = await hotelService.getHotelById(req.params.id);
      res.json({ success: true, data: hotel });
    } catch (error) { next(error); }
  }

  async updateHotel(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = (req.files as Express.Multer.File[]) || [];
      const newImages = files.map((f) => f.path);
      const hotel = await hotelService.updateHotel(req.params.id, req.body, newImages);
      res.json({ success: true, message: 'Hotel updated', data: hotel });
    } catch (error) { next(error); }
  }

  async deleteHotel(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await hotelService.deleteHotel(req.params.id);
      res.json({ success: true, message: 'Hotel deleted' });
    } catch (error) { next(error); }
  }

  async toggleFeatured(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const hotel = await hotelService.toggleFeatured(req.params.id);
      res.json({ success: true, data: hotel });
    } catch (error) { next(error); }
  }

  async getFeaturedHotels(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const hotels = await hotelService.getFeaturedHotels();
      res.json({ success: true, data: hotels });
    } catch (error) { next(error); }
  }

  async removeImage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const hotel = await hotelService.removeImage(req.params.id, req.body.imageUrl);
      res.json({ success: true, data: hotel });
    } catch (error) { next(error); }
  }
}

export const hotelController = new HotelController();

