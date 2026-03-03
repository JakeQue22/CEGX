import { Module, OnModuleInit } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AutomationsService, AUTOMATIONS_QUEUE } from './automations.service';
import { AutomationsProcessor } from './automations.processor';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailService } from '../common/services/email.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: AUTOMATIONS_QUEUE }),
    NotificationsModule,
  ],
  providers: [AutomationsService, AutomationsProcessor, EmailService],
  exports: [AutomationsService],
})
export class AutomationsModule implements OnModuleInit {
  constructor(@InjectQueue(AUTOMATIONS_QUEUE) private readonly automationsQueue: Queue) {}

  async onModuleInit() {
    // Schedule recurring jobs (runs every hour)
    await this.automationsQueue.add(
      'check-follow-ups',
      {},
      { repeat: { cron: '0 * * * *' }, removeOnComplete: true },
    );

    // Check inactive deals daily at midnight
    await this.automationsQueue.add(
      'check-inactive-deals',
      {},
      { repeat: { cron: '0 0 * * *' }, removeOnComplete: true },
    );

    // Send scheduled campaigns every 5 minutes
    await this.automationsQueue.add(
      'send-scheduled-campaigns',
      {},
      { repeat: { cron: '*/5 * * * *' }, removeOnComplete: true },
    );
  }
}
