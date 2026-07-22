'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useCreateFoodEquivalency, useUpdateFoodEquivalency } from '@/lib/hooks/useFoodEquivalencies';
import { useToast } from '@/components/ui/Toast';
import type { FoodEquivalency } from '@/lib/supabase/food-equivalencies';

interface Props {
  summaryGroup: string;
  existing?: FoodEquivalency | null;
  onClose: () => void;
  onSaved: () => void;
}

export function FoodEquivalencyForm({ summaryGroup, existing, onClose, onSaved }: Props) {
  const [foodName, setFoodName] = useState(existing?.foodName ?? '');
  const [portionDesc, setPortionDesc] = useState(existing?.portionDesc ?? '');
  const [portionGrams, setPortionGrams] = useState<string>(
    existing?.portionGrams != null ? String(existing.portionGrams) : '',
  );
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saving, setSaving] = useState(false);

  const { create } = useCreateFoodEquivalency();
  const { update } = useUpdateFoodEquivalency();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!foodName.trim() || !portionDesc.trim()) return;

    setSaving(true);
    try {
      const grams = portionGrams ? parseFloat(portionGrams) : null;

      if (existing) {
        await update(existing.id, {
          food_name: foodName.trim(),
          portion_desc: portionDesc.trim(),
          portion_grams: grams != null && !isNaN(grams) ? grams : null,
          notes: notes.trim(),
        });
        toast('Equivalencia actualizada');
      } else {
        await create({
          summary_group: summaryGroup,
          food_name: foodName.trim(),
          portion_desc: portionDesc.trim(),
          portion_grams: grams != null && !isNaN(grams) ? grams : null,
          notes: notes.trim(),
          sort_order: 0,
          is_active: true,
        });
        toast('Equivalencia creada');
      }
      onSaved();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={existing ? 'Editar equivalencia' : 'Nueva equivalencia'} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink-secondary mb-1">Alimento</label>
          <input
            type="text"
            value={foodName}
            onChange={e => setFoodName(e.target.value)}
            required
            placeholder="Ej: Leche descremada"
            className="w-full px-3 py-2 rounded-lg border border-border bg-inset text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-secondary mb-1">Porción</label>
          <input
            type="text"
            value={portionDesc}
            onChange={e => setPortionDesc(e.target.value)}
            required
            placeholder="Ej: 1 taza (240ml)"
            className="w-full px-3 py-2 rounded-lg border border-border bg-inset text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-secondary mb-1">Gramos (opcional)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={portionGrams}
            onChange={e => setPortionGrams(e.target.value)}
            placeholder="Ej: 240"
            className="w-full px-3 py-2 rounded-lg border border-border bg-inset text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-secondary mb-1">Notas</label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Información adicional..."
            className="w-full px-3 py-2 rounded-lg border border-border bg-inset text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage transition-colors resize-vertical"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={saving} loading={saving}>
            {existing ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
