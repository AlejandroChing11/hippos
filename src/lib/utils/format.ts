export function formatNumber(n: number, decimals = 1): string {
  return n.toFixed(decimals);
}

export function formatKcal(n: number): string {
  return `${Math.round(n)} kcal`;
}

export function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
