import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EmailService } from '../common/services/email.service';
import { CAMPAIGN_QUEUE } from './campaigns.service';

@Processor(CAMPAIGN_QUEUE)
export class CampaignsProcessor {
  private readonly logger = new Logger(CampaignsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  @Process('send-campaign')
  async handleSendCampaign(job: Job<{ campaignId: string }>) {
    const { campaignId } = job.data;
    this.logger.log(`Processing campaign ${campaignId}`);

    const campaign = await this.prisma.emailCampaign.findUnique({
      where: { id: campaignId },
      include: { recipients: { where: { unsubscribed: false } } },
    });

    if (!campaign) {
      this.logger.error(`Campaign ${campaignId} not found`);
      return;
    }

    if (campaign.status === 'SENT') {
      this.logger.warn(`Campaign ${campaignId} already sent, skipping`);
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const recipient of campaign.recipients) {
      try {
        const trackingPixel = this.emailService.buildTrackingPixelHtml(campaignId, recipient.email);
        const bodyWithTracking = `${campaign.body}${trackingPixel}`;

        await this.emailService.sendMail({
          to: recipient.email,
          subject: campaign.subject,
          html: bodyWithTracking,
        });

        successCount++;
      } catch (err) {
        this.logger.error(`Failed to send to ${recipient.email}: ${err.message}`);
        failCount++;
      }
    }

    await this.prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: failCount === campaign.recipients.length ? 'FAILED' : 'SENT',
        sentAt: new Date(),
      },
    });

    this.logger.log(
      `Campaign ${campaignId} completed: ${successCount} sent, ${failCount} failed`,
    );
  }
}
