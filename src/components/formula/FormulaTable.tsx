'use client';

import { useMemo, useCallback } from 'react';
import { FOOD_GROUPS } from '@/lib/constants/food-groups';
import type { FoodSubgroup } from '@/lib/constants/food-groups';
import type { ExchangeEntry } from '@/lib/types/formula';
import { formatNumber } from '@/lib/utils/format';

interface FormulaTableProps {
  exchanges: ExchangeEntry[];
  onChange: (exchanges: ExchangeEntry[]) => void;
}

interface ComputedRow {
  subgroup: FoodSubgroup;
  groupId: string;
  groupName: string;
  groupSize: number;
  isFirstInGroup: boolean;
  exchangeCount: number;
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
}

const exchangeMap = (exchanges: ExchangeEntry[]) => {
  const map = new Map<string, number>();
  for (const e of exchanges) map.set(e.subgroupId, e.exchanges);
  return map;
};

export function FormulaTable({ exchanges, onChange }: FormulaTableProps) {
  const exMap = useMemo(() => exchangeMap(exchanges), [exchanges]);

  const rows: ComputedRow[] = useMemo(() => {
    const result: ComputedRow[] = [];
    for (const group of FOOD_GROUPS) {
      for (let i = 0; i < group.subgroups.length; i++) {
        const sub = group.subgroups[i];
        const count = exMap.get(sub.id) ?? 0;
        result.push({
          subgroup: sub,
          groupId: group.id,
          groupName: group.name,
          groupSize: group.subgroups.length,
          isFirstInGroup: i === 0,
          exchangeCount: count,
          protein: count * sub.protein,
          fat: count * sub.fat,
          carbs: count * sub.carbs,
          kcal: count * sub.kcalPerExchange,
        });
      }
    }
    return result;
  }, [exMap]);

  const totals = useMemo(() => {
    let protein = 0, fat = 0, carbs = 0, kcal = 0;
    for (const r of rows) {
      protein += r.protein;
      fat += r.fat;
      carbs += r.carbs;
      kcal += r.kcal;
    }
    return { protein, fat, carbs, kcal };
  }, [rows]);

  const handleChange = useCallback(
    (subgroupId: string, value: number) => {
      const next = exchanges.map(e =>
        e.subgroupId === subgroupId ? { ...e, exchanges: value } : e,
      );
      onChange(next);
    },
    [exchanges, onChange],
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-xs">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-inset text-ink-secondary">
            <th className="text-left px-3 py-2.5 font-medium w-[130px]">Grupo</th>
            <th className="text-left px-3 py-2.5 font-medium">Subgrupo</th>
            <th className="text-center px-3 py-2.5 font-medium w-[100px]">Intercambios</th>
            <th className="text-right px-3 py-2.5 font-medium w-[85px]">Prot (g)</th>
            <th className="text-right px-3 py-2.5 font-medium w-[85px]">Grasa (g)</th>
            <th className="text-right px-3 py-2.5 font-medium w-[85px]">CHO (g)</th>
            <th className="text-right px-3 py-2.5 font-medium w-[75px]">Kcal</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.subgroup.id}
              className="border-t border-border hover:bg-surface-hover/50 transition-colors"
            >
              {row.isFirstInGroup && (
                <td
                  rowSpan={row.groupSize}
                  className="px-3 py-2 font-medium text-ink bg-surface-hover/40 align-top text-xs leading-snug"
                >
                  <span className="text-sage font-semibold">{row.groupId}</span>
                  <br />
                  {row.groupName}
                </td>
              )}
              <td className="px-3 py-2 text-ink">{row.subgroup.name}</td>
              <td className="px-3 py-1.5 text-center">
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={row.exchangeCount || ''}
                  placeholder="0"
                  onChange={(e) => {
                    const v = e.target.value;
                    handleChange(row.subgroup.id, v === '' ? 0 : Math.max(0, parseFloat(v) || 0));
                  }}
                  className="w-[72px] px-2 py-1 text-right text-sm bg-inset border border-border rounded-lg focus:outline-none focus-visible:border-sage focus-visible:ring-2 focus-visible:ring-sage/30 tabular-nums"
                />
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-ink-secondary">
                {row.exchangeCount > 0 ? formatNumber(row.protein) : '—'}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-ink-secondary">
                {row.exchangeCount > 0 ? formatNumber(row.fat) : '—'}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-ink-secondary">
                {row.exchangeCount > 0 ? formatNumber(row.carbs) : '—'}
              </td>
              <td className="px-3 py-2 text-right tabular-nums font-medium text-ink">
                {row.exchangeCount > 0 ? formatNumber(row.kcal) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border-strong bg-inset font-semibold text-ink">
            <td colSpan={2} className="px-3 py-2.5">Total</td>
            <td className="px-3 py-2.5 text-center" />
            <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(totals.protein)}</td>
            <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(totals.fat)}</td>
            <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(totals.carbs)}</td>
            <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(totals.kcal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
