'use client';

import { useState } from 'react';
import { EXCHANGE_SUMMARY_GROUPS } from '@/lib/constants/exchange-summary-groups';
import { FoodEquivalencyList } from '@/components/food-equivalencies/FoodEquivalencyList';
import { FoodEquivalencyForm } from '@/components/food-equivalencies/FoodEquivalencyForm';
import { Button } from '@/components/ui/Button';

export default function EquivalenciesPage() {
  const groups = EXCHANGE_SUMMARY_GROUPS;
  const [activeGroupIdx, setActiveGroupIdx] = useState(0);
  const [showCreate, setShowCreate] = useState(false);

  const activeGroup = groups[activeGroupIdx];

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 pb-12">
      <header className="flex flex-col gap-4 border-b border-border/80 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="font-heading text-2xl font-bold text-balance text-ink md:text-3xl">Equivalencias de alimentos</h1>
          <p className="text-pretty text-sm text-ink-secondary">Administra las equivalencias por cada grupo de intercambios.</p>
        </div>
        <div className="shrink-0">
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
            + Agregar alimento
          </Button>
        </div>
      </header>

      <nav className="flex flex-wrap gap-1.5 overflow-x-auto pb-1" role="tablist">
        {groups.map((group, idx) => (
          <button
            key={group.id}
            role="tab"
            aria-selected={idx === activeGroupIdx}
            onClick={() => setActiveGroupIdx(idx)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
              idx === activeGroupIdx
                ? 'bg-sage text-white shadow-xs'
                : 'bg-surface text-ink-secondary hover:bg-surface-hover hover:text-ink border border-border'
            }`}
          >
            {group.label}
          </button>
        ))}
      </nav>

      <section className="bg-surface rounded-xl border border-border shadow-xs p-6">
        <h2 className="font-heading text-lg font-semibold text-ink mb-4">{activeGroup.label}</h2>
        <FoodEquivalencyList summaryGroup={activeGroup.id} />
      </section>

      {showCreate && (
        <FoodEquivalencyForm
          summaryGroup={activeGroup.id}
          onClose={() => setShowCreate(false)}
          onSaved={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
