import { IsString, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TargetCriteriaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keywords?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companySize?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobTitle?: string;
}

export class CreateMarketingCampaignDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['LINKEDIN', 'EMAIL', 'COMBINED'] })
  @IsString()
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  targetCriteria?: TargetCriteriaDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aiPrompt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];
}

export class UpdateMarketingCampaignDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  targetCriteria?: TargetCriteriaDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aiPrompt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];
}
