import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { CreateCustomerOrderDto } from './create-customer-order.dto';

export class UpdateCustomerOrderDto extends PartialType(CreateCustomerOrderDto) {
  @ApiPropertyOptional({ enum: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] })
  @IsOptional()
  @IsEnum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
  status?: string;
}
