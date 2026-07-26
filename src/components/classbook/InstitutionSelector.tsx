import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { classbookService } from '../../services/classbookService';

export function InstitutionSelector() {
  const { user, activeInstitutionId, setActiveInstitution, clearActiveInstitution } = useAuth();
  const [institutions, setInstitutions] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.institutionalRole !== 'super_admin') {
      setLoading(false);
      return;
    }

    const ctrl = new AbortController();
    setLoading(true);
    classbookService.getInstitutions(ctrl.signal)
      .then((data) => {
        setInstitutions(data);
        if (activeInstitutionId && !data.some(i => i.id === activeInstitutionId)) {
          clearActiveInstitution();
        }
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError('Error al cargar instituciones');
          setLoading(false);
        }
      });
    return () => ctrl.abort();
  }, [user?.institutionalRole]);

  if (!user || user.institutionalRole !== 'super_admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500">
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Cargando instituciones...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-red-600">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        {error}
      </div>
    );
  }

  if (institutions.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Sin instituciones disponibles
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="institution-selector" className="text-xs font-medium text-slate-500">
        Institución activa
      </label>
      <select
        id="institution-selector"
        value={activeInstitutionId || ''}
        onChange={(e) => setActiveInstitution(e.target.value)}
        className="w-auto min-w-[200px] max-w-[300px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-colors"
        aria-label="Seleccionar institución activa"
      >
        <option value="">Seleccionar institución</option>
        {institutions.map((inst) => (
          <option key={inst.id} value={inst.id}>
            {inst.name}
          </option>
        ))}
      </select>
    </div>
  );
}
