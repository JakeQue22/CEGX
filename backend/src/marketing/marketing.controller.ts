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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { MarketingService } from './marketing.service';
import {
  CreateMarketingCampaignDto,
  UpdateMarketingCampaignDto,
} from './dto/create-campaign.dto';

@ApiTags('Marketing Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing/campaigns')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Create a marketing campaign' })
  create(
    @Body() dto: CreateMarketingCampaignDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.marketingService.createCampaign(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all marketing campaigns' })
  findAll(
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.marketingService.findAllCampaigns({ status, type });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get marketing campaigns overview stats' })
  getStats() {
    return this.marketingService.getCampaignStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign details' })
  findOne(@Param('id') id: string) {
    return this.marketingService.findCampaignById(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Update a marketing campaign' })
  update(@Param('id') id: string, @Body() dto: UpdateMarketingCampaignDto) {
    return this.marketingService.updateCampaign(id, dto);
  }

  @Post(':id/start')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Start a marketing campaign' })
  start(@Param('id') id: string) {
    return this.marketingService.startCampaign(id);
  }

  @Post(':id/pause')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Pause a marketing campaign' })
  pause(@Param('id') id: string) {
    return this.marketingService.pauseCampaign(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a marketing campaign' })
  remove(@Param('id') id: string) {
    return this.marketingService.deleteCampaign(id);
  }
}
