import { PartialType } from '@nestjs/swagger';
import { CreateDealDto } from './create-deal.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDealDto extends PartialType(CreateDealDto) {
  @ApiPropertyOptional({ enum: ['OPEN', 'WON', 'LOST'] })
  @IsOptional()
  @IsEnum(['OPEN', 'WON', 'LOST'])
  status?: string;
}
