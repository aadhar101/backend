import mongoose, { Schema } from 'mongoose';
import { IAmenity, AmenityCategory } from '../types/user.type';

const amenitySchema = new Schema<IAmenity>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    icon: { type: String, required: true },
    category: { type: String, enum: Object.values(AmenityCategory), required: true },
    description: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const AmenityModel = mongoose.model<IAmenity>('Amenity', amenitySchema);