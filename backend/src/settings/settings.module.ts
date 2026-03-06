import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { EmailService } from '../common/services/email.service';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService, EmailService],
  exports: [SettingsService],
})
export class SettingsModule {}
