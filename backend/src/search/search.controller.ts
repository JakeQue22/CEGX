import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Global search across deals, suppliers, products, categories' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'types', required: false, description: 'Comma-separated: deals,suppliers,products,categories' })
  search(
    @Query('q') q: string,
    @Query('types') types?: string,
  ) {
    const typeList = types
      ? (types.split(',').map((t) => t.trim()) as any[])
      : ['deals', 'suppliers', 'products', 'categories'];
    return this.searchService.search(q, typeList);
  }
}
