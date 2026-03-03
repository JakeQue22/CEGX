import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../common/services/email.service';
import { AUTOMATIONS_QUEUE } from './automations.service';

@Processor(AUTOMATIONS_QUEUE)
export class AutomationsProcessor {
  private readonly logger = new Logger(AutomationsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  @Process('check-follow-ups')
  async handleCheckFollowUps(_job: Job) {
    this.logger.log('Running follow-up due check...');
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 60 * 60 * 1000); // next 1 hour

    const dueFollowUps = await this.prisma.followUp.findMany({
      where: {
        isCompleted: false,
        dueAt: { gte: now, lte: windowEnd },
      },
      include: {
        assignedUser: { select: { id: true, name: true, email: true } },
        deal: { select: { id: true, title: true } },
      },
    });

    const settings = await this.prisma.companySettings.findFirst();

    for (const followUp of dueFollowUps) {
      if (!settings?.notifyOnFollowUpDue) continue;

      await this.notificationsService.create({
        userId: followUp.assignedUserId,
        title: '⏰ Follow-up Due Soon',
        message: followUp.deal
          ? `Follow-up for "${followUp.deal.title}" is due soon.`
          : `Follow-up due at ${followUp.dueAt.toISOString()}`,
        type: 'FOLLOW_UP_DUE',
        link: followUp.deal ? `/deals/${followUp.deal.id}` : undefined,
      });
    }

    this.logger.log(`Checked ${dueFollowUps.length} follow-ups`);
  }

  @Process('check-inactive-deals')
  async handleCheckInactiveDeals(_job: Job) {
    this.logger.log('Running inactive deal check...');
    const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000); // 14 days

    const inactiveDeals = await this.prisma.deal.findMany({
      where: {
        status: 'OPEN',
        updatedAt: { lt: cutoff },
        assignedUserId: { not: null },
      },
      select: { id: true, title: true, assignedUserId: true },
    });

    for (const deal of inactiveDeals) {
      if (deal.assignedUserId) {
        await this.notificationsService.create({
          userId: deal.assignedUserId,
          title: '⚠️ Deal Inactive',
          message: `Deal "${deal.title}" hasn't been updated in over 14 days.`,
          type: 'DEAL_INACTIVE',
          link: `/deals/${deal.id}`,
        });
      }
    }

    this.logger.log(`Checked ${inactiveDeals.length} inactive deals`);
  }

  @Process('send-scheduled-campaigns')
  async handleSendScheduledCampaigns(_job: Job) {
    this.logger.log('Checking for scheduled campaigns to send...');
    const now = new Date();

    const dueCampaigns = await this.prisma.emailCampaign.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now },
        sentAt: null,
      },
      include: { recipients: { where: { unsubscribed: false } } },
    });

    for (const campaign of dueCampaigns) {
      this.logger.log(`Sending scheduled campaign ${campaign.id}: ${campaign.name}`);
      let sent = 0;

      for (const recipient of campaign.recipients) {
        try {
          const trackingPixel = this.emailService.buildTrackingPixelHtml(campaign.id, recipient.email);
          await this.emailService.sendMail({
            to: recipient.email,
            subject: campaign.subject,
            html: `${campaign.body}${trackingPixel}`,
          });
          sent++;
        } catch (err) {
          this.logger.error(`Failed to send campaign email to ${recipient.email}: ${err.message}`);
        }
      }

      await this.prisma.emailCampaign.update({
        where: { id: campaign.id },
        data: { status: 'SENT', sentAt: now },
      });

      this.logger.log(`Campaign ${campaign.id} sent to ${sent} recipients`);
    }
  }
}
