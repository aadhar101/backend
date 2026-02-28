import { reviewRepository, bookingRepository, userRepository } from '../repositories';
import { NotFoundError, BadRequestError, ConflictError } from '../errors/http-error';
import { CreateReviewDto, RespondReviewDto } from '../dtos';
import { IReview, IUser, PaginatedResult, PaginationOptions, BookingStatus } from '../types/user.type';
import { UpdateProfileDto } from '../dtos/auth.dto';

// ─── Review Service ───────────────────────────────────────────────────────────

export class ReviewService {
  async createReview(userId: string, dto: CreateReviewDto, images: string[] = []): Promise<IReview> {
    const booking = await bookingRepository.findById(dto.bookingId);
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.user.toString() !== userId) throw new BadRequestError('You can only review your own bookings');
    if (booking.status !== BookingStatus.CHECKED_OUT) throw new BadRequestError('You can only review after check-out');

    const existingReview = await reviewRepository.exists({ booking: dto.bookingId });
    if (existingReview) throw new ConflictError('You have already reviewed this booking');

    return reviewRepository.create({
      user: userId as any,
      hotel: dto.hotelId as any,
      booking: dto.bookingId as any,
      rating: dto.rating,
      title: dto.title,
      comment: dto.comment,
      ratings: dto.ratings,
      images,
      isVerified: true,
    } as any);
  }

  async getHotelReviews(hotelId: string, page = 1, limit = 10): Promise<PaginatedResult<IReview>> {
    const options: PaginationOptions = { page, limit, sort: 'createdAt', order: 'desc' };
    return reviewRepository.paginate(
      { hotel: hotelId, isApproved: true },
      options,
      'user',
    );
  }

  async getAllReviews(page = 1, limit = 10, approved?: string): Promise<PaginatedResult<IReview>> {
    const filter: any = {};
    if (approved !== undefined) filter.isApproved = approved === 'true';
    const options: PaginationOptions = { page, limit, sort: 'createdAt', order: 'desc' };
    return reviewRepository.paginate(filter, options, ['user', 'hotel']);
  }

  async approveReview(id: string, approved: boolean): Promise<IReview> {
    const review = await reviewRepository.findById(id);
    if (!review) throw new NotFoundError('Review not found');
    return (await reviewRepository.updateById(id, { isApproved: approved })) as IReview;
  }

  async respondToReview(id: string, dto: RespondReviewDto, adminId: string): Promise<IReview> {
    const review = await reviewRepository.findById(id);
    if (!review) throw new NotFoundError('Review not found');
    return (await reviewRepository.updateById(id, {
      response: { text: dto.text, respondedAt: new Date(), respondedBy: adminId },
    })) as IReview;
  }

  async deleteReview(id: string): Promise<void> {
    const review = await reviewRepository.findById(id);
    if (!review) throw new NotFoundError('Review not found');
    await reviewRepository.deleteById(id);
  }
}

export const reviewService = new ReviewService();

// ─── User Service ─────────────────────────────────────────────────────────────

export class UserService {
  async getProfile(userId: string): Promise<IUser> {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto, avatar?: string): Promise<IUser> {
    const updateData: any = { ...dto };
    if (avatar) updateData.avatar = avatar;
    return (await userRepository.updateById(userId, updateData)) as IUser;
  }

  async getAllUsers(page = 1, limit = 10): Promise<PaginatedResult<IUser>> {
    const options: PaginationOptions = { page, limit, sort: 'createdAt', order: 'desc' };
    return userRepository.paginate({}, options);
  }

  async getUserById(id: string): Promise<IUser> {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  async toggleUserStatus(id: string): Promise<IUser> {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return (await userRepository.updateById(id, { isActive: !user.isActive })) as IUser;
  }

  async deleteUser(id: string): Promise<void> {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');
    await userRepository.deleteById(id);
  }

  async updateUserRole(id: string, role: string): Promise<IUser> {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return (await userRepository.updateById(id, { role })) as IUser;
  }

  async getAdminDashboard() {
    const [totalUsers, activeUsers, totalHotels, totalBookings] = await Promise.all([
      userRepository.count(),
      userRepository.count({ isActive: true }),
      // Will import from hotelRepo
      Promise.resolve(0),
      Promise.resolve(0),
    ]);
    return { totalUsers, activeUsers };
  }
}

export const userService = new UserService();