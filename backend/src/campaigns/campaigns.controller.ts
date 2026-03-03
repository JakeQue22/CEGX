import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { AddRecipientsDto } from './dto/add-recipients.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Email Campaigns')
@ApiBearerAuth()
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get('track-open/:encoded')
  @ApiOperation({ summary: 'Track email open (pixel endpoint)' })
  async trackOpen(@Param('encoded') encoded: string, @Res() res: Response) {
    const gif = await this.campaignsService.trackOpen(encoded);
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    return res.send(gif);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Create email campaign' })
  create(@Body() dto: CreateCampaignDto, @CurrentUser('id') userId: string) {
    return this.campaignsService.create(dto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'List all campaigns' })
  findAll() {
    return this.campaignsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get campaign by ID' })
  findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/stats')
  @ApiOperation({ summary: 'Get campaign statistics' })
  getStats(@Param('id') id: string) {
    return this.campaignsService.getStats(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Update campaign' })
  update(@Param('id') id: string, @Body() dto: CreateCampaignDto) {
    return this.campaignsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/recipients')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Add recipients to campaign' })
  addRecipients(@Param('id') id: string, @Body() dto: AddRecipientsDto) {
    return this.campaignsService.addRecipients(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/send')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send campaign immediately' })
  send(@Param('id') id: string) {
    return this.campaignsService.send(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/schedule')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Schedule campaign for later sending' })
  schedule(@Param('id') id: string, @Body('scheduledAt') scheduledAt: string) {
    return this.campaignsService.schedule(id, scheduledAt);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete campaign (Admin only)' })
  remove(@Param('id') id: string) {
    return this.campaignsService.remove(id);
  }
}
