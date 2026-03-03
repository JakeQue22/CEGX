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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.PROCUREMENT_OFFICER)
  @ApiOperation({ summary: 'Create product' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List products' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'supplierId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  findAll(
    @Query('search') search?: string,
    @Query('supplierId') supplierId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.productsService.findAll(search, supplierId, categoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get(':id/profit-preview')
  @ApiOperation({ summary: 'Preview deal financials for a product' })
  @ApiQuery({ name: 'quantity', required: true })
  @ApiQuery({ name: 'salePrice', required: true })
  profitPreview(
    @Param('id') id: string,
    @Query('quantity') quantity: number,
    @Query('salePrice') salePrice: number,
  ) {
    return this.productsService.profitPreview(id, Number(quantity), Number(salePrice));
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.PROCUREMENT_OFFICER)
  @ApiOperation({ summary: 'Update product' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Post(':id/duplicate')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.PROCUREMENT_OFFICER)
  @ApiOperation({ summary: 'Duplicate a product' })
  duplicate(@Param('id') id: string) {
    return this.productsService.duplicate(id);
  }

  @Patch(':id/archive')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.PROCUREMENT_OFFICER)
  @ApiOperation({ summary: 'Archive a product' })
  archive(@Param('id') id: string) {
    return this.productsService.archive(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete product (Admin only)' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
