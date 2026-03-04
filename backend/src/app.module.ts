import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SettingsModule } from './settings/settings.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { PipelineModule } from './pipeline/pipeline.module';
import { DealsModule } from './deals/deals.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { FollowUpsModule } from './followups/followups.module';
import { ActivityModule } from './activity/activity.module';
import { SearchModule } from './search/search.module';
import { AutomationsModule } from './automations/automations.module';
import { HealthModule } from './health/health.module';
import { MarketingModule } from './marketing/marketing.module';
import { GrokModule } from './grok/grok.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6380),
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    SettingsModule,
    SuppliersModule,
    ProductsModule,
    CategoriesModule,
    PipelineModule,
    DealsModule,
    NotificationsModule,
    CampaignsModule,
    AnalyticsModule,
    FollowUpsModule,
    ActivityModule,
    SearchModule,
    AutomationsModule,
    HealthModule,
    MarketingModule,
    GrokModule,
  ],
})
export class AppModule {}
