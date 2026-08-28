/**
 * Vendor Catalog — concrete per-module AI builder for catalog heavy work.
 *
 * The platform's second highest-leverage AI surface is the catalog itself:
 * writing titles, descriptions, SEO copy, specs and promo blurbs at scale.
 * This builder makes the model write as a merchandiser, not a generic writer:
 * it preserves every supplied fact (price, SKU, stock, category, margin) and
 * produces publish-ready copy the vendor can accept with one click.
 */

import { registerAiContext } from '../ai-context-registry';
import type { AiContextBuilder, AiFeature, AiPromptBundle } from '../ai-context.types';
import { composeModuleSystemPrompt } from '../../prompts/prompt-templates';

export const VENDOR_CATALOG_MODULE_ID = 'vendor-catalog';
export const VENDOR_CATALOG_ALIASES = ['vendor-products', 'catalog', 'products'] as const;

const VENDOR_CATALOG_CONSTRAINTS = [
  'Never invent price, SKU, stock, weight, ingredients or origin that is not in the facts/payload.',
  'Preserve the provided currency and unit exactly as given. Do not round prices unless asked.',
  'Produced copy must be ready to publish on a consumerstorefront: clear, correct, no placeholders.',
  'Offer Swahili and English versions when the vendor audience is mixed, but default to the language of the facts.',
];

function catalogFeatureIntent(feature: AiFeature): string {
  switch (feature) {
    case 'draft':
      return 'Draft publish-ready product content: title (≤70 chars), short description (≤160 chars), long description (2-3 paragraphs with bullets for specs), 5 SEO tags, and a one-line ad blurb. Keep every supplied fact and avoid filler.';
    case 'recommend':
      return 'Recommend concrete catalog improvements: pricing, bundle/promo ideas, SEO keywords and imagery hints, each justified by the provided price/stock/margin facts.';
    case 'review':
      return 'Review the draft catalog copy against completeness, accuracy, compliance and conversion. Report issues and exact fixes.';
    case 'extract':
      return 'Extract structured fields from the supplied free-text description: title, brand, category, price, unit, SKU, specs.';
    case 'summarize':
      return 'Summarize the provided catalog payload into a scannable merchandiser brief.';
    default:
      return 'Help the vendor improve their product catalog. Be precise, grounded in the supplied product facts, and offer concrete next steps.';
  }
}

export const vendorCatalogContextBuilder: AiContextBuilder = (request): AiPromptBundle => {
  const rawFeature = (request.feature ?? 'assistant') as AiFeature;
  const feature: AiFeature = [
    'assistant',
    'summarize',
    'analyze',
    'draft',
    'recommend',
    'review',
    'extract',
  ].includes(rawFeature)
    ? rawFeature
    : 'assistant';
  const facts = request.context?.facts ?? {};
  const rows = request.context?.rows ?? [];
  const constraints = [
    ...VENDOR_CATALOG_CONSTRAINTS,
    ...(request.context?.constraints ?? []),
  ];

  const base = composeModuleSystemPrompt({
    moduleLabel: 'Vendor Product Catalog',
    feature,
    facts,
    rows,
    constraints,
  });

  const extra = [
    catalogFeatureIntent(feature),
    'Facts meaning: payload or facts.product may hold { name, sku, price, currency, unit, stockQuantity, category, brand, description }. rows may hold variant rows or competitive catalog entries to compare against.',
    'When feature is "draft", output MUST be structured with headings: Title / Short Description / Long Description / SEO Tags / Ad Blurb — no extra commentary.',
  ].join('\n\n');

  return {
    system: `${base}\n\n${extra}`,
    userMessage: request.message,
  };
};

export function registerVendorCatalogContext(): void {
  registerAiContext(VENDOR_CATALOG_MODULE_ID, vendorCatalogContextBuilder);
  for (const alias of VENDOR_CATALOG_ALIASES) {
    registerAiContext(alias, vendorCatalogContextBuilder);
  }
}
