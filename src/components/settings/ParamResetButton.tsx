'use client';

import { useState } from 'react';
import type { ParamCategory } from '@/lib/supabase/types';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface ParamResetButtonProps {
  category: ParamCategory;
  onReset: (category: ParamCategory) => Promise<void>;
}

const CATEGORY_LABELS: Record<ParamCategory, string> = {
  ACTIVITY_FACTOR: 'los factores de actividad física',
  MIFFLIN_COEFFICIENT: 'los coeficientes Mifflin-St Jeor',
  MACRO_RANGE: 'los rangos de macronutrientes',
};

export function ParamResetButton({ category, onReset }: ParamResetButtonProps) {
  const [open, setOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  async function handleConfirm() {
    setIsResetting(true);
    try {
      await onReset(category);
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} disabled={isResetting}>
        {isResetting ? 'Restaurando…' : 'Restaurar valores por defecto'}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title="Restaurar valores por defecto"
        message={`¿Confirmas que deseas restaurar ${CATEGORY_LABELS[category]} a los valores estándar de Mifflin-St Jeor? Esta acción sobreescribe los valores actuales.`}
        confirmLabel="Restaurar"
        variant="primary"
      />
    </>
  );
}
