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
      include: {
        pricings: { orderBy: { unitType: 'asc' } },
        _count: { select: { deals: true, customerOrders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const courier = await this.prisma.courier.findUnique({
      where: { id },
      include: {
        pricings: { orderBy: { unitType: 'asc' } },
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

  // --- Pricing ---
  async addPricing(courierId: string, data: { unitType: string; label: string; minQuantity?: number; maxQuantity?: number; price: number; notes?: string }) {
    await this.findOne(courierId);
    return this.prisma.courierPricing.create({
      data: { courierId, ...data },
    });
  }

  async updatePricing(id: string, data: { unitType?: string; label?: string; minQuantity?: number; maxQuantity?: number; price?: number; notes?: string }) {
    const pricing = await this.prisma.courierPricing.findUnique({ where: { id } });
    if (!pricing) throw new NotFoundException(`Pricing ${id} not found`);
    return this.prisma.courierPricing.update({ where: { id }, data });
  }

  async removePricing(id: string) {
    const pricing = await this.prisma.courierPricing.findUnique({ where: { id } });
    if (!pricing) throw new NotFoundException(`Pricing ${id} not found`);
    await this.prisma.courierPricing.delete({ where: { id } });
    return { message: 'Pricing deleted successfully' };
  }
}
