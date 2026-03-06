import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';
import { EmailService } from '../common/services/email.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  private readonly userSelect = {
    id: true,
    email: true,
    name: true,
    phone: true,
    title: true,
    department: true,
    role: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  };

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const plainPassword = dto.password || crypto.randomBytes(16).toString('hex');
    const hashed = await bcrypt.hash(plainPassword, 12);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashed,
        phone: dto.phone,
        title: dto.title,
        department: dto.department,
        role: dto.role ?? 'VIEWER',
        isActive: dto.isActive ?? true,
      },
      select: this.userSelect,
    });

    // Send emails asynchronously (don't block user creation)
    const settings = await this.prisma.companySettings.findFirst();
    const baseUrl = settings?.baseDomainUrl || process.env.FRONTEND_URL || 'http://localhost:3002';
    const companyName = settings?.companyName || 'CEGX';

    if (dto.sendSetPasswordEmail) {
      this.sendSetPasswordEmail(user.email, user.name, baseUrl, companyName).catch((err) =>
        this.logger.error(`Failed to send set-password email to ${user.email}: ${err.message}`),
      );
    }

    if (dto.sendWelcomeEmail) {
      this.sendWelcomeEmail(user.email, user.name, plainPassword, baseUrl, companyName, user.role).catch((err) =>
        this.logger.error(`Failed to send welcome email to ${user.email}: ${err.message}`),
      );
    }

    return user;
  }

  private async sendSetPasswordEmail(email: string, name: string, baseUrl: string, companyName: string) {
    const loginUrl = `${baseUrl}/auth/login`;
    await this.emailService.sendMail({
      to: email,
      subject: `${companyName} — Set Your Password`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#1a1a1a">Welcome to ${companyName}, ${name}!</h2>
          <p>An account has been created for you. Please click the link below to set your password and get started:</p>
          <p style="margin:24px 0">
            <a href="${loginUrl}" style="background-color:#2563EB;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
              Set Your Password
            </a>
          </p>
          <p style="color:#666;font-size:14px">Or visit: <a href="${loginUrl}">${loginUrl}</a></p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="color:#999;font-size:12px">This email was sent by ${companyName}.</p>
        </div>
      `,
    });
  }

  private async sendWelcomeEmail(email: string, name: string, password: string, baseUrl: string, companyName: string, role: string) {
    const loginUrl = `${baseUrl}/auth/login`;
    await this.emailService.sendMail({
      to: email,
      subject: `${companyName} — Your Account Details`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#1a1a1a">Welcome to ${companyName}, ${name}!</h2>
          <p>Your account has been created. Here are your login details:</p>
          <table style="margin:16px 0;border-collapse:collapse">
            <tr><td style="padding:8px 16px 8px 0;color:#666;font-weight:600">Login URL:</td><td style="padding:8px 0"><a href="${loginUrl}">${loginUrl}</a></td></tr>
            <tr><td style="padding:8px 16px 8px 0;color:#666;font-weight:600">Username:</td><td style="padding:8px 0">${email}</td></tr>
            <tr><td style="padding:8px 16px 8px 0;color:#666;font-weight:600">Password:</td><td style="padding:8px 0"><code style="background:#f3f4f6;padding:4px 8px;border-radius:4px">${password}</code></td></tr>
            <tr><td style="padding:8px 16px 8px 0;color:#666;font-weight:600">Role:</td><td style="padding:8px 0">${role.replace(/_/g, ' ')}</td></tr>
          </table>
          <p style="color:#dc2626;font-size:14px;font-weight:600">⚠️ Please change your password after your first login.</p>
          <p style="margin:24px 0">
            <a href="${loginUrl}" style="background-color:#2563EB;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
              Log In Now
            </a>
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="color:#999;font-size:12px">This email was sent by ${companyName}.</p>
        </div>
      `,
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: this.userSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async update(id: string, dto: UpdateUserDto, requestingUserId: string, requestingRole: string) {
    await this.findOne(id);

    // Non-admins can only update themselves
    if (requestingRole !== 'ADMIN' && requestingUserId !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // Non-admins cannot change roles
    if (requestingRole !== 'ADMIN' && dto.role) {
      throw new ForbiddenException('Only admins can change roles');
    }

    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (existing) throw new ConflictException('Email already in use');
    }

    const data: Record<string, unknown> = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 12);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: this.userSelect,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted successfully' };
  }
}
