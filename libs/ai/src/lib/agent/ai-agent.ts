/**
 * Heavy-task agent — orchestrates deterministic tools before/after the LLM.
 *
 * Example: vendor restock agent: calls lowStockDetector tool on inventory rows,
 * then asks the model to draft a restock PO grounded in that tool output.
 * The agent carries heavy tasks so the UI stays thin and the model stays grounded.
 */

import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../service/ai.service';
import { callAiTool } from '../tools/ai-tools.registry';
import type { AiContextRequest, AiFeature } from '../context/ai-context.types';

@Injectable()
export class AiAgent {
  private readonly logger = new Logger(AiAgent.name);
  constructor(private readonly aiService: AiService) {}

  /**
   * Vendor restock: detect low-stock via tool, then draft a restock plan via LLM.
   * Returns the tool result plus the grounded LLM text.
   */
  public async vendorRestockPlan(request: AiContextRequest & { feature?: AiFeature }): Promise<{ toolResult: unknown; text: string }> {
    const threshold = (request.context?.facts?.lowStockThreshold as number | undefined) ?? 5;
    let toolResult: unknown = null;
    try {
      toolResult = await callAiTool('lowStockDetector', { threshold });
    } catch (e) {
      this.logger.warn(`lowStockDetector failed: ${(e as Error).message}`);
      toolResult = { threshold, error: (e as Error).message };
    }
    const enrichedRequest: AiContextRequest = {
      ...request,
      feature: 'recommend',
      message: `${request.message}\n\nTool lowStockDetector result: ${JSON.stringify(toolResult)}`,
      context: {
        summary: request.context?.summary ?? 'Vendor restock',
        facts: { ...(request.context?.facts ?? {}), lowStockToolResult: toolResult },
        rows: request.context?.rows,
        constraints: request.context?.constraints,
      },
    };
    const result = await this.aiService.complete(enrichedRequest);
    return { toolResult, text: result.text };
  }

  /**
   * Finance commission: calls calculateCommission tool, then explains via LLM.
   */
  public async financeCommissionExplain(request: AiContextRequest & { feature?: AiFeature }): Promise<{ toolResult: unknown; text: string }> {
    const gross = request.context?.facts?.totalRevenue as number | undefined;
    const rate = (request.params?.rate as number | undefined) ?? 0.1;
    let toolResult: unknown = null;
    if (typeof gross === 'number') {
      try {
        toolResult = await callAiTool('calculateCommission', { grossRevenue: gross, rate });
      } catch (e) {
        this.logger.warn(`calculateCommission failed: ${(e as Error).message}`);
      }
    }
    const enrichedRequest: AiContextRequest = {
      ...request,
      feature: 'analyze',
      message: `${request.message}\n\nTool calculateCommission result: ${JSON.stringify(toolResult)}`,
      context: {
        summary: request.context?.summary ?? 'Finance commission',
        facts: { ...(request.context?.facts ?? {}), commissionToolResult: toolResult },
        rows: request.context?.rows,
      },
    };
    const result = await this.aiService.complete(enrichedRequest);
    return { toolResult, text: result.text };
  }

  /**
   * Finance reconciler — chains summarizeLedger + calculateCommission before LLM.
   * Heavy task: sum ledger by kind/status, compute commission, then let LLM
   * explain the reconciliation and flag anomalies.
   */
  public async financeReconciler(request: AiContextRequest & { feature?: AiFeature }): Promise<{ toolResults: Record<string, unknown>; text: string }> {
    const toolResults: Record<string, unknown> = {};
    try {
      toolResults.ledgerSummary = await callAiTool('summarizeLedger', { kind: (request.params?.kind as string) ?? 'all' });
    } catch (e) {
      this.logger.warn(`summarizeLedger failed: ${(e as Error).message}`);
    }
    const gross = request.context?.facts?.totalRevenue as number | undefined;
    if (typeof gross === 'number') {
      try {
        toolResults.commission = await callAiTool('calculateCommission', { grossRevenue: gross, rate: (request.params?.rate as number) ?? 0.1 });
      } catch (e) {
        this.logger.warn(`calculateCommission failed: ${(e as Error).message}`);
      }
    }
    const enrichedRequest: AiContextRequest = {
      ...request,
      feature: 'review',
      message: `${request.message}\n\nTool results: ${JSON.stringify(toolResults)}`,
      context: {
        summary: request.context?.summary ?? 'Finance reconciliation',
        facts: { ...(request.context?.facts ?? {}), ...toolResults },
        rows: request.context?.rows,
        constraints: [...(request.context?.constraints ?? []), 'Use tool results as ground truth for sums.'],
      },
    };
    const result = await this.aiService.complete(enrichedRequest);
    return { toolResults, text: result.text };
  }

  /**
   * POS closer — chains lowStockDetector + summarizeLedger for shift close.
   * Heavy task: detect stock gaps and ledger totals, then draft close summary.
   */
  public async posCloser(request: AiContextRequest & { feature?: AiFeature }): Promise<{ toolResults: Record<string, unknown>; text: string }> {
    const toolResults: Record<string, unknown> = {};
    try {
      toolResults.lowStock = await callAiTool('lowStockDetector', { threshold: (request.context?.facts?.lowStockThreshold as number) ?? 5 });
    } catch (e) {
      this.logger.warn(`lowStockDetector failed: ${(e as Error).message}`);
    }
    try {
      toolResults.ledger = await callAiTool('summarizeLedger', { kind: 'transfer' });
    } catch (e) {
      this.logger.warn(`summarizeLedger failed: ${(e as Error).message}`);
    }
    const enrichedRequest: AiContextRequest = {
      ...request,
      feature: 'summarize',
      message: `${request.message}\n\nTool results: ${JSON.stringify(toolResults)}`,
      context: {
        summary: request.context?.summary ?? 'POS close',
        facts: { ...(request.context?.facts ?? {}), ...toolResults },
        rows: request.context?.rows,
      },
    };
    const result = await this.aiService.complete(enrichedRequest);
    return { toolResults, text: result.text };
  }

  /**
   * Generic streaming heavy task: streams LLM tokens after tool enrichment.
   */
  public async *streamWithTools(request: AiContextRequest): AsyncIterable<string> {
    // Example: run lowStockDetector if inventory in facts, then stream.
    const hasInventory = !!request.context?.facts?.lowStockThreshold || !!request.context?.rows?.some((r) => (r as Record<string, unknown>).kind === 'inventory');
    let enriched = request;
    if (hasInventory) {
      try {
        const toolResult = await callAiTool('lowStockDetector', { threshold: (request.context?.facts?.lowStockThreshold as number) ?? 5 });
        enriched = {
          ...request,
          context: { summary: request.context?.summary ?? 'Stream with tools', facts: { ...(request.context?.facts ?? {}), lowStockToolResult: toolResult }, rows: request.context?.rows },
        };
      } catch {
        // ignore tool failure, stream without it
      }
    }
    yield* this.aiService.stream(enriched);
  }
}
