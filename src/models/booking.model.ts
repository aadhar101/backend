import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IBooking, BookingStatus, PaymentStatus, PaymentMethod } from '../types/user.type';

const bookingSchema = new Schema<IBooking>(
  {
    bookingReference: {
      type: String,
      unique: true,
      default: () => `HB-${uuidv4().slice(0, 8).toUpperCase()}`,
    },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hotel: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
    room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    adults: { type: Number, required: true, min: 1 },
    children: { type: Number, default: 0 },
    nights: { type: Number, required: true },
    pricePerNight: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    taxes: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: Object.values(BookingStatus), default: BookingStatus.PENDING },
    paymentStatus: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod) },
    specialRequests: String,
    guestInfo: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    cancellationReason: String,
    cancelledAt: Date,
    checkedInAt: Date,
    checkedOutAt: Date,
    stripePaymentIntentId: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ hotel: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ bookingReference: 1 });
bookingSchema.index({ room: 1, checkIn: 1, checkOut: 1 });

export const BookingModel = mongoose.model<IBooking>('Booking', bookingSchema);