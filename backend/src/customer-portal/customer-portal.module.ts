import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsModule } from '../notifications/notifications.module';
import { CustomerPortalController } from './customer-portal.controller';
import { CustomerPortalService } from './customer-portal.service';
import { CustomerJwtGuard } from './guards/customer-jwt.guard';

@Module({
  imports: [JwtModule.register({}), NotificationsModule],
  controllers: [CustomerPortalController],
  providers: [CustomerPortalService, CustomerJwtGuard],
})
export class CustomerPortalModule {}
