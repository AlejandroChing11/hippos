'use client';

import { useState, useEffect } from 'react';
import { getTemplateSlides, type TemplateSlide } from '@/lib/supabase/plan-template-slides';

interface Props {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function TemplateSlideSelector({ selectedIds, onChange }: Props) {
  const [slides, setSlides] = useState<TemplateSlide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTemplateSlides(true)
      .then(setSlides)
      .catch(() => setSlides([]))
      .finally(() => setLoading(false));
  }, []);

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(s => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  if (loading) {
    return (
      <div className="mt-2 space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-8 bg-inset rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <p className="text-xs text-ink-muted mt-2">
        No hay slides educativas disponibles. Agregalas desde Configuración.
      </p>
    );
  }

  return (
    <div className="mt-2 space-y-1.5">
      {slides.map(slide => (
        <label
          key={slide.id}
          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors text-sm ${
            selectedIds.includes(slide.id)
              ? 'border-sage/40 bg-sage-light/20 text-ink'
              : 'border-border bg-surface text-ink-secondary hover:bg-surface-hover'
          }`}
        >
          <input
            type="checkbox"
            checked={selectedIds.includes(slide.id)}
            onChange={() => toggle(slide.id)}
            className="rounded border-border text-sage focus:ring-sage h-4 w-4"
          />
          <span className="truncate">{slide.title}</span>
        </label>
      ))}
    </div>
  );
}
