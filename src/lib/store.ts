export const STORAGE_KEYS = {
  PATIENTS: 'hippos_patients',
  TMB_CALCULATIONS: 'hippos_tmb_calculations',
  FORMULA_SESSIONS: 'hippos_formula_sessions',
} as const;

function read<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, data: T[]): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch { /* quota */ }
}

export function getAll<T>(key: string): T[] {
  return read<T>(key);
}

export function getById<T extends { id: string }>(key: string, id: string): T | undefined {
  return read<T>(key).find(item => item.id === id);
}

export function save<T extends { id: string }>(key: string, item: T): void {
  const items = read<T>(key);
  const idx = items.findIndex(i => i.id === item.id);
  if (idx >= 0) items[idx] = item;
  else items.push(item);
  write(key, items);
}

export function remove(key: string, id: string): void {
  write(key, read<{ id: string }>(key).filter(i => i.id !== id));
}
