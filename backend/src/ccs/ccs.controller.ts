import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CcsService } from './ccs.service';
import { CcsScraperService } from './ccs-scraper.service';
import {
  CreateCcsFrameworkDto,
  UpdateCcsFrameworkDto,
  CreateCcsLotDto,
  UpdateCcsLotDto,
  CreateCcsOpportunityDto,
  UpdateCcsOpportunityDto,
  ConfigureProxiesDto,
} from './dto/ccs.dto';

@ApiTags('CCS Frameworks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ccs')
export class CcsController {
  constructor(
    private readonly ccsService: CcsService,
    private readonly scraperService: CcsScraperService,
  ) {}

  // --- Stats ---
  @Get('stats')
  @ApiOperation({ summary: 'Get CCS framework and opportunity statistics' })
  getStats() {
    return this.ccsService.getFrameworkStats();
  }

  @Get('categories')
  @ApiOperation({ summary: 'List framework categories' })
  getCategories() {
    return this.ccsService.getFrameworkCategories();
  }

  // --- Scraping ---
  @Post('scrape/sync')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Scrape CCS website and sync frameworks and opportunities into database' })
  async syncFromCcs() {
    const frameworkResult = await this.scraperService.syncFrameworks();
    const opportunityResult = await this.scraperService.scrapeOpportunities();
    return {
      frameworks: frameworkResult,
      opportunities: opportunityResult,
    };
  }

  @Post('scrape/opportunities')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Scrape CCS opportunities from Contracts Finder' })
  scrapeOpportunities() {
    return this.scraperService.scrapeOpportunities();
  }

  @Post('scrape/preview')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Preview what would be scraped from CCS without saving' })
  previewScrape() {
    return this.scraperService.scrapeFrameworksList();
  }

  @Post('scrape/framework/:reference')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Scrape detail for a specific CCS framework by reference' })
  scrapeFrameworkDetail(@Param('reference') reference: string) {
    return this.scraperService.scrapeFrameworkDetail(reference);
  }

  @Post('scrape/proxies')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Configure rotating proxies for CCS scraping' })
  configureProxies(@Body() dto: ConfigureProxiesDto) {
    this.scraperService.setProxies(
      dto.proxies.map((p) => ({
        host: p.host,
        port: p.port,
        auth: p.username && p.password ? { username: p.username, password: p.password } : undefined,
      })),
    );
    return { message: `Configured ${dto.proxies.length} rotating proxies` };
  }

  // --- Frameworks ---
  @Post('frameworks')
  @Roles(Role.ADMIN, Role.PROCUREMENT_OFFICER)
  @ApiOperation({ summary: 'Create a CCS framework' })
  createFramework(@Body() dto: CreateCcsFrameworkDto) {
    return this.ccsService.createFramework(dto);
  }

  @Get('frameworks')
  @ApiOperation({ summary: 'List CCS frameworks' })
  getFrameworks(
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.ccsService.getFrameworks({ category, status, search });
  }

  @Get('frameworks/:id')
  @ApiOperation({ summary: 'Get CCS framework detail' })
  getFramework(@Param('id') id: string) {
    return this.ccsService.getFrameworkById(id);
  }

  @Patch('frameworks/:id')
  @Roles(Role.ADMIN, Role.PROCUREMENT_OFFICER)
  @ApiOperation({ summary: 'Update a CCS framework' })
  updateFramework(@Param('id') id: string, @Body() dto: UpdateCcsFrameworkDto) {
    return this.ccsService.updateFramework(id, dto);
  }

  @Delete('frameworks/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a CCS framework' })
  deleteFramework(@Param('id') id: string) {
    return this.ccsService.deleteFramework(id);
  }

  // --- Lots ---
  @Post('lots')
  @Roles(Role.ADMIN, Role.PROCUREMENT_OFFICER)
  @ApiOperation({ summary: 'Create a framework lot' })
  createLot(@Body() dto: CreateCcsLotDto) {
    return this.ccsService.createLot(dto);
  }

  @Patch('lots/:id')
  @Roles(Role.ADMIN, Role.PROCUREMENT_OFFICER)
  @ApiOperation({ summary: 'Update a framework lot' })
  updateLot(@Param('id') id: string, @Body() dto: UpdateCcsLotDto) {
    return this.ccsService.updateLot(id, dto);
  }

  @Delete('lots/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a framework lot' })
  deleteLot(@Param('id') id: string) {
    return this.ccsService.deleteLot(id);
  }

  // --- Opportunities ---
  @Post('opportunities')
  @Roles(Role.ADMIN, Role.PROCUREMENT_OFFICER, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Create a CCS opportunity' })
  createOpportunity(@Body() dto: CreateCcsOpportunityDto) {
    return this.ccsService.createOpportunity(dto);
  }

  @Get('opportunities')
  @ApiOperation({ summary: 'List CCS opportunities' })
  getOpportunities(
    @Query('frameworkId') frameworkId?: string,
    @Query('status') status?: string,
    @Query('bidStatus') bidStatus?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.ccsService.getOpportunities({ frameworkId, status, bidStatus, category, search });
  }

  @Get('opportunities/:id')
  @ApiOperation({ summary: 'Get CCS opportunity detail' })
  getOpportunity(@Param('id') id: string) {
    return this.ccsService.getOpportunityById(id);
  }

  @Patch('opportunities/:id')
  @Roles(Role.ADMIN, Role.PROCUREMENT_OFFICER, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Update a CCS opportunity' })
  updateOpportunity(@Param('id') id: string, @Body() dto: UpdateCcsOpportunityDto) {
    return this.ccsService.updateOpportunity(id, dto);
  }

  @Delete('opportunities/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a CCS opportunity' })
  deleteOpportunity(@Param('id') id: string) {
    return this.ccsService.deleteOpportunity(id);
  }
}
