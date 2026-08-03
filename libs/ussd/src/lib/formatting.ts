export function formatCurrency(amount: number, _currency: string = 'TZS'): string {
  return `TZS ${amount.toLocaleString('en-US')}`;
}
