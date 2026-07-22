'use client';

import { useState } from 'react';
import { useFoodEquivalencies } from '@/lib/hooks/useFoodEquivalencies';
import type { FoodEquivalency } from '@/lib/supabase/food-equivalencies';
import { Button } from '@/components/ui/Button';
import { FoodEquivalencyForm } from './FoodEquivalencyForm';

interface Props {
  summaryGroup: string;
}

export function FoodEquivalencyList({ summaryGroup }: Props) {
  const { items, loading, error, refetch } = useFoodEquivalencies(summaryGroup);
  const [editing, setEditing] = useState<FoodEquivalency | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  if (loading) {
    return (
      <div className="space-y-2 px-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 bg-inset rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-danger mb-2">{error}</p>
        <Button variant="ghost" size="sm" onClick={refetch}>Reintentar</Button>
      </div>
    );
  }

  const activeItems = items.filter(i => i.isActive);

  if (activeItems.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-ink-muted mb-3">Sin equivalencias</p>
        <Button variant="secondary" size="sm" onClick={() => setShowCreate(true)}>
          Agregar primer alimento
        </Button>
        {showCreate && (
          <FoodEquivalencyForm
            summaryGroup={summaryGroup}
            onClose={() => setShowCreate(false)}
            onSaved={() => { setShowCreate(false); refetch(); }}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-left font-medium text-ink-secondary text-xs uppercase tracking-wider">Alimento</th>
              <th className="px-3 py-2 text-left font-medium text-ink-secondary text-xs uppercase tracking-wider">Porción</th>
              <th className="px-3 py-2 text-center font-medium text-ink-secondary text-xs uppercase tracking-wider">Gramos</th>
              <th className="px-3 py-2 text-left font-medium text-ink-secondary text-xs uppercase tracking-wider hidden sm:table-cell">Notas</th>
              <th className="px-3 py-2 text-center font-medium text-ink-secondary text-xs uppercase tracking-wider w-[80px]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {activeItems.map(item => (
              <tr key={item.id} className="border-b border-border/50 hover:bg-surface-hover/50 transition-colors">
                <td className="px-3 py-2 text-left text-ink font-medium">{item.foodName}</td>
                <td className="px-3 py-2 text-left text-ink-secondary">{item.portionDesc}</td>
                <td className="px-3 py-2 text-center tabular-nums text-ink">
                  {item.portionGrams != null ? item.portionGrams : '—'}
                </td>
                <td className="px-3 py-2 text-left text-ink-muted hidden sm:table-cell truncate max-w-[200px]">
                  {item.notes || '—'}
                </td>
                <td className="px-2 py-1.5 text-center">
                  <div className="flex items-center justify-center gap-0.5">
                    <button
                      onClick={() => setEditing(item)}
                      className="p-1 rounded-md text-ink-tertiary hover:text-ink hover:bg-surface-hover transition-colors cursor-pointer"
                      aria-label="Editar"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setEditing(item)}
                      className="p-1 rounded-md text-ink-tertiary hover:text-danger hover:bg-surface-hover transition-colors cursor-pointer"
                      aria-label="Eliminar"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3">
        <Button variant="ghost" size="sm" onClick={() => setShowCreate(true)}>
          + Agregar alimento
        </Button>
      </div>

      {(showCreate || editing) && (
        <FoodEquivalencyForm
          summaryGroup={summaryGroup}
          existing={editing}
          onClose={() => { setShowCreate(false); setEditing(null); }}
          onSaved={() => { setShowCreate(false); setEditing(null); refetch(); }}
        />
      )}
    </div>
  );
}
