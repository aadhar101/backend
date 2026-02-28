import { bookingRepository, roomRepository, hotelRepository } from '../repositories';
import { NotFoundError, BadRequestError, ForbiddenError } from '../errors/http-error';
import { CreateBookingDto } from '../dtos';
import { IBooking, BookingStatus, PaymentStatus, PaginatedResult, PaginationOptions, UserRole } from '../types/user.type';
import { sendBookingConfirmationEmail } from '../config/jwt.config';

const TAX_RATE = 0.12; // 12%

export class BookingService {
  async createBooking(userId: string, dto: CreateBookingDto): Promise<IBooking> {
    const room = await roomRepository.model.findById(dto.roomId).populate('hotel');
    if (!room || !room.isActive) throw new NotFoundError('Room not found');

    const hotel = await hotelRepository.findById(dto.hotelId);
    if (!hotel) throw new NotFoundError('Hotel not found');

    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);

    if (checkIn >= checkOut) throw new BadRequestError('Check-out must be after check-in');
    if (checkIn < new Date()) throw new BadRequestError('Check-in cannot be in the past');

    const isAvailable = await bookingRepository.isRoomAvailable(dto.roomId, checkIn, checkOut);
    if (!isAvailable) throw new BadRequestError('Room is not available for the selected dates');

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const pricePerNight = room.discountPrice ?? room.price;
    const subtotal = pricePerNight * nights;
    const taxes = Math.round(subtotal * TAX_RATE * 100) / 100;
    const totalAmount = subtotal + taxes;

    const booking = await bookingRepository.create({
      user: userId as any,
      hotel: dto.hotelId as any,
      room: dto.roomId as any,
      checkIn,
      checkOut,
      adults: dto.adults,
      children: dto.children || 0,
      nights,
      pricePerNight,
      subtotal,
      taxes,
      totalAmount,
      guestInfo: dto.guestInfo,
      specialRequests: dto.specialRequests,
      paymentMethod: dto.paymentMethod,
      status: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
    } as any);

    // Send confirmation email (non-blocking)
    sendBookingConfirmationEmail(
      dto.guestInfo.email,
      booking.bookingReference,
      `${dto.guestInfo.firstName} ${dto.guestInfo.lastName}`,
      checkIn,
      checkOut,
      hotel.name,
      totalAmount
    ).catch(console.error);

    return booking;
  }

  async getBookingById(id: string, userId: string, userRole: UserRole): Promise<IBooking> {
    const booking = await bookingRepository.findById(id);
    if (!booking) throw new NotFoundError('Booking not found');

    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
    if (!isAdmin && booking.user.toString() !== userId) {
      throw new ForbiddenError('Access denied');
    }

    return bookingRepository.model
      .findById(id)
      .populate('user', 'firstName lastName email phone')
      .populate('hotel', 'name address phone email')
      .populate('room', 'roomNumber type name floor bedType')
      .exec() as Promise<IBooking>;
  }

  async getUserBookings(userId: string, page = 1, limit = 10): Promise<PaginatedResult<IBooking>> {
    const options: PaginationOptions = { page, limit, sort: 'createdAt', order: 'desc' };
    return bookingRepository.paginate(
      { user: userId },
      options,
      ['hotel', 'room']
    );
  }

  async getAllBookings(page = 1, limit = 10, status?: string): Promise<PaginatedResult<IBooking>> {
    const filter: any = {};
    if (status) filter.status = status;
    const options: PaginationOptions = { page, limit, sort: 'createdAt', order: 'desc' };
    return bookingRepository.paginate(filter, options, ['user', 'hotel', 'room']);
  }

  async updateBookingStatus(
    id: string,
    status: BookingStatus,
    userId: string,
    userRole: UserRole,
    reason?: string
  ): Promise<IBooking> {
    const booking = await bookingRepository.findById(id);
    if (!booking) throw new NotFoundError('Booking not found');

    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
    const isOwner = booking.user.toString() === userId;

    // Guests can only cancel their own bookings
    if (!isAdmin) {
      if (!isOwner) throw new ForbiddenError();
      if (status !== BookingStatus.CANCELLED) throw new ForbiddenError('Guests can only cancel bookings');
    }

    const updateData: any = { status };
    if (status === BookingStatus.CANCELLED) {
      updateData.cancellationReason = reason;
      updateData.cancelledAt = new Date();
    }
    if (status === BookingStatus.CHECKED_IN) updateData.checkedInAt = new Date();
    if (status === BookingStatus.CHECKED_OUT) updateData.checkedOutAt = new Date();

    return (await bookingRepository.updateById(id, updateData)) as IBooking;
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus, stripeId?: string): Promise<IBooking> {
    const updateData: any = { paymentStatus };
    if (stripeId) updateData.stripePaymentIntentId = stripeId;
    if (paymentStatus === PaymentStatus.PAID) updateData.status = BookingStatus.CONFIRMED;
    return (await bookingRepository.updateById(id, updateData)) as IBooking;
  }

  async getBookingByReference(ref: string): Promise<IBooking> {
    const booking = await bookingRepository.findByReference(ref);
    if (!booking) throw new NotFoundError('Booking not found');
    return booking;
  }

  async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [totalBookings, pendingBookings, confirmedBookings, revenueThisMonth, revenueByMonth] = await Promise.all([
      bookingRepository.count(),
      bookingRepository.count({ status: BookingStatus.PENDING }),
      bookingRepository.count({ status: BookingStatus.CONFIRMED }),
      bookingRepository.model.aggregate([
        { $match: { status: { $in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_OUT] }, createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      bookingRepository.getRevenueStats(new Date(now.getFullYear(), 0, 1), now),
    ]);

    return {
      totalBookings,
      pendingBookings,
      confirmedBookings,
      revenueThisMonth: revenueThisMonth[0]?.total || 0,
      revenueByMonth,
    };
  }
}

export const bookingService = new BookingService();