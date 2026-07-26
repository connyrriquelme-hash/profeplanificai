import type { CoordinatorDashboardSummary } from '../../../types/classbookCoordinator';
import { Card } from '../../ui/Card';
import {
  BookOpen,
  Users,
  CheckCircle2,
  Clock,
  PenLine,
  ClipboardCheck,
  TrendingUp,
  Target,
} from 'lucide-react';

interface CoordinatorSummaryCardsProps {
  summary: CoordinatorDashboardSummary;
}

interface MetricConfig {
  key: keyof CoordinatorDashboardSummary;
  label: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
}

const metrics: MetricConfig[] = [
  {
    key: 'totalCourses',
    label: 'Cursos supervisados',
    icon: BookOpen,
    colorClass: 'text-violet-600',
    bgClass: 'bg-violet-50',
  },
  {
    key: 'totalTeachers',
    label: 'Docentes supervisados',
    icon: Users,
    colorClass: 'text-violet-600',
    bgClass: 'bg-violet-50',
  },
  {
    key: 'sessionsCompleted',
    label: 'Sesiones completadas',
    icon: CheckCircle2,
    colorClass: 'text-emerald-600',
    bgClass: 'bg-emerald-50',
  },
  {
    key: 'sessionsPending',
    label: 'Sesiones pendientes',
    icon: Clock,
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-50',
  },
  {
    key: 'sessionsPendingSignature',
    label: 'Pendientes de firma',
    icon: PenLine,
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-50',
  },
  {
    key: 'planningReviewsPending',
    label: 'Revisiones pendientes',
    icon: ClipboardCheck,
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-50',
  },
  {
    key: 'averageAttendanceRate',
    label: 'Asistencia promedio (%)',
    icon: TrendingUp,
    colorClass: 'text-violet-600',
    bgClass: 'bg-violet-50',
  },
  {
    key: 'estimatedCoveragePercent',
    label: 'Cobertura OA (%)',
    icon: Target,
    colorClass: 'text-violet-600',
    bgClass: 'bg-violet-50',
  },
];

export default function CoordinatorSummaryCards({
  summary,
}: CoordinatorSummaryCardsProps) {
  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      aria-label="Resumen del dashboard de coordinación"
    >
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const rawValue = summary[metric.key];
        const displayValue =
          typeof rawValue === 'number' && metric.key !== 'averageAttendanceRate' && metric.key !== 'estimatedCoveragePercent'
            ? rawValue.toLocaleString('es-CL')
            : typeof rawValue === 'number'
              ? `${rawValue.toFixed(1)}%`
              : String(rawValue ?? '—');

        return (
          <Card key={metric.key} variant="default" aria-label={metric.label}>
            <div className="flex items-start gap-3">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-xl ${metric.bgClass} flex-shrink-0`}
              >
                <Icon size={18} className={metric.colorClass} strokeWidth={2.25} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 truncate">
                  {metric.label}
                </p>
                <p
                  className={`text-xl font-black mt-0.5 ${metric.colorClass}`}
                >
                  {displayValue}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
