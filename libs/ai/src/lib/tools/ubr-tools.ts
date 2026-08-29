import { registerAiTool } from './ai-tools.registry';

export function registerUbrTools(): void {
  registerAiTool('validateEntity', {
    schema: {
      name: 'validateEntity',
      description: 'Validate a UBR registered entity against metadata',
      usage: 'Use when checking if an entity is valid',
      parameters: { entityType: { type: 'string', required: true }, displayName: { type: 'string', required: true } },
    },
    handler: (args) => {
      const type = String(args.entityType);
      const name = String(args.displayName);
      const valid = type.length >= 2 && name.length >= 2;
      return { entityType: type, displayName: name, valid, note: valid ? 'Entity looks valid' : 'Check name/type' };
    },
  });

  registerAiTool('suggestRelationship', {
    schema: {
      name: 'suggestRelationship',
      description: 'Suggest a relationship between two entity types',
      usage: 'Use when designing business graph relationships',
      parameters: { source: { type: 'string', required: true }, target: { type: 'string', required: true } },
    },
    handler: (args) => {
      const s = String(args.source);
      const t = String(args.target);
      return { source: s, target: t, relationship: `${s}_to_${t}`, cardinality: 'ONE_TO_MANY', note: `Suggested ${s} → ${t}` };
    },
  });
}
