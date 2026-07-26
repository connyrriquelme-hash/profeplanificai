import type { CoordinatorDashboardSummary } from '../../../types/classbookCoordinator';
import { Card } from '../../ui/Card';
import { Activity } from 'lucide-react';

interface SessionStatusChartProps {
  summary: CoordinatorDashboardSummary;
}

interface Segment {
  label: string;
  count: number;
  colorClass: string;
  bgClass: string;
}

export default function SessionStatusChart({
  summary,
}: SessionStatusChartProps) {
  const total =
    summary.sessionsScheduled +
    summary.sessionsCompleted +
    summary.sessionsPending;

  const segments: Segment[] = [
    {
      label: 'Programadas',
      count: summary.sessionsScheduled,
      colorClass: 'bg-violet-500',
      bgClass: 'bg-violet-100',
    },
    {
      label: 'Completadas',
      count: summary.sessionsCompleted,
      colorClass: 'bg-emerald-500',
      bgClass: 'bg-emerald-100',
    },
    {
      label: 'Pendientes',
      count: summary.sessionsPending,
      colorClass: 'bg-amber-500',
      bgClass: 'bg-amber-100',
    },
  ];

  return (
    <Card variant="default" aria-label="Resumen de estados de sesión">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-violet-500" />
        <h3 className="text-sm font-bold text-slate-700">
          Estado de sesiones
        </h3>
      </div>

      <div
        className="flex h-6 rounded-full overflow-hidden bg-slate-100"
        role="img"
        aria-label={`Total de sesiones: ${total}. Programadas: ${summary.sessionsScheduled}, Completadas: ${summary.sessionsCompleted}, Pendientes: ${summary.sessionsPending}`}
      >
        {segments.map((seg) => {
          const pct = total > 0 ? (seg.count / total) * 100 : 0;
          return pct > 0 ? (
            <div
              key={seg.label}
              className={`h-full transition-all duration-500 ${seg.colorClass}`}
              style={{ width: `${pct}%` }}
              title={`${seg.label}: ${seg.count} (${pct.toFixed(1)}%)`}
            />
          ) : null;
        })}
      </div>

      <div className="flex items-center justify-between mt-4">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${seg.colorClass}`}
            />
            <span className="text-xs text-slate-600">{seg.label}</span>
            <span className="text-xs font-bold text-slate-800">
              {seg.count}
            </span>
          </div>
        ))}
      </div>

      <div className="text-center mt-3 pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-400">
          Total: {total} sesiones
        </span>
      </div>
    </Card>
  );
}
