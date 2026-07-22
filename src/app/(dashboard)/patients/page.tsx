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
import { useToast } from '@/components/ui/Toast';

export default function PatientsPage() {
  const router = useRouter();
  const { patients, loading, error, create, update, remove, refetch } = usePatients();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreate = useCallback(() => { setEditing(undefined); setFormOpen(true); }, []);
  const openEdit = useCallback((patient: Patient) => { setEditing(patient); setFormOpen(true); }, []);
  const closeForm = useCallback(() => { setFormOpen(false); setEditing(undefined); }, []);

  const handleSave = useCallback(async (data: PatientFormData) => {
    setSaving(true);
    try {
      if (editing) {
        await update(editing.id, data);
        toast('Paciente actualizado correctamente');
      } else {
        await create(data);
        toast('Paciente creado correctamente');
      }
      closeForm();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al guardar paciente', 'error');
    } finally {
      setSaving(false);
    }
  }, [editing, update, create, closeForm, toast]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    try {
      await remove(deleteId);
      toast('Paciente eliminado');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al eliminar', 'error');
    }
    setDeleteId(null);
  }, [deleteId, remove, toast]);

  const handleCalculate = useCallback((patient: Patient) => {
    router.push(`/calculator?patientId=${patient.id}`);
  }, [router]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold text-ink">Pacientes</h1>
          <div className="skeleton h-9 w-36" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-16 w-full" />
          ))}
        </div>
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
        <PatientForm key={editing?.id ?? 'new'} patient={editing} onSave={handleSave} onCancel={closeForm} saving={saving} />
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
