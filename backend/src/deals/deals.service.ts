import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { FinancialCalculationService } from '../common/services/financial-calculation.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { ChangeStageDto } from './dto/change-stage.dto';

@Injectable()
export class DealsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financialCalc: FinancialCalculationService,
  ) {}

  private async computeFinancials(
    productId: string | null | undefined,
    quantity: number,
    salePrice: number,
  ) {
    if (!productId) {
      return {
        costPriceSnapshot: 0,
        adPercentSnapshot: 0,
        vatPercentSnapshot: 20,
        revenue: salePrice * quantity,
        cost: 0,
        adSpend: 0,
        vat: 0,
        grossProfit: salePrice * quantity,
        profitMarginPercent: 100,
      };
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { bulkPricings: true },
    });

    if (!product) {
      return {
        costPriceSnapshot: 0,
        adPercentSnapshot: 0,
        vatPercentSnapshot: 20,
        revenue: salePrice * quantity,
        cost: 0,
        adSpend: 0,
        vat: 0,
        grossProfit: salePrice * quantity,
        profitMarginPercent: 100,
      };
    }

    const effectiveCost = this.financialCalc.getBulkPrice(
      quantity,
      Number(product.baseCostPrice),
      product.bulkPricings.map((bp) => ({
        minQuantity: bp.minQuantity,
        bulkCostPrice: bp.bulkCostPrice,
      })),
    );

    const financials = this.financialCalc.calculateDealFinancials(
      salePrice,
      quantity,
      effectiveCost,
      Number(product.adPercent),
      Number(product.vatPercent),
    );

    return {
      costPriceSnapshot: effectiveCost,
      adPercentSnapshot: Number(product.adPercent),
      vatPercentSnapshot: Number(product.vatPercent),
      ...financials,
    };
  }

  async create(dto: CreateDealDto, userId: string) {
    const { quantity = 1, salePrice, productId, stageId, shippingCost = 0, ...rest } = dto;

    // Validate stage exists
    const stage = await this.prisma.pipelineStage.findUnique({ where: { id: stageId } });
    if (!stage) throw new NotFoundException(`Stage ${stageId} not found`);

    const financials = await this.computeFinancials(productId, quantity, salePrice);

    const deal = await this.prisma.$transaction(async (tx) => {
      const created = await tx.deal.create({
        data: {
          ...rest,
          productId,
          stageId,
          quantity,
          salePrice,
          shippingCost,
          ...financials,
          assignedUserId: rest.assignedUserId ?? userId,
        },
        include: {
          stage: true,
          supplier: true,
          product: true,
          courier: true,
          assignedUser: { select: { id: true, name: true, email: true } },
        },
      });

      // Log initial stage entry
      await tx.dealStageHistory.create({
        data: {
          dealId: created.id,
          fromStageId: null,
          toStageId: stageId,
          changedById: userId,
        },
      });

      return created;
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'CREATE',
        entityType: 'Deal',
        entityId: deal.id,
        metadata: { title: deal.title, stageId },
      },
    });

    return deal;
  }

  async findAll(filters?: {
    status?: string;
    stageId?: string;
    assignedUserId?: string;
    supplierId?: string;
    search?: string;
  }) {
    return this.prisma.deal.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.stageId ? { stageId: filters.stageId } : {}),
        ...(filters?.assignedUserId ? { assignedUserId: filters.assignedUserId } : {}),
        ...(filters?.supplierId ? { supplierId: filters.supplierId } : {}),
        ...(filters?.search
          ? { title: { contains: filters.search, mode: 'insensitive' } }
          : {}),
      },
      include: {
        stage: true,
        supplier: true,
        product: true,
        courier: true,
        assignedUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        stage: true,
        supplier: true,
        product: { include: { bulkPricings: true } },
        courier: true,
        assignedUser: { select: { id: true, name: true, email: true } },
        followUps: { where: { isCompleted: false }, orderBy: { dueAt: 'asc' } },
      },
    });
    if (!deal) throw new NotFoundException(`Deal ${id} not found`);
    return deal;
  }

  async update(id: string, dto: UpdateDealDto, userId: string) {
    const existing = await this.findOne(id);

    const quantity = dto.quantity ?? existing.quantity;
    const salePrice = dto.salePrice !== undefined ? dto.salePrice : Number(existing.salePrice);
    const productId = dto.productId !== undefined ? dto.productId : existing.productId;

    let financials = {};
    if (dto.quantity !== undefined || dto.salePrice !== undefined || dto.productId !== undefined) {
      financials = await this.computeFinancials(productId, quantity, salePrice);
    }

    const data: Record<string, unknown> = { ...dto, ...financials };

    if (dto.status === 'WON' && existing.status !== 'WON') {
      data.closedAt = new Date();
    } else if (dto.status === 'LOST' && existing.status !== 'LOST') {
      data.closedAt = new Date();
    }

    const deal = await this.prisma.deal.update({
      where: { id },
      data,
      include: {
        stage: true,
        supplier: true,
        product: true,
        courier: true,
        assignedUser: { select: { id: true, name: true } },
      },
    });

    await this.prisma.activityLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entityType: 'Deal',
        entityId: id,
        metadata: { changes: { ...dto } },
      },
    });

    return deal;
  }

  async changeStage(id: string, dto: ChangeStageDto, userId: string) {
    const deal = await this.findOne(id);

    const newStage = await this.prisma.pipelineStage.findUnique({ where: { id: dto.stageId } });
    if (!newStage) throw new NotFoundException(`Stage ${dto.stageId} not found`);

    const isWon = newStage.name.toUpperCase() === 'WON';
    const isLost = newStage.name.toUpperCase() === 'LOST';

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.deal.update({
        where: { id },
        data: {
          stageId: dto.stageId,
          ...(isWon ? { status: 'WON', closedAt: new Date() } : {}),
          ...(isLost ? { status: 'LOST', closedAt: new Date() } : {}),
        },
        include: {
          stage: true,
          supplier: true,
          product: true,
          courier: true,
          assignedUser: { select: { id: true, name: true } },
        },
      });

      await tx.dealStageHistory.create({
        data: {
          dealId: id,
          fromStageId: deal.stageId,
          toStageId: dto.stageId,
          changedById: userId,
        },
      });

      await tx.activityLog.create({
        data: {
          userId,
          action: 'STAGE_CHANGE',
          entityType: 'Deal',
          entityId: id,
          metadata: { from: deal.stageId, to: dto.stageId, stageName: newStage.name },
        },
      });

      return updated;
    });
  }

  async getHistory(id: string) {
    await this.findOne(id);
    return this.prisma.dealStageHistory.findMany({
      where: { dealId: id },
      include: {
        fromStage: true,
        toStage: true,
        changedBy: { select: { id: true, name: true } },
      },
      orderBy: { changedAt: 'asc' },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id);
    await this.prisma.deal.delete({ where: { id } });
    await this.prisma.activityLog.create({
      data: { userId, action: 'DELETE', entityType: 'Deal', entityId: id },
    });
    return { message: 'Deal deleted successfully' };
  }
}
