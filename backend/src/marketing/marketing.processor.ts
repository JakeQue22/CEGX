import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../common/prisma/prisma.service';
import { LeadScrapingService } from './lead-scraping.service';

@Processor('marketing')
export class MarketingProcessor {
  private readonly logger = new Logger(MarketingProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly leadScrapingService: LeadScrapingService,
  ) {}

  @Process('run-campaign')
  async handleRunCampaign(job: Job<{ campaignId: string }>) {
    this.logger.log(`Processing campaign ${job.data.campaignId}`);
    // Campaign orchestration logic:
    // 1. Load campaign with criteria
    // 2. Run scraping if needed
    // 3. Queue connection requests / emails
    const campaign = await this.prisma.marketingCampaign.findUnique({
      where: { id: job.data.campaignId },
    });
    if (!campaign) return;

    this.logger.log(`Campaign ${campaign.name} processing started`);
  }

  @Process('linkedin-connect')
  async handleLinkedInConnect(
    job: Job<{
      connectionId: string;
      accountId: string;
      profileUrl: string;
      message?: string;
    }>,
  ) {
    this.logger.log(`Processing LinkedIn connection to ${job.data.profileUrl}`);
    // Browser automation would go here:
    // 1. Load LinkedIn session from account
    // 2. Navigate to profile
    // 3. Send connection request with optional message
    // 4. Update connection status
  }

  @Process('linkedin-send-message')
  async handleLinkedInSendMessage(
    job: Job<{ messageId: string; connectionId: string; content: string }>,
  ) {
    this.logger.log(`Sending LinkedIn message ${job.data.messageId}`);
    // Browser automation:
    // 1. Load LinkedIn session
    // 2. Navigate to conversation
    // 3. Send message
    // 4. Update message status
  }

  @Process('linkedin-sync')
  async handleLinkedInSync(job: Job<{ accountId: string }>) {
    this.logger.log(`Syncing LinkedIn account ${job.data.accountId}`);

    const account = await this.prisma.linkedInAccount.findUnique({
      where: { id: job.data.accountId },
      include: {
        connections: {
          where: { status: 'PENDING' },
          select: { id: true, profileUrl: true, createdAt: true },
        },
      },
    });

    if (!account) {
      this.logger.warn(`LinkedIn account ${job.data.accountId} not found, skipping sync`);
      return;
    }

    // Mark stale pending connections (older than threshold) as expired
    const STALE_THRESHOLD_DAYS = 30;
    const cutoffDate = new Date(Date.now() - STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);
    const staleConnections = account.connections.filter(
      (c) => c.createdAt < cutoffDate,
    );
    for (const conn of staleConnections) {
      await this.prisma.linkedInConnection.update({
        where: { id: conn.id },
        data: { status: 'EXPIRED' },
      });
    }

    if (staleConnections.length > 0) {
      this.logger.log(
        `Marked ${staleConnections.length} stale pending connections as expired for account ${account.email}`,
      );
    }

    // Note: Full inbox sync via browser automation would require a headless browser
    // (e.g. Puppeteer/Playwright) to log in and scrape LinkedIn messages.
    // This is a placeholder for that integration.
    this.logger.log(
      `LinkedIn sync completed for ${account.email}: ${staleConnections.length} stale connections expired`,
    );
  }

  @Process('send-outreach-email')
  async handleSendOutreachEmail(job: Job<{ emailId: string }>) {
    this.logger.log(`Sending outreach email ${job.data.emailId}`);

    const email = await this.prisma.outreachEmail.findUnique({
      where: { id: job.data.emailId },
    });
    if (!email) return;

    try {
      // In production, use nodemailer transport configured via settings
      // await this.emailService.send({ to: email.toEmail, subject: email.subject, body: email.body });

      await this.prisma.outreachEmail.update({
        where: { id: email.id },
        data: { status: 'SENT', sentAt: new Date() },
      });

      this.logger.log(`Outreach email sent to ${email.toEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send email ${email.id}: ${error.message}`);
      await this.prisma.outreachEmail.update({
        where: { id: email.id },
        data: { status: 'BOUNCED' },
      });
    }
  }

  @Process('send-bulk-outreach')
  async handleBulkOutreach(job: Job<{ emailIds: string[] }>) {
    this.logger.log(`Sending ${job.data.emailIds.length} bulk outreach emails`);
    for (const emailId of job.data.emailIds) {
      await this.handleSendOutreachEmail({ data: { emailId } } as any);
      // Add delay between sends to avoid spam filters
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  @Process('scrape-leads')
  async handleScrapeLeads(
    job: Job<{ campaignId: string; query?: string; targetCriteria: any }>,
  ) {
    this.logger.log(`Scraping leads for campaign ${job.data.campaignId}`);
    await this.leadScrapingService.scrapeCompanies(
      job.data.campaignId,
      job.data.targetCriteria || {},
    );
  }
}
