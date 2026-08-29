import { registerAiTool } from './ai-tools.registry';

export function registerLaundryTools(): void {
  registerAiTool('calculateLaundryByKg', {
    schema: {
      name: 'calculateLaundryByKg',
      description: 'Calculate laundry price by weight (Premium by KG)',
      usage: 'Use for Premium Laundry by KG — price = kg * rate',
      parameters: {
        kg: { type: 'number', required: true, description: 'Weight in KG' },
        ratePerKg: { type: 'number', required: true, description: 'Rate per KG in TZS' },
      },
    },
    handler: (args) => {
      const kg = args.kg as number;
      const rate = args.ratePerKg as number;
      const total = Math.round(kg * rate * 100) / 100;
      return { kg, ratePerKg: rate, total, currency: 'TZS', note: 'Premium by KG — UV safe, skin friendly, minimal water' };
    },
  });

  registerAiTool('suggestLaundryAddOn', {
    schema: {
      name: 'suggestLaundryAddOn',
      description: 'Suggest add-on cleaning for shoes/bags',
      usage: 'Use when order contains shoes or bags',
      parameters: {
        hasShoes: { type: 'boolean', required: false },
        hasBags: { type: 'boolean', required: false },
      },
    },
    handler: (args) => {
      const hasShoes = !!args.hasShoes;
      const hasBags = !!args.hasBags;
      const suggestions: string[] = [];
      if (hasShoes) suggestions.push('Shoe Cleaning — per pair, eco chemicals');
      if (hasBags) suggestions.push('Bag Cleaning — per piece, UV safe');
      if (suggestions.length === 0) suggestions.push('Steam Press — per item');
      return { suggestions };
    },
  });
}
