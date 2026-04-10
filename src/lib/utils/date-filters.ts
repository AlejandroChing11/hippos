import type { DateRangePreset } from '@/lib/types/report';

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function mondayOfWeek(d: Date): Date {
  const copy = startOfDay(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

export function resolveDateRange(preset: DateRangePreset, customStart: string, customEnd: string): { startDate: string; endDate: string } {
  const now = new Date();
  const today = startOfDay(now);

  switch (preset) {
    case 'today':
      return { startDate: toISODate(today), endDate: toISODate(today) };

    case 'this_week': {
      const mon = mondayOfWeek(today);
      return { startDate: toISODate(mon), endDate: toISODate(today) };
    }

    case 'this_month': {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: toISODate(first), endDate: toISODate(today) };
    }

    case 'last_week': {
      const mon = mondayOfWeek(today);
      const lastMon = new Date(mon);
      lastMon.setDate(lastMon.getDate() - 7);
      const lastSun = new Date(lastMon);
      lastSun.setDate(lastSun.getDate() + 6);
      return { startDate: toISODate(lastMon), endDate: toISODate(lastSun) };
    }

    case 'last_month': {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      return { startDate: toISODate(first), endDate: toISODate(last) };
    }

    case 'custom':
      return { startDate: customStart, endDate: customEnd };

    case 'all_time':
      return { startDate: '2000-01-01', endDate: toISODate(today) };

    default:
      return { startDate: toISODate(today), endDate: toISODate(today) };
  }
}

export function isDateInRange(isoDatetime: string, start: string, end: string): boolean {
  const local = toISODate(new Date(isoDatetime));
  return local >= start && local <= end;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function firstOfMonthISO(): string {
  const d = new Date();
  return toISODate(new Date(d.getFullYear(), d.getMonth(), 1));
}
