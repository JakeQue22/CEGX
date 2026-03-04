import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateMarketingCampaignDto,
  UpdateMarketingCampaignDto,
} from './dto/create-campaign.dto';

@Injectable()
export class MarketingService {
  private readonly logger = new Logger(MarketingService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('marketing') private readonly marketingQueue: Queue,
  ) {}

  async createCampaign(dto: CreateMarketingCampaignDto, userId: string) {
    return this.prisma.marketingCampaign.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type,
        targetCriteria: dto.targetCriteria as any,
        aiPrompt: dto.aiPrompt,
        productIds: dto.productIds as any,
        createdById: userId,
      },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });
  }

  async findAllCampaigns(filters: { status?: string; type?: string }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;

    return this.prisma.marketingCampaign.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        _count: {
          select: {
            connections: true,
            leads: true,
            outreachEmails: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findCampaignById(id: string) {
    const campaign = await this.prisma.marketingCampaign.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        connections: { orderBy: { createdAt: 'desc' }, take: 50 },
        leads: { orderBy: { createdAt: 'desc' }, take: 50 },
        outreachEmails: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async updateCampaign(id: string, dto: UpdateMarketingCampaignDto) {
    const campaign = await this.prisma.marketingCampaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    return this.prisma.marketingCampaign.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status && { status: dto.status }),
        ...(dto.targetCriteria && { targetCriteria: dto.targetCriteria as any }),
        ...(dto.aiPrompt !== undefined && { aiPrompt: dto.aiPrompt }),
        ...(dto.productIds && { productIds: dto.productIds as any }),
      },
    });
  }

  async startCampaign(id: string) {
    const campaign = await this.prisma.marketingCampaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.prisma.marketingCampaign.update({
      where: { id },
      data: { status: 'ACTIVE', startedAt: new Date() },
    });

    await this.marketingQueue.add('run-campaign', { campaignId: id });

    this.logger.log(`Campaign ${id} started`);
    return { message: 'Campaign started' };
  }

  async pauseCampaign(id: string) {
    return this.prisma.marketingCampaign.update({
      where: { id },
      data: { status: 'PAUSED' },
    });
  }

  async deleteCampaign(id: string) {
    return this.prisma.marketingCampaign.delete({ where: { id } });
  }

  async getCampaignStats() {
    const [total, active, leads, emails] = await Promise.all([
      this.prisma.marketingCampaign.count(),
      this.prisma.marketingCampaign.count({ where: { status: 'ACTIVE' } }),
      this.prisma.marketingLead.count(),
      this.prisma.outreachEmail.count({ where: { status: 'SENT' } }),
    ]);

    const byStatus = await this.prisma.marketingCampaign.groupBy({
      by: ['status'],
      _count: true,
    });

    return { total, active, totalLeads: leads, emailsSent: emails, byStatus };
  }
}
