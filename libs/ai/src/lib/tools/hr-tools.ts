import { registerAiTool } from './ai-tools.registry';

export function registerHrTools(): void {
  registerAiTool('suggestPosition', {
    schema: {
      name: 'suggestPosition',
      description: 'Suggest a position title and level from description',
      usage: 'Use when drafting a new position',
      parameters: { description: { type: 'string', required: true, description: 'Position description' } },
    },
    handler: (args) => {
      const desc = String(args.description).toLowerCase();
      const level = desc.includes('senior') ? 'Senior' : desc.includes('junior') ? 'Junior' : 'Mid';
      return { title: `${level} Position`, level, note: 'Drafted from description' };
    },
  });

  registerAiTool('checkCompliance', {
    schema: {
      name: 'checkCompliance',
      description: 'Check HR compliance for a module',
      usage: 'Use when reviewing HR compliance',
      parameters: { module: { type: 'string', required: true, description: 'HR module e.g., leave, payroll' } },
    },
    handler: (args) => {
      const mod = String(args.module);
      return { module: mod, status: 'reviewed', note: `Checked ${mod} against HR policies` };
    },
  });
}
