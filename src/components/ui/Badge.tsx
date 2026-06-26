const colorMap = {
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  violet: { bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-500' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-500' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-700', dot: 'bg-pink-500' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500' },
  green: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
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
