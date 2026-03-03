import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.companySettings.findFirst();
    if (!settings) {
      settings = await this.prisma.companySettings.create({ data: {} });
    }
    return settings;
  }

  async updateSettings(dto: UpdateSettingsDto) {
    const settings = await this.getSettings();
    return this.prisma.companySettings.update({
      where: { id: settings.id },
      data: dto,
    });
  }
}
