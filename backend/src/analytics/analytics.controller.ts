import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard summary metrics' })
  getDashboard() {
    return this.analyticsService.getDashboard();
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue analytics (GBP)' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getRevenue(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getRevenue(from, to);
  }

  @Get('profit')
  @ApiOperation({ summary: 'Get profit analytics (GBP)' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getProfit(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getProfit(from, to);
  }

  @Get('ad-spend')
  @ApiOperation({ summary: 'Get advertising spend analytics (GBP)' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getAdSpend(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getAdSpend(from, to);
  }

  @Get('margin-by-supplier')
  @ApiOperation({ summary: 'Get profit margin breakdown by supplier' })
  getMarginBySupplier() {
    return this.analyticsService.getMarginBySupplier();
  }

  @Get('margin-by-product')
  @ApiOperation({ summary: 'Get profit margin breakdown by product' })
  getMarginByProduct() {
    return this.analyticsService.getMarginByProduct();
  }

  @Get('campaign-roi')
  @ApiOperation({ summary: 'Get email campaign ROI metrics' })
  getCampaignRoi() {
    return this.analyticsService.getCampaignRoi();
  }

  @Get('vat-liability')
  @ApiOperation({ summary: 'Get VAT liability report (GBP)' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getVatLiability(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getVatLiability(from, to);
  }
}
