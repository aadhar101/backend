import { Request } from 'express';
import { Document, Types } from 'mongoose';

export enum UserRole {
  GUEST = 'guest',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
  FAILED = 'failed',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum RoomType {
  STANDARD = 'standard',
  DELUXE = 'deluxe',
  SUITE = 'suite',
  PRESIDENTIAL = 'presidential',
  PENTHOUSE = 'penthouse',
}

export enum RoomStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  STRIPE = 'stripe',
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
}

export enum AmenityCategory {
  RECREATION = 'recreation',
  DINING = 'dining',
  WELLNESS = 'wellness',
  BUSINESS = 'business',
  TRANSPORT = 'transport',
  OTHER = 'other',
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshToken?: string;
  isActive: boolean;
  address?: { street?: string; city?: string; state?: string; country?: string; zipCode?: string; };
  preferences?: { currency: string; language: string; notifications: boolean; };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  fullName: string;
}

export interface IHotel extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  address: { street: string; city: string; state: string; country: string; zipCode: string; coordinates?: { lat: number; lng: number }; };
  phone: string;
  email: string;
  website?: string;
  starRating: number;
  images: string[];
  amenities: string[];
  policies: { checkIn: string; checkOut: string; cancellation: string; pets: boolean; smoking: boolean; children: boolean; };
  isActive: boolean;
  isFeatured: boolean;
  totalRooms: number;
  createdBy: Types.ObjectId;
  averageRating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoom extends Document {
  _id: Types.ObjectId;
  hotel: Types.ObjectId;
  roomNumber: string;
  type: RoomType;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  capacity: { adults: number; children: number };
  size: number;
  floor: number;
  images: string[];
  amenities: string[];
  status: RoomStatus;
  isActive: boolean;
  bedType: string;
  view?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBooking extends Document {
  _id: Types.ObjectId;
  bookingReference: string;
  user: Types.ObjectId;
  hotel: Types.ObjectId;
  room: Types.ObjectId;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  children: number;
  nights: number;
  pricePerNight: number;
  subtotal: number;
  taxes: number;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  specialRequests?: string;
  guestInfo: { firstName: string; lastName: string; email: string; phone: string; };
  cancellationReason?: string;
  cancelledAt?: Date;
  checkedInAt?: Date;
  checkedOutAt?: Date;
  stripePaymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReview extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  hotel: Types.ObjectId;
  booking: Types.ObjectId;
  rating: number;
  title: string;
  comment: string;
  ratings: { cleanliness: number; service: number; location: number; value: number; amenities: number; };
  images?: string[];
  isVerified: boolean;
  isApproved: boolean;
  response?: { text: string; respondedAt: Date; respondedBy: Types.ObjectId; };
  createdAt: Date;
  updatedAt: Date;
}

export interface IAmenity extends Document {
  _id: Types.ObjectId;
  name: string;
  icon: string;
  category: AmenityCategory;
  description?: string;
  isActive: boolean;
}

// FIX: Do NOT override 'files' here — keep it compatible with Express.Request
// Controllers cast (req.files as Express.Multer.File[]) when needed
export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: Omit<PaginatedResult<T>, 'data'>;
}