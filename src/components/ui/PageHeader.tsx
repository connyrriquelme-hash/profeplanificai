import type { LucideIcon } from 'lucide-react';
import { IconBadge } from './IconBadge';

interface PageHeaderProps {
  icon?: LucideIcon;
  iconColor?: string;
  title: string;
  description?: string;
  badge?: string;
  badgeColor?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ icon, iconColor = '#4f46e5', title, description, badge, badgeColor = 'indigo', actions, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 ${className}`}>
      <div className="flex items-center gap-3">
        {icon && <IconBadge icon={icon} size={22} color={iconColor} variant="gradient" />}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {badge && (
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full bg-${badgeColor}-100 text-${badgeColor}-700`}>
                {badge}
              </span>
            )}
          </div>
          {description && <p className="text-sm text-gray-500 mt-0.5 max-w-2xl">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
