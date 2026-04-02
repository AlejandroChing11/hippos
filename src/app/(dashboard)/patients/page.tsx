'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Patient } from '@/lib/types/patient';
import { useSessionStorage } from '@/hooks/useSessionStorage';
import { PatientForm } from '@/components/patients/PatientForm';
import { PatientList } from '@/components/patients/PatientList';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useSessionStorage<Patient[]>('hippos_patients', []);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = useCallback(() => {
    setEditing(undefined);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((patient: Patient) => {
    setEditing(patient);
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditing(undefined);
  }, []);

  const handleSave = useCallback((patient: Patient) => {
    setPatients(prev => {
      const idx = prev.findIndex(p => p.id === patient.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = patient;
        return next;
      }
      return [...prev, patient];
    });
    closeForm();
  }, [setPatients, closeForm]);

  const handleDelete = useCallback(() => {
    if (!deleteId) return;
    setPatients(prev => prev.filter(p => p.id !== deleteId));
    setDeleteId(null);
  }, [deleteId, setPatients]);

  const handleCalculate = useCallback((patient: Patient) => {
    router.push(`/calculator?patientId=${patient.id}`);
  }, [router]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-ink">Pacientes</h1>
        <Button onClick={openCreate}>Nuevo Paciente</Button>
      </div>

      <PatientList
        patients={patients}
        onEdit={openEdit}
        onDelete={setDeleteId}
        onCalculate={handleCalculate}
      />

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? 'Editar paciente' : 'Nuevo paciente'}
        size="lg"
      >
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
