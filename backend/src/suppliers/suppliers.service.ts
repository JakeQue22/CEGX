import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSupplierDto) {
    return this.prisma.supplier.create({ data: dto });
  }

  async findAll(search?: string) {
    return this.prisma.supplier.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { contactEmail: { contains: search, mode: 'insensitive' } },
              { country: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: { _count: { select: { products: true, deals: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true, deals: true } },
      },
    });
    if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);
    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto) {
    await this.findOne(id);
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.supplier.delete({ where: { id } });
    return { message: 'Supplier deleted successfully' };
  }

  async getSupplierProducts(id: string) {
    await this.findOne(id);
    return this.prisma.product.findMany({
      where: { supplierId: id, isArchived: false },
      include: { category: true, bulkPricings: true },
    });
  }

  async getSupplierDeals(id: string) {
    await this.findOne(id);
    return this.prisma.deal.findMany({
      where: { supplierId: id },
      include: { stage: true, assignedUser: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSupplierProfitability(id: string) {
    await this.findOne(id);
    const deals = await this.prisma.deal.findMany({
      where: { supplierId: id, status: 'WON' },
      select: {
        revenue: true,
        cost: true,
        adSpend: true,
        vat: true,
        grossProfit: true,
        profitMarginPercent: true,
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
        ? deals.reduce((acc, d) => acc + Number(d.profitMarginPercent), 0) / deals.length
        : 0;

    return {
      wonDealsCount: deals.length,
      ...totals,
      avgProfitMarginPercent: parseFloat(avgMargin.toFixed(2)),
    };
  }
}
