import mongoose, { Schema } from 'mongoose';
import { IRoom, RoomType, RoomStatus } from '../types/user.type';

const roomSchema = new Schema<IRoom>(
  {
    hotel: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
    roomNumber: { type: String, required: true, trim: true },
    type: { type: String, enum: Object.values(RoomType), required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    capacity: {
      adults: { type: Number, required: true, min: 1, default: 2 },
      children: { type: Number, default: 0 },
    },
    size: { type: Number, required: true }, // sqm
    floor: { type: Number, required: true },
    images: [{ type: String }],
    amenities: [{ type: String }],
    status: { type: String, enum: Object.values(RoomStatus), default: RoomStatus.AVAILABLE },
    isActive: { type: Boolean, default: true },
    bedType: { type: String, required: true },
    view: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Ensure room number is unique per hotel
roomSchema.index({ hotel: 1, roomNumber: 1 }, { unique: true });
roomSchema.index({ hotel: 1, status: 1, type: 1 });
roomSchema.index({ price: 1 });

// Virtual effective price
roomSchema.virtual('effectivePrice').get(function () {
  return this.discountPrice ?? this.price;
});

export const RoomModel = mongoose.model<IRoom>('Room', roomSchema);