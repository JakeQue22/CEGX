import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateEmailListDto, ImportEmailListDto } from './dto/email-list.dto';

@Injectable()
export class EmailListsService {
  private readonly logger = new Logger(EmailListsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.emailList.findMany({
      include: { _count: { select: { entries: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const list = await this.prisma.emailList.findUnique({
      where: { id },
      include: {
        entries: { orderBy: { createdAt: 'asc' } },
        _count: { select: { entries: true } },
      },
    });
    if (!list) throw new NotFoundException(`Email list ${id} not found`);
    return list;
  }

  async create(dto: CreateEmailListDto) {
    return this.prisma.emailList.create({
      data: {
        name: dto.name,
        columns: dto.columns,
      },
    });
  }

  async import(dto: ImportEmailListDto) {
    if (!dto.rows.length) {
      throw new BadRequestException('No rows provided');
    }

    // Validate that the email column exists in the data
    const firstRow = dto.rows[0];
    if (!firstRow[dto.emailColumn]) {
      throw new BadRequestException(`Email column "${dto.emailColumn}" not found in row data`);
    }

    // Create the list
    const list = await this.prisma.emailList.create({
      data: {
        name: dto.name,
        columns: dto.columns,
      },
    });

    // Batch insert entries
    const entries = dto.rows
      .filter((row) => row[dto.emailColumn]?.trim())
      .map((row) => ({
        listId: list.id,
        email: row[dto.emailColumn].trim(),
        name: dto.nameColumn ? row[dto.nameColumn]?.trim() || null : null,
        data: row,
      }));

    let created = 0;
    const batchSize = 100;
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      const result = await this.prisma.emailListEntry.createMany({ data: batch });
      created += result.count;
    }

    this.logger.log(`Imported ${created} entries into email list "${dto.name}"`);
    return {
      id: list.id,
      name: list.name,
      columns: list.columns,
      imported: created,
      total: dto.rows.length,
    };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.emailList.delete({ where: { id } });
    return { message: 'Email list deleted successfully' };
  }

  async addToCampaign(listId: string, campaignId: string) {
    const list = await this.prisma.emailList.findUnique({
      where: { id: listId },
      include: { entries: true },
    });
    if (!list) throw new NotFoundException(`Email list ${listId} not found`);

    const campaign = await this.prisma.emailCampaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) throw new NotFoundException(`Campaign ${campaignId} not found`);

    let added = 0;
    for (const entry of list.entries) {
      try {
        await this.prisma.campaignRecipient.upsert({
          where: { campaignId_email: { campaignId, email: entry.email } },
          create: { campaignId, email: entry.email, name: entry.name },
          update: { name: entry.name },
        });
        added++;
      } catch (err) {
        this.logger.warn(`Failed to add ${entry.email} to campaign: ${err.message}`);
      }
    }

    return { added, total: list.entries.length };
  }
}
