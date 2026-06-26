import type { LucideIcon } from 'lucide-react';
import { IconBadge } from './IconBadge';

interface SectionHeaderProps {
  icon?: LucideIcon;
  iconColor?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ icon, iconColor = '#4f46e5', title, description, action, className = '' }: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-3">
        {icon && <IconBadge icon={icon} size={16} color={iconColor} variant="soft" />}
        <div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
