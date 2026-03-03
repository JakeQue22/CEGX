import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateFollowUpDto } from './dto/create-followup.dto';

@Injectable()
export class FollowUpsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFollowUpDto, userId: string) {
    return this.prisma.followUp.create({
      data: {
        dealId: dto.dealId,
        supplierId: dto.supplierId,
        assignedUserId: dto.assignedUserId ?? userId,
        dueAt: new Date(dto.dueAt),
        note: dto.note,
        isCompleted: dto.isCompleted ?? false,
      },
      include: {
        deal: { select: { id: true, title: true } },
        supplier: { select: { id: true, name: true } },
        assignedUser: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(userId: string, role: string, filters?: { isCompleted?: boolean; dealId?: string }) {
    const isAdmin = role === 'ADMIN' || role === 'SALES_MANAGER';

    return this.prisma.followUp.findMany({
      where: {
        ...(isAdmin ? {} : { assignedUserId: userId }),
        ...(filters?.isCompleted !== undefined ? { isCompleted: filters.isCompleted } : {}),
        ...(filters?.dealId ? { dealId: filters.dealId } : {}),
      },
      include: {
        deal: { select: { id: true, title: true } },
        supplier: { select: { id: true, name: true } },
        assignedUser: { select: { id: true, name: true } },
      },
      orderBy: { dueAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const followUp = await this.prisma.followUp.findUnique({
      where: { id },
      include: {
        deal: { select: { id: true, title: true } },
        supplier: { select: { id: true, name: true } },
        assignedUser: { select: { id: true, name: true } },
      },
    });
    if (!followUp) throw new NotFoundException(`FollowUp ${id} not found`);
    return followUp;
  }

  async update(id: string, dto: Partial<CreateFollowUpDto>) {
    await this.findOne(id);
    return this.prisma.followUp.update({
      where: { id },
      data: {
        ...dto,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
      },
      include: {
        deal: { select: { id: true, title: true } },
        assignedUser: { select: { id: true, name: true } },
      },
    });
  }

  async complete(id: string) {
    await this.findOne(id);
    return this.prisma.followUp.update({
      where: { id },
      data: { isCompleted: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.followUp.delete({ where: { id } });
    return { message: 'Follow-up deleted successfully' };
  }

  async getOverdue() {
    return this.prisma.followUp.findMany({
      where: { isCompleted: false, dueAt: { lt: new Date() } },
      include: {
        deal: { select: { id: true, title: true } },
        assignedUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: { dueAt: 'asc' },
    });
  }
}
