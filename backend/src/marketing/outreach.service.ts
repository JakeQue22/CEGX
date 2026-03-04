import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateLeadDto,
  UpdateLeadDto,
  CreateOutreachEmailDto,
  BulkOutreachDto,
} from './dto/outreach.dto';

@Injectable()
export class OutreachService {
  private readonly logger = new Logger(OutreachService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('marketing') private readonly marketingQueue: Queue,
  ) {}

  // --- Lead Management ---
  async createLead(dto: CreateLeadDto) {
    return this.prisma.marketingLead.create({ data: dto });
  }

  async getLeads(filters: { campaignId?: string; status?: string }) {
    const where: any = {};
    if (filters.campaignId) where.campaignId = filters.campaignId;
    if (filters.status) where.status = filters.status;

    return this.prisma.marketingLead.findMany({
      where,
      include: {
        campaign: { select: { id: true, name: true } },
        _count: { select: { outreachEmails: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLeadById(id: string) {
    const lead = await this.prisma.marketingLead.findUnique({
      where: { id },
      include: {
        campaign: { select: { id: true, name: true } },
        outreachEmails: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async updateLead(id: string, dto: UpdateLeadDto) {
    return this.prisma.marketingLead.update({ where: { id }, data: dto });
  }

  async deleteLead(id: string) {
    return this.prisma.marketingLead.delete({ where: { id } });
  }

  // --- Outreach Emails ---
  async createOutreachEmail(dto: CreateOutreachEmailDto) {
    const email = await this.prisma.outreachEmail.create({
      data: {
        toEmail: dto.toEmail,
        toName: dto.toName,
        subject: dto.subject,
        body: dto.body,
        campaignId: dto.campaignId,
        leadId: dto.leadId,
        isAiGenerated: dto.useAi || false,
        status: 'QUEUED',
      },
    });

    // Queue sending
    await this.marketingQueue.add('send-outreach-email', { emailId: email.id });

    return email;
  }

  async sendBulkOutreach(dto: BulkOutreachDto) {
    const where: any = { campaignId: dto.campaignId };
    if (dto.leadIds?.length) {
      where.id = { in: dto.leadIds };
    }

    const leads = await this.prisma.marketingLead.findMany({
      where,
      select: { id: true, contactEmail: true, contactName: true, companyName: true },
    });

    const emails = [];
    for (const lead of leads) {
      if (!lead.contactEmail) continue;

      const email = await this.prisma.outreachEmail.create({
        data: {
          toEmail: lead.contactEmail,
          toName: lead.contactName || lead.companyName,
          subject: dto.subject,
          body: dto.body,
          campaignId: dto.campaignId,
          leadId: lead.id,
          isAiGenerated: dto.useAi || false,
          status: 'QUEUED',
        },
      });
      emails.push(email);
    }

    // Queue bulk send
    await this.marketingQueue.add('send-bulk-outreach', {
      emailIds: emails.map((e) => e.id),
    });

    this.logger.log(`Queued ${emails.length} outreach emails for campaign ${dto.campaignId}`);
    return { queued: emails.length, emails };
  }

  async getEmails(filters: { campaignId?: string; status?: string }) {
    const where: any = {};
    if (filters.campaignId) where.campaignId = filters.campaignId;
    if (filters.status) where.status = filters.status;

    return this.prisma.outreachEmail.findMany({
      where,
      include: {
        campaign: { select: { id: true, name: true } },
        lead: { select: { id: true, companyName: true, contactName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getEmailById(id: string) {
    const email = await this.prisma.outreachEmail.findUnique({
      where: { id },
      include: {
        campaign: { select: { id: true, name: true } },
        lead: true,
      },
    });
    if (!email) throw new NotFoundException('Outreach email not found');
    return email;
  }

  // --- Lead Scraping ---
  async scrapeLeads(campaignId: string, query?: string) {
    const campaign = await this.prisma.marketingCampaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');

    // Queue the scraping job
    await this.marketingQueue.add('scrape-leads', {
      campaignId,
      query,
      targetCriteria: campaign.targetCriteria,
    });

    this.logger.log(`Lead scraping queued for campaign ${campaignId}`);
    return { message: 'Lead scraping started', campaignId };
  }
}
