import { useMemo } from 'react';
import type { CoordinatorTeacherSummary } from '../../../types/classbookCoordinator';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { EmptyState } from '../../ui/EmptyState';
import { Users } from 'lucide-react';

interface TeacherComplianceTableProps {
  teachers: CoordinatorTeacherSummary[];
}

function complianceColor(pct: number): string {
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-rose-500';
}

function complianceBadgeColor(pct: number): 'green' | 'amber' | 'violet' {
  if (pct >= 80) return 'green';
  if (pct >= 50) return 'amber';
  return 'violet';
}

export default function TeacherComplianceTable({
  teachers,
}: TeacherComplianceTableProps) {
  const sorted = useMemo(
    () => [...teachers].sort((a, b) => a.compliancePercent - b.compliancePercent),
    [teachers],
  );

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Sin docentes para mostrar"
        description="No hay datos de cumplimiento docente disponibles."
        iconColor="#7c3aed"
      />
    );
  }

  return (
    <Card variant="default" aria-label="Tabla de cumplimiento docente">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Cursos
              </th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Planificadas
              </th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Completadas
              </th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pendientes
              </th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Sin asistencia
              </th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Firmas pend.
              </th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Revisiones
              </th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[140px]">
                % Cumplimiento
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.map((t) => (
              <tr
                key={t.teacherId}
                className="hover:bg-slate-50/50 transition-colors"
              >
                <td className="py-3 px-3 font-medium text-slate-800">
                  {t.teacherName}
                </td>
                <td className="py-3 px-3 text-slate-600">
                  {t.courses.join(', ')}
                </td>
                <td className="py-3 px-3 text-center text-slate-600">
                  {t.sessionsPlanned}
                </td>
                <td className="py-3 px-3 text-center text-emerald-600 font-medium">
                  {t.sessionsCompleted}
                </td>
                <td className="py-3 px-3 text-center text-amber-600 font-medium">
                  {t.sessionsPending}
                </td>
                <td className="py-3 px-3 text-center text-rose-600 font-medium">
                  {t.sessionsWithoutAttendance}
                </td>
                <td className="py-3 px-3 text-center text-amber-600 font-medium">
                  {t.pendingSignatures}
                </td>
                <td className="py-3 px-3 text-center text-violet-600 font-medium">
                  {t.pendingReviews}
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${complianceColor(t.compliancePercent)}`}
                        style={{ width: `${Math.min(t.compliancePercent, 100)}%` }}
                      />
                    </div>
                    <Badge
                      color={complianceBadgeColor(t.compliancePercent)}
                      size="sm"
                    >
                      {t.compliancePercent.toFixed(0)}%
                    </Badge>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
