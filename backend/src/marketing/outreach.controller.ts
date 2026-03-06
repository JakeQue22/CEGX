import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
import { OutreachService } from './outreach.service';
import {
  CreateLeadDto,
  UpdateLeadDto,
  CreateOutreachEmailDto,
  BulkOutreachDto,
} from './dto/outreach.dto';

@ApiTags('Marketing Outreach')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing/outreach')
export class OutreachController {
  constructor(private readonly outreachService: OutreachService) {}

  // --- Lead Management ---
  @Post('leads')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Create a lead' })
  createLead(@Body() dto: CreateLeadDto) {
    return this.outreachService.createLead(dto);
  }

  @Get('leads')
  @ApiOperation({ summary: 'List leads' })
  getLeads(
    @Query('campaignId') campaignId?: string,
    @Query('status') status?: string,
  ) {
    return this.outreachService.getLeads({ campaignId, status });
  }

  @Get('leads/:id')
  @ApiOperation({ summary: 'Get lead detail' })
  getLead(@Param('id') id: string) {
    return this.outreachService.getLeadById(id);
  }

  @Put('leads/:id')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Update a lead' })
  updateLead(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.outreachService.updateLead(id, dto);
  }

  @Patch('leads/:id/stage')
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.PROCUREMENT_OFFICER)
  @ApiOperation({ summary: 'Move a lead to a different pipeline stage' })
  moveLeadStage(
    @Param('id') id: string,
    @Body() body: { stageId: string },
  ) {
    return this.outreachService.updateLead(id, { pipelineStageId: body.stageId });
  }

  @Delete('leads/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a lead' })
  deleteLead(@Param('id') id: string) {
    return this.outreachService.deleteLead(id);
  }

  // --- Outreach Emails ---
  @Post('emails')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Create and send an outreach email' })
  createEmail(@Body() dto: CreateOutreachEmailDto) {
    return this.outreachService.createOutreachEmail(dto);
  }

  @Post('emails/bulk')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Send bulk outreach emails to campaign leads' })
  bulkSend(@Body() dto: BulkOutreachDto) {
    return this.outreachService.sendBulkOutreach(dto);
  }

  @Get('emails')
  @ApiOperation({ summary: 'List outreach emails' })
  getEmails(
    @Query('campaignId') campaignId?: string,
    @Query('status') status?: string,
  ) {
    return this.outreachService.getEmails({ campaignId, status });
  }

  @Get('emails/:id')
  @ApiOperation({ summary: 'Get outreach email detail' })
  getEmail(@Param('id') id: string) {
    return this.outreachService.getEmailById(id);
  }

  // --- Scraping ---
  @Post('scrape')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Start scraping procurement companies for a campaign' })
  scrapeLeads(@Body() body: { campaignId: string; query?: string }) {
    return this.outreachService.scrapeLeads(body.campaignId, body.query);
  }
}
