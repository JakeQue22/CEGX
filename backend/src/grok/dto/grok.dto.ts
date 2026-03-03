import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyzeDataDto {
  @ApiProperty({ description: 'The prompt/question for data analysis' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({ description: 'Context data to analyze (JSON string or text)' })
  @IsOptional()
  @IsString()
  context?: string;
}

export class GenerateReplyDto {
  @ApiProperty({ description: 'The message to reply to' })
  @IsString()
  originalMessage: string;

  @ApiPropertyOptional({ description: 'Custom prompt/instructions for the reply' })
  @IsOptional()
  @IsString()
  customPrompt?: string;

  @ApiProperty({
    description: 'Context type: linkedin_reply, email_reply, outreach_generate',
    enum: ['linkedin_reply', 'email_reply', 'outreach_generate'],
  })
  @IsString()
  contextType: string;

  @ApiPropertyOptional({ description: 'Entity ID for tracking (message ID, email ID, etc.)' })
  @IsOptional()
  @IsString()
  entityId?: string;
}

export class GenerateOutreachDto {
  @ApiProperty({ description: 'Company name to generate outreach for' })
  @IsString()
  companyName: string;

  @ApiPropertyOptional({ description: 'Products to promote' })
  @IsOptional()
  @IsString()
  products?: string;

  @ApiPropertyOptional({ description: 'Campaign context or custom instructions' })
  @IsOptional()
  @IsString()
  campaignContext?: string;

  @ApiProperty({ description: 'Type: email_subject, email_body, linkedin_message, connection_note' })
  @IsString()
  outputType: string;
}

export class UpdateAISettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultPrompt?: string;
}
