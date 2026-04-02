const paddings = { sm: 'p-4', md: 'p-6', lg: 'p-8' };

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  return (
    <div className={`bg-surface rounded-xl border border-border shadow-xs ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
}
