import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { AddRecipientsDto } from './dto/add-recipients.dto';

export const CAMPAIGN_QUEUE = 'campaign';

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(CAMPAIGN_QUEUE) private readonly campaignQueue: Queue,
  ) {}

  async create(dto: CreateCampaignDto, userId: string) {
    return this.prisma.emailCampaign.create({
      data: {
        name: dto.name,
        subject: dto.subject,
        body: dto.body,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        status: dto.scheduledAt ? 'SCHEDULED' : 'DRAFT',
        createdById: userId,
      },
    });
  }

  async findAll(userId?: string) {
    return this.prisma.emailCampaign.findMany({
      include: {
        _count: { select: { recipients: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const campaign = await this.prisma.emailCampaign.findUnique({
      where: { id },
      include: {
        recipients: true,
        createdBy: { select: { id: true, name: true } },
        _count: { select: { recipients: true } },
      },
    });
    if (!campaign) throw new NotFoundException(`Campaign ${id} not found`);
    return campaign;
  }

  async update(id: string, dto: Partial<CreateCampaignDto>) {
    const campaign = await this.findOne(id);
    if (campaign.status === 'SENT') {
      throw new BadRequestException('Cannot edit a sent campaign');
    }
    return this.prisma.emailCampaign.update({
      where: { id },
      data: {
        ...dto,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.emailCampaign.delete({ where: { id } });
    return { message: 'Campaign deleted successfully' };
  }

  async addRecipients(id: string, dto: AddRecipientsDto) {
    await this.findOne(id);
    const created = await this.prisma.$transaction(
      dto.recipients.map((r) =>
        this.prisma.campaignRecipient.upsert({
          where: { campaignId_email: { campaignId: id, email: r.email } },
          create: { campaignId: id, email: r.email, name: r.name },
          update: { name: r.name },
        }),
      ),
    );
    return { added: created.length };
  }

  async send(id: string) {
    const campaign = await this.findOne(id);
    if (campaign.status === 'SENT') {
      throw new BadRequestException('Campaign already sent');
    }
    if (campaign.recipients.length === 0) {
      throw new BadRequestException('Campaign has no recipients');
    }

    await this.prisma.emailCampaign.update({
      where: { id },
      data: { status: 'SCHEDULED' },
    });

    await this.campaignQueue.add('send-campaign', { campaignId: id });
    return { message: 'Campaign queued for sending' };
  }

  async schedule(id: string, scheduledAt: string) {
    const campaign = await this.findOne(id);
    if (campaign.status === 'SENT') {
      throw new BadRequestException('Campaign already sent');
    }

    const date = new Date(scheduledAt);
    const delay = date.getTime() - Date.now();
    if (delay <= 0) throw new BadRequestException('scheduledAt must be in the future');

    await this.prisma.emailCampaign.update({
      where: { id },
      data: { status: 'SCHEDULED', scheduledAt: date },
    });

    await this.campaignQueue.add('send-campaign', { campaignId: id }, { delay });
    return { message: `Campaign scheduled for ${date.toISOString()}` };
  }

  async getStats(id: string) {
    await this.findOne(id);
    const total = await this.prisma.campaignRecipient.count({ where: { campaignId: id } });
    const opened = await this.prisma.campaignRecipient.count({
      where: { campaignId: id, openedAt: { not: null } },
    });
    const unsubscribed = await this.prisma.campaignRecipient.count({
      where: { campaignId: id, unsubscribed: true },
    });

    return {
      total,
      opened,
      unsubscribed,
      openRate: total > 0 ? parseFloat(((opened / total) * 100).toFixed(2)) : 0,
      unsubscribeRate: total > 0 ? parseFloat(((unsubscribed / total) * 100).toFixed(2)) : 0,
    };
  }

  async trackOpen(encoded: string) {
    try {
      const decoded = Buffer.from(encoded, 'base64').toString('utf8');
      const [campaignId, email] = decoded.split(':');
      if (campaignId && email) {
        await this.prisma.campaignRecipient.updateMany({
          where: { campaignId, email, openedAt: null },
          data: { openedAt: new Date() },
        });
      }
    } catch {
      // silently ignore tracking errors
    }
    // Return a 1x1 transparent GIF
    return Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64',
    );
  }
}
