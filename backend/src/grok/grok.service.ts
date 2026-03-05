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
    return settings?.defaultPrompt || `You are an expert UK procurement specialist and B2B sales strategist working for a wholesale distribution company. You write exclusively in British English (colour, organise, specialise, favour, etc.) and use UK date formats (DD/MM/YYYY) and GBP (£) currency throughout.

Your core competencies include: strategic sourcing, supplier negotiation, tender management, framework agreements (including Crown Commercial Services), bid writing, cost analysis, margin optimisation, and relationship-driven sales.

TONE GUIDELINES:
- For LinkedIn messages and connection requests: be warm, conversational, and personable. Avoid corporate jargon. Write as a real person would — approachable yet knowledgeable. Use contractions (we're, you'll, that's). Keep it brief and natural. Think of it as a friendly professional chat, not a formal letter.
- For emails: be professional but not stiff. Lead with value, be clear and structured, include a specific call-to-action. More formal than LinkedIn but still human and engaging.
- For outreach campaigns: be compelling and benefit-led. Focus on what the recipient gains. Personalise where possible.
- For data analysis: be direct, concise, and insight-driven. Prioritise actionable recommendations over description. Focus on margin trends, conversion rates, pipeline velocity, supplier reliability, and cost-saving opportunities.

When generating content: always lead with value, avoid generic filler, personalise where data is available, and include a clear next step or call-to-action. Think like a master procurer who knows the UK public and private sector procurement landscape inside out.`;
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
      linkedin_reply: `${defaultPrompt}\n\nYou are replying to a LinkedIn message. Keep it conversational and friendly — like a chat between professionals who respect each other's time. Use contractions, be warm, build rapport naturally, and steer toward a business conversation without being pushy. No corporate waffle.`,
      email_reply: `${defaultPrompt}\n\nYou are replying to a business email. Be professional and structured — address all points raised clearly. More formal than LinkedIn but still personable and human. Always include a clear next step.`,
      outreach_generate: `${defaultPrompt}\n\nYou are generating outreach content. Be compelling, benefit-led, and personalised where possible. Lead with what the recipient gains, not what you're selling.`,
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

  private async getSenderCompanyName(): Promise<string> {
    const settings = await this.prisma.companySettings.findFirst();
    return settings?.companyName || 'our company';
  }

  async generateOutreach(
    companyName: string | undefined,
    outputType: string,
    products?: string,
    campaignContext?: string,
  ): Promise<{ content: string; tokensUsed: number; conversationId: string }> {
    const defaultPrompt = await this.getDefaultPrompt();
    const senderCompany = await this.getSenderCompanyName();

    let prompt = companyName
      ? `Generate a ${outputType.replace(/_/g, ' ')} for outreach to ${companyName} on behalf of ${senderCompany}.`
      : `Generate a generic ${outputType.replace(/_/g, ' ')} for outreach on behalf of ${senderCompany} that can be sent to multiple companies.`;
    if (products) prompt += `\nProducts/services to promote: ${products}`;
    if (campaignContext) prompt += `\nCampaign context: ${campaignContext}`;

    const messages: GrokChatMessage[] = [
      { role: 'system', content: `${defaultPrompt}\n\nYou are writing outreach on behalf of ${senderCompany}. Generate compelling content that leads with value and feels genuine. For LinkedIn: keep it conversational and brief. For emails: be professional but engaging. Always use British English.` },
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
