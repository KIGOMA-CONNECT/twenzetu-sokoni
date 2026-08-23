/**
 * Returns the start of the local day for a given date and timezone offset.
 * @param d - The date to truncate
 * @param tzOffsetHours - UTC offset in hours (e.g. 3 for EAT = UTC+3). Defaults to server local time.
 */
export function startOfLocalDay(d: Date, tzOffsetHours?: number): Date {
  if (tzOffsetHours !== undefined) {
    const utcMs = d.getTime() + d.getTimezoneOffset() * 60_000;
    const localMs = utcMs + tzOffsetHours * 3_600_000;
    const local = new Date(localMs);
    local.setHours(0, 0, 0, 0);
    const backToUtc = local.getTime() - tzOffsetHours * 3_600_000 - new Date(localMs).getTimezoneOffset() * 60_000;
    return new Date(backToUtc);
  }
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * Returns the end of the local day for a given date and timezone offset.
 */
export function endOfLocalDay(d: Date, tzOffsetHours?: number): Date {
  const next = new Date(startOfLocalDay(d, tzOffsetHours));
  next.setDate(next.getDate() + 1);
  return next;
}

/**
 * Resolves UTC offset in hours from an IANA timezone string.
 * Defaults to EAT (UTC+3) for East African context.
 */
export function getUtcOffsetHours(timezone?: string): number {
  if (!timezone) return 3; // EAT default
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(now);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    if (tzPart) {
      const match = tzPart.value.match(/GMT([+-]\d{1,2}(?::\d{2})?)/);
      if (match) {
        const [h, m] = match[1].split(':');
        return parseInt(h, 10) + (m ? parseInt(m, 10) / 60 : 0);
      }
      if (tzPart.value === 'GMT') return 0;
    }
  } catch {}
  return 3; // EAT fallback
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