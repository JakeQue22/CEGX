import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { PlaceOrderDto } from './dto/place-order.dto';

@Injectable()
export class CustomerPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async login(dto: CustomerLoginDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { email: dto.email },
    });
    if (!customer || !customer.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, customer.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: customer.id,
      email: customer.email,
      type: 'customer',
    };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET', 'jwt-secret'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    });

    return {
      accessToken,
      customer: {
        id: customer.id,
        companyName: customer.companyName,
        contactName: customer.contactName,
        email: customer.email,
      },
    };
  }

  async getProducts() {
    return this.prisma.product.findMany({
      where: { isArchived: false },
      include: {
        category: true,
        supplier: true,
        bulkPricings: { orderBy: { minQuantity: 'asc' } },
      },
    });
  }

  async getMyOrders(customerId: string) {
    return this.prisma.customerOrder.findMany({
      where: { customerId },
      include: { courier: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async placeOrder(customerId: string, dto: PlaceOrderDto) {
    const order = await this.prisma.customerOrder.create({
      data: { customerId, ...dto },
    });

    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SALES_MANAGER'] }, isActive: true },
    });

    for (const admin of admins) {
      await this.notificationsService.create({
        userId: admin.id,
        title: 'New Customer Order',
        message: `Order from customer for ${dto.quantity}x ${dto.productName}`,
        type: 'CUSTOMER_ORDER',
        link: '/customer-orders',
      });
    }

    return order;
  }
}
