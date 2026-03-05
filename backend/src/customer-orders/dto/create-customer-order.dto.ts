import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateCustomerOrderDto {
  @ApiProperty({ description: 'ID of the customer placing the order' })
  @IsString()
  customerId: string;

  @ApiPropertyOptional({ description: 'ID of the product being ordered' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({ description: 'Name of the product being ordered' })
  @IsString()
  productName: string;

  @ApiProperty({ description: 'Quantity of the product', minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Delivery location for the order' })
  @IsOptional()
  @IsString()
  deliveryLocation?: string;

  @ApiPropertyOptional({ description: 'ID of the assigned courier' })
  @IsOptional()
  @IsString()
  courierId?: string;

  @ApiPropertyOptional({ description: 'Additional notes for the order' })
  @IsOptional()
  @IsString()
  notes?: string;
}
