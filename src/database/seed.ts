import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from './mongodb';
import { UserModel } from '../models/user.model';
import { HotelModel } from '../models/hotel.model';
import { RoomModel } from '../models/room.model';
import { AmenityModel } from '../models/amenity.model';
import { UserRole, RoomType, RoomStatus, AmenityCategory } from '../types/user.type';

const seed = async () => {
  await connectDB();

  console.log('🌱 Seeding database...');

  // Clear existing
  await Promise.all([
    UserModel.deleteMany({}),
    HotelModel.deleteMany({}),
    RoomModel.deleteMany({}),
    AmenityModel.deleteMany({}),
  ]);

  // Amenities
  const amenities = await AmenityModel.insertMany([
    { name: 'Free WiFi', icon: 'wifi', category: AmenityCategory.OTHER, isActive: true },
    { name: 'Swimming Pool', icon: 'pool', category: AmenityCategory.RECREATION, isActive: true },
    { name: 'Spa & Wellness', icon: 'spa', category: AmenityCategory.WELLNESS, isActive: true },
    { name: 'Gym', icon: 'fitness', category: AmenityCategory.WELLNESS, isActive: true },
    { name: 'Restaurant', icon: 'restaurant', category: AmenityCategory.DINING, isActive: true },
    { name: 'Bar & Lounge', icon: 'bar', category: AmenityCategory.DINING, isActive: true },
    { name: 'Conference Room', icon: 'business', category: AmenityCategory.BUSINESS, isActive: true },
    { name: 'Airport Shuttle', icon: 'airport', category: AmenityCategory.TRANSPORT, isActive: true },
    { name: 'Free Parking', icon: 'parking', category: AmenityCategory.TRANSPORT, isActive: true },
    { name: 'Room Service', icon: 'room_service', category: AmenityCategory.OTHER, isActive: true },
  ]);

  // Super Admin
  const superAdmin = await UserModel.create({
    firstName: 'Super',
    lastName: 'Admin',
    email: 'superadmin@hotel.com',
    password: 'Admin@123',
    role: UserRole.SUPER_ADMIN,
    isEmailVerified: true,
    isActive: true,
  });

  // Admin
  const admin = await UserModel.create({
    firstName: 'Hotel',
    lastName: 'Admin',
    email: 'admin@hotel.com',
    password: 'Admin@123',
    role: UserRole.ADMIN,
    isEmailVerified: true,
    isActive: true,
  });

  // Test User
  await UserModel.create({
    firstName: 'John',
    lastName: 'Doe',
    email: 'user@hotel.com',
    password: 'User@123',
    role: UserRole.GUEST,
    isEmailVerified: true,
    isActive: true,
  });

  // Hotel
  const hotel = await HotelModel.create({
    name: 'Grand Palace Hotel',
    description: 'A luxurious 5-star hotel in the heart of the city offering world-class amenities and exceptional service.',
    address: {
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      zipCode: '10001',
      coordinates: { lat: 40.7128, lng: -74.006 },
    },
    phone: '+1-212-555-0100',
    email: 'info@grandpalace.com',
    website: 'https://grandpalace.com',
    starRating: 5,
    images: ['hotel-1.jpg', 'hotel-2.jpg'],
    amenities: amenities.map((a) => a.name),
    policies: {
      checkIn: '14:00',
      checkOut: '12:00',
      cancellation: 'Free cancellation up to 24 hours before check-in',
      pets: false,
      smoking: false,
      children: true,
    },
    isActive: true,
    isFeatured: true,
    totalRooms: 5,
    createdBy: admin._id,
  });

  // Rooms
  const roomsData = [
    { roomNumber: '101', type: RoomType.STANDARD, name: 'Standard Room', price: 99, floor: 1, capacity: { adults: 2, children: 1 }, size: 25, bedType: 'Queen', view: 'City View' },
    { roomNumber: '201', type: RoomType.DELUXE, name: 'Deluxe Room', price: 149, floor: 2, capacity: { adults: 2, children: 2 }, size: 35, bedType: 'King', view: 'Pool View' },
    { roomNumber: '301', type: RoomType.SUITE, name: 'Junior Suite', price: 249, floor: 3, capacity: { adults: 3, children: 2 }, size: 55, bedType: 'King', view: 'City Panorama' },
    { roomNumber: '401', type: RoomType.SUITE, name: 'Executive Suite', price: 399, floor: 4, capacity: { adults: 4, children: 2 }, size: 80, bedType: 'King', view: 'Ocean View' },
    { roomNumber: '501', type: RoomType.PRESIDENTIAL, name: 'Presidential Suite', price: 799, floor: 5, capacity: { adults: 4, children: 4 }, size: 150, bedType: 'King', view: '360° Panoramic' },
  ];

  for (const rd of roomsData) {
    await RoomModel.create({
      ...rd,
      hotel: hotel._id,
      description: `Spacious ${rd.name} with stunning views and modern amenities.`,
      images: [`room-${rd.roomNumber}-1.jpg`, `room-${rd.roomNumber}-2.jpg`],
      amenities: ['Free WiFi', 'Air Conditioning', 'Mini Bar', 'Safe', 'Flat Screen TV'],
      status: RoomStatus.AVAILABLE,
      isActive: true,
    });
  }

  console.log('✅ Seed completed!');
  console.log('👤 Super Admin: superadmin@hotel.com / Admin@123');
  console.log('👤 Admin: admin@hotel.com / Admin@123');
  console.log('👤 User: user@hotel.com / User@123');

  await mongoose.disconnect();
};

seed().catch(console.error);