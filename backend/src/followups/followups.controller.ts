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
import { FollowUpsService } from './followups.service';
import { CreateFollowUpDto } from './dto/create-followup.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Follow-ups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('followups')
export class FollowUpsController {
  constructor(private readonly followUpsService: FollowUpsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a follow-up' })
  create(@Body() dto: CreateFollowUpDto, @CurrentUser('id') userId: string) {
    return this.followUpsService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List follow-ups' })
  @ApiQuery({ name: 'isCompleted', required: false, type: Boolean })
  @ApiQuery({ name: 'dealId', required: false })
  findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Query('isCompleted') isCompleted?: string,
    @Query('dealId') dealId?: string,
  ) {
    const filter = {
      isCompleted: isCompleted !== undefined ? isCompleted === 'true' : undefined,
      dealId,
    };
    return this.followUpsService.findAll(userId, role, filter);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue follow-ups' })
  getOverdue() {
    return this.followUpsService.getOverdue();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get follow-up by ID' })
  findOne(@Param('id') id: string) {
    return this.followUpsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update follow-up' })
  update(@Param('id') id: string, @Body() dto: CreateFollowUpDto) {
    return this.followUpsService.update(id, dto);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark follow-up as completed' })
  complete(@Param('id') id: string) {
    return this.followUpsService.complete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete follow-up' })
  remove(@Param('id') id: string) {
    return this.followUpsService.remove(id);
  }
}
