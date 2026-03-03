import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: {
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, any>;
  }) {
    return this.prisma.activityLog.create({ data });
  }

  async getAll(filters?: { userId?: string; entityType?: string; entityId?: string }, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where: {
          ...(filters?.userId ? { userId: filters.userId } : {}),
          ...(filters?.entityType ? { entityType: filters.entityType } : {}),
          ...(filters?.entityId ? { entityId: filters.entityId } : {}),
        },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.activityLog.count({
        where: {
          ...(filters?.userId ? { userId: filters.userId } : {}),
          ...(filters?.entityType ? { entityType: filters.entityType } : {}),
          ...(filters?.entityId ? { entityId: filters.entityId } : {}),
        },
      }),
    ]);
    return { items, total, page, limit };
  }
}
