import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../common/services/email.service';
import { CreateCustomerOrderDto } from './dto/create-customer-order.dto';
import { UpdateCustomerOrderDto } from './dto/update-customer-order.dto';

@Injectable()
export class CustomerOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  async create(dto: CreateCustomerOrderDto) {
    const order = await this.prisma.customerOrder.create({ data: dto });

    // Look up the customer name for the notification
    let customerName = 'a customer';
    if (dto.customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
        select: { companyName: true, contactName: true, email: true },
      });
      if (customer) {
        customerName = customer.companyName || customer.contactName || customer.email;
      }
    }

    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SALES_MANAGER'] }, isActive: true },
    });

    for (const admin of admins) {
      await this.notificationsService.create({
        userId: admin.id,
        title: 'New Customer Order',
        message: `Order from ${customerName} for ${dto.quantity}x ${dto.productName}`,
        type: 'CUSTOMER_ORDER',
        link: `/customer-orders/${order.id}`,
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

  async getActiveCount(): Promise<{ count: number }> {
    const count = await this.prisma.customerOrder.count({
      where: {
        status: { notIn: ['SHIPPED', 'DELIVERED', 'CANCELLED'] },
      },
    });
    return { count };
  }

  async sendInvoice(id: string) {
    const order = await this.prisma.customerOrder.findUnique({
      where: { id },
      include: { customer: true, courier: true },
    });
    if (!order) throw new NotFoundException(`Customer order with ID ${id} not found`);
    if (!order.customer?.email) {
      return { success: false, message: 'Customer has no email address.' };
    }

    const settings = await this.prisma.companySettings.findFirst();
    const prefix = settings?.invoicePrefix || 'INV';
    const invoiceNumber = `${prefix}-${order.id.slice(0, 8).toUpperCase()}`;
    const companyName = settings?.companyName || 'CEGX';

    const deliveryLines = [
      order.deliveryStreet, order.deliveryStreet2, order.deliveryCity,
      order.deliveryCounty, order.deliveryPostcode, order.deliveryLocation,
    ].filter(Boolean).join(', ');

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; color: #1a1a1a; font-size: 13px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
          <div>
            <div style="font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 4px;">${companyName}</div>
            ${settings?.companyAddress ? `<div style="color: #6b7280; font-size: 12px;">${settings.companyAddress}</div>` : ''}
            ${settings?.companyPhone ? `<div style="color: #6b7280; font-size: 12px;">Tel: ${settings.companyPhone}</div>` : ''}
            ${settings?.companyEmail ? `<div style="color: #6b7280; font-size: 12px;">${settings.companyEmail}</div>` : ''}
            ${settings?.vatNumber ? `<div style="color: #6b7280; font-size: 12px; margin-top: 4px;">VAT: ${settings.vatNumber}</div>` : ''}
          </div>
          <div style="text-align: right;">
            <div style="font-size: 28px; font-weight: 700; color: #111827;">INVOICE</div>
            <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">
              <div>${invoiceNumber}</div>
              <div>Date: ${new Date().toLocaleDateString('en-GB')}</div>
            </div>
          </div>
        </div>
        <div style="margin-bottom: 28px;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin-bottom: 6px; font-weight: 600;">Bill To</div>
          <div style="color: #374151; line-height: 1.5;">
            ${order.customer.companyName ? `<div style="font-weight: 600;">${order.customer.companyName}</div>` : ''}
            ${order.customer.contactName ? `<div>${order.customer.contactName}</div>` : ''}
            ${order.customer.email ? `<div>${order.customer.email}</div>` : ''}
            ${deliveryLines ? `<div style="margin-top: 4px;">${deliveryLines}</div>` : ''}
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr>
              <th style="background: #f9fafb; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Description</th>
              <th style="background: #f9fafb; padding: 10px 12px; text-align: right; font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Qty</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #f3f4f6; color: #374151;">${order.productName}</td>
              <td style="padding: 12px; border-bottom: 1px solid #f3f4f6; color: #374151; text-align: right;">${order.quantity}</td>
            </tr>
          </tbody>
        </table>
        ${order.courier ? `<div style="margin-bottom: 16px;"><span style="color: #9ca3af; font-size: 11px; text-transform: uppercase;">Courier:</span> <span style="color: #4b5563; font-size: 12px;">${order.courier.name}</span></div>` : ''}
        ${settings?.invoiceTerms ? `<div style="background: #f9fafb; border-radius: 6px; padding: 14px; margin-bottom: 20px;"><div style="font-size: 11px; text-transform: uppercase; color: #9ca3af; font-weight: 600; margin-bottom: 6px;">Payment Terms</div><div style="color: #4b5563; font-size: 12px; line-height: 1.5; white-space: pre-wrap;">${settings.invoiceTerms}</div></div>` : ''}
        ${(settings?.bankAccountName || settings?.bankSortCode) ? `<div style="margin-bottom: 20px;"><div style="font-size: 11px; text-transform: uppercase; color: #9ca3af; font-weight: 600; margin-bottom: 6px;">Bank Details</div><div style="font-size: 12px; color: #374151;">${settings.bankAccountName ? `Account: ${settings.bankAccountName}<br>` : ''}${settings.bankSortCode ? `Sort Code: ${settings.bankSortCode}<br>` : ''}${settings.bankAccountNumber ? `Account No: ${settings.bankAccountNumber}<br>` : ''}${settings.bankIban ? `IBAN: ${settings.bankIban}` : ''}</div></div>` : ''}
        ${settings?.invoiceNotes ? `<div style="margin-bottom: 20px; color: #4b5563; font-size: 12px;">${settings.invoiceNotes}</div>` : ''}
        ${settings?.invoiceFooter ? `<div style="text-align: center; color: #9ca3af; font-size: 11px; padding-top: 16px; border-top: 1px solid #e5e7eb; margin-top: 20px;">${settings.invoiceFooter}</div>` : ''}
      </div>
    `;

    try {
      await this.emailService.sendMail({
        to: order.customer.email,
        subject: `${invoiceNumber} — Invoice from ${companyName}`,
        html,
        text: `Invoice ${invoiceNumber} from ${companyName} for ${order.quantity}x ${order.productName}`,
      });
      return { success: true, message: `Invoice sent to ${order.customer.email}` };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, message: `Failed to send invoice: ${message}` };
    }
  }
}
