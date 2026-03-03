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
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { ChangeStageDto } from './dto/change-stage.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Deals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.PROCUREMENT_OFFICER)
  @ApiOperation({ summary: 'Create a deal' })
  create(@Body() dto: CreateDealDto, @CurrentUser('id') userId: string) {
    return this.dealsService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List deals with optional filters' })
  @ApiQuery({ name: 'status', required: false, enum: ['OPEN', 'WON', 'LOST'] })
  @ApiQuery({ name: 'stageId', required: false })
  @ApiQuery({ name: 'assignedUserId', required: false })
  @ApiQuery({ name: 'supplierId', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('status') status?: string,
    @Query('stageId') stageId?: string,
    @Query('assignedUserId') assignedUserId?: string,
    @Query('supplierId') supplierId?: string,
    @Query('search') search?: string,
  ) {
    return this.dealsService.findAll({ status, stageId, assignedUserId, supplierId, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deal by ID' })
  findOne(@Param('id') id: string) {
    return this.dealsService.findOne(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get deal stage history' })
  getHistory(@Param('id') id: string) {
    return this.dealsService.getHistory(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.PROCUREMENT_OFFICER)
  @ApiOperation({ summary: 'Update deal' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDealDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.dealsService.update(id, dto, userId);
  }

  @Patch(':id/stage')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SALES_MANAGER, Role.PROCUREMENT_OFFICER)
  @ApiOperation({ summary: 'Move deal to a different stage' })
  changeStage(
    @Param('id') id: string,
    @Body() dto: ChangeStageDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.dealsService.changeStage(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete deal (Admin only)' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.dealsService.remove(id, userId);
  }
}
