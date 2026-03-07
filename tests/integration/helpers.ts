import { generateAccessToken } from '../../src/config/jwt.config';
import { BookingModel } from '../../src/models/booking.model';
import { HotelModel } from '../../src/models/hotel.model';
import { RoomModel } from '../../src/models/room.model';
import { UserModel } from '../../src/models/user.model';
import {
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  RoomStatus,
  RoomType,
  UserRole,
} from '../../src/types/user.type';

type CreateUserOptions = {
  role?: UserRole;
  email?: string;
  isActive?: boolean;
};

export const createUserWithToken = async (options: CreateUserOptions = {}) => {
  const email = options.email || `user.${Date.now()}.${Math.random().toString(16).slice(2)}@example.com`;
  const role = options.role || UserRole.GUEST;

  const user = await UserModel.create({
    firstName: 'Test',
    lastName: 'User',
    email,
    password: 'Password123',
    phone: '+9779800000001',
    role,
    isEmailVerified: true,
    isActive: options.isActive ?? true,
  });

  const token = generateAccessToken({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  return { user, token };
};

export const createHotelDoc = async (adminId: string, isFeatured = false) => {
  return HotelModel.create({
    name: `Hotel ${Math.random().toString(16).slice(2, 8)}`,
    description: 'Integration test hotel',
    address: {
      street: 'Test Street 1',
      city: 'Kathmandu',
      state: 'Bagmati',
      country: 'Nepal',
      zipCode: '44600',
    },
    phone: '+977-1-4000000',
    email: `hotel.${Math.random().toString(16).slice(2)}@example.com`,
    starRating: 4,
    amenities: ['wifi', 'parking'],
    isFeatured,
    createdBy: adminId,
  });
};

export const createRoomDoc = async (hotelId: string) => {
  return RoomModel.create({
    hotel: hotelId,
    roomNumber: `${Math.floor(Math.random() * 900) + 100}`,
    type: RoomType.STANDARD,
    name: 'Standard Room',
    description: 'Comfortable room',
    price: 100,
    capacity: { adults: 2, children: 1 },
    size: 25,
    floor: 2,
    amenities: ['wifi'],
    status: RoomStatus.AVAILABLE,
    bedType: 'Queen',
  });
};

export const createBookingDoc = async (params: {
  userId: string;
  hotelId: string;
  roomId: string;
  status?: BookingStatus;
}) => {
  const now = new Date();
  const checkIn = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const checkOut = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  return BookingModel.create({
    user: params.userId,
    hotel: params.hotelId,
    room: params.roomId,
    checkIn,
    checkOut,
    adults: 2,
    children: 0,
    nights: 2,
    pricePerNight: 100,
    subtotal: 200,
    taxes: 24,
    totalAmount: 224,
    status: params.status || BookingStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
    paymentMethod: PaymentMethod.CASH,
    guestInfo: {
      firstName: 'Guest',
      lastName: 'One',
      email: 'guest@example.com',
      phone: '+9779800000002',
    },
  });
};

