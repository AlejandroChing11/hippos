'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Patient } from '@/lib/types/patient';
import { usePatients, type PatientFormData } from '@/lib/hooks/usePatients';
import { PatientForm } from '@/components/patients/PatientForm';
import { PatientList } from '@/components/patients/PatientList';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';

export default function PatientsPage() {
  const router = useRouter();
  const { patients, loading, error, create, update, remove, refetch } = usePatients();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = useCallback(() => { setEditing(undefined); setFormOpen(true); }, []);
  const openEdit = useCallback((patient: Patient) => { setEditing(patient); setFormOpen(true); }, []);
  const closeForm = useCallback(() => { setFormOpen(false); setEditing(undefined); }, []);

  const handleSave = useCallback(async (data: PatientFormData) => {
    if (editing) {
      await update(editing.id, data);
    } else {
      await create(data);
    }
    closeForm();
  }, [editing, update, create, closeForm]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    try {
      await remove(deleteId);
    } catch {
      /* ConfirmDialog already closed — error visible on refetch */
    }
    setDeleteId(null);
  }, [deleteId, remove]);

  const handleCalculate = useCallback((patient: Patient) => {
    router.push(`/calculator?patientId=${patient.id}`);
  }, [router]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold text-ink">Pacientes</h1>
        </div>
        <div className="py-12 text-center text-sm text-ink-tertiary">Cargando pacientes…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold text-ink">Pacientes</h1>
        <div className="rounded-xl border border-danger/25 bg-danger-light px-4 py-3 text-sm text-danger">
          {error}
          <Button variant="ghost" size="sm" className="ml-3" onClick={refetch}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-ink">Pacientes</h1>
        <Button onClick={openCreate}>Nuevo Paciente</Button>
      </div>

      <PatientList patients={patients} onEdit={openEdit} onDelete={setDeleteId} onCalculate={handleCalculate} />

      <Modal open={formOpen} onClose={closeForm} title={editing ? 'Editar paciente' : 'Nuevo paciente'} size="lg">
        <PatientForm patient={editing} onSave={handleSave} onCancel={closeForm} />
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar paciente"
        message="¿Estás seguro de que deseas eliminar este paciente? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
}
