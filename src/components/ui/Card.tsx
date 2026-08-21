const variantStyles: Record<string, string> = {
  default:
    'bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)]',
  glass:
    'bg-[var(--surface)]/80 backdrop-blur-md border border-white/60 shadow-[var(--shadow-card)]',
  elevated:
    'bg-[var(--surface)] border border-[var(--border-strong)] shadow-[var(--shadow-card-hover)]',
  interactive:
    'bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] cursor-pointer hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--primary)]/30 hover:-translate-y-0.5 transition-all duration-200',
  gradient:
    'bg-gradient-to-br from-[var(--surface)] to-[var(--primary-tint)] border border-transparent shadow-[var(--shadow-card)]',
};

interface CardProps {
  variant?: keyof typeof variantStyles;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

export function Card({ variant = 'default', className = '', children, onClick }: CardProps) {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      className={`rounded-[var(--radius-card)] p-5 transition-all duration-200 ${variantStyles[variant]} ${className}`}
      onClick={onClick}
      {...(onClick ? { type: 'button' as const } : {})}
    >
      {children}
    </Component>
  );
}
