import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService, CAMPAIGN_QUEUE } from './campaigns.service';
import { CampaignsProcessor } from './campaigns.processor';
import { EmailService } from '../common/services/email.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: CAMPAIGN_QUEUE }),
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService, CampaignsProcessor, EmailService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
