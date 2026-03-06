import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EmailService } from '../common/services/email.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async getSettings() {
    let settings = await this.prisma.companySettings.findFirst();
    if (!settings) {
      settings = await this.prisma.companySettings.create({ data: {} });
    }
    return settings;
  }

  async updateSettings(dto: UpdateSettingsDto) {
    const settings = await this.getSettings();
    return this.prisma.companySettings.update({
      where: { id: settings.id },
      data: dto,
    });
  }

  async sendTestEmail(recipientEmail: string): Promise<{ success: boolean; message: string }> {
    const settings = await this.getSettings();

    if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
      return { success: false, message: 'SMTP settings are not fully configured. Please set SMTP host, username, and password first.' };
    }

    try {
      const companyName = settings.companyName || 'CEGX CRM';
      await this.emailService.sendMail({
        to: recipientEmail,
        subject: `${companyName} — SMTP Test Email`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1e293b;">✅ SMTP Connection Successful</h2>
            <p style="color: #475569; font-size: 14px;">
              This is a test email sent from <strong>${companyName}</strong> CRM to verify your SMTP configuration is working correctly.
            </p>
            <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 4px 0; font-size: 13px; color: #64748b;"><strong>Host:</strong> ${settings.smtpHost}</p>
              <p style="margin: 4px 0; font-size: 13px; color: #64748b;"><strong>Port:</strong> ${settings.smtpPort ?? 587}</p>
              <p style="margin: 4px 0; font-size: 13px; color: #64748b;"><strong>SSL/TLS:</strong> ${settings.smtpSecure ? 'Yes' : 'No'}</p>
              <p style="margin: 4px 0; font-size: 13px; color: #64748b;"><strong>Sender:</strong> ${settings.smtpSenderName ?? 'Not set'}</p>
            </div>
            <p style="color: #94a3b8; font-size: 12px;">
              Sent at ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}
            </p>
          </div>
        `,
        text: `SMTP Connection Successful — Test email from ${companyName} CRM. Host: ${settings.smtpHost}, Port: ${settings.smtpPort ?? 587}`,
      });

      return { success: true, message: `Test email sent successfully to ${recipientEmail}` };
    } catch (err) {
      return { success: false, message: `Failed to send test email: ${err.message}` };
    }
  }
}
