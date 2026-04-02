'use client';

import { Input } from '@/components/ui/Input';

interface RestrictionInputProps {
  value: number;
  onChange: (val: number) => void;
  required?: boolean;
}

export function RestrictionInput({ value, onChange, required }: RestrictionInputProps) {
  return (
    <Input
      type="number"
      label={`Restricción calórica (kcal)${required ? ' *' : ''}`}
      helperText="Kcal a restar del TDEE"
      value={value || ''}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      min={0}
      step={50}
      required={required}
    />
  );
}
