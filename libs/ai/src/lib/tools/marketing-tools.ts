/**
 * Marketing tools — deterministic helpers for campaign drafting.
 */

import { registerAiTool } from './ai-tools.registry';

export function registerMarketingTools(): void {
  registerAiTool('draftCampaign', {
    schema: {
      name: 'draftCampaign',
      description: 'Draft a marketing campaign SMS with segments',
      usage: 'Use when user wants a campaign draft with audience filter',
      parameters: {
        name: { type: 'string', required: true, description: 'Campaign name' },
        message: { type: 'string', required: true, description: 'SMS body' },
        minOrders: { type: 'number', required: false, description: 'Minimum orders for segment' },
      },
    },
    handler: (args) => {
      const name = String(args.name);
      const message = String(args.message);
      const minOrders = args.minOrders as number | undefined;
      const segment = minOrders ? `segment minOrders=${minOrders}` : 'all customers';
      return { draft: { name, message, segment }, note: 'Draft ready for vendor-catalog builder to polish' };
    },
  });

  registerAiTool('suggestAdCopy', {
    schema: {
      name: 'suggestAdCopy',
      description: 'Suggest advert title/body/emoji for a product',
      usage: 'Use when drafting advert copy for a product',
      parameters: {
        productName: { type: 'string', required: true },
        price: { type: 'number', required: false },
      },
    },
    handler: (args) => {
      const name = String(args.productName);
      const price = args.price as number | undefined;
      return {
        title: `${name} — Ofa Maalum!`,
        body: price ? `Nunua ${name} kwa ${price} TZS tu! Stock limited.` : `Nunua ${name} sasa!`,
        emoji: '🔥',
        ctaLabel: 'Nunua Sasa',
      };
    },
  });
}
