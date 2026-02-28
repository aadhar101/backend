import { Router, RequestHandler } from 'express';
import { authController } from '../controllers/auth.controller';
import { hotelController } from '../controllers/hotel.controller';
import { roomController } from '../controllers/room.controller';
import { bookingController } from '../controllers/booking.controller';
import { reviewController, userController } from '../controllers/review.controller';
import { adminController } from '../controllers/admin.controller';
import { authenticate, adminOnly, superAdminOnly, rateLimiter } from '../middleware';
import { uploadMultiple, uploadSingle } from '../config/multer.config';

// FIX: Cast controller methods to RequestHandler to satisfy Express overloads
// when using custom AuthenticatedRequest (which extends Request).
const h = <T extends (...args: any[]) => any>(fn: T): RequestHandler =>
  fn as unknown as RequestHandler;

const router = Router();
const authLimiter = rateLimiter(10, 15 * 60 * 1000);
const apiLimiter = rateLimiter(100, 15 * 60 * 1000);

// ─── Auth ─────────────────────────────────────────────────────────────────────
const authRouter = Router();
authRouter.post('/register', authLimiter, h(authController.register.bind(authController)));
authRouter.post('/login', authLimiter, h(authController.login.bind(authController)));
authRouter.post('/refresh-token', h(authController.refreshToken.bind(authController)));
authRouter.post('/forgot-password', authLimiter, h(authController.forgotPassword.bind(authController)));
authRouter.post('/reset-password', h(authController.resetPassword.bind(authController)));
authRouter.post('/change-password', authenticate as RequestHandler, h(authController.changePassword.bind(authController)));
authRouter.post('/logout', authenticate as RequestHandler, h(authController.logout.bind(authController)));
authRouter.get('/me', authenticate as RequestHandler, h(authController.me.bind(authController)));

// ─── Hotels ───────────────────────────────────────────────────────────────────
const hotelRouter = Router();
hotelRouter.get('/', apiLimiter, h(hotelController.getHotels.bind(hotelController)));
hotelRouter.get('/featured', h(hotelController.getFeaturedHotels.bind(hotelController)));
hotelRouter.get('/:id', h(hotelController.getHotelById.bind(hotelController)));
hotelRouter.post('/', authenticate as RequestHandler, adminOnly as RequestHandler, uploadMultiple('images', 10), h(hotelController.createHotel.bind(hotelController)));
hotelRouter.put('/:id', authenticate as RequestHandler, adminOnly as RequestHandler, uploadMultiple('images', 10), h(hotelController.updateHotel.bind(hotelController)));
hotelRouter.delete('/:id', authenticate as RequestHandler, adminOnly as RequestHandler, h(hotelController.deleteHotel.bind(hotelController)));
hotelRouter.patch('/:id/featured', authenticate as RequestHandler, adminOnly as RequestHandler, h(hotelController.toggleFeatured.bind(hotelController)));
hotelRouter.patch('/:id/remove-image', authenticate as RequestHandler, adminOnly as RequestHandler, h(hotelController.removeImage.bind(hotelController)));

// ─── Rooms (nested under hotels) ─────────────────────────────────────────────
const roomRouter = Router({ mergeParams: true });
roomRouter.get('/', h(roomController.getRoomsByHotel.bind(roomController)));
roomRouter.get('/available', h(roomController.getAvailableRooms.bind(roomController)));
roomRouter.get('/:id', h(roomController.getRoomById.bind(roomController)));
roomRouter.post('/', authenticate as RequestHandler, adminOnly as RequestHandler, uploadMultiple('images', 10), h(roomController.createRoom.bind(roomController)));
roomRouter.put('/:id', authenticate as RequestHandler, adminOnly as RequestHandler, uploadMultiple('images', 10), h(roomController.updateRoom.bind(roomController)));
roomRouter.delete('/:id', authenticate as RequestHandler, adminOnly as RequestHandler, h(roomController.deleteRoom.bind(roomController)));
roomRouter.patch('/:id/status', authenticate as RequestHandler, adminOnly as RequestHandler, h(roomController.updateRoomStatus.bind(roomController)));

// ─── Bookings ─────────────────────────────────────────────────────────────────
const bookingRouter = Router();
bookingRouter.post('/', authenticate as RequestHandler, h(bookingController.createBooking.bind(bookingController)));
bookingRouter.get('/my', authenticate as RequestHandler, h(bookingController.getMyBookings.bind(bookingController)));
bookingRouter.get('/admin/stats', authenticate as RequestHandler, adminOnly as RequestHandler, h(bookingController.getDashboardStats.bind(bookingController)));
bookingRouter.get('/reference/:reference', authenticate as RequestHandler, h(bookingController.getBookingByReference.bind(bookingController)));
bookingRouter.get('/:id', authenticate as RequestHandler, h(bookingController.getBookingById.bind(bookingController)));
bookingRouter.patch('/:id/cancel', authenticate as RequestHandler, h(bookingController.cancelBooking.bind(bookingController)));
bookingRouter.get('/', authenticate as RequestHandler, adminOnly as RequestHandler, h(bookingController.getAllBookings.bind(bookingController)));
bookingRouter.patch('/:id/status', authenticate as RequestHandler, adminOnly as RequestHandler, h(bookingController.updateBookingStatus.bind(bookingController)));

// ─── Reviews ──────────────────────────────────────────────────────────────────
const reviewRouter = Router();
reviewRouter.post('/', authenticate as RequestHandler, uploadMultiple('images', 5), h(reviewController.createReview.bind(reviewController)));
reviewRouter.get('/hotel/:hotelId', h(reviewController.getHotelReviews.bind(reviewController)));
reviewRouter.get('/', authenticate as RequestHandler, adminOnly as RequestHandler, h(reviewController.getAllReviews.bind(reviewController)));
reviewRouter.patch('/:id/approve', authenticate as RequestHandler, adminOnly as RequestHandler, h(reviewController.approveReview.bind(reviewController)));
reviewRouter.patch('/:id/respond', authenticate as RequestHandler, adminOnly as RequestHandler, h(reviewController.respondToReview.bind(reviewController)));
reviewRouter.delete('/:id', authenticate as RequestHandler, adminOnly as RequestHandler, h(reviewController.deleteReview.bind(reviewController)));

// ─── Users ────────────────────────────────────────────────────────────────────
const userRouter = Router();
userRouter.get('/profile', authenticate as RequestHandler, h(userController.getProfile.bind(userController)));
userRouter.put('/profile', authenticate as RequestHandler, uploadSingle('avatar'), h(userController.updateProfile.bind(userController)));
userRouter.get('/', authenticate as RequestHandler, adminOnly as RequestHandler, h(userController.getAllUsers.bind(userController)));
userRouter.get('/:id', authenticate as RequestHandler, adminOnly as RequestHandler, h(userController.getUserById.bind(userController)));
userRouter.patch('/:id/toggle-status', authenticate as RequestHandler, adminOnly as RequestHandler, h(userController.toggleUserStatus.bind(userController)));
userRouter.patch('/:id/role', authenticate as RequestHandler, superAdminOnly as RequestHandler, h(userController.updateUserRole.bind(userController)));
userRouter.delete('/:id', authenticate as RequestHandler, superAdminOnly as RequestHandler, h(userController.deleteUser.bind(userController)));

// ─── Admin ────────────────────────────────────────────────────────────────────
const adminRouter = Router();
adminRouter.get('/dashboard', authenticate as RequestHandler, adminOnly as RequestHandler, h(adminController.getDashboard.bind(adminController)));
adminRouter.get('/stats', authenticate as RequestHandler, adminOnly as RequestHandler, h(adminController.getSystemStats.bind(adminController)));

// ─── Mount ────────────────────────────────────────────────────────────────────
router.use('/auth', authRouter);
router.use('/hotels', hotelRouter);
router.use('/hotels/:hotelId/rooms', roomRouter);
router.use('/bookings', bookingRouter);
router.use('/reviews', reviewRouter);
router.use('/users', userRouter);
router.use('/admin', adminRouter);

export default router;

