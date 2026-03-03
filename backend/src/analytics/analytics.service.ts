import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [
      totalDeals,
      wonDeals,
      lostDeals,
      openDeals,
      totalRevenue,
      totalGrossProfit,
      pendingFollowUps,
      activeCampaigns,
    ] = await Promise.all([
      this.prisma.deal.count(),
      this.prisma.deal.count({ where: { status: 'WON' } }),
      this.prisma.deal.count({ where: { status: 'LOST' } }),
      this.prisma.deal.count({ where: { status: 'OPEN' } }),
      this.prisma.deal.aggregate({ where: { status: 'WON' }, _sum: { revenue: true } }),
      this.prisma.deal.aggregate({ where: { status: 'WON' }, _sum: { grossProfit: true } }),
      this.prisma.followUp.count({ where: { isCompleted: false } }),
      this.prisma.emailCampaign.count({ where: { status: { in: ['DRAFT', 'SCHEDULED'] } } }),
    ]);

    const winRate = totalDeals > 0 ? ((wonDeals / totalDeals) * 100).toFixed(2) : '0.00';

    return {
      totalDeals,
      wonDeals,
      lostDeals,
      openDeals,
      winRate: parseFloat(winRate),
      totalRevenue: Number(totalRevenue._sum.revenue ?? 0),
      totalGrossProfit: Number(totalGrossProfit._sum.grossProfit ?? 0),
      pendingFollowUps,
      activeCampaigns,
    };
  }

  async getRevenue(from?: string, to?: string) {
    const dateFilter = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
    const where = {
      status: 'WON',
      ...(from || to ? { closedAt: dateFilter } : {}),
    };

    const result = await this.prisma.deal.aggregate({
      where,
      _sum: { revenue: true },
      _count: { id: true },
    });

    // Monthly breakdown using Prisma (parameterized)
    const deals = await this.prisma.deal.findMany({
      where,
      select: { revenue: true, closedAt: true },
      orderBy: { closedAt: 'asc' },
    });

    const monthlyMap = new Map<string, { revenue: number; deals: number }>();
    for (const d of deals) {
      if (!d.closedAt) continue;
      const month = d.closedAt.toISOString().slice(0, 7); // 'YYYY-MM'
      const entry = monthlyMap.get(month) ?? { revenue: 0, deals: 0 };
      entry.revenue += Number(d.revenue);
      entry.deals += 1;
      monthlyMap.set(month, entry);
    }

    const monthly = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));

    return {
      total: Number(result._sum.revenue ?? 0),
      count: result._count.id ?? 0,
      monthly,
    };
  }

  async getProfit(from?: string, to?: string) {
    const deals = await this.prisma.deal.findMany({
      where: {
        status: 'WON',
        ...(from || to
          ? {
              closedAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      select: {
        revenue: true,
        cost: true,
        adSpend: true,
        vat: true,
        grossProfit: true,
        profitMarginPercent: true,
        closedAt: true,
      },
    });

    const totals = deals.reduce(
      (acc, d) => ({
        revenue: acc.revenue + Number(d.revenue),
        cost: acc.cost + Number(d.cost),
        adSpend: acc.adSpend + Number(d.adSpend),
        vat: acc.vat + Number(d.vat),
        grossProfit: acc.grossProfit + Number(d.grossProfit),
      }),
      { revenue: 0, cost: 0, adSpend: 0, vat: 0, grossProfit: 0 },
    );

    const avgMargin =
      deals.length > 0
        ? deals.reduce((a, d) => a + Number(d.profitMarginPercent), 0) / deals.length
        : 0;

    return { ...totals, avgProfitMarginPercent: parseFloat(avgMargin.toFixed(2)), count: deals.length };
  }

  async getAdSpend(from?: string, to?: string) {
    const result = await this.prisma.deal.aggregate({
      where: {
        status: 'WON',
        ...(from || to
          ? { closedAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
          : {}),
      },
      _sum: { adSpend: true, revenue: true },
    });

    const adSpend = Number(result._sum.adSpend ?? 0);
    const revenue = Number(result._sum.revenue ?? 0);
    const adRoi = adSpend > 0 ? parseFloat(((revenue - adSpend) / adSpend).toFixed(4)) : null;

    return { totalAdSpend: adSpend, totalRevenue: revenue, adRoi };
  }

  async getMarginBySupplier() {
    const suppliers = await this.prisma.supplier.findMany({
      where: { deals: { some: { status: 'WON' } } },
      include: {
        deals: {
          where: { status: 'WON' },
          select: { grossProfit: true, revenue: true, profitMarginPercent: true },
        },
      },
    });

    return suppliers.map((s) => {
      const totalRevenue = s.deals.reduce((a, d) => a + Number(d.revenue), 0);
      const totalGrossProfit = s.deals.reduce((a, d) => a + Number(d.grossProfit), 0);
      const avgMargin =
        s.deals.length > 0
          ? s.deals.reduce((a, d) => a + Number(d.profitMarginPercent), 0) / s.deals.length
          : 0;
      return {
        supplierId: s.id,
        supplierName: s.name,
        wonDeals: s.deals.length,
        totalRevenue,
        totalGrossProfit,
        avgProfitMarginPercent: parseFloat(avgMargin.toFixed(2)),
      };
    });
  }

  async getMarginByProduct() {
    const products = await this.prisma.product.findMany({
      where: { deals: { some: { status: 'WON' } } },
      include: {
        deals: {
          where: { status: 'WON' },
          select: { grossProfit: true, revenue: true, profitMarginPercent: true, quantity: true },
        },
      },
    });

    return products.map((p) => {
      const totalRevenue = p.deals.reduce((a, d) => a + Number(d.revenue), 0);
      const totalGrossProfit = p.deals.reduce((a, d) => a + Number(d.grossProfit), 0);
      const totalQuantity = p.deals.reduce((a, d) => a + d.quantity, 0);
      const avgMargin =
        p.deals.length > 0
          ? p.deals.reduce((a, d) => a + Number(d.profitMarginPercent), 0) / p.deals.length
          : 0;
      return {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        wonDeals: p.deals.length,
        totalQuantity,
        totalRevenue,
        totalGrossProfit,
        avgProfitMarginPercent: parseFloat(avgMargin.toFixed(2)),
      };
    });
  }

  async getCampaignRoi() {
    const campaigns = await this.prisma.emailCampaign.findMany({
      where: { status: 'SENT' },
      include: {
        _count: { select: { recipients: true } },
        recipients: { select: { openedAt: true, unsubscribed: true } },
      },
    });

    return campaigns.map((c) => {
      const total = c.recipients.length;
      const opened = c.recipients.filter((r) => r.openedAt !== null).length;
      const unsubscribed = c.recipients.filter((r) => r.unsubscribed).length;
      return {
        campaignId: c.id,
        campaignName: c.name,
        sentAt: c.sentAt,
        totalRecipients: total,
        opened,
        unsubscribed,
        openRate: total > 0 ? parseFloat(((opened / total) * 100).toFixed(2)) : 0,
        unsubscribeRate: total > 0 ? parseFloat(((unsubscribed / total) * 100).toFixed(2)) : 0,
      };
    });
  }

  async getVatLiability(from?: string, to?: string) {
    const result = await this.prisma.deal.aggregate({
      where: {
        status: 'WON',
        ...(from || to
          ? { closedAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
          : {}),
      },
      _sum: { vat: true, revenue: true },
    });

    return {
      totalVatLiability: Number(result._sum.vat ?? 0),
      totalRevenue: Number(result._sum.revenue ?? 0),
    };
  }

  private buildDateFilter(status: string, from?: string, to?: string) {
    return {
      status,
      ...(from || to
        ? {
            closedAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };
  }
}
