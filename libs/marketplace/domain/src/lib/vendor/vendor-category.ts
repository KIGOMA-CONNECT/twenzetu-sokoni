export const VENDOR_CATEGORIES = [
  'food',
  'grocery',
  'electronics',
  'general',
  'laundry',
  'secondhand',
  'cleaning',
  'tailoring',
  'procurement',
] as const;

export type VendorCategory = typeof VENDOR_CATEGORIES[number];

export function isVendorCategory(value: string): value is VendorCategory {
  return (VENDOR_CATEGORIES as readonly string[]).includes(value);
}
