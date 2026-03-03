import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateStageDto } from './dto/create-stage.dto';

@Injectable()
export class PipelineService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStageDto) {
    return this.prisma.pipelineStage.create({ data: dto });
  }

  async findAll() {
    return this.prisma.pipelineStage.findMany({
      include: { _count: { select: { deals: true } } },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string) {
    const stage = await this.prisma.pipelineStage.findUnique({
      where: { id },
      include: { _count: { select: { deals: true } } },
    });
    if (!stage) throw new NotFoundException(`Stage ${id} not found`);
    return stage;
  }

  async update(id: string, dto: Partial<CreateStageDto>) {
    await this.findOne(id);
    return this.prisma.pipelineStage.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.pipelineStage.delete({ where: { id } });
    return { message: 'Stage deleted successfully' };
  }

  async getDefaultStage() {
    return this.prisma.pipelineStage.findFirst({ where: { isDefault: true } });
  }
}
