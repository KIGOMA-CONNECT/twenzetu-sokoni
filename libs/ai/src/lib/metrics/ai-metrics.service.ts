import { Injectable } from '@nestjs/common';

@Injectable()
export class AiMetricsService {
  private readonly buckets = [0.1, 0.3, 0.5, 1, 2, 3, 5, 10];
  private readonly observations: number[] = [];
  private readonly feedbackDown = new Map<string, number>();

  public observe(durationSeconds: number, module: string, feature?: string | null, feedback?: string | null): void {
    this.observations.push(durationSeconds);
    if (this.observations.length > 1000) this.observations.shift();
    if (feedback === 'down') {
      const key = `${module}:${feature ?? 'unknown'}`;
      this.feedbackDown.set(key, (this.feedbackDown.get(key) ?? 0) + 1);
    }
  }

  public getMetrics(): string {
    const count = this.observations.length;
    const sum = this.observations.reduce((a, b) => a + b, 0);
    const avg = count ? sum / count : 0;
    const p95 = count ? [...this.observations].sort((a, b) => a - b)[Math.floor(count * 0.95)] ?? 0 : 0;
    let out = '# HELP ai_request_duration_seconds AI request duration\n';
    out += '# TYPE ai_request_duration_seconds histogram\n';
    for (const b of this.buckets) {
      const c = this.observations.filter((v) => v <= b).length;
      out += `ai_request_duration_seconds_bucket{le="${b}"} ${c}\n`;
    }
    out += `ai_request_duration_seconds_bucket{le="+Inf"} ${count}\n`;
    out += `ai_request_duration_seconds_sum ${sum}\n`;
    out += `ai_request_duration_seconds_count ${count}\n`;
    out += `# HELP ai_request_duration_seconds_avg Average\n# TYPE ai_request_duration_seconds_avg gauge\nai_request_duration_seconds_avg ${avg}\n`;
    out += `# HELP ai_request_duration_seconds_p95 p95\n# TYPE ai_request_duration_seconds_p95 gauge\nai_request_duration_seconds_p95 ${p95}\n`;
    out += '# HELP ai_interactions_feedback_down_total Total thumbs-down\n# TYPE ai_interactions_feedback_down_total counter\n';
    for (const [k, v] of this.feedbackDown.entries()) {
      out += `ai_interactions_feedback_down_total{module_feature="${k}"} ${v}\n`;
    }
    return out;
  }
}
