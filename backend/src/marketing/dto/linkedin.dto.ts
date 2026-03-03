import { IsString, IsOptional, IsEmail, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLinkedInAccountDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  profileUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  sessionData?: any;
}

export class UpdateLinkedInAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  profileUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  sessionData?: any;
}

export class SendLinkedInMessageDto {
  @ApiProperty()
  @IsString()
  connectionId: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  useAi?: boolean;
}

export class ConnectLinkedInDto {
  @ApiProperty()
  @IsString()
  accountId: string;

  @ApiProperty()
  @IsString()
  profileUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;
}
