'use client';

import { type SelectHTMLAttributes, forwardRef } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, placeholder, helperText, className = '', id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-ink-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`w-full px-3 py-2 pr-9 bg-inset border rounded-lg text-ink text-sm transition-all duration-150
              appearance-none cursor-pointer
              focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20
              hover:border-border-strong
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border
              ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : 'border-border'}
              ${className}`}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {/* Custom chevron */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
            <svg className="h-4 w-4 text-ink-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && <p className="text-xs text-danger animate-fade-in">{error}</p>}
        {helperText && !error && <p className="text-xs text-ink-tertiary">{helperText}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';
