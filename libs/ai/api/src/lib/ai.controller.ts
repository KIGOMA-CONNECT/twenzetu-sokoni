import { Body, Controller, Get, Headers, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiAgent, AiLearningService, AiService } from '@afri-market/ai';
import type { AiFeature } from '@afri-market/ai';
import { AiChatDto, AiFeedbackDto, AiStatusDto } from './dto/ai-request.dto';
import type { Request, Response } from 'express';

@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly aiAgent: AiAgent,
    private readonly learningService: AiLearningService,
  ) {}

  @Post('chat')
  @ApiOperation({ summary: 'Module-aware AI assistant response (grounded in module context)' })
  public async chat(
    @Body() dto: AiChatDto,
    @Req() req: Request,
    @Headers('x-tenant-id') headerTenantId?: string,
  ): Promise<{ text: string; id?: string; enabled: boolean }> {
    const feature: AiFeature | undefined = this.validFeature(dto.feature);
    const tenantId = dto.tenantId ?? headerTenantId ?? ((req as unknown as { tenantId?: string }).tenantId as string | undefined);
    const userId = ((req as unknown as { user?: { id?: string; userId?: string } }).user?.id ??
      (req as unknown as { user?: { id?: string; userId?: string } }).user?.userId) as string | undefined;
    const result = await this.aiService.complete({
      module: dto.module,
      message: dto.message,
      feature,
      history: dto.history?.map((m) => ({ role: m.role, content: m.content })),
      tenantId,
      userId,
      context: dto.context
        ? {
            summary: dto.context.summary,
            facts: dto.context.facts,
            rows: dto.context.rows,
            constraints: dto.context.constraints,
            questions: dto.context.questions,
            payload: dto.context.payload,
          }
        : undefined,
    });
    return { text: result.text, id: (result as { id?: string }).id, enabled: true };
  }

  @Post('stream')
  @ApiOperation({ summary: 'Streaming module-aware AI response (grounded, chunked)' })
  public async stream(
    @Body() dto: AiChatDto,
    @Res() res: Response,
    @Req() req: Request,
    @Headers('x-tenant-id') headerTenantId?: string,
  ): Promise<void> {
    const feature: AiFeature | undefined = this.validFeature(dto.feature);
    const tenantId = dto.tenantId ?? headerTenantId ?? ((req as unknown as { tenantId?: string }).tenantId as string | undefined);
    const userId = ((req as unknown as { user?: { id?: string; userId?: string } }).user?.id ??
      (req as unknown as { user?: { id?: string; userId?: string } }).user?.userId) as string | undefined;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');
    try {
      for await (const chunk of this.aiService.stream({
        module: dto.module,
        message: dto.message,
        feature,
        history: dto.history?.map((m) => ({ role: m.role, content: m.content })),
        tenantId,
        userId,
        context: dto.context
          ? {
              summary: dto.context.summary,
              facts: dto.context.facts,
              rows: dto.context.rows,
              constraints: dto.context.constraints,
              questions: dto.context.questions,
              payload: dto.context.payload,
            }
          : undefined,
      })) {
        res.write(chunk);
      }
    } catch (e) {
      res.write(`\n[error: ${(e as Error).message}]`);
    } finally {
      res.end();
    }
  }

  @Post('agent/vendor-restock')
  @ApiOperation({ summary: 'Heavy-task agent: vendor restock plan (tool + LLM)' })
  public async vendorRestock(
    @Body() dto: AiChatDto,
    @Req() req: Request,
    @Headers('x-tenant-id') headerTenantId?: string,
  ): Promise<{ text: string; toolResult: unknown; id?: string; enabled: boolean }> {
    const feature: AiFeature | undefined = this.validFeature(dto.feature);
    const tenantId = dto.tenantId ?? headerTenantId ?? ((req as unknown as { tenantId?: string }).tenantId as string | undefined);
    const userId = ((req as unknown as { user?: { id?: string; userId?: string } }).user?.id ??
      (req as unknown as { user?: { id?: string; userId?: string } }).user?.userId) as string | undefined;
    const result = await this.aiAgent.vendorRestockPlan({
      module: dto.module,
      message: dto.message,
      feature,
      history: dto.history?.map((m) => ({ role: m.role, content: m.content })),
      tenantId,
      userId,
      context: dto.context
        ? {
            summary: dto.context.summary,
            facts: dto.context.facts,
            rows: dto.context.rows,
            constraints: dto.context.constraints,
            questions: dto.context.questions,
            payload: dto.context.payload,
          }
        : undefined,
    });
    return { text: result.text, toolResult: result.toolResult, id: result.id, enabled: true };
  }

  @Post('agent/finance-reconcile')
  @ApiOperation({ summary: 'Heavy-task agent: finance reconciler (2 tools + LLM)' })
  public async financeReconcile(
    @Body() dto: AiChatDto,
    @Req() req: Request,
    @Headers('x-tenant-id') headerTenantId?: string,
  ): Promise<{ text: string; toolResults: Record<string, unknown>; id?: string; enabled: boolean }> {
    const feature: AiFeature | undefined = this.validFeature(dto.feature);
    const tenantId = dto.tenantId ?? headerTenantId ?? ((req as unknown as { tenantId?: string }).tenantId as string | undefined);
    const userId = ((req as unknown as { user?: { id?: string; userId?: string } }).user?.id ??
      (req as unknown as { user?: { id?: string; userId?: string } }).user?.userId) as string | undefined;
    const result = await this.aiAgent.financeReconciler({
      module: dto.module,
      message: dto.message,
      feature,
      history: dto.history?.map((m) => ({ role: m.role, content: m.content })),
      tenantId,
      userId,
      context: dto.context
        ? {
            summary: dto.context.summary,
            facts: dto.context.facts,
            rows: dto.context.rows,
            constraints: dto.context.constraints,
            questions: dto.context.questions,
            payload: dto.context.payload,
          }
        : undefined,
    });
    return { text: result.text, toolResults: result.toolResults, id: result.id, enabled: true };
  }

  @Post('agent/pos-close')
  @ApiOperation({ summary: 'Heavy-task agent: POS closer (2 tools + LLM)' })
  public async posClose(
    @Body() dto: AiChatDto,
    @Req() req: Request,
    @Headers('x-tenant-id') headerTenantId?: string,
  ): Promise<{ text: string; toolResults: Record<string, unknown>; id?: string; enabled: boolean }> {
    const feature: AiFeature | undefined = this.validFeature(dto.feature);
    const tenantId = dto.tenantId ?? headerTenantId ?? ((req as unknown as { tenantId?: string }).tenantId as string | undefined);
    const userId = ((req as unknown as { user?: { id?: string; userId?: string } }).user?.id ??
      (req as unknown as { user?: { id?: string; userId?: string } }).user?.userId) as string | undefined;
    const result = await this.aiAgent.posCloser({
      module: dto.module,
      message: dto.message,
      feature,
      history: dto.history?.map((m) => ({ role: m.role, content: m.content })),
      tenantId,
      userId,
      context: dto.context
        ? {
            summary: dto.context.summary,
            facts: dto.context.facts,
            rows: dto.context.rows,
            constraints: dto.context.constraints,
            questions: dto.context.questions,
            payload: dto.context.payload,
          }
        : undefined,
    });
    return { text: result.text, toolResults: result.toolResults, id: result.id, enabled: true };
  }

  @Post('feedback')
  @ApiOperation({ summary: 'Submit feedback for an AI interaction (self-learner)' })
  public async feedback(
    @Body() dto: AiFeedbackDto,
    @Req() req: Request,
    @Headers('x-tenant-id') headerTenantId?: string,
  ): Promise<{ ok: boolean }> {
    const tenantId = headerTenantId ?? ((req as unknown as { tenantId?: string }).tenantId as string | undefined);
    if (!tenantId) return { ok: false };
    const feedback = dto.feedback as 'up' | 'down';
    await this.learningService.submitFeedback(dto.id, tenantId, feedback);
    return { ok: true };
  }

  @Get('learning/insights')
  @ApiOperation({ summary: 'Self-learner insights: usage by module/feature, feedback, latency' })
  public async insights(@Req() req: Request, @Headers('x-tenant-id') headerTenantId?: string, @Query('days') days?: string): Promise<unknown> {
    const tenantId = headerTenantId ?? ((req as unknown as { tenantId?: string }).tenantId as string | undefined);
    if (!tenantId) return { total: 0, byModule: [], byFeature: [], recentFeedbackLow: [] };
    const d = days ? Math.min(30, Math.max(1, Number(days) || 7)) : 7;
    return this.learningService.getInsights(tenantId, d);
  }

  @Get('status')
  @ApiOperation({ summary: 'AI capability status for the configured provider' })
  public status(@Query() _dto?: AiStatusDto) {
    return {
      enabled: this.aiService.isConfigured,
      provider: this.aiService.providerId,
      providers: this.aiService.providers,
    };
  }

  private validFeature(v: string | undefined): AiFeature | undefined {
    const valid: AiFeature[] = [
      'assistant',
      'summarize',
      'analyze',
      'draft',
      'recommend',
      'review',
      'extract',
    ];
    return v && valid.includes(v as AiFeature) ? (v as AiFeature) : undefined;
  }
}
