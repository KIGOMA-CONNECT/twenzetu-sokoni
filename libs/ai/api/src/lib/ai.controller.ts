import { Body, Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiAgent, AiService } from '@afri-market/ai';
import type { AiFeature } from '@afri-market/ai';
import { AiChatDto, AiStatusDto } from './dto/ai-request.dto';
import type { Response } from 'express';

@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(private readonly aiService: AiService, private readonly aiAgent: AiAgent) {}

  @Post('chat')
  @ApiOperation({ summary: 'Module-aware AI assistant response (grounded in module context)' })
  public async chat(@Body() dto: AiChatDto): Promise<{ text: string; enabled: boolean }> {
    const feature: AiFeature | undefined = this.validFeature(dto.feature);
    const result = await this.aiService.complete({
      module: dto.module,
      message: dto.message,
      feature,
      history: dto.history?.map((m) => ({ role: m.role, content: m.content })),
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
    return { text: result.text, enabled: true };
  }

  @Post('stream')
  @ApiOperation({ summary: 'Streaming module-aware AI response (grounded, chunked)' })
  public async stream(@Body() dto: AiChatDto, @Res() res: Response): Promise<void> {
    const feature: AiFeature | undefined = this.validFeature(dto.feature);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');
    try {
      for await (const chunk of this.aiService.stream({
        module: dto.module,
        message: dto.message,
        feature,
        history: dto.history?.map((m) => ({ role: m.role, content: m.content })),
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
  public async vendorRestock(@Body() dto: AiChatDto): Promise<{ text: string; toolResult: unknown; enabled: boolean }> {
    const feature: AiFeature | undefined = this.validFeature(dto.feature);
    const result = await this.aiAgent.vendorRestockPlan({
      module: dto.module,
      message: dto.message,
      feature,
      history: dto.history?.map((m) => ({ role: m.role, content: m.content })),
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
    return { text: result.text, toolResult: result.toolResult, enabled: true };
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
