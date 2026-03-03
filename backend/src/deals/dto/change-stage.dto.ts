import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeStageDto {
  @ApiProperty({ description: 'Target pipeline stage ID' })
  @IsString()
  stageId: string;
}
