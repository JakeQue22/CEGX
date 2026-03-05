import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ description: 'Base domain URL for the CRM, e.g. https://cegx.quantumonline.co.uk' })
  @IsOptional()
  @IsString()
  baseDomainUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Company address for invoices' })
  @IsOptional()
  @IsString()
  companyAddress?: string;

  @ApiPropertyOptional({ description: 'Company phone number' })
  @IsOptional()
  @IsString()
  companyPhone?: string;

  @ApiPropertyOptional({ description: 'Company email address' })
  @IsOptional()
  @IsString()
  companyEmail?: string;

  @ApiPropertyOptional({ description: 'Company website' })
  @IsOptional()
  @IsString()
  companyWebsite?: string;

  @ApiPropertyOptional({ description: 'VAT registration number' })
  @IsOptional()
  @IsString()
  vatNumber?: string;

  @ApiPropertyOptional({ description: 'Company registration number' })
  @IsOptional()
  @IsString()
  companyRegNumber?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  defaultVatPercent?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  defaultAdPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  smtpSenderName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  smtpHost?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  smtpPort?: number;

  @ApiPropertyOptional({ description: 'Use SSL/TLS for SMTP connection' })
  @IsOptional()
  @IsBoolean()
  smtpSecure?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  smtpUser?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  smtpPass?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyOnDealCreated?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyOnDealWon?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyOnDealLost?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyOnFollowUpDue?: boolean;

  // Payment / Bank Details
  @ApiPropertyOptional({ description: 'Bank account holder name' })
  @IsOptional()
  @IsString()
  bankAccountName?: string;

  @ApiPropertyOptional({ description: 'Bank sort code (e.g. 12-34-56)' })
  @IsOptional()
  @IsString()
  bankSortCode?: string;

  @ApiPropertyOptional({ description: 'Bank account number' })
  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @ApiPropertyOptional({ description: 'IBAN for international transfers' })
  @IsOptional()
  @IsString()
  bankIban?: string;

  // Stripe Integration
  @ApiPropertyOptional({ description: 'Stripe test publishable key' })
  @IsOptional()
  @IsString()
  stripeTestPublicKey?: string;

  @ApiPropertyOptional({ description: 'Stripe test secret key' })
  @IsOptional()
  @IsString()
  stripeTestSecretKey?: string;

  @ApiPropertyOptional({ description: 'Stripe live publishable key' })
  @IsOptional()
  @IsString()
  stripeLivePublicKey?: string;

  @ApiPropertyOptional({ description: 'Stripe live secret key' })
  @IsOptional()
  @IsString()
  stripeLiveSecretKey?: string;

  @ApiPropertyOptional({ description: 'Stripe mode: "test" or "live"' })
  @IsOptional()
  @IsString()
  stripeMode?: string;
}
