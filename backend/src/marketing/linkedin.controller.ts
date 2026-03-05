import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { LinkedInService } from './linkedin.service';
import {
  CreateLinkedInAccountDto,
  UpdateLinkedInAccountDto,
  SendLinkedInMessageDto,
  ConnectLinkedInDto,
  ImportLinkedInConnectionsDto,
} from './dto/linkedin.dto';

@ApiTags('LinkedIn Automation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing/linkedin')
export class LinkedInController {
  constructor(private readonly linkedInService: LinkedInService) {}

  // --- Account Management ---
  @Post('accounts')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Add a LinkedIn account' })
  createAccount(@Body() dto: CreateLinkedInAccountDto) {
    return this.linkedInService.createAccount(dto);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'List LinkedIn accounts' })
  getAccounts() {
    return this.linkedInService.getAccounts();
  }

  @Put('accounts/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a LinkedIn account' })
  updateAccount(@Param('id') id: string, @Body() dto: UpdateLinkedInAccountDto) {
    return this.linkedInService.updateAccount(id, dto);
  }

  @Delete('accounts/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Remove a LinkedIn account' })
  deleteAccount(@Param('id') id: string) {
    return this.linkedInService.deleteAccount(id);
  }

  // --- Connections ---
  @Get('connections')
  @ApiOperation({ summary: 'List LinkedIn connections' })
  getConnections(
    @Query('accountId') accountId?: string,
    @Query('status') status?: string,
    @Query('campaignId') campaignId?: string,
  ) {
    return this.linkedInService.getConnections({ accountId, status, campaignId });
  }

  @Post('connect')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Send a connection request' })
  sendConnectionRequest(@Body() dto: ConnectLinkedInDto) {
    return this.linkedInService.sendConnectionRequest(dto);
  }

  @Post('connections/:id/accept')
  @ApiOperation({ summary: 'Mark connection as accepted (webhook/sync)' })
  markAccepted(@Param('id') id: string) {
    return this.linkedInService.markConnectionAccepted(id);
  }

  // --- Inbox / Messages ---
  @Get('inbox')
  @ApiOperation({ summary: 'Get LinkedIn inbox (all threads)' })
  getInbox(
    @Query('accountId') accountId?: string,
    @Query('unreadOnly') unreadOnly?: boolean,
  ) {
    return this.linkedInService.getInbox({ accountId, unreadOnly });
  }

  @Get('messages/:connectionId')
  @ApiOperation({ summary: 'Get messages for a specific connection thread' })
  getThread(@Param('connectionId') connectionId: string) {
    return this.linkedInService.getThread(connectionId);
  }

  @Post('messages')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Send a LinkedIn message' })
  sendMessage(@Body() dto: SendLinkedInMessageDto) {
    return this.linkedInService.sendMessage(dto);
  }

  @Put('messages/:id/read')
  @ApiOperation({ summary: 'Mark message as read' })
  markRead(@Param('id') id: string) {
    return this.linkedInService.markMessageRead(id);
  }

  // --- Import ---
  @Post('accounts/:accountId/import-connections')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Import LinkedIn connections from CSV data (parsed client-side)' })
  importConnections(
    @Param('accountId') accountId: string,
    @Body() dto: ImportLinkedInConnectionsDto,
  ) {
    return this.linkedInService.importConnections(accountId, dto);
  }

  // --- Sync ---
  @Post('sync/:accountId')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Trigger LinkedIn inbox sync for an account' })
  syncAccount(@Param('accountId') accountId: string) {
    return this.linkedInService.syncAccount(accountId);
  }
}
