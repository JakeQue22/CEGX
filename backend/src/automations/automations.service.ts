import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../common/services/email.service';

export const AUTOMATIONS_QUEUE = 'automations';

@Injectable()
export class AutomationsService {
  private readonly logger = new Logger(AutomationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    @InjectQueue(AUTOMATIONS_QUEUE) private readonly automationsQueue: Queue,
  ) {}

  async triggerDealWon(dealId: string, userId: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        supplier: true,
        product: true,
        assignedUser: { select: { id: true, name: true, email: true } },
      },
    });
    if (!deal) return;

    const settings = await this.prisma.companySettings.findFirst();
    if (!settings?.notifyOnDealWon) return;

    // Notify the assigned user
    if (deal.assignedUserId) {
      await this.notificationsService.create({
        userId: deal.assignedUserId,
        title: '🎉 Deal Won!',
        message: `Deal "${deal.title}" has been marked as WON. Revenue: £${Number(deal.revenue).toFixed(2)}`,
        type: 'DEAL_WON',
        link: `/deals/${dealId}`,
      });

      // Also notify via email if we have SMTP configured
      if (deal.assignedUser?.email && settings?.smtpHost) {
        try {
          await this.emailService.sendMail({
            to: deal.assignedUser.email,
            subject: `🎉 Deal Won: ${deal.title}`,
            html: `
              <h2>Congratulations! Deal Won</h2>
              <p>The deal <strong>${deal.title}</strong> has been marked as <strong>WON</strong>.</p>
              <ul>
                <li>Revenue: <strong>£${Number(deal.revenue).toFixed(2)}</strong></li>
                <li>Gross Profit: <strong>£${Number(deal.grossProfit).toFixed(2)}</strong></li>
                <li>Profit Margin: <strong>${Number(deal.profitMarginPercent).toFixed(2)}%</strong></li>
              </ul>
            `,
          });
        } catch (err) {
          this.logger.error(`Failed to send deal won email: ${err.message}`);
        }
      }
    }

    this.logger.log(`Deal won automation triggered for deal ${dealId}`);
  }

  async triggerFollowUpDue(followUpId: string) {
    const followUp = await this.prisma.followUp.findUnique({
      where: { id: followUpId },
      include: {
        assignedUser: { select: { id: true, name: true, email: true } },
        deal: { select: { id: true, title: true } },
      },
    });
    if (!followUp) return;

    const settings = await this.prisma.companySettings.findFirst();
    if (!settings?.notifyOnFollowUpDue) return;

    await this.notificationsService.create({
      userId: followUp.assignedUserId,
      title: '⏰ Follow-up Due',
      message: followUp.deal
        ? `Follow-up for deal "${followUp.deal.title}" is due: ${followUp.note ?? ''}`
        : `Follow-up is due: ${followUp.note ?? ''}`,
      type: 'FOLLOW_UP_DUE',
      link: followUp.deal ? `/deals/${followUp.deal.id}` : undefined,
    });

    this.logger.log(`Follow-up due notification sent for followUp ${followUpId}`);
  }

  async triggerNewSupplier(supplierId: string, createdByUserId: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) return;

    // Notify all admins
    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN', isActive: true } });
    await Promise.all(
      admins.map((admin) =>
        this.notificationsService.create({
          userId: admin.id,
          title: '🏭 New Supplier Added',
          message: `Supplier "${supplier.name}" was added to the system.`,
          type: 'SUPPLIER_ADDED',
          link: `/suppliers/${supplierId}`,
        }),
      ),
    );

    this.logger.log(`New supplier notification sent for supplier ${supplierId}`);
  }

  async triggerDealInactive(dealId: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      include: { assignedUser: { select: { id: true, name: true } } },
    });
    if (!deal || !deal.assignedUserId) return;

    await this.notificationsService.create({
      userId: deal.assignedUserId,
      title: '⚠️ Deal Inactive',
      message: `Deal "${deal.title}" has had no activity for an extended period.`,
      type: 'DEAL_INACTIVE',
      link: `/deals/${dealId}`,
    });

    this.logger.log(`Deal inactive notification sent for deal ${dealId}`);
  }
}
