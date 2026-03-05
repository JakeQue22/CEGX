import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateLinkedInAccountDto,
  UpdateLinkedInAccountDto,
  SendLinkedInMessageDto,
  ConnectLinkedInDto,
} from './dto/linkedin.dto';

@Injectable()
export class LinkedInService {
  private readonly logger = new Logger(LinkedInService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('marketing') private readonly marketingQueue: Queue,
  ) {}

  // --- Account Management ---
  async createAccount(dto: CreateLinkedInAccountDto) {
    const hashedPassword = dto.password
      ? await bcrypt.hash(dto.password, 12)
      : undefined;
    return this.prisma.linkedInAccount.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        profileUrl: dto.profileUrl,
        sessionData: dto.sessionData,
      },
    });
  }

  async getAccounts() {
    return this.prisma.linkedInAccount.findMany({
      include: {
        _count: { select: { connections: true, messages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateAccount(id: string, dto: UpdateLinkedInAccountDto) {
    return this.prisma.linkedInAccount.update({
      where: { id },
      data: dto,
    });
  }

  async deleteAccount(id: string) {
    return this.prisma.linkedInAccount.delete({ where: { id } });
  }

  // --- Connections ---
  async getConnections(filters: {
    accountId?: string;
    status?: string;
    campaignId?: string;
  }) {
    const where: any = {};
    if (filters.accountId) where.accountId = filters.accountId;
    if (filters.status) where.status = filters.status;
    if (filters.campaignId) where.campaignId = filters.campaignId;

    return this.prisma.linkedInConnection.findMany({
      where,
      include: {
        account: { select: { id: true, email: true, name: true } },
        campaign: { select: { id: true, name: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async sendConnectionRequest(dto: ConnectLinkedInDto) {
    // Create the connection record
    const connection = await this.prisma.linkedInConnection.create({
      data: {
        accountId: dto.accountId,
        profileUrl: dto.profileUrl,
        name: 'Pending...', // Will be updated on sync
        status: 'PENDING',
        campaignId: dto.campaignId,
      },
    });

    // Queue the browser automation job
    await this.marketingQueue.add('linkedin-connect', {
      connectionId: connection.id,
      accountId: dto.accountId,
      profileUrl: dto.profileUrl,
      message: dto.message,
    });

    this.logger.log(`Connection request queued for ${dto.profileUrl}`);
    return connection;
  }

  async markConnectionAccepted(id: string) {
    return this.prisma.linkedInConnection.update({
      where: { id },
      data: { status: 'CONNECTED', connectedAt: new Date() },
    });
  }

  // --- Inbox / Messages ---
  async getInbox(filters: { accountId?: string; unreadOnly?: boolean }) {
    const where: any = {};
    if (filters.accountId) where.accountId = filters.accountId;

    // Get latest message per connection (thread view)
    const connections = await this.prisma.linkedInConnection.findMany({
      where: {
        ...where,
        status: 'CONNECTED',
      },
      include: {
        account: { select: { id: true, email: true, name: true } },
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { messages: { where: { isRead: false, direction: 'INBOUND' } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (filters.unreadOnly) {
      return connections.filter((c) => c._count.messages > 0);
    }
    return connections;
  }

  async getThread(connectionId: string) {
    const connection = await this.prisma.linkedInConnection.findUnique({
      where: { id: connectionId },
      include: {
        account: { select: { id: true, email: true, name: true } },
        messages: { orderBy: { sentAt: 'asc' } },
      },
    });

    if (!connection) throw new NotFoundException('Connection not found');

    // Mark inbound messages as read
    await this.prisma.linkedInMessage.updateMany({
      where: { connectionId, direction: 'INBOUND', isRead: false },
      data: { isRead: true },
    });

    return connection;
  }

  async sendMessage(dto: SendLinkedInMessageDto) {
    const connection = await this.prisma.linkedInConnection.findUnique({
      where: { id: dto.connectionId },
    });
    if (!connection) throw new NotFoundException('Connection not found');

    const message = await this.prisma.linkedInMessage.create({
      data: {
        accountId: connection.accountId,
        connectionId: dto.connectionId,
        direction: 'OUTBOUND',
        content: dto.content,
        isAiGenerated: dto.useAi || false,
        isRead: true,
      },
    });

    // Queue the actual send via browser automation
    await this.marketingQueue.add('linkedin-send-message', {
      messageId: message.id,
      connectionId: dto.connectionId,
      content: dto.content,
    });

    return message;
  }

  async markMessageRead(id: string) {
    return this.prisma.linkedInMessage.update({
      where: { id },
      data: { isRead: true },
    });
  }

  // --- Sync ---
  async syncAccount(accountId: string) {
    const account = await this.prisma.linkedInAccount.findUnique({
      where: { id: accountId },
      include: {
        _count: { select: { connections: true, messages: true } },
      },
    });
    if (!account) throw new NotFoundException('Account not found');

    // Update lastSyncAt timestamp
    await this.prisma.linkedInAccount.update({
      where: { id: accountId },
      data: { lastSyncAt: new Date() },
    });

    // Mark stale pending connections (older than 30 days) as expired in a single query
    const STALE_THRESHOLD_DAYS = 30;
    const cutoffDate = new Date(Date.now() - STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);
    const expireResult = await this.prisma.linkedInConnection.updateMany({
      where: {
        accountId,
        status: 'PENDING',
        createdAt: { lt: cutoffDate },
      },
      data: { status: 'EXPIRED' },
    });

    // Get connection counts by status
    const [activeCount, pendingCount] = await Promise.all([
      this.prisma.linkedInConnection.count({ where: { accountId, status: 'CONNECTED' } }),
      this.prisma.linkedInConnection.count({ where: { accountId, status: 'PENDING' } }),
    ]);

    this.logger.log(
      `LinkedIn sync for ${account.email}: ${account._count.connections} connections, ${account._count.messages} messages, ${expireResult.count} expired`,
    );

    return {
      message: 'Sync complete',
      accountId,
      email: account.email,
      lastSyncAt: new Date().toISOString(),
      stats: {
        connections: account._count.connections,
        messages: account._count.messages,
        activeConnections: activeCount,
        pendingConnections: pendingCount,
        expiredThisSync: expireResult.count,
      },
      note: 'Automated LinkedIn data import requires browser automation (Puppeteer/Playwright) which is not yet configured. Add connections manually via the Connect feature or import them through the API.',
    };
  }
}
