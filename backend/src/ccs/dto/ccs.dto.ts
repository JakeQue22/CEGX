import { IsString, IsOptional, IsDateString, IsNumber, IsArray, ValidateNested, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ProxyEntryDto {
  @ApiProperty({ example: 'proxy.example.com' })
  @IsString()
  host: string;

  @ApiProperty({ example: 8080 })
  @IsInt()
  port: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  password?: string;
}

export class ConfigureProxiesDto {
  @ApiProperty({ type: [ProxyEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProxyEntryDto)
  proxies: ProxyEntryDto[];
}

export class CreateCcsFrameworkDto {
  @ApiProperty({ example: 'RM6187' })
  @IsString()
  reference: string;

  @ApiProperty({ example: 'Technology Products & Associated Services' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Technology' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ default: 'LIVE' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxValue?: number;

  @ApiPropertyOptional({ description: 'Benefits of the framework' })
  @IsOptional()
  @IsString()
  benefits?: string;

  @ApiPropertyOptional({ description: 'Products and services available' })
  @IsOptional()
  @IsString()
  productsServices?: string;

  @ApiPropertyOptional({ description: 'Regulation (e.g. PCR2015)' })
  @IsOptional()
  @IsString()
  regulation?: string;
}

export class UpdateCcsFrameworkDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxValue?: number;

  @ApiPropertyOptional({ description: 'Benefits of the framework' })
  @IsOptional()
  @IsString()
  benefits?: string;

  @ApiPropertyOptional({ description: 'Products and services available' })
  @IsOptional()
  @IsString()
  productsServices?: string;

  @ApiPropertyOptional({ description: 'Regulation (e.g. PCR2015)' })
  @IsOptional()
  @IsString()
  regulation?: string;
}

export class CreateCcsLotDto {
  @ApiProperty()
  @IsString()
  frameworkId: string;

  @ApiProperty({ example: '1' })
  @IsString()
  lotNumber: string;

  @ApiProperty({ example: 'Hardware & Software' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCcsLotDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lotNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateCcsOpportunityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  frameworkId?: string;

  @ApiProperty({ example: 'Supply of IT Equipment for NHS Trust' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buyerName?: string;

  @ApiPropertyOptional({ default: 'OPEN' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  publishedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  closingDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  noticeUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ default: 'NOT_BIDDING' })
  @IsOptional()
  @IsString()
  bidStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  bidDeadline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bidValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedUserId?: string;
}

export class UpdateCcsOpportunityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  frameworkId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buyerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  publishedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  closingDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  noticeUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bidStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  bidDeadline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bidValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedUserId?: string;
}
