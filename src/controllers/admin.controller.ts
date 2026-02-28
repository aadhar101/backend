import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/user.type';
import { userRepository, hotelRepository, bookingRepository, reviewRepository } from '../repositories/index';
import { BookingStatus } from '../types/user.type';

export class AdminController {
  async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const [
        totalUsers,
        totalHotels,
        totalBookings,
        pendingBookings,
        activeBookings,
        revenueData,
        topHotels,
        recentBookings,
        reviewsPending,
      ] = await Promise.all([
        userRepository.count({ isActive: true }),
        hotelRepository.count({ isActive: true }),
        bookingRepository.count(),
        bookingRepository.count({ status: BookingStatus.PENDING }),
        bookingRepository.count({ status: BookingStatus.CONFIRMED }),
        bookingRepository.model.aggregate([
          {
            $match: {
              status: { $in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_OUT] },
              createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            },
          },
          { $group: { _id: null, thisMonth: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        ]),
        bookingRepository.model.aggregate([
          { $group: { _id: '$hotel', bookingCount: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
          { $sort: { bookingCount: -1 } },
          { $limit: 5 },
          { $lookup: { from: 'hotels', localField: '_id', foreignField: '_id', as: 'hotel' } },
          { $unwind: '$hotel' },
          { $project: { 'hotel.name': 1, 'hotel.starRating': 1, bookingCount: 1, revenue: 1 } },
        ]),
        bookingRepository.model
          .find()
          .sort({ createdAt: -1 })
          .limit(10)
          .populate('user', 'firstName lastName email')
          .populate('hotel', 'name')
          .populate('room', 'roomNumber type')
          .lean(),
        reviewRepository.count({ isApproved: false }),
      ]);

      const revenueByMonth = await bookingRepository.getRevenueStats(
        new Date(now.getFullYear(), 0, 1),
        now
      );

      res.json({
        success: true,
        data: {
          overview: {
            totalUsers,
            totalHotels,
            totalBookings,
            pendingBookings,
            activeBookings,
            revenueThisMonth: revenueData[0]?.thisMonth || 0,
            reviewsPending,
          },
          revenueByMonth,
          topHotels,
          recentBookings,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getSystemStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const [usersByRole, bookingsByStatus, hotelsByRating] = await Promise.all([
        userRepository.model.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
        bookingRepository.model.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        hotelRepository.model.aggregate([{ $group: { _id: '$starRating', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      ]);

      res.json({ success: true, data: { usersByRole, bookingsByStatus, hotelsByRating } });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();