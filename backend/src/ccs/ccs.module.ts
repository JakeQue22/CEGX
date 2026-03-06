import { Module } from '@nestjs/common';
import { CcsController } from './ccs.controller';
import { CcsService } from './ccs.service';
import { CcsScraperService } from './ccs-scraper.service';

@Module({
  controllers: [CcsController],
  providers: [CcsService, CcsScraperService],
  exports: [CcsService, CcsScraperService],
})
export class CcsModule {}
