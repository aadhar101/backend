import { hotelRepository } from '../repositories';
import { NotFoundError } from '../errors/http-error';
import { CreateHotelDto, UpdateHotelDto, HotelQueryDto } from '../dtos';
import { IHotel, PaginatedResult, PaginationOptions } from '../types/user.type';

export class HotelService {
  async createHotel(dto: CreateHotelDto, adminId: string, images: string[] = []): Promise<IHotel> {
    return hotelRepository.create({ ...dto, createdBy: adminId as any, images } as any);
  }

  async getHotels(query: HotelQueryDto): Promise<PaginatedResult<IHotel>> {
    const filter = await hotelRepository.search({
      city: query.city,
      country: query.country,
      search: query.search,
      starRating: query.starRating ? Number(query.starRating) : undefined,
      amenities: query.amenities,
    });

    const options: PaginationOptions = {
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 10,
      sort: query.sort || 'createdAt',
      order: 'desc',
    };

    return hotelRepository.paginate(filter, options, 'createdBy', '-__v');
  }

  async getHotelById(id: string): Promise<IHotel> {
    const hotel = await hotelRepository.model.findById(id).populate('createdBy', 'firstName lastName email');
    if (!hotel) throw new NotFoundError('Hotel not found');
    return hotel;
  }

  async updateHotel(id: string, dto: UpdateHotelDto, newImages?: string[]): Promise<IHotel> {
    const hotel = await hotelRepository.findById(id);
    if (!hotel) throw new NotFoundError('Hotel not found');

    const updateData: any = { ...dto };
    if (newImages?.length) {
      updateData.images = [...hotel.images, ...newImages];
    }

    return (await hotelRepository.updateById(id, updateData)) as IHotel;
  }

  async deleteHotel(id: string): Promise<void> {
    const hotel = await hotelRepository.findById(id);
    if (!hotel) throw new NotFoundError('Hotel not found');
    await hotelRepository.deleteById(id);
  }

  async toggleFeatured(id: string): Promise<IHotel> {
    const hotel = await hotelRepository.findById(id);
    if (!hotel) throw new NotFoundError('Hotel not found');
    return (await hotelRepository.updateById(id, { isFeatured: !hotel.isFeatured })) as IHotel;
  }

  async getFeaturedHotels(): Promise<IHotel[]> {
    return hotelRepository.findAll({ isFeatured: true, isActive: true });
  }

  async removeImage(hotelId: string, imageUrl: string): Promise<IHotel> {
    const hotel = await hotelRepository.findById(hotelId);
    if (!hotel) throw new NotFoundError('Hotel not found');
    return (await hotelRepository.updateById(hotelId, {
      images: hotel.images.filter((img) => img !== imageUrl),
    })) as IHotel;
  }
}

export const hotelService = new HotelService();