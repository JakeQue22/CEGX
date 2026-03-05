import { Module } from '@nestjs/common';
import { CcsController } from './ccs.controller';
import { CcsService } from './ccs.service';

@Module({
  controllers: [CcsController],
  providers: [CcsService],
  exports: [CcsService],
})
export class CcsModule {}
