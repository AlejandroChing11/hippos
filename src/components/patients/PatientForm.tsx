'use client';

import { useState, type FormEvent } from 'react';
import type { Patient, PatientObjective, ActivityLevel } from '@/lib/types/patient';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { TagInput } from '@/components/ui/TagInput';
import { Button } from '@/components/ui/Button';
import { generateId, calculateAge } from '@/lib/utils/slug';
import { ACTIVITY_FACTORS } from '@/lib/constants/activity-factors';
import { OBJECTIVES } from '@/lib/constants/objectives';

interface PatientFormProps {
  patient?: Patient;
  onSave: (patient: Patient) => void;
  onCancel: () => void;
}

const activityOptions = (Object.entries(ACTIVITY_FACTORS) as [ActivityLevel, typeof ACTIVITY_FACTORS[ActivityLevel]][]).map(
  ([value, { label }]) => ({ value, label }),
);

const objectiveOptions = (Object.entries(OBJECTIVES) as [PatientObjective, typeof OBJECTIVES[PatientObjective]][]).map(
  ([value, { label }]) => ({ value, label }),
);

const sexOptions = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
];

export function PatientForm({ patient, onSave, onCancel }: PatientFormProps) {
  const [firstName, setFirstName] = useState(patient?.firstName ?? '');
  const [lastName, setLastName] = useState(patient?.lastName ?? '');
  const [birthDate, setBirthDate] = useState(patient?.birthDate ?? '');
  const [sex, setSex] = useState<'M' | 'F' | ''>(patient?.sex ?? '');
  const [weight, setWeight] = useState(patient?.weight?.toString() ?? '');
  const [height, setHeight] = useState(patient?.height?.toString() ?? '');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | ''>(patient?.activityLevel ?? '');
  const [objective, setObjective] = useState<PatientObjective | ''>(patient?.objective ?? '');
  const [pathologies, setPathologies] = useState<string[]>(patient?.pathologies ?? []);
  const [foodAllergies, setFoodAllergies] = useState<string[]>(patient?.foodAllergies ?? []);
  const [notes, setNotes] = useState(patient?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const computedAge = birthDate ? calculateAge(birthDate) : null;

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'Requerido';
    if (!lastName.trim()) e.lastName = 'Requerido';
    if (!birthDate) e.birthDate = 'Requerido';
    if (!sex) e.sex = 'Requerido';
    const w = parseFloat(weight);
    if (!weight || isNaN(w) || w < 20 || w > 300) e.weight = 'Entre 20 y 300 kg';
    const h = parseFloat(height);
    if (!height || isNaN(h) || h < 80 || h > 250) e.height = 'Entre 80 y 250 cm';
    if (!activityLevel) e.activityLevel = 'Requerido';
    if (!objective) e.objective = 'Requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const now = new Date().toISOString();
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    onSave({
      id: patient?.id ?? generateId(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      fullName,
      birthDate,
      age: calculateAge(birthDate),
      sex: sex as 'M' | 'F',
      weight: parseFloat(weight),
      height: parseFloat(height),
      pathologies,
      foodAllergies,
      objective: objective as PatientObjective,
      activityLevel: activityLevel as ActivityLevel,
      notes: notes.trim(),
      createdAt: patient?.createdAt ?? now,
      updatedAt: now,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombre"
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
          error={errors.firstName}
          required
        />
        <Input
          label="Apellido"
          value={lastName}
          onChange={e => setLastName(e.target.value)}
          error={errors.lastName}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Input
            label="Fecha de nacimiento"
            type="date"
            value={birthDate}
            onChange={e => setBirthDate(e.target.value)}
            error={errors.birthDate}
            required
          />
          {computedAge !== null && (
            <p className="text-xs text-ink-tertiary">{computedAge} años</p>
          )}
        </div>
        <Select
          label="Sexo"
          options={sexOptions}
          value={sex}
          onChange={e => setSex(e.target.value as 'M' | 'F')}
          placeholder="Seleccionar"
          error={errors.sex}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Peso (kg)"
          type="number"
          min={20}
          max={300}
          step={0.1}
          value={weight}
          onChange={e => setWeight(e.target.value)}
          error={errors.weight}
          required
        />
        <Input
          label="Talla (cm)"
          type="number"
          min={80}
          max={250}
          step={0.1}
          value={height}
          onChange={e => setHeight(e.target.value)}
          error={errors.height}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Nivel de actividad"
          options={activityOptions}
          value={activityLevel}
          onChange={e => setActivityLevel(e.target.value as ActivityLevel)}
          placeholder="Seleccionar"
          error={errors.activityLevel}
          required
        />
        <Select
          label="Objetivo"
          options={objectiveOptions}
          value={objective}
          onChange={e => setObjective(e.target.value as PatientObjective)}
          placeholder="Seleccionar"
          error={errors.objective}
          required
        />
      </div>

      <TagInput
        label="Patologías"
        tags={pathologies}
        onChange={setPathologies}
        placeholder="Escribir patología y Enter"
      />

      <TagInput
        label="Alergias alimentarias"
        tags={foodAllergies}
        onChange={setFoodAllergies}
        placeholder="Escribir alergia y Enter"
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-ink-secondary">Notas</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 bg-inset border border-border rounded-lg text-ink text-sm placeholder:text-ink-muted transition-colors focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage resize-none"
          placeholder="Observaciones adicionales..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {patient ? 'Guardar cambios' : 'Crear paciente'}
        </Button>
      </div>
    </form>
  );
}
