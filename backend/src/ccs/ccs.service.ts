import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateCcsFrameworkDto,
  UpdateCcsFrameworkDto,
  CreateCcsLotDto,
  UpdateCcsLotDto,
  CreateCcsOpportunityDto,
  UpdateCcsOpportunityDto,
} from './dto/ccs.dto';

@Injectable()
export class CcsService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Frameworks ---
  async createFramework(dto: CreateCcsFrameworkDto) {
    return this.prisma.ccsFramework.create({ data: dto as any });
  }

  async getFrameworks(filters: { category?: string; status?: string; search?: string }) {
    const where: any = {};
    if (filters.category) where.category = filters.category;
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { reference: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.ccsFramework.findMany({
      where,
      include: {
        _count: { select: { lots: true, opportunities: true } },
      },
      orderBy: { reference: 'asc' },
    });
  }

  async getFrameworkById(id: string) {
    const framework = await this.prisma.ccsFramework.findUnique({
      where: { id },
      include: {
        lots: { orderBy: { lotNumber: 'asc' } },
        opportunities: { orderBy: { createdAt: 'desc' }, take: 20 },
        _count: { select: { lots: true, opportunities: true } },
      },
    });
    if (!framework) throw new NotFoundException('Framework not found');
    return framework;
  }

  async updateFramework(id: string, dto: UpdateCcsFrameworkDto) {
    await this.getFrameworkById(id);
    return this.prisma.ccsFramework.update({ where: { id }, data: dto as any });
  }

  async deleteFramework(id: string) {
    await this.getFrameworkById(id);
    await this.prisma.ccsFramework.delete({ where: { id } });
    return { message: 'Framework deleted successfully' };
  }

  async getFrameworkCategories() {
    const categories = await this.prisma.ccsFramework.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { category: 'asc' },
    });
    return categories.map((c) => ({ category: c.category, count: c._count.id }));
  }

  async getFrameworkStats() {
    const [total, live, expired, upcoming, totalOpportunities, openOpportunities, biddingOpportunities] =
      await Promise.all([
        this.prisma.ccsFramework.count(),
        this.prisma.ccsFramework.count({ where: { status: 'LIVE' } }),
        this.prisma.ccsFramework.count({ where: { status: 'EXPIRED' } }),
        this.prisma.ccsFramework.count({ where: { status: 'UPCOMING' } }),
        this.prisma.ccsOpportunity.count(),
        this.prisma.ccsOpportunity.count({ where: { status: 'OPEN' } }),
        this.prisma.ccsOpportunity.count({
          where: { bidStatus: { in: ['PREPARING', 'SUBMITTED'] } },
        }),
      ]);

    return {
      frameworks: { total, live, expired, upcoming },
      opportunities: {
        total: totalOpportunities,
        open: openOpportunities,
        bidding: biddingOpportunities,
      },
    };
  }

  // --- Lots ---
  async createLot(dto: CreateCcsLotDto) {
    return this.prisma.ccsLot.create({ data: dto });
  }

  async updateLot(id: string, dto: UpdateCcsLotDto) {
    return this.prisma.ccsLot.update({ where: { id }, data: dto });
  }

  async deleteLot(id: string) {
    await this.prisma.ccsLot.delete({ where: { id } });
    return { message: 'Lot deleted successfully' };
  }

  // --- Opportunities ---
  async createOpportunity(dto: CreateCcsOpportunityDto) {
    return this.prisma.ccsOpportunity.create({ data: dto as any });
  }

  async getOpportunities(filters: {
    frameworkId?: string;
    status?: string;
    bidStatus?: string;
    category?: string;
    search?: string;
  }) {
    const where: any = {};
    if (filters.frameworkId) where.frameworkId = filters.frameworkId;
    if (filters.status) where.status = filters.status;
    if (filters.bidStatus) where.bidStatus = filters.bidStatus;
    if (filters.category) where.category = filters.category;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { buyerName: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.ccsOpportunity.findMany({
      where,
      include: {
        framework: { select: { id: true, reference: true, title: true } },
        assignedUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOpportunityById(id: string) {
    const opp = await this.prisma.ccsOpportunity.findUnique({
      where: { id },
      include: {
        framework: {
          select: { id: true, reference: true, title: true, category: true },
        },
        assignedUser: { select: { id: true, name: true, email: true } },
      },
    });
    if (!opp) throw new NotFoundException('Opportunity not found');
    return opp;
  }

  async updateOpportunity(id: string, dto: UpdateCcsOpportunityDto) {
    await this.getOpportunityById(id);
    return this.prisma.ccsOpportunity.update({ where: { id }, data: dto as any });
  }

  async deleteOpportunity(id: string) {
    await this.getOpportunityById(id);
    await this.prisma.ccsOpportunity.delete({ where: { id } });
    return { message: 'Opportunity deleted successfully' };
  }
}
