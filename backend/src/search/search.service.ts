import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

type SearchType = 'deals' | 'suppliers' | 'products' | 'categories';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string, types: SearchType[] = ['deals', 'suppliers', 'products', 'categories']) {
    const results: Record<string, any[]> = {};

    if (!query || query.trim().length < 2) {
      return results;
    }

    const q = query.trim();

    const searchPromises: Promise<void>[] = [];

    if (types.includes('deals')) {
      searchPromises.push(
        this.prisma.deal
          .findMany({
            where: {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { notes: { contains: q, mode: 'insensitive' } },
              ],
            },
            include: {
              stage: true,
              supplier: { select: { id: true, name: true } },
              assignedUser: { select: { id: true, name: true } },
            },
            take: 10,
          })
          .then((res) => {
            results.deals = res;
          }),
      );
    }

    if (types.includes('suppliers')) {
      searchPromises.push(
        this.prisma.supplier
          .findMany({
            where: {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { contactEmail: { contains: q, mode: 'insensitive' } },
                { country: { contains: q, mode: 'insensitive' } },
              ],
            },
            take: 10,
          })
          .then((res) => {
            results.suppliers = res;
          }),
      );
    }

    if (types.includes('products')) {
      searchPromises.push(
        this.prisma.product
          .findMany({
            where: {
              isArchived: false,
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { sku: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            },
            include: { category: true, supplier: { select: { id: true, name: true } } },
            take: 10,
          })
          .then((res) => {
            results.products = res;
          }),
      );
    }

    if (types.includes('categories')) {
      searchPromises.push(
        this.prisma.productCategory
          .findMany({
            where: {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            },
            take: 10,
          })
          .then((res) => {
            results.categories = res;
          }),
      );
    }

    await Promise.all(searchPromises);
    return results;
  }
}
