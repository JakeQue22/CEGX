import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCustomerOrderDto } from './dto/create-customer-order.dto';
import { UpdateCustomerOrderDto } from './dto/update-customer-order.dto';

@Injectable()
export class CustomerOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateCustomerOrderDto) {
    const order = await this.prisma.customerOrder.create({ data: dto });

    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SALES_MANAGER'] }, isActive: true },
    });

    for (const admin of admins) {
      await this.notificationsService.create({
        userId: admin.id,
        title: 'New Customer Order',
        message: `Order from customer for ${dto.quantity}x ${dto.productName}`,
        type: 'CUSTOMER_ORDER',
        link: `/customer-orders`,
      });
    }

    return order;
  }

  async findAll(filters?: { customerId?: string; status?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.customerId) where.customerId = filters.customerId;
    if (filters?.status) where.status = filters.status;

    return this.prisma.customerOrder.findMany({
      where,
      include: { customer: true, courier: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.customerOrder.findUnique({
      where: { id },
      include: { customer: true, courier: true },
    });

    if (!order) {
      throw new NotFoundException(`Customer order with ID ${id} not found`);
    }

    return order;
  }

  async update(id: string, dto: UpdateCustomerOrderDto) {
    await this.findOne(id);
    return this.prisma.customerOrder.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.customerOrder.delete({ where: { id } });
  }
}
