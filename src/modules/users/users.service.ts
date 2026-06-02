import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDocument } from './schema/user.schema';
import { PaginatedUsersDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const { email, username, firstName, lastName, phone, gender, ...rest } =
      createUserDto;

    const [emailExists, usernameExists] = await Promise.all([
      this.usersRepository.exists({ email: email.toLowerCase() }),
      this.usersRepository.exists({ username: username.toLowerCase() }),
    ]);

    if (emailExists) {
      throw new ConflictException('Email address is already registered');
    }
    if (usernameExists) {
      throw new ConflictException('Username is already taken');
    }

    const user = await this.usersRepository.create({
      ...rest,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      profile: { firstName, lastName, phone, gender },
    });

    this.logger.log(`User created: ${user.email}`);
    return user;
  }

  async findAll(
    page = 1,
    limit = 10,
    search?: string,
  ): Promise<PaginatedUsersDto> {
    const filter: any = {};

    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
      ];
    }

    const { data, total } = await this.usersRepository.findMany(filter, {
      page,
      limit,
      sort: { createdAt: -1 },
    });

    return {
      data: data as any,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<UserDocument> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.usersRepository.findOne({ email: email.toLowerCase() });
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.usersRepository.findOneWithPassword({
      email: email.toLowerCase(),
    });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const { firstName, lastName, phone, gender, permissions, status, ...rest } =
      updateUserDto;

    const updatePayload: any = { ...rest };

    if (firstName !== undefined) updatePayload['profile.firstName'] = firstName;
    if (lastName !== undefined) updatePayload['profile.lastName'] = lastName;
    if (phone !== undefined) updatePayload['profile.phone'] = phone;
    if (gender !== undefined) updatePayload['profile.gender'] = gender;
    if (permissions !== undefined) updatePayload.permissions = permissions;
    if (status !== undefined) updatePayload.status = status;

    const updated = await this.usersRepository.update(
      { _id: id },
      { $set: updatePayload },
    );

    this.logger.log(`User updated: ${id}`);
    return updated!;
  }

  async remove(id: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    if (user.isSuperAdmin) {
      throw new BadRequestException('Super admin account cannot be deleted');
    }

    await this.usersRepository.softDelete(id);
    this.logger.log(`User soft-deleted: ${id}`);
    return { message: 'User deleted successfully' };
  }

  async getStats(): Promise<Record<string, number>> {
    const [total, active, suspended, pending] = await Promise.all([
      this.usersRepository.count(),
      this.usersRepository.count({ status: 'active' }),
      this.usersRepository.count({ status: 'suspended' }),
      this.usersRepository.count({ status: 'pending' }),
    ]);

    return { total, active, suspended, pending };
  }
}
