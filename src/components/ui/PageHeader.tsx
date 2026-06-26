import type { LucideIcon } from 'lucide-react';
import { IconBadge } from './IconBadge';
import { Badge } from './Badge';

const iconColorMap: Record<string, string> = {
  indigo: '#4f46e5',
  violet: '#7c3aed',
  teal: '#0d9488',
  orange: '#ea580c',
  pink: '#db2777',
  slate: '#475569',
  green: '#16a34a',
  blue: '#2563eb',
};

interface PageHeaderProps {
  icon?: LucideIcon;
  iconColor?: string;
  title: string;
  description?: string;
  badge?: string;
  badgeColor?: 'indigo' | 'violet' | 'teal' | 'orange' | 'pink' | 'slate' | 'green';
  actions?: React.ReactNode;
  variant?: 'default' | 'hero' | 'compact';
  className?: string;
}

export function PageHeader({ icon, iconColor: iconColorProp, title, description, badge, badgeColor = 'indigo', actions, variant = 'default', className = '' }: PageHeaderProps) {
  const iconColor = iconColorProp ?? iconColorMap[badgeColor] ?? '#4f46e5';

  if (variant === 'hero') {
    return (
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 p-6 sm:p-8 lg:p-10 mb-8 ${className}`}>
        <div className="absolute inset-0 bg-noise opacity-[0.07]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {icon && <IconBadge icon={icon} size="xl" color="#ffffff" variant="glass" />}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{title}</h1>
                {badge && <Badge color="violet" size="sm">{badge}</Badge>}
              </div>
              {description && <p className="text-sm text-indigo-200 mt-1 max-w-xl">{description}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center justify-between gap-3 mb-6 ${className}`}>
        <div className="flex items-center gap-2.5">
          {icon && <IconBadge icon={icon} size="sm" color={iconColor} variant="soft" />}
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {badge && <Badge color={badgeColor} size="sm">{badge}</Badge>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    );
  }

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 ${className}`}>
      <div className="flex items-center gap-3">
        {icon && <IconBadge icon={icon} size="lg" color={iconColor} variant="gradient" />}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
            {badge && <Badge color={badgeColor} size="md">{badge}</Badge>}
          </div>
          {description && <p className="text-sm text-gray-500 mt-0.5 max-w-2xl">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
