import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { CreateCustomerOrderDto } from './create-customer-order.dto';

export class UpdateCustomerOrderDto extends PartialType(CreateCustomerOrderDto) {
  @ApiPropertyOptional({ enum: ['PENDING', 'APPROVED', 'PENDING_PAYMENT', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] })
  @IsOptional()
  @IsEnum(['PENDING', 'APPROVED', 'PENDING_PAYMENT', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
  status?: string;
}
