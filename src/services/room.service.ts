import { roomRepository, hotelRepository } from '../repositories';
import { NotFoundError, ConflictError } from '../errors/http-error';
import { CreateRoomDto, UpdateRoomDto } from '../dtos';
import { IRoom, PaginatedResult, PaginationOptions, RoomStatus } from '../types/user.type';

export class RoomService {
  async createRoom(hotelId: string, dto: CreateRoomDto, images: string[] = []): Promise<IRoom> {
    const hotel = await hotelRepository.findById(hotelId);
    if (!hotel) throw new NotFoundError('Hotel not found');

    const exists = await roomRepository.exists({ hotel: hotelId, roomNumber: dto.roomNumber });
    if (exists) throw new ConflictError(`Room number ${dto.roomNumber} already exists in this hotel`);

    const room = await roomRepository.create({ ...dto, hotel: hotelId as any, images } as any);

    // Update hotel totalRooms
    await hotelRepository.updateById(hotelId, { $inc: { totalRooms: 1 } } as any);

    return room;
  }

  async getRoomsByHotel(
    hotelId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedResult<IRoom>> {
    const options: PaginationOptions = { page, limit, sort: 'floor', order: 'asc' };
    return roomRepository.paginate({ hotel: hotelId, isActive: true }, options);
  }

  async getRoomById(id: string): Promise<IRoom> {
    const room = await roomRepository.model.findById(id).populate('hotel', 'name address phone');
    if (!room) throw new NotFoundError('Room not found');
    return room;
  }

  async updateRoom(id: string, dto: UpdateRoomDto, newImages?: string[]): Promise<IRoom> {
    const room = await roomRepository.findById(id);
    if (!room) throw new NotFoundError('Room not found');

    const updateData: any = { ...dto };
    if (newImages?.length) updateData.images = [...room.images, ...newImages];

    return (await roomRepository.updateById(id, updateData)) as IRoom;
  }

  async deleteRoom(id: string): Promise<void> {
    const room = await roomRepository.findById(id);
    if (!room) throw new NotFoundError('Room not found');

    await roomRepository.deleteById(id);
    await hotelRepository.updateById(room.hotel.toString(), { $inc: { totalRooms: -1 } } as any);
  }

  async updateRoomStatus(id: string, status: RoomStatus): Promise<IRoom> {
    const room = await roomRepository.findById(id);
    if (!room) throw new NotFoundError('Room not found');
    return (await roomRepository.updateById(id, { status })) as IRoom;
  }

  async getAvailableRooms(hotelId: string, checkIn: Date, checkOut: Date, adults: number, children = 0): Promise<IRoom[]> {
    const hotel = await hotelRepository.findById(hotelId);
    if (!hotel) throw new NotFoundError('Hotel not found');
    return roomRepository.findAvailableRooms(hotelId, checkIn, checkOut, adults, children);
  }
}

export const roomService = new RoomService();