import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getTransporter(): Promise<nodemailer.Transporter> {
    const settings = await this.prisma.companySettings.findFirst();

    if (settings?.smtpHost && settings?.smtpUser && settings?.smtpPass) {
      return nodemailer.createTransport({
        host: settings.smtpHost,
        port: settings.smtpPort ?? 587,
        secure: (settings.smtpPort ?? 587) === 465,
        auth: {
          user: settings.smtpUser,
          pass: settings.smtpPass,
        },
      });
    }

    // Fallback to env-based SMTP
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    try {
      const transporter = await this.getTransporter();
      const settings = await this.prisma.companySettings.findFirst();

      const from = settings?.emailSenderName
        ? `"${settings.emailSenderName}" <${process.env.SMTP_USER}>`
        : process.env.SMTP_USER;

      await transporter.sendMail({
        from,
        to: Array.isArray(options.to) ? options.to.join(',') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      this.logger.log(`Email sent to ${options.to} – subject: ${options.subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email: ${err.message}`, err.stack);
      throw err;
    }
  }

  buildTrackingPixelHtml(campaignId: string, recipientEmail: string): string {
    const baseUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const encoded = Buffer.from(`${campaignId}:${recipientEmail}`).toString('base64');
    return `<img src="${baseUrl}/api/campaigns/track-open/${encoded}" width="1" height="1" style="display:none" alt="" />`;
  }
}
