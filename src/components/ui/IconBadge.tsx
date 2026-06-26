import type { LucideIcon } from 'lucide-react';

const sizeMap = {
  sm: 14,
  md: 18,
  lg: 22,
  xl: 28,
} as const;

interface IconBadgeProps {
  icon: LucideIcon;
  size?: keyof typeof sizeMap | number;
  color?: string;
  variant?: 'soft' | 'solid' | 'gradient' | 'outline' | 'glass';
  className?: string;
}

export function IconBadge({ icon: Icon, size = 'md', color = '#4f46e5', variant = 'soft', className = '' }: IconBadgeProps) {
  const px = typeof size === 'number' ? size : sizeMap[size] ?? sizeMap.md;
  const container = px * 2;
  const radius = px * 0.5;

  const style = { width: container, height: container, borderRadius: radius };

  if (variant === 'gradient') {
    return (
      <div
        className={`flex items-center justify-center flex-shrink-0 ${className}`}
        style={{ ...style, background: `linear-gradient(135deg, ${color}, ${adjustColor(color, -30)})`, boxShadow: `0 2px 8px ${color}33` }}
      >
        <Icon size={px} className="text-white" strokeWidth={2.25} />
      </div>
    );
  }

  if (variant === 'solid') {
    return (
      <div
        className={`flex items-center justify-center flex-shrink-0 ${className}`}
        style={{ ...style, backgroundColor: color }}
      >
        <Icon size={px} className="text-white" strokeWidth={2.25} />
      </div>
    );
  }

  if (variant === 'outline') {
    return (
      <div
        className={`flex items-center justify-center flex-shrink-0 ${className}`}
        style={{ ...style, border: `2px solid ${color}33` }}
      >
        <Icon size={px} style={{ color }} strokeWidth={2.25} />
      </div>
    );
  }

  if (variant === 'glass') {
    return (
      <div
        className={`flex items-center justify-center flex-shrink-0 ${className}`}
        style={{ ...style, backgroundColor: `${color}14`, backdropFilter: 'blur(4px)' }}
      >
        <Icon size={px} style={{ color }} strokeWidth={2.25} />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ ...style, backgroundColor: `${color}14` }}
    >
      <Icon size={px} style={{ color }} strokeWidth={2.25} />
    </div>
  );
}

function adjustColor(hex: string, amount: number): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
