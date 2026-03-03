import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BulkPricingDto {
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  minQuantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  bulkCostPrice: number;
}

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  sku: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  baseCostPrice: number;

  @ApiPropertyOptional({ default: 20, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  vatPercent?: number;

  @ApiPropertyOptional({ default: 0, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  adPercent?: number;

  @ApiPropertyOptional({ type: [BulkPricingDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkPricingDto)
  bulkPricings?: BulkPricingDto[];
}
