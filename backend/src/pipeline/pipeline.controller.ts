import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PipelineService } from './pipeline.service';
import { CreateStageDto } from './dto/create-stage.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Pipeline Stages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pipeline')
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create pipeline stage (Admin only)' })
  create(@Body() dto: CreateStageDto) {
    return this.pipelineService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all pipeline stages' })
  findAll() {
    return this.pipelineService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get stage by ID' })
  findOne(@Param('id') id: string) {
    return this.pipelineService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update pipeline stage (Admin only)' })
  update(@Param('id') id: string, @Body() dto: CreateStageDto) {
    return this.pipelineService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete pipeline stage (Admin only)' })
  remove(@Param('id') id: string) {
    return this.pipelineService.remove(id);
  }
}
