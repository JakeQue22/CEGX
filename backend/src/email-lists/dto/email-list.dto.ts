import { IsString, IsArray, IsOptional, ValidateNested, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmailListDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Array of column names from the CSV' })
  @IsArray()
  @IsString({ each: true })
  columns: string[];
}

export class EmailListEntryDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Full row data as key-value pairs' })
  @IsOptional()
  data?: Record<string, string>;
}

export class ImportEmailListDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Array of column names from the CSV' })
  @IsArray()
  @IsString({ each: true })
  columns: string[];

  @ApiProperty({ description: 'Column name to use as the email field' })
  @IsString()
  emailColumn: string;

  @ApiPropertyOptional({ description: 'Column name to use as the name field' })
  @IsOptional()
  @IsString()
  nameColumn?: string;

  @ApiProperty({ description: 'Array of row data objects' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  rows: Record<string, string>[];
}
