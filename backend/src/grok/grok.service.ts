import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';

interface GrokChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GrokResponse {
  id: string;
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

@Injectable()
export class GrokService {
  private readonly logger = new Logger(GrokService.name);
  private readonly apiUrl = 'https://api.x.ai/v1/chat/completions';

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private async getApiKey(): Promise<string> {
    // Check DB settings first, then fall back to env
    const settings = await this.prisma.aISettings.findFirst({
      where: { provider: 'grok', isActive: true },
    });
    return settings?.apiKey || this.configService.get<string>('GROK_API_KEY', '');
  }

  private async getModel(): Promise<string> {
    const settings = await this.prisma.aISettings.findFirst({
      where: { provider: 'grok', isActive: true },
    });
    return settings?.model || this.configService.get<string>('GROK_MODEL', 'grok-3');
  }

  private async getDefaultPrompt(): Promise<string> {
    const settings = await this.prisma.aISettings.findFirst({
      where: { provider: 'grok', isActive: true },
    });
    return settings?.defaultPrompt || 'You are a professional business development and procurement specialist assistant.';
  }

  async chat(messages: GrokChatMessage[]): Promise<{ content: string; tokensUsed: number }> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('Grok API key not configured. Set GROK_API_KEY or configure in AI Settings.');
    }

    const model = await this.getModel();

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Grok API error: ${response.status} - ${error}`);
      throw new Error(`Grok API error: ${response.status}`);
    }

    const data: GrokResponse = await response.json();
    const content = data.choices[0]?.message?.content || '';
    const tokensUsed = data.usage?.total_tokens || 0;

    return { content, tokensUsed };
  }

  async analyzeData(prompt: string, context?: string): Promise<{ analysis: string; tokensUsed: number; conversationId: string }> {
    const defaultPrompt = await this.getDefaultPrompt();
    const messages: GrokChatMessage[] = [
      { role: 'system', content: `${defaultPrompt} You are analyzing business data. Provide clear, actionable insights.` },
    ];

    if (context) {
      messages.push({ role: 'user', content: `Context data:\n${context}\n\nQuestion: ${prompt}` });
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    const result = await this.chat(messages);

    // Log the conversation
    const conversation = await this.prisma.aIConversation.create({
      data: {
        context: 'data_analysis',
        prompt,
        response: result.content,
        tokensUsed: result.tokensUsed,
      },
    });

    return { analysis: result.content, tokensUsed: result.tokensUsed, conversationId: conversation.id };
  }

  async generateReply(
    originalMessage: string,
    contextType: string,
    customPrompt?: string,
    entityId?: string,
  ): Promise<{ reply: string; tokensUsed: number; conversationId: string }> {
    const defaultPrompt = await this.getDefaultPrompt();

    const systemPrompts: Record<string, string> = {
      linkedin_reply: `${defaultPrompt} You are replying to a LinkedIn message. Be professional, warm, and concise. Build rapport and drive toward business conversations.`,
      email_reply: `${defaultPrompt} You are replying to a business email. Be professional and thorough. Address all points raised.`,
      outreach_generate: `${defaultPrompt} You are generating outreach content. Be compelling, personalized, and concise.`,
    };

    const systemMessage = customPrompt
      ? `${systemPrompts[contextType] || defaultPrompt}\n\nAdditional instructions: ${customPrompt}`
      : systemPrompts[contextType] || defaultPrompt;

    const messages: GrokChatMessage[] = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: `Generate a reply to this message:\n\n"${originalMessage}"` },
    ];

    const result = await this.chat(messages);

    const conversation = await this.prisma.aIConversation.create({
      data: {
        context: contextType,
        entityType: contextType.includes('linkedin') ? 'linkedin_message' : 'outreach_email',
        entityId,
        prompt: originalMessage,
        response: result.content,
        tokensUsed: result.tokensUsed,
      },
    });

    return { reply: result.content, tokensUsed: result.tokensUsed, conversationId: conversation.id };
  }

  async generateOutreach(
    companyName: string,
    outputType: string,
    products?: string,
    campaignContext?: string,
  ): Promise<{ content: string; tokensUsed: number; conversationId: string }> {
    const defaultPrompt = await this.getDefaultPrompt();

    let prompt = `Generate a ${outputType.replace(/_/g, ' ')} for outreach to ${companyName}.`;
    if (products) prompt += `\nProducts/services to promote: ${products}`;
    if (campaignContext) prompt += `\nCampaign context: ${campaignContext}`;

    const messages: GrokChatMessage[] = [
      { role: 'system', content: `${defaultPrompt} Generate compelling, professional outreach content.` },
      { role: 'user', content: prompt },
    ];

    const result = await this.chat(messages);

    const conversation = await this.prisma.aIConversation.create({
      data: {
        context: 'outreach_generate',
        prompt,
        response: result.content,
        tokensUsed: result.tokensUsed,
      },
    });

    return { content: result.content, tokensUsed: result.tokensUsed, conversationId: conversation.id };
  }

  // --- AI Settings ---
  async getSettings() {
    return this.prisma.aISettings.findFirst({ where: { provider: 'grok' } });
  }

  async updateSettings(data: { apiKey?: string; model?: string; isActive?: boolean; defaultPrompt?: string }) {
    const existing = await this.prisma.aISettings.findFirst({ where: { provider: 'grok' } });

    if (existing) {
      return this.prisma.aISettings.update({
        where: { id: existing.id },
        data,
      });
    }

    return this.prisma.aISettings.create({
      data: {
        provider: 'grok',
        apiKey: data.apiKey || '',
        model: data.model || 'grok-3',
        isActive: data.isActive ?? true,
        defaultPrompt: data.defaultPrompt,
      },
    });
  }

  async getConversations(context?: string, limit: number = 50) {
    const cappedLimit = Math.min(Math.max(limit, 1), 1000);
    const where: Record<string, string> = {};
    if (context) where.context = context;

    return this.prisma.aIConversation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: cappedLimit,
    });
  }
}
