export function formatCurrency(amount: number, currency: string = 'TZS'): string {
  return `TZS ${amount.toLocaleString('en-US')}`;
}
