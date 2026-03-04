import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { GrokService } from './grok.service';
import {
  AnalyzeDataDto,
  GenerateReplyDto,
  GenerateOutreachDto,
  UpdateAISettingsDto,
} from './dto/grok.dto';

@ApiTags('Grok AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class GrokController {
  constructor(private readonly grokService: GrokService) {}

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze data using Grok AI' })
  analyze(@Body() dto: AnalyzeDataDto) {
    return this.grokService.analyzeData(dto.prompt, dto.context);
  }

  @Post('reply')
  @ApiOperation({ summary: 'Generate an AI reply to a message' })
  generateReply(@Body() dto: GenerateReplyDto) {
    return this.grokService.generateReply(
      dto.originalMessage,
      dto.contextType,
      dto.customPrompt,
      dto.entityId,
    );
  }

  @Post('outreach')
  @ApiOperation({ summary: 'Generate outreach content (email, LinkedIn message, etc.)' })
  generateOutreach(@Body() dto: GenerateOutreachDto) {
    return this.grokService.generateOutreach(
      dto.companyName,
      dto.outputType,
      dto.products,
      dto.campaignContext,
    );
  }

  // --- Settings ---
  @Get('settings')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get AI settings' })
  getSettings() {
    return this.grokService.getSettings();
  }

  @Put('settings')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update AI settings (API key, model, prompt)' })
  updateSettings(@Body() dto: UpdateAISettingsDto) {
    return this.grokService.updateSettings(dto);
  }

  // --- Conversations log ---
  @Get('conversations')
  @ApiOperation({ summary: 'Get AI conversation history' })
  getConversations(
    @Query('context') context?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.grokService.getConversations(context, limit);
  }
}
