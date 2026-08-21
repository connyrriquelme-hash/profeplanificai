import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const variantStyles: Record<string, string> = {
  primary:
    'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] active:scale-[0.98]',
  secondary:
    'bg-[var(--surface)] text-[var(--ink)] border border-[var(--border)] hover:bg-[var(--sidebar-hover)] hover:border-[var(--ink-soft)]/30',
  ghost:
    'bg-transparent text-[var(--ink-soft)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--ink)]',
  outline:
    'bg-transparent text-[var(--primary)] border border-[var(--primary)]/35 hover:bg-[var(--primary-tint)]',
  premium:
    'bg-[var(--primary)] text-white shadow-[var(--shadow-card-hover)] hover:shadow-lg hover:bg-[var(--primary-hover)] active:scale-[0.98]',
  danger:
    'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 hover:border-red-200',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-[var(--radius-input)] gap-1.5 h-8',
  md: 'px-4 py-2 text-sm rounded-[var(--radius-input)] gap-2 h-10',
  lg: 'px-6 py-3 text-base rounded-[var(--radius-card)] gap-2.5 h-12',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  iconLeft?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      iconLeft: IconLeft,
      iconRight: IconRight,
      loading = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
<button
        ref={ref}
        type="button"
        disabled={isDisabled}
        className={`inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {loading ? (
          <Loader2 size={size === 'lg' ? 18 : size === 'sm' ? 12 : 14} className="animate-spin" />
        ) : IconLeft ? (
          <IconLeft size={size === 'lg' ? 18 : size === 'sm' ? 12 : 14} strokeWidth={2.25} />
        ) : null}
        {children && <span>{children}</span>}
        {!loading && IconRight && (
          <IconRight size={size === 'lg' ? 18 : size === 'sm' ? 12 : 14} strokeWidth={2.25} />
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
