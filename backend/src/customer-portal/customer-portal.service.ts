import { Injectable, UnauthorizedException, Logger, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { PlaceOrderDto } from './dto/place-order.dto';

@Injectable()
export class CustomerPortalService {
  private readonly logger = new Logger(CustomerPortalService.name);

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
    // Validate the customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      throw new BadRequestException('Customer account not found');
    }

    // Build data explicitly to avoid spreading unknown fields into Prisma
    const orderData: any = {
      customerId,
      productName: dto.productName,
      quantity: dto.quantity,
    };
    if (dto.productId) orderData.productId = dto.productId;
    if (dto.deliveryLocation) orderData.deliveryLocation = dto.deliveryLocation;
    if (dto.deliveryStreet) orderData.deliveryStreet = dto.deliveryStreet;
    if (dto.deliveryStreet2) orderData.deliveryStreet2 = dto.deliveryStreet2;
    if (dto.deliveryCity) orderData.deliveryCity = dto.deliveryCity;
    if (dto.deliveryCounty) orderData.deliveryCounty = dto.deliveryCounty;
    if (dto.deliveryPostcode) orderData.deliveryPostcode = dto.deliveryPostcode;
    if (dto.courierId) orderData.courierId = dto.courierId;
    if (dto.notes) orderData.notes = dto.notes;

    let order;
    try {
      order = await this.prisma.customerOrder.create({ data: orderData });
    } catch (err) {
      this.logger.error(`Failed to create customer order: ${err.message}`);
      throw new BadRequestException('Failed to create order. Please check your details and try again.');
    }

    // Send notifications to admin/sales users (non-fatal — don't fail the order)
    try {
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
    } catch (err) {
      this.logger.warn(`Failed to send order notifications: ${err.message}`);
    }

    return order;
  }
}
