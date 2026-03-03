import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { FinancialCalculationService } from '../common/services/financial-calculation.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, FinancialCalculationService],
  exports: [ProductsService],
})
export class ProductsModule {}
