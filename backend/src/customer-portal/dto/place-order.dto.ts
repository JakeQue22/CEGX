import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlaceOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty()
  @IsString()
  productName: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Legacy single-line delivery location' })
  @IsOptional()
  @IsString()
  deliveryLocation?: string;

  @ApiPropertyOptional({ description: 'Street address line 1' })
  @IsOptional()
  @IsString()
  deliveryStreet?: string;

  @ApiPropertyOptional({ description: 'Street address line 2' })
  @IsOptional()
  @IsString()
  deliveryStreet2?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  deliveryCity?: string;

  @ApiPropertyOptional({ description: 'County' })
  @IsOptional()
  @IsString()
  deliveryCounty?: string;

  @ApiPropertyOptional({ description: 'Postcode' })
  @IsOptional()
  @IsString()
  deliveryPostcode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courierId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
