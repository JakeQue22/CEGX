import { Module } from '@nestjs/common';
import { EmailListsController } from './email-lists.controller';
import { EmailListsService } from './email-lists.service';

@Module({
  controllers: [EmailListsController],
  providers: [EmailListsService],
  exports: [EmailListsService],
})
export class EmailListsModule {}
