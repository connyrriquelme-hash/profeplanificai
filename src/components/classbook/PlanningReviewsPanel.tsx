import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { classbookService } from '../../services/classbookService';
import { canReviewPlanning } from '../../utils/classbookPermissions';
import type { ClassbookPlanningReview } from '../../types/classbook';

interface Props {
  institutionId: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-green-50 text-green-700',
  observed: 'bg-orange-50 text-orange-700',
  returned: 'bg-red-50 text-red-700',
  archived: 'bg-slate-100 text-slate-600',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  observed: 'Observada',
  returned: 'Devuelta',
  archived: 'Archivada',
};

export function PlanningReviewsPanel({ institutionId }: Props) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ClassbookPlanningReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    classbookService.getPlanningReviews(institutionId, ctrl.signal)
      .then(r => { setReviews(r); setLoading(false); })
      .catch(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [institutionId]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Revisiones de planificación</h1>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div role="status" aria-label="Cargando revisiones" className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <p className="text-sm text-slate-500">No hay revisiones registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <div key={review.id} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">Planificación: {review.planning_id}</p>
                  {review.comments && (
                    <p className="text-sm text-slate-600 mt-1">{review.comments}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">{review.created_at?.slice(0, 10)}</p>
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[review.status] ?? 'bg-slate-100 text-slate-500'}`}>
                  {STATUS_LABELS[review.status] ?? review.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
