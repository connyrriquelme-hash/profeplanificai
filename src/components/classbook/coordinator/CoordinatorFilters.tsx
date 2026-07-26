import type { CoordinatorDashboardFilters } from '../../../types/classbookCoordinator';
import { Filter } from 'lucide-react';

interface CoordinatorFiltersProps {
  filters: CoordinatorDashboardFilters;
  onFilterChange: (filters: CoordinatorDashboardFilters) => void;
  academicYears: { id: string; name: string }[];
  terms: { id: string; name: string }[];
  courses: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
}

export default function CoordinatorFilters({
  filters,
  onFilterChange,
  academicYears,
  terms,
  courses,
  subjects,
  teachers,
}: CoordinatorFiltersProps) {
  const handleChange = (
    field: keyof CoordinatorDashboardFilters,
    value: string,
  ) => {
    onFilterChange({ ...filters, [field]: value || undefined });
  };

  const selectClass =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-colors';
  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-colors';

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 p-4"
      aria-label="Filtros del dashboard de coordinación"
    >
      <div className="flex items-center gap-2 mb-3">
        <Filter size={16} className="text-slate-400" />
        <span className="text-sm font-semibold text-slate-700">Filtros</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Año lectivo
          </label>
          <select
            className={selectClass}
            value={filters.academicYearId ?? ''}
            onChange={(e) => handleChange('academicYearId', e.target.value)}
            aria-label="Seleccionar año lectivo"
          >
            <option value="">Todos</option>
            {academicYears.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Período
          </label>
          <select
            className={selectClass}
            value={filters.termId ?? ''}
            onChange={(e) => handleChange('termId', e.target.value)}
            aria-label="Seleccionar período"
          >
            <option value="">Todos</option>
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Curso
          </label>
          <select
            className={selectClass}
            value={filters.courseId ?? ''}
            onChange={(e) => handleChange('courseId', e.target.value)}
            aria-label="Seleccionar curso"
          >
            <option value="">Todos</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Asignatura
          </label>
          <select
            className={selectClass}
            value={filters.subjectId ?? ''}
            onChange={(e) => handleChange('subjectId', e.target.value)}
            aria-label="Seleccionar asignatura"
          >
            <option value="">Todas</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Docente
          </label>
          <select
            className={selectClass}
            value={filters.teacherId ?? ''}
            onChange={(e) => handleChange('teacherId', e.target.value)}
            aria-label="Seleccionar docente"
          >
            <option value="">Todos</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Estado
          </label>
          <select
            className={selectClass}
            value={filters.status ?? ''}
            onChange={(e) => handleChange('status', e.target.value)}
            aria-label="Seleccionar estado"
          >
            <option value="">Todos</option>
            <option value="scheduled">Programada</option>
            <option value="completed">Completada</option>
            <option value="pending_signature">Pendiente firma</option>
            <option value="signed">Firmada</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Desde
          </label>
          <input
            type="date"
            className={inputClass}
            value={filters.dateFrom ?? ''}
            onChange={(e) => handleChange('dateFrom', e.target.value)}
            aria-label="Fecha desde"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Hasta
          </label>
          <input
            type="date"
            className={inputClass}
            value={filters.dateTo ?? ''}
            onChange={(e) => handleChange('dateTo', e.target.value)}
            aria-label="Fecha hasta"
          />
        </div>
      </div>
    </div>
  );
}
