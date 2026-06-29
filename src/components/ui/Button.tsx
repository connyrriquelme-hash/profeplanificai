import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const variantStyles: Record<string, string> = {
  primary:
    'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600 shadow-md shadow-violet-200/50 hover:shadow-lg hover:shadow-violet-200/60 active:scale-[0.98]',
  secondary:
    'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  outline:
    'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300',
  premium:
    'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-200/50 hover:shadow-xl hover:shadow-violet-200/60 hover:from-violet-600 hover:to-fuchsia-600 active:scale-[0.98]',
  danger:
    'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 hover:border-red-200',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5 h-8',
  md: 'px-4 py-2 text-sm rounded-xl gap-2 h-10',
  lg: 'px-6 py-3 text-base rounded-2xl gap-2.5 h-12',
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
        className={`inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
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
