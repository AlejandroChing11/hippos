'use client';

import { useState, useMemo } from 'react';
import type { Patient } from '@/lib/types/patient';
import { Table, type Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OBJECTIVES } from '@/lib/constants/objectives';
import { formatDate } from '@/lib/utils/format';

interface PatientListProps {
  patients: Patient[];
  onEdit: (patient: Patient) => void;
  onDelete: (id: string) => void;
  onCalculate: (patient: Patient) => void;
}

export function PatientList({ patients, onEdit, onDelete, onCalculate }: PatientListProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return patients;
    return patients.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q),
    );
  }, [patients, search]);

  const columns: Column<Patient>[] = useMemo(() => [
    { key: 'fullName', header: 'Nombre' },
    {
      key: 'age',
      header: 'Edad',
      render: (p) => `${p.age} años`,
      className: 'whitespace-nowrap',
    },
    { key: 'sex', header: 'Sexo', className: 'w-16' },
    {
      key: 'weight',
      header: 'Peso',
      render: (p) => `${p.weight} kg`,
      className: 'whitespace-nowrap',
    },
    {
      key: 'height',
      header: 'Talla',
      render: (p) => `${p.height} cm`,
      className: 'whitespace-nowrap',
    },
    {
      key: 'objective',
      header: 'Objetivo',
      render: (p) => OBJECTIVES[p.objective].label,
    },
    {
      key: 'createdAt',
      header: 'Fecha',
      render: (p) => formatDate(p.createdAt),
      className: 'whitespace-nowrap',
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'text-right',
      render: (p) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(p); }}>
            Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}>
            Eliminar
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onCalculate(p); }}>
            Calcular TMB
          </Button>
        </div>
      ),
    },
  ], [onEdit, onDelete, onCalculate]);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Buscar paciente por nombre..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <Table<Patient>
        columns={columns}
        data={filtered}
        keyExtractor={(p) => p.id}
        emptyMessage="No hay pacientes registrados"
      />
    </div>
  );
}
