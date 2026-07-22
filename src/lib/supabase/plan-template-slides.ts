import { supabase } from './client';
import type { DbPlanTemplateSlide } from './types';

// ─── Converters ─────────────────────────────────────────────

export interface TemplateSlide {
  id: string;
  title: string;
  category: string;
  content: {
    heading: string;
    body?: string;
    bullets?: string[];
    imageHint?: string;
    backgroundColor?: string;
  };
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function toDomain(row: DbPlanTemplateSlide): TemplateSlide {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    content: row.content,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type TemplateSlideInsert = {
  title: string;
  category: string;
  content: TemplateSlide['content'];
  sort_order?: number;
  is_active?: boolean;
};

function toDbInsert(d: TemplateSlideInsert) {
  return {
    title: d.title,
    category: d.category,
    content: d.content,
    sort_order: d.sort_order ?? 0,
    is_active: d.is_active ?? true,
  };
}

export type TemplateSlideUpdate = Partial<TemplateSlideInsert>;

function toDbUpdate(d: TemplateSlideUpdate) {
  const u: Record<string, unknown> = {};
  if (d.title !== undefined) u.title = d.title;
  if (d.category !== undefined) u.category = d.category;
  if (d.content !== undefined) u.content = d.content;
  if (d.sort_order !== undefined) u.sort_order = d.sort_order;
  if (d.is_active !== undefined) u.is_active = d.is_active;
  return u;
}

// ─── Queries ────────────────────────────────────────────────

export async function getTemplateSlides(
  activeOnly?: boolean,
): Promise<TemplateSlide[]> {
  let query = supabase
    .from('plan_template_slides')
    .select('*')
    .order('sort_order', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toDomain);
}

export async function createTemplateSlide(
  data: TemplateSlideInsert,
): Promise<TemplateSlide> {
  const { data: inserted, error } = await supabase
    .from('plan_template_slides')
    .insert(toDbInsert(data))
    .select()
    .single();
  if (error) throw error;
  return toDomain(inserted);
}

export async function updateTemplateSlide(
  id: string,
  data: TemplateSlideUpdate,
): Promise<TemplateSlide> {
  const { data: updated, error } = await supabase
    .from('plan_template_slides')
    .update({ ...toDbUpdate(data), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return toDomain(updated);
}

export async function deleteTemplateSlide(id: string): Promise<void> {
  const { error } = await supabase
    .from('plan_template_slides')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
