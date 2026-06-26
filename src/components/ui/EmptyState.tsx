import type { LucideIcon } from 'lucide-react';
import { IconBadge } from './IconBadge';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  iconColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({ icon, title, description, action, iconColor = '#9ca3af', size = 'md' }: EmptyStateProps) {
  const iconSize = size === 'sm' ? 20 : size === 'lg' ? 32 : 24;
  const badgeSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <IconBadge icon={icon} size={badgeSize} color={iconColor} variant="soft" className="mb-4" />
      <h3 className={`font-semibold text-gray-800 ${size === 'lg' ? 'text-lg' : 'text-base'}`}>{title}</h3>
      {description && <p className="text-sm text-gray-400 mt-1 max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
