'use client';

import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-ink-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3 py-2 bg-inset border rounded-lg text-ink text-sm placeholder:text-ink-muted
            transition-all duration-150
            focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20
            hover:border-border-strong
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border
            ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : 'border-border'}
            ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-danger animate-fade-in">{error}</p>}
        {helperText && !error && <p className="text-xs text-ink-tertiary">{helperText}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
