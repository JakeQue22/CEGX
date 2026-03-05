import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly userSelect = {
    id: true,
    email: true,
    name: true,
    phone: true,
    title: true,
    department: true,
    role: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  };

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const password = dto.password || crypto.randomBytes(16).toString('hex');
    const hashed = await bcrypt.hash(password, 12);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashed,
        phone: dto.phone,
        title: dto.title,
        department: dto.department,
        role: dto.role ?? 'VIEWER',
        isActive: dto.isActive ?? true,
      },
      select: this.userSelect,
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: this.userSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async update(id: string, dto: UpdateUserDto, requestingUserId: string, requestingRole: string) {
    await this.findOne(id);

    // Non-admins can only update themselves
    if (requestingRole !== 'ADMIN' && requestingUserId !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // Non-admins cannot change roles
    if (requestingRole !== 'ADMIN' && dto.role) {
      throw new ForbiddenException('Only admins can change roles');
    }

    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (existing) throw new ConflictException('Email already in use');
    }

    const data: Record<string, unknown> = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 12);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: this.userSelect,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted successfully' };
  }
}
