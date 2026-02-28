import { PaymentMethod } from '../types/user.type';

// ─── Booking ──────────────────────────────────────────────────────────────────
export interface CreateBookingDto {
  hotelId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  specialRequests?: string;
  guestInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  paymentMethod?: PaymentMethod;
}

export interface UpdateBookingStatusDto {
  status: string;
  reason?: string;
}

// ─── Hotel ────────────────────────────────────────────────────────────────────
export interface CreateHotelDto {
  name: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    coordinates?: { lat: number; lng: number };
  };
  phone: string;
  email: string;
  website?: string;
  starRating: number;
  amenities?: string[];
  policies?: {
    checkIn?: string;
    checkOut?: string;
    cancellation?: string;
    pets?: boolean;
    smoking?: boolean;
    children?: boolean;
  };
  isFeatured?: boolean;
}

export interface UpdateHotelDto extends Partial<CreateHotelDto> {}

export interface HotelQueryDto {
  city?: string;
  country?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  minPrice?: number;
  maxPrice?: number;
  starRating?: number;
  amenities?: string[];
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

// ─── Room ─────────────────────────────────────────────────────────────────────
export interface CreateRoomDto {
  roomNumber: string;
  type: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  capacity: { adults: number; children?: number };
  size: number;
  floor: number;
  amenities?: string[];
  status?: string;
  bedType: string;
  view?: string;
}

export interface UpdateRoomDto extends Partial<CreateRoomDto> {}

// ─── Review ───────────────────────────────────────────────────────────────────
export interface CreateReviewDto {
  hotelId: string;
  bookingId: string;
  rating: number;
  title: string;
  comment: string;
  ratings: {
    cleanliness: number;
    service: number;
    location: number;
    value: number;
    amenities: number;
  };
}

export interface RespondReviewDto {
  text: string;
}