export function startOfLocalDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function endOfLocalDay(d: Date): Date {
  const next = new Date(startOfLocalDay(d));
  next.setDate(next.getDate() + 1);
  return next;
}

export function isDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function parseDateInput(value?: string): Date {
  if (!value) return new Date();
  if (!isDateString(value)) throw new Error('Invalid date format, expected YYYY-MM-DD');
  return new Date(`${value}T00:00:00`);
}

export function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}