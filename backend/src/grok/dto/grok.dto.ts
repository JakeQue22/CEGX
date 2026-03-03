import { IsString, IsOptional, IsBoolean, MaxLength, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyzeDataDto {
  @ApiProperty({ description: 'The prompt/question for data analysis' })
  @IsString()
  @MaxLength(5000)
  prompt: string;

  @ApiPropertyOptional({ description: 'Context data to analyze (JSON string or text)' })
  @IsOptional()
  @IsString()
  @MaxLength(50000)
  context?: string;
}

export class GenerateReplyDto {
  @ApiProperty({ description: 'The message to reply to' })
  @IsString()
  @MaxLength(10000)
  originalMessage: string;

  @ApiPropertyOptional({ description: 'Custom prompt/instructions for the reply' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  customPrompt?: string;

  @ApiProperty({
    description: 'Context type: linkedin_reply, email_reply, outreach_generate',
    enum: ['linkedin_reply', 'email_reply', 'outreach_generate'],
  })
  @IsIn(['linkedin_reply', 'email_reply', 'outreach_generate'])
  contextType: string;

  @ApiPropertyOptional({ description: 'Entity ID for tracking (message ID, email ID, etc.)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  entityId?: string;
}

export class GenerateOutreachDto {
  @ApiProperty({ description: 'Company name to generate outreach for' })
  @IsString()
  @MaxLength(500)
  companyName: string;

  @ApiPropertyOptional({ description: 'Products to promote' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  products?: string;

  @ApiPropertyOptional({ description: 'Campaign context or custom instructions' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  campaignContext?: string;

  @ApiProperty({ description: 'Type: email_subject, email_body, linkedin_message, connection_note' })
  @IsIn(['email_subject', 'email_body', 'linkedin_message', 'connection_note'])
  outputType: string;
}

export class UpdateAISettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  apiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  defaultPrompt?: string;
}
