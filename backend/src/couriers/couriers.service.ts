import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCourierDto } from './dto/create-courier.dto';
import { UpdateCourierDto } from './dto/update-courier.dto';

@Injectable()
export class CouriersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCourierDto) {
    return this.prisma.courier.create({ data: dto });
  }

  async findAll(search?: string) {
    return this.prisma.courier.findMany({
      where: search
        ? {
            name: { contains: search, mode: 'insensitive' },
          }
        : undefined,
      include: { _count: { select: { deals: true, customerOrders: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const courier = await this.prisma.courier.findUnique({
      where: { id },
      include: {
        _count: { select: { deals: true, customerOrders: true } },
      },
    });
    if (!courier) throw new NotFoundException(`Courier ${id} not found`);
    return courier;
  }

  async update(id: string, dto: UpdateCourierDto) {
    await this.findOne(id);
    return this.prisma.courier.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.courier.delete({ where: { id } });
    return { message: 'Courier deleted successfully' };
  }
}
