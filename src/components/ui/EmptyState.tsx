import type { LucideIcon } from 'lucide-react';
import { IconBadge } from './IconBadge';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  iconColor?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function EmptyState({ icon, title, description, action, iconColor = '#9ca3af', size = 'md', className = '' }: EmptyStateProps) {
  const badgeSize = size === 'sm' ? 'sm' : size === 'lg' ? 'xl' : 'lg';
  const titleSize = size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in ${className}`}>
      <IconBadge icon={icon} size={badgeSize} color={iconColor} variant="soft" className="mb-5" />
      <h3 className={`font-semibold text-gray-800 ${titleSize}`}>{title}</h3>
      {description && <p className="text-sm text-gray-400 mt-1.5 max-w-md leading-relaxed">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
