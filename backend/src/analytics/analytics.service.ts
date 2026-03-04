import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      openDealsCount,
      monthlyAgg,
      dealsByStageRaw,
      wonDeals,
      upcomingFollowUpsRaw,
    ] = await Promise.all([
      this.prisma.deal.count({ where: { status: 'OPEN' } }),
      this.prisma.deal.aggregate({
        where: { status: 'WON', closedAt: { gte: startOfMonth } },
        _sum: { revenue: true, grossProfit: true, vat: true },
      }),
      this.prisma.deal.groupBy({
        by: ['stageId'],
        _count: { id: true },
        _sum: { revenue: true },
      }),
      this.prisma.deal.findMany({
        where: {
          status: 'WON',
          closedAt: { gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) },
        },
        select: { revenue: true, grossProfit: true, closedAt: true },
        orderBy: { closedAt: 'asc' },
      }),
      this.prisma.followUp.findMany({
        where: { isCompleted: false },
        orderBy: { dueAt: 'asc' },
        take: 10,
        include: {
          deal: { select: { id: true, title: true } },
        },
      }),
    ]);

    // Resolve stage names for dealsByStage
    const stageIds = dealsByStageRaw.map((g) => g.stageId);
    const stages = stageIds.length > 0
      ? await this.prisma.pipelineStage.findMany({
          where: { id: { in: stageIds } },
          select: { id: true, name: true },
        })
      : [];
    const stageMap = new Map(stages.map((s) => [s.id, s.name]));

    const dealsByStage = dealsByStageRaw.map((g) => ({
      stage: stageMap.get(g.stageId) ?? 'Unknown',
      count: g._count.id,
      value: Number(g._sum.revenue ?? 0),
    }));

    // Build profitOverTime from recent won deals
    const monthlyMap = new Map<string, { revenue: number; profit: number }>();
    for (const d of wonDeals) {
      if (!d.closedAt) continue;
      const month = d.closedAt.toISOString().slice(0, 7);
      const entry = monthlyMap.get(month) ?? { revenue: 0, profit: 0 };
      entry.revenue += Number(d.revenue);
      entry.profit += Number(d.grossProfit);
      monthlyMap.set(month, entry);
    }
    const profitOverTime = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, data]) => ({ month, ...data }));

    // Map follow-ups to the shape the frontend expects
    const upcomingFollowUps = upcomingFollowUpsRaw.map((fu) => ({
      id: fu.id,
      dealId: fu.dealId,
      deal: fu.deal,
      title: fu.note ?? 'Follow-up',
      dueDate: fu.dueAt.toISOString(),
      isCompleted: fu.isCompleted,
      createdAt: fu.createdAt.toISOString(),
      updatedAt: fu.updatedAt.toISOString(),
    }));

    return {
      monthlyRevenue: Number(monthlyAgg._sum.revenue ?? 0),
      monthlyProfit: Number(monthlyAgg._sum.grossProfit ?? 0),
      openDealsCount,
      vatCollected: Number(monthlyAgg._sum.vat ?? 0),
      dealsByStage,
      profitOverTime,
      upcomingFollowUps,
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

  async getProcurementIntelligence() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [
      totalSuppliers,
      activeSuppliers,
      totalProducts,
      totalCategories,
      totalLeads,
      leadsByStatus,
      recentDeals,
      topSuppliers,
      categoryDemand,
      campaignStats,
      recentLeads,
      outreachStats,
    ] = await Promise.all([
      // Supplier counts
      this.prisma.supplier.count(),
      this.prisma.supplier.count({ where: { isActive: true } }),
      // Product & category counts
      this.prisma.product.count({ where: { isArchived: false } }),
      this.prisma.productCategory.count(),
      // Lead counts
      this.prisma.marketingLead.count(),
      this.prisma.marketingLead.groupBy({ by: ['status'], _count: true }),
      // Recent deals for pipeline velocity
      this.prisma.deal.findMany({
        where: { createdAt: { gte: ninetyDaysAgo } },
        select: { status: true, revenue: true, grossProfit: true, closedAt: true, createdAt: true },
      }),
      // Top suppliers by deal value
      this.prisma.supplier.findMany({
        where: { deals: { some: {} } },
        include: {
          deals: {
            select: { status: true, revenue: true, grossProfit: true, profitMarginPercent: true },
          },
          _count: { select: { products: true } },
        },
        take: 10,
      }),
      // Category demand (products per category with deal count)
      this.prisma.productCategory.findMany({
        include: {
          products: {
            include: {
              _count: { select: { deals: true } },
              deals: {
                where: { status: 'WON' },
                select: { revenue: true },
              },
            },
          },
        },
      }),
      // Campaign performance
      this.prisma.marketingCampaign.findMany({
        include: {
          _count: { select: { leads: true, connections: true, outreachEmails: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // Recent leads
      this.prisma.marketingLead.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { campaign: { select: { id: true, name: true } } },
      }),
      // Outreach email stats
      this.prisma.outreachEmail.groupBy({ by: ['status'], _count: true }),
    ]);

    // Lead funnel data
    const leadFunnel = leadsByStatus.map((l) => ({
      status: l.status,
      count: l._count,
    }));

    // Pipeline velocity (last 90 days)
    const wonDeals = recentDeals.filter((d) => d.status === 'WON');
    const lostDeals = recentDeals.filter((d) => d.status === 'LOST');
    const openDeals = recentDeals.filter((d) => d.status === 'OPEN');
    const winRate = wonDeals.length + lostDeals.length > 0
      ? parseFloat(((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100).toFixed(1))
      : 0;
    const avgDealSize = wonDeals.length > 0
      ? parseFloat((wonDeals.reduce((a, d) => a + Number(d.revenue), 0) / wonDeals.length).toFixed(2))
      : 0;
    const pipelineValue = openDeals.reduce((a, d) => a + Number(d.revenue), 0);

    // Top suppliers enriched
    const topSuppliersData = topSuppliers
      .map((s) => {
        const won = s.deals.filter((d) => d.status === 'WON');
        const totalRevenue = won.reduce((a, d) => a + Number(d.revenue), 0);
        const totalProfit = won.reduce((a, d) => a + Number(d.grossProfit), 0);
        const avgMargin = won.length > 0
          ? won.reduce((a, d) => a + Number(d.profitMarginPercent), 0) / won.length
          : 0;
        return {
          id: s.id,
          name: s.name,
          totalDeals: s.deals.length,
          wonDeals: won.length,
          openDeals: s.deals.filter((d) => d.status === 'OPEN').length,
          productCount: s._count.products,
          totalRevenue,
          totalProfit,
          avgMargin: parseFloat(avgMargin.toFixed(1)),
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Category demand analysis
    const categoryDemandData = categoryDemand.map((cat) => {
      const totalDealCount = cat.products.reduce((a, p) => a + p._count.deals, 0);
      const totalRevenue = cat.products.reduce(
        (a, p) => a + p.deals.reduce((s, d) => s + Number(d.revenue), 0),
        0,
      );
      return {
        id: cat.id,
        name: cat.name,
        productCount: cat.products.length,
        totalDealCount,
        wonRevenue: totalRevenue,
      };
    }).sort((a, b) => b.wonRevenue - a.wonRevenue);

    // Outreach performance
    const outreachPerf = outreachStats.reduce(
      (acc, s) => {
        acc[s.status] = s._count;
        acc.total += s._count;
        return acc;
      },
      { total: 0 } as Record<string, number>,
    );

    return {
      overview: {
        totalSuppliers,
        activeSuppliers,
        totalProducts,
        totalCategories,
        totalLeads,
        pipelineValue,
        winRate,
        avgDealSize,
      },
      leadFunnel,
      topSuppliers: topSuppliersData,
      categoryDemand: categoryDemandData,
      campaignPerformance: campaignStats.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        status: c.status,
        leadsGenerated: c._count.leads,
        connections: c._count.connections,
        emailsSent: c._count.outreachEmails,
        startedAt: c.startedAt,
        createdAt: c.createdAt,
      })),
      recentLeads: recentLeads.map((l) => ({
        id: l.id,
        companyName: l.companyName,
        contactName: l.contactName,
        contactEmail: l.contactEmail,
        industry: l.industry,
        source: l.source,
        status: l.status,
        campaignName: l.campaign?.name ?? null,
        createdAt: l.createdAt,
      })),
      outreachPerformance: outreachPerf,
    };
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

}
