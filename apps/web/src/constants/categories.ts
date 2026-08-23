export interface VendorCategoryDef {
  key: string;
  label: string;
  emoji: string;
}

export const VENDOR_CATEGORIES: VendorCategoryDef[] = [
  { key: 'food', label: 'Food', emoji: '🍲' },
  { key: 'grocery', label: 'Groceries', emoji: '🥬' },
  { key: 'electronics', label: 'Electronics', emoji: '📱' },
  { key: 'general', label: 'General', emoji: '🧵' },
  { key: 'laundry', label: 'Laundry', emoji: '🧺' },
  { key: 'secondhand', label: 'Secondhand', emoji: '♻️' },
  { key: 'cleaning', label: 'Home & Garden', emoji: '🧹' },
  { key: 'tailoring', label: 'Tailoring', emoji: '🧵' },
  { key: 'procurement', label: 'Procurement', emoji: '📋' },
];

// Platform-controlled commission rates by category.
// Vendor-facing pages display this; vendors do NOT set their own rate.
export const PLATFORM_COMMISSION: Record<string, number> = {
  food: 10,
  grocery: 8,
  electronics: 8,
  general: 10,
  laundry: 15,
  secondhand: 8,
  cleaning: 15,
  tailoring: 12,
  procurement: 10,
};

export const DEFAULT_PLATFORM_COMMISSION = 10;

export const VENDOR_CATEGORY_KEYS = VENDOR_CATEGORIES.map((c) => c.key);

export function categoryEmoji(key: string | undefined | null): string {
  return VENDOR_CATEGORIES.find((c) => c.key === key)?.emoji ?? '🏪';
}

export function categoryLabel(key: string | undefined | null): string {
  return VENDOR_CATEGORIES.find((c) => c.key === key)?.label ?? 'General';
}
