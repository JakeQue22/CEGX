import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CustomerOrdersService } from './customer-orders.service';
import { CreateCustomerOrderDto } from './dto/create-customer-order.dto';
import { UpdateCustomerOrderDto } from './dto/update-customer-order.dto';

@ApiTags('Customer Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customer-orders')
export class CustomerOrdersController {
  constructor(private readonly customerOrdersService: CustomerOrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer order' })
  create(@Body() dto: CreateCustomerOrderDto) {
    return this.customerOrdersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all customer orders' })
  @ApiQuery({ name: 'customerId', required: false, description: 'Filter by customer ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by order status' })
  findAll(
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
  ) {
    return this.customerOrdersService.findAll({ customerId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a customer order by ID' })
  findOne(@Param('id') id: string) {
    return this.customerOrdersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Update a customer order' })
  update(@Param('id') id: string, @Body() dto: UpdateCustomerOrderDto) {
    return this.customerOrdersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a customer order' })
  remove(@Param('id') id: string) {
    return this.customerOrdersService.remove(id);
  }
}
