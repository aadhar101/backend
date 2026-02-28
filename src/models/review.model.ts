import mongoose, { Schema } from 'mongoose';
import { IReview } from '../types/user.type';
import { HotelModel } from './hotel.model';

const reviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hotel: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, maxlength: 100 },
    comment: { type: String, required: true, maxlength: 1000 },
    ratings: {
      cleanliness: { type: Number, min: 1, max: 5, required: true },
      service: { type: Number, min: 1, max: 5, required: true },
      location: { type: Number, min: 1, max: 5, required: true },
      value: { type: Number, min: 1, max: 5, required: true },
      amenities: { type: Number, min: 1, max: 5, required: true },
    },
    images: [String],
    isVerified: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    response: {
      text: String,
      respondedAt: Date,
      respondedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
  },
  { timestamps: true }
);

// One review per booking
reviewSchema.index({ booking: 1 }, { unique: true });
reviewSchema.index({ hotel: 1, isApproved: 1 });

// Update hotel average rating after save
reviewSchema.post('save', async function () {
  const result = await mongoose.model('Review').aggregate([
    { $match: { hotel: this.hotel, isApproved: true } },
    { $group: { _id: '$hotel', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (result.length > 0) {
    await HotelModel.findByIdAndUpdate(this.hotel, {
      averageRating: Math.round(result[0].avgRating * 10) / 10,
      totalReviews: result[0].count,
    });
  }
});

export const ReviewModel = mongoose.model<IReview>('Review', reviewSchema);