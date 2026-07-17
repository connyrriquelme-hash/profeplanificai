import type { CoordinatorCourseSummary } from '../../../types/classbookCoordinator';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { EmptyState } from '../../ui/EmptyState';
import { BookOpen } from 'lucide-react';

interface CourseCoverageTableProps {
  courses: CoordinatorCourseSummary[];
}

function coverageColor(pct: number): 'green' | 'amber' | 'violet' {
  if (pct > 80) return 'green';
  if (pct >= 50) return 'amber';
  return 'violet';
}

function coverageTextColor(pct: number): string {
  if (pct > 80) return 'text-emerald-600';
  if (pct >= 50) return 'text-amber-600';
  return 'text-rose-600';
}

function attendanceTextColor(rate: number): string {
  if (rate >= 80) return 'text-emerald-600';
  if (rate >= 60) return 'text-amber-600';
  return 'text-rose-600';
}

export default function CourseCoverageTable({
  courses,
}: CourseCoverageTableProps) {
  if (courses.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Sin cursos para mostrar"
        description="No hay datos de cobertura de cursos disponibles."
        iconColor="#7c3aed"
      />
    );
  }

  return (
    <Card variant="default" aria-label="Tabla de cobertura por curso">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Curso
              </th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Asignatura
              </th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Docente
              </th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total
              </th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Completadas
              </th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Asistencia %
              </th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Revisiones pend.
              </th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[120px]">
                Cobertura OA %
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {courses.map((c) => (
              <tr
                key={c.courseId}
                className="hover:bg-slate-50/50 transition-colors"
              >
                <td className="py-3 px-3 font-medium text-slate-800">
                  {c.courseName}
                </td>
                <td className="py-3 px-3 text-slate-600">{c.subjectName}</td>
                <td className="py-3 px-3 text-slate-600">{c.teacherName}</td>
                <td className="py-3 px-3 text-center text-slate-600">
                  {c.sessionsTotal}
                </td>
                <td className="py-3 px-3 text-center text-emerald-600 font-medium">
                  {c.sessionsCompleted}
                </td>
                <td
                  className={`py-3 px-3 text-center font-medium ${attendanceTextColor(c.attendanceRate)}`}
                >
                  {c.attendanceRate.toFixed(1)}%
                </td>
                <td className="py-3 px-3 text-center text-amber-600 font-medium">
                  {c.pendingReviews}
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center justify-center gap-2">
                    <Badge color={coverageColor(c.coveragePercent)} size="sm">
                      {c.coveragePercent.toFixed(0)}%
                    </Badge>
                    <span
                      className={`text-xs font-medium ${coverageTextColor(c.coveragePercent)}`}
                    >
                      {c.coveragePercent > 80
                        ? '✓'
                        : c.coveragePercent >= 50
                          ? '!'
                          : '✗'}
                    </span>
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
