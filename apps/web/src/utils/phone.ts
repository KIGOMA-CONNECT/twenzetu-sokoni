export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[\s\-()]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('0') && digits.length >= 9) return '+255' + digits.slice(1);
  if (digits.length >= 9 && !digits.startsWith('+')) return '+' + digits;
  return digits;
}
