import mongoose, { Schema } from 'mongoose';
import { IHotel } from '../types/user.type';

const hotelSchema = new Schema<IHotel>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      zipCode: { type: String, required: true },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    phone: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    website: String,
    starRating: { type: Number, min: 1, max: 5, required: true },
    images: [{ type: String }],
    amenities: [{ type: String }],
    policies: {
      checkIn: { type: String, default: '14:00' },
      checkOut: { type: String, default: '12:00' },
      cancellation: String,
      pets: { type: Boolean, default: false },
      smoking: { type: Boolean, default: false },
      children: { type: Boolean, default: true },
    },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    totalRooms: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

hotelSchema.index({ 'address.city': 1, 'address.country': 1 });
hotelSchema.index({ starRating: 1 });
hotelSchema.index({ isActive: 1, isFeatured: 1 });
hotelSchema.index({ name: 'text', description: 'text', 'address.city': 'text' });

export const HotelModel = mongoose.model<IHotel>('Hotel', hotelSchema);