type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const styles: Record<Variant, string> = {
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  danger: 'bg-danger-light text-danger',
  info: 'bg-info-light text-info',
  neutral: 'bg-surface-hover text-ink-secondary',
};

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
}

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}
