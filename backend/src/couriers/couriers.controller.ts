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
import { CouriersService } from './couriers.service';
import { CreateCourierDto } from './dto/create-courier.dto';
import { UpdateCourierDto } from './dto/update-courier.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Couriers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('couriers')
export class CouriersController {
  constructor(private readonly couriersService: CouriersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.PROCUREMENT_OFFICER)
  @ApiOperation({ summary: 'Create a courier' })
  create(@Body() dto: CreateCourierDto) {
    return this.couriersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all couriers' })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query('search') search?: string) {
    return this.couriersService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get courier by ID' })
  findOne(@Param('id') id: string) {
    return this.couriersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.PROCUREMENT_OFFICER)
  @ApiOperation({ summary: 'Update a courier' })
  update(@Param('id') id: string, @Body() dto: UpdateCourierDto) {
    return this.couriersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a courier (Admin only)' })
  remove(@Param('id') id: string) {
    return this.couriersService.remove(id);
  }

  // --- Pricing ---
  @Post(':id/pricings')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.PROCUREMENT_OFFICER)
  @ApiOperation({ summary: 'Add pricing to a courier' })
  addPricing(@Param('id') id: string, @Body() body: { unitType: string; label: string; minQuantity?: number; maxQuantity?: number; price: number; notes?: string }) {
    return this.couriersService.addPricing(id, body);
  }

  @Patch('pricings/:pricingId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.PROCUREMENT_OFFICER)
  @ApiOperation({ summary: 'Update a courier pricing' })
  updatePricing(@Param('pricingId') id: string, @Body() body: { unitType?: string; label?: string; minQuantity?: number; maxQuantity?: number; price?: number; notes?: string }) {
    return this.couriersService.updatePricing(id, body);
  }

  @Delete('pricings/:pricingId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a courier pricing' })
  removePricing(@Param('pricingId') id: string) {
    return this.couriersService.removePricing(id);
  }
}
