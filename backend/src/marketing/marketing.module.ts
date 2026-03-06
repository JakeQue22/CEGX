import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MarketingController } from './marketing.controller';
import { MarketingService } from './marketing.service';
import { LinkedInController } from './linkedin.controller';
import { LinkedInService } from './linkedin.service';
import { LinkedInBrowserService } from './linkedin-browser.service';
import { LeadScrapingService } from './lead-scraping.service';
import { OutreachController } from './outreach.controller';
import { OutreachService } from './outreach.service';
import { MarketingProcessor } from './marketing.processor';

const MARKETING_QUEUE = 'marketing';

@Module({
  imports: [
    BullModule.registerQueue({ name: MARKETING_QUEUE }),
  ],
  controllers: [MarketingController, LinkedInController, OutreachController],
  providers: [
    MarketingService,
    LinkedInService,
    LinkedInBrowserService,
    LeadScrapingService,
    OutreachService,
    MarketingProcessor,
  ],
  exports: [MarketingService, LinkedInService, OutreachService],
})
export class MarketingModule {}
