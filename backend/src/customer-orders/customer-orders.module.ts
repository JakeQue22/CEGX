import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailService } from '../common/services/email.service';
import { CustomerOrdersController } from './customer-orders.controller';
import { CustomerOrdersService } from './customer-orders.service';

@Module({
  imports: [NotificationsModule],
  controllers: [CustomerOrdersController],
  providers: [CustomerOrdersService, EmailService],
})
export class CustomerOrdersModule {}
