import type { CoordinatorAlert } from '../../../types/classbookCoordinator';
import { EmptyState } from '../../ui/EmptyState';
import { AlertTriangle, Info, XCircle, ExternalLink } from 'lucide-react';

interface CoordinatorAlertsPanelProps {
  alerts: CoordinatorAlert[];
  onNavigate?: (resourceType: string, resourceId: string) => void;
}

function severityConfig(severity: CoordinatorAlert['severity']) {
  switch (severity) {
    case 'critical':
      return {
        icon: XCircle,
        iconColor: 'text-rose-500',
        bgClass: 'bg-rose-50 border-rose-100',
        dotColor: 'bg-rose-500',
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        iconColor: 'text-amber-500',
        bgClass: 'bg-amber-50 border-amber-100',
        dotColor: 'bg-amber-500',
      };
    case 'info':
    default:
      return {
        icon: Info,
        iconColor: 'text-violet-500',
        bgClass: 'bg-violet-50 border-violet-100',
        dotColor: 'bg-violet-500',
      };
  }
}

export default function CoordinatorAlertsPanel({
  alerts,
  onNavigate,
}: CoordinatorAlertsPanelProps) {
  if (alerts.length === 0) {
    return (
      <EmptyState
        icon={Info}
        title="Sin alertas"
        description="No hay alertas activas en este momento."
        iconColor="#7c3aed"
      />
    );
  }

  const handleAlertClick = (alert: CoordinatorAlert) => {
    if (onNavigate && alert.resourceId) {
      onNavigate(alert.resourceType, alert.resourceId);
    }
  };

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 overflow-hidden"
      aria-label="Panel de alertas"
    >
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500" />
          <h3 className="text-sm font-bold text-slate-700">
            Alertas ({alerts.length})
          </h3>
        </div>
      </div>
      <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
        {alerts.map((alert) => {
          const config = severityConfig(alert.severity);
          const Icon = config.icon;
          const hasNavigation = onNavigate && alert.resourceId;

          return (
            <div
              key={alert.id}
              className={`px-4 py-3 border-l-4 ${config.bgClass} ${hasNavigation ? 'cursor-pointer hover:bg-slate-50/50' : ''}`}
              onClick={() => handleAlertClick(alert)}
              role={hasNavigation ? 'button' : undefined}
              tabIndex={hasNavigation ? 0 : undefined}
              onKeyDown={hasNavigation ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleAlertClick(alert); } : undefined}
            >
              <div className="flex items-start gap-3">
                <Icon size={18} className={`${config.iconColor} mt-0.5 flex-shrink-0`} strokeWidth={2.25} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    {alert.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {alert.description}
                  </p>
                  {hasNavigation && (
                    <p className="text-[10px] text-violet-500 mt-1.5 flex items-center gap-1">
                      <ExternalLink size={10} strokeWidth={2} />
                      Click para abrir recurso
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}