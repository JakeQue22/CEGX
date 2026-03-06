import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../common/prisma/prisma.service';
import { LeadScrapingService } from './lead-scraping.service';
import { LinkedInBrowserService } from './linkedin-browser.service';

@Processor('marketing')
export class MarketingProcessor {
  private readonly logger = new Logger(MarketingProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly leadScrapingService: LeadScrapingService,
    private readonly browserService: LinkedInBrowserService,
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

    const account = await this.prisma.linkedInAccount.findUnique({
      where: { id: job.data.accountId },
    });
    if (!account || !account.sessionData) {
      this.logger.warn(`No session data for account ${job.data.accountId}, skipping connection request`);
      return;
    }

    const result = await this.browserService.sendConnectionRequest(
      account.sessionData,
      job.data.profileUrl,
      job.data.message,
    );

    if (result.success) {
      await this.prisma.linkedInConnection.update({
        where: { id: job.data.connectionId },
        data: {
          name: result.name || 'Pending...',
          status: 'PENDING',
        },
      });
      this.logger.log(`Connection request sent to ${result.name || job.data.profileUrl}`);
    } else {
      this.logger.error(`Connection request failed: ${result.error}`);
    }
  }

  @Process('linkedin-send-message')
  async handleLinkedInSendMessage(
    job: Job<{ messageId: string; connectionId: string; content: string }>,
  ) {
    this.logger.log(`Sending LinkedIn message ${job.data.messageId}`);

    const connection = await this.prisma.linkedInConnection.findUnique({
      where: { id: job.data.connectionId },
      include: { account: true },
    });
    if (!connection || !connection.account.sessionData) {
      this.logger.warn(`No session data for connection ${job.data.connectionId}, skipping message send`);
      return;
    }

    const result = await this.browserService.sendMessage(
      connection.account.sessionData,
      connection.profileUrl,
      job.data.content,
    );

    if (result.success) {
      this.logger.log(`Message sent to ${connection.name}`);
    } else {
      this.logger.error(`Message send failed: ${result.error}`);
    }
  }

  @Process('linkedin-sync')
  async handleLinkedInSync(job: Job<{ accountId: string }>) {
    this.logger.log(`Syncing LinkedIn account ${job.data.accountId}`);

    const account = await this.prisma.linkedInAccount.findUnique({
      where: { id: job.data.accountId },
    });

    if (!account) {
      this.logger.warn(`LinkedIn account ${job.data.accountId} not found, skipping sync`);
      return;
    }

    // Mark stale pending connections (older than threshold) as expired
    const STALE_THRESHOLD_DAYS = 30;
    const cutoffDate = new Date(Date.now() - STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);
    const expireResult = await this.prisma.linkedInConnection.updateMany({
      where: {
        accountId: account.id,
        status: 'PENDING',
        createdAt: { lt: cutoffDate },
      },
      data: { status: 'EXPIRED' },
    });

    if (expireResult.count > 0) {
      this.logger.log(
        `Marked ${expireResult.count} stale pending connections as expired for account ${account.email}`,
      );
    }

    // Attempt browser-based sync if we have session data
    if (account.sessionData) {
      const connResult = await this.browserService.fetchConnections(account.sessionData);
      if (!connResult.error) {
        let imported = 0;
        for (const conn of connResult.connections) {
          try {
            const existing = await this.prisma.linkedInConnection.findFirst({
              where: { accountId: account.id, profileUrl: conn.profileUrl },
            });
            if (!existing) {
              await this.prisma.linkedInConnection.create({
                data: {
                  accountId: account.id,
                  profileUrl: conn.profileUrl,
                  name: conn.name,
                  headline: conn.headline,
                  company: conn.company,
                  location: conn.location,
                  status: 'CONNECTED',
                  connectedAt: new Date(),
                },
              });
              imported++;
            }
          } catch (err) {
            this.logger.warn(`Failed to import connection ${conn.profileUrl}: ${(err as Error).message}`);
          }
        }
        this.logger.log(`Background sync imported ${imported} new connections for ${account.email}`);
      }
    }

    this.logger.log(`LinkedIn sync completed for ${account.email}`);
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
