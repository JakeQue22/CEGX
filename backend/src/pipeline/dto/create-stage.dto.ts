import { IsString, IsInt, IsBoolean, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStageDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  order: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ default: '#6B7280' })
  @IsOptional()
  @IsString()
  color?: string;
}
