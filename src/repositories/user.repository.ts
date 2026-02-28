import { Model, Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import { PaginationOptions, PaginatedResult } from '../types/user.type';

export class BaseRepository<T extends Document> {
  // FIX: changed from 'protected' to 'public' so services/controllers can use .model directly
  public readonly model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return this.model.findOne(filter).exec();
  }

  async findAll(filter: FilterQuery<T> = {}): Promise<T[]> {
    return this.model.find(filter).exec();
  }

  async create(data: Partial<T>): Promise<T> {
    const doc = new this.model(data);
    return doc.save();
  }

  async updateById(id: string, update: UpdateQuery<T>, options: QueryOptions = { new: true }): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, update, options).exec();
  }

  async deleteById(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  async paginate(
    filter: FilterQuery<T>,
    options: PaginationOptions,
    populate?: string | string[],
    select?: string
  ): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = options;
    const skip = (page - 1) * limit;
    const sortObj: Record<string, 1 | -1> = { [sort]: order === 'asc' ? 1 : -1 };

    let query = this.model.find(filter).sort(sortObj).skip(skip).limit(limit);

    if (populate) {
      const pops = Array.isArray(populate) ? populate : [populate];
      pops.forEach((p) => { query = query.populate(p) as typeof query; });
    }

    if (select) query = query.select(select);

    const [data, total] = await Promise.all([query.exec(), this.model.countDocuments(filter)]);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const count = await this.model.countDocuments(filter);
    return count > 0;
  }
}
