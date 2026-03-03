import { Module } from '@nestjs/common';
import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';
import { FinancialCalculationService } from '../common/services/financial-calculation.service';

@Module({
  controllers: [DealsController],
  providers: [DealsService, FinancialCalculationService],
  exports: [DealsService],
})
export class DealsModule {}
