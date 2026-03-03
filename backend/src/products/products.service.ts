import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { FinancialCalculationService } from '../common/services/financial-calculation.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financialCalc: FinancialCalculationService,
  ) {}

  async create(dto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
    if (existing) throw new ConflictException(`SKU '${dto.sku}' already exists`);

    const { bulkPricings, ...productData } = dto;

    return this.prisma.product.create({
      data: {
        ...productData,
        bulkPricings: bulkPricings
          ? { create: bulkPricings }
          : undefined,
      },
      include: { category: true, supplier: true, bulkPricings: true },
    });
  }

  async findAll(search?: string, supplierId?: string, categoryId?: string) {
    return this.prisma.product.findMany({
      where: {
        isArchived: false,
        ...(supplierId ? { supplierId } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { category: true, supplier: true, bulkPricings: { orderBy: { minQuantity: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, supplier: true, bulkPricings: { orderBy: { minQuantity: 'asc' } } },
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.findOne(id);

    if (dto.sku && dto.sku !== product.sku) {
      const existing = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
      if (existing) throw new ConflictException(`SKU '${dto.sku}' already exists`);
    }

    const { bulkPricings, ...productData } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (bulkPricings !== undefined) {
        await tx.bulkPricing.deleteMany({ where: { productId: id } });
      }

      return tx.product.update({
        where: { id },
        data: {
          ...productData,
          ...(bulkPricings ? { bulkPricings: { create: bulkPricings } } : {}),
        },
        include: { category: true, supplier: true, bulkPricings: true },
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.product.delete({ where: { id } });
    return { message: 'Product deleted successfully' };
  }

  async archive(id: string) {
    await this.findOne(id);
    return this.prisma.product.update({ where: { id }, data: { isArchived: true } });
  }

  async duplicate(id: string) {
    const product = await this.findOne(id);
    const newSku = `${product.sku}-COPY-${Date.now()}`;

    return this.prisma.product.create({
      data: {
        sku: newSku,
        name: `${product.name} (Copy)`,
        description: product.description,
        categoryId: product.categoryId,
        supplierId: product.supplierId,
        baseCostPrice: product.baseCostPrice,
        vatPercent: product.vatPercent,
        adPercent: product.adPercent,
        bulkPricings: {
          create: product.bulkPricings.map((bp) => ({
            minQuantity: bp.minQuantity,
            bulkCostPrice: bp.bulkCostPrice,
          })),
        },
      },
      include: { category: true, supplier: true, bulkPricings: true },
    });
  }

  async profitPreview(id: string, quantity: number, salePrice: number) {
    const product = await this.findOne(id);

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
      productId: id,
      quantity,
      salePrice,
      effectiveCostPrice: effectiveCost,
      ...financials,
    };
  }
}
