import { registerAiTool } from './ai-tools.registry';

export function registerMarketplaceTools(): void {
  registerAiTool('priceRecommendation', {
    schema: {
      name: 'priceRecommendation',
      description: 'Recommend price based on cost and margin',
      usage: 'Use for pricing',
      parameters: {
        cost: { type: 'number', required: true },
        marginPercent: { type: 'number', required: true, description: 'Desired margin %' },
      },
    },
    handler: (args) => {
      const cost = args.cost as number;
      const margin = args.marginPercent as number;
      const price = Math.round(cost * (1 + margin / 100) * 100) / 100;
      return { cost, marginPercent: margin, recommendedPrice: price };
    },
  });

  registerAiTool('bundleSuggestion', {
    schema: {
      name: 'bundleSuggestion',
      description: 'Suggest bundle for products',
      usage: 'Use when bundling',
      parameters: { productName: { type: 'string', required: true } },
    },
    handler: (args) => {
      const name = String(args.productName);
      return { productName: name, bundles: [`${name} + complementary`, `${name} — 2-pack`] };
    },
  });
}
