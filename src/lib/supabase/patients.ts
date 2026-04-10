import { supabase } from './client';
import type { Database, DbPatient } from './types';
import type { Patient, PatientObjective, ActivityLevel } from '@/lib/types/patient';
import { calculateAge } from '@/lib/utils/slug';

// ─── Converters ─────────────────────────────────────────────

function toPatient(row: DbPatient): Patient {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: row.full_name,
    birthDate: row.birth_date,
    age: calculateAge(row.birth_date),
    sex: row.sex,
    weight: Number(row.weight),
    height: Number(row.height),
    pathologies: row.pathologies ?? [],
    foodAllergies: row.food_allergies ?? [],
    objective: row.objective as PatientObjective,
    activityLevel: row.activity_level as ActivityLevel,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface PatientFormData {
  firstName: string;
  lastName: string;
  birthDate: string;
  sex: 'M' | 'F';
  weight: number;
  height: number;
  pathologies: string[];
  foodAllergies: string[];
  objective: PatientObjective;
  activityLevel: ActivityLevel;
  notes: string;
}

function toDbInsert(d: PatientFormData) {
  return {
    first_name: d.firstName,
    last_name: d.lastName,
    birth_date: d.birthDate,
    sex: d.sex,
    weight: d.weight,
    height: d.height,
    pathologies: d.pathologies,
    food_allergies: d.foodAllergies,
    objective: d.objective,
    activity_level: d.activityLevel,
    notes: d.notes,
  };
}

// ─── Queries ────────────────────────────────────────────────

export async function getPatients(): Promise<Patient[]> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('full_name');
  if (error) throw error;
  return (data ?? []).map(toPatient);
}

export async function getPatientById(id: string): Promise<Patient | null> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? toPatient(data) : null;
}

export async function createPatient(input: PatientFormData): Promise<Patient> {
  const { data, error } = await supabase
    .from('patients')
    .insert(toDbInsert(input))
    .select()
    .single();
  if (error) throw error;
  return toPatient(data);
}

type DbPatientUpdate = Database['hippos']['Tables']['patients']['Update'];

export async function updatePatient(id: string, input: Partial<PatientFormData>): Promise<Patient> {
  const dbUpdate: DbPatientUpdate = {};
  if (input.firstName !== undefined) dbUpdate.first_name = input.firstName;
  if (input.lastName !== undefined) dbUpdate.last_name = input.lastName;
  if (input.birthDate !== undefined) dbUpdate.birth_date = input.birthDate;
  if (input.sex !== undefined) dbUpdate.sex = input.sex;
  if (input.weight !== undefined) dbUpdate.weight = input.weight;
  if (input.height !== undefined) dbUpdate.height = input.height;
  if (input.pathologies !== undefined) dbUpdate.pathologies = input.pathologies;
  if (input.foodAllergies !== undefined) dbUpdate.food_allergies = input.foodAllergies;
  if (input.objective !== undefined) dbUpdate.objective = input.objective;
  if (input.activityLevel !== undefined) dbUpdate.activity_level = input.activityLevel;
  if (input.notes !== undefined) dbUpdate.notes = input.notes;

  const { data, error } = await supabase
    .from('patients')
    .update(dbUpdate)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return toPatient(data);
}

export async function deletePatient(id: string): Promise<void> {
  const { error } = await supabase.from('patients').delete().eq('id', id);
  if (error) throw error;
}
