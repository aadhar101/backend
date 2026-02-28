import { FilterQuery } from 'mongoose';
import { BaseRepository } from './user.repository';
import { UserModel } from '../models/user.model';
import { HotelModel } from '../models/hotel.model';
import { RoomModel } from '../models/room.model';
import { BookingModel } from '../models/booking.model';
import { ReviewModel } from '../models/review.model';
import { AmenityModel } from '../models/amenity.model';
import { IUser, IHotel, IRoom, IBooking, IReview, IAmenity, BookingStatus } from '../types/user.type';

// ─── User Repository ──────────────────────────────────────────────────────────

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    const query = UserModel.findOne({ email: email.toLowerCase() });
    if (includePassword) query.select('+password');
    return query.exec();
  }

  async findByResetToken(token: string): Promise<IUser | null> {
    return UserModel.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    })
      .select('+passwordResetToken +passwordResetExpires')
      .exec();
  }
}

// ─── Hotel Repository ─────────────────────────────────────────────────────────

export class HotelRepository extends BaseRepository<IHotel> {
  constructor() {
    super(HotelModel);
  }

  async search(query: {
    city?: string;
    country?: string;
    search?: string;
    starRating?: number;
    minPrice?: number;
    maxPrice?: number;
    amenities?: string[];
    isFeatured?: boolean;
    isActive?: boolean;
  }): Promise<FilterQuery<IHotel>> {
    const filter: FilterQuery<IHotel> = { isActive: query.isActive ?? true };

    if (query.city) filter['address.city'] = { $regex: query.city, $options: 'i' };
    if (query.country) filter['address.country'] = { $regex: query.country, $options: 'i' };
    if (query.search) filter.$text = { $search: query.search };
    if (query.starRating) filter.starRating = query.starRating;
    if (query.isFeatured !== undefined) filter.isFeatured = query.isFeatured;
    if (query.amenities?.length) filter.amenities = { $all: query.amenities };

    return filter;
  }
}

// ─── Room Repository ──────────────────────────────────────────────────────────

export class RoomRepository extends BaseRepository<IRoom> {
  constructor() {
    super(RoomModel);
  }

  async findAvailableRooms(
    hotelId: string,
    checkIn: Date,
    checkOut: Date,
    adults: number,
    children = 0
  ): Promise<IRoom[]> {
    // Get booked room IDs for the date range
    const bookedRoomIds = await BookingModel.distinct('room', {
      hotel: hotelId,
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.PENDING] },
      $or: [
        { checkIn: { $lt: checkOut, $gte: checkIn } },
        { checkOut: { $gt: checkIn, $lte: checkOut } },
        { checkIn: { $lte: checkIn }, checkOut: { $gte: checkOut } },
      ],
    });

    return RoomModel.find({
      hotel: hotelId,
      _id: { $nin: bookedRoomIds },
      status: 'available',
      isActive: true,
      'capacity.adults': { $gte: adults },
      'capacity.children': { $gte: children },
    }).exec();
  }
}

// ─── Booking Repository ───────────────────────────────────────────────────────

export class BookingRepository extends BaseRepository<IBooking> {
  constructor() {
    super(BookingModel);
  }

  async findByReference(ref: string): Promise<IBooking | null> {
    return BookingModel.findOne({ bookingReference: ref })
      .populate('user', 'firstName lastName email')
      .populate('hotel', 'name address phone')
      .populate('room', 'roomNumber type name floor')
      .exec();
  }

  async isRoomAvailable(roomId: string, checkIn: Date, checkOut: Date, excludeBookingId?: string): Promise<boolean> {
    const filter: FilterQuery<IBooking> = {
      room: roomId,
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.PENDING] },
      $or: [
        { checkIn: { $lt: checkOut, $gte: checkIn } },
        { checkOut: { $gt: checkIn, $lte: checkOut } },
        { checkIn: { $lte: checkIn }, checkOut: { $gte: checkOut } },
      ],
    };
    if (excludeBookingId) filter._id = { $ne: excludeBookingId };
    const count = await BookingModel.countDocuments(filter);
    return count === 0;
  }

  async getRevenueStats(startDate: Date, endDate: Date) {
    return BookingModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_OUT] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }
}

// ─── Review Repository ────────────────────────────────────────────────────────

export class ReviewRepository extends BaseRepository<IReview> {
  constructor() {
    super(ReviewModel);
  }
}

// ─── Amenity Repository ───────────────────────────────────────────────────────

export class AmenityRepository extends BaseRepository<IAmenity> {
  constructor() {
    super(AmenityModel);
  }
}

// ─── Singleton instances ──────────────────────────────────────────────────────

export const userRepository = new UserRepository();
export const hotelRepository = new HotelRepository();
export const roomRepository = new RoomRepository();
export const bookingRepository = new BookingRepository();
export const reviewRepository = new ReviewRepository();
export const amenityRepository = new AmenityRepository();