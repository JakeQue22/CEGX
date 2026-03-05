import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { EmailListsService } from './email-lists.service';
import { CreateEmailListDto, ImportEmailListDto } from './dto/email-list.dto';

@ApiTags('Email Lists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('email-lists')
export class EmailListsController {
  constructor(private readonly emailListsService: EmailListsService) {}

  @Get()
  @ApiOperation({ summary: 'List all email lists' })
  findAll() {
    return this.emailListsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get email list by ID with entries' })
  findOne(@Param('id') id: string) {
    return this.emailListsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Create an empty email list' })
  create(@Body() dto: CreateEmailListDto) {
    return this.emailListsService.create(dto);
  }

  @Post('import')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Import a CSV email list with column mapping' })
  import(@Body() dto: ImportEmailListDto) {
    return this.emailListsService.import(dto);
  }

  @Post(':id/add-to-campaign/:campaignId')
  @Roles(Role.ADMIN, Role.SALES_MANAGER)
  @ApiOperation({ summary: 'Add email list entries as recipients to a campaign' })
  addToCampaign(
    @Param('id') id: string,
    @Param('campaignId') campaignId: string,
  ) {
    return this.emailListsService.addToCampaign(id, campaignId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete an email list' })
  remove(@Param('id') id: string) {
    return this.emailListsService.remove(id);
  }
}
