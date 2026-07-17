import type { CoordinatorCoverageSummary } from '../../../types/classbookCoordinator';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/EmptyState';
import { BarChart3 } from 'lucide-react';

interface CurriculumCoverageChartProps {
  coverage: CoordinatorCoverageSummary[];
}

function barColor(pct: number): string {
  if (pct > 80) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-rose-500';
}

export default function CurriculumCoverageChart({
  coverage,
}: CurriculumCoverageChartProps) {
  if (coverage.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Sin datos de cobertura"
        description="No hay datos de cobertura curricular disponibles."
        iconColor="#7c3aed"
      />
    );
  }

  return (
    <Card variant="default" aria-label="Gráfico de cobertura curricular">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={16} className="text-violet-500" />
        <h3 className="text-sm font-bold text-slate-700">Cobertura curricular</h3>
      </div>
      <div className="space-y-3">
        {coverage.map((item) => (
          <div key={item.courseId}>
            <div className="flex items-center justify-between mb-1">
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-700">
                  {item.courseName}
                </span>
                <span className="text-xs text-slate-400 ml-1.5">
                  · {item.subjectName}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-600 flex-shrink-0">
                {item.coveragePercent.toFixed(0)}%
              </span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor(item.coveragePercent)}`}
                style={{ width: `${Math.min(item.coveragePercent, 100)}%` }}
                role="progressbar"
                aria-valuenow={item.coveragePercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Cobertura de ${item.courseName}: ${item.coveragePercent.toFixed(0)}%`}
              />
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[10px] text-slate-400">
                OA planificados: {item.plannedOA}
              </span>
              <span className="text-[10px] text-slate-400">
                OA trabajados: {item.workedOA}
              </span>
              <span className="text-[10px] text-slate-400">
                Pendientes: {item.pendingOA}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
