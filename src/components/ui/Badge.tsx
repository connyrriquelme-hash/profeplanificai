const colorMap = {
  indigo: { bg: 'bg-[var(--primary-tint)]', text: 'text-[var(--primary-ink)]', dot: 'bg-[var(--primary)]' },
  violet: { bg: 'bg-[var(--primary-tint)]', text: 'text-[var(--primary-ink)]', dot: 'bg-[var(--primary)]' },
  teal: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  orange: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  pink: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
} as const;

const sizeStyles = {
  sm: 'text-[10px] px-2 py-0.5 gap-1',
  md: 'text-xs px-2.5 py-1 gap-1.5',
  lg: 'text-sm px-3 py-1.5 gap-1.5',
};

type BadgeColor = keyof typeof colorMap;

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  size?: keyof typeof sizeStyles;
  dot?: boolean;
  className?: string;
}

export function Badge({ children, color = 'indigo', size = 'md', dot = false, className = '' }: BadgeProps) {
  const c = colorMap[color] ?? colorMap.indigo;

  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${c.bg} ${c.text} ${sizeStyles[size]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />}
      {children}
    </span>
  );
}
