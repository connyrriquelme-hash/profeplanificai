import type { LucideIcon } from 'lucide-react';

interface IconBadgeProps {
  icon: LucideIcon;
  size?: number;
  color?: string;
  variant?: 'soft' | 'solid' | 'gradient' | 'outline';
  className?: string;
}

export function IconBadge({ icon: Icon, size = 24, color = '#6d5dfc', variant = 'soft', className = '' }: IconBadgeProps) {
  if (variant === 'gradient') {
    return (
      <div
        className={`flex items-center justify-center flex-shrink-0 ${className}`}
        style={{
          width: size * 2,
          height: size * 2,
          borderRadius: size * 0.5,
          background: `linear-gradient(135deg, ${color}, ${color}dd)`,
          boxShadow: `0 2px 8px ${color}33`,
        }}
      >
        <Icon size={size} className="text-white" strokeWidth={2.25} />
      </div>
    );
  }

  if (variant === 'solid') {
    return (
      <div
        className={`flex items-center justify-center flex-shrink-0 ${className}`}
        style={{
          width: size * 2,
          height: size * 2,
          borderRadius: size * 0.5,
          backgroundColor: color,
        }}
      >
        <Icon size={size} className="text-white" strokeWidth={2.25} />
      </div>
    );
  }

  if (variant === 'outline') {
    return (
      <div
        className={`flex items-center justify-center flex-shrink-0 ${className}`}
        style={{
          width: size * 2,
          height: size * 2,
          borderRadius: size * 0.5,
          border: `2px solid ${color}33`,
        }}
      >
        <Icon size={size} style={{ color }} strokeWidth={2.25} />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center flex-shrink-0 ${className}`}
      style={{
        width: size * 2,
        height: size * 2,
        borderRadius: size * 0.5,
        backgroundColor: `${color}14`,
      }}
    >
      <Icon size={size} style={{ color }} strokeWidth={2.25} />
    </div>
  );
}
