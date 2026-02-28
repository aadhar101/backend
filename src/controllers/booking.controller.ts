import { Response, NextFunction } from 'express';
import { bookingService } from '../services/booking.service';
import { AuthenticatedRequest, UserRole } from '../types/user.type';

export class BookingController {
  async createBooking(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const booking = await bookingService.createBooking(req.user!._id.toString(), req.body);
      res.status(201).json({ success: true, message: 'Booking created', data: booking });
    } catch (error) { next(error); }
  }

  async getMyBookings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = req.query;
      const result = await bookingService.getUserBookings(req.user!._id.toString(), Number(page) || 1, Number(limit) || 10);
      res.json({ success: true, data: result.data, pagination: { ...result, data: undefined } });
    } catch (error) { next(error); }
  }

  async getBookingById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const booking = await bookingService.getBookingById(req.params.id, req.user!._id.toString(), req.user!.role);
      res.json({ success: true, data: booking });
    } catch (error) { next(error); }
  }

  async getBookingByReference(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const booking = await bookingService.getBookingByReference(req.params.reference);
      res.json({ success: true, data: booking });
    } catch (error) { next(error); }
  }

  async cancelBooking(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const booking = await bookingService.updateBookingStatus(
        req.params.id, 'cancelled' as any, req.user!._id.toString(), req.user!.role, req.body.reason
      );
      res.json({ success: true, message: 'Booking cancelled', data: booking });
    } catch (error) { next(error); }
  }

  // Admin routes
  async getAllBookings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, status } = req.query;
      const result = await bookingService.getAllBookings(Number(page) || 1, Number(limit) || 10, status as string);
      res.json({ success: true, data: result.data, pagination: { ...result, data: undefined } });
    } catch (error) { next(error); }
  }

  async updateBookingStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const booking = await bookingService.updateBookingStatus(
        req.params.id, req.body.status, req.user!._id.toString(), req.user!.role, req.body.reason
      );
      res.json({ success: true, data: booking });
    } catch (error) { next(error); }
  }

  async getDashboardStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await bookingService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error) { next(error); }
  }
}

export const bookingController = new BookingController();