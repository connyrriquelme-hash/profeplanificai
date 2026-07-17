import { useState } from 'react';
import type { CoordinatorPlanningSummary } from '../../../types/classbookCoordinator';
import { Badge } from '../../ui/Badge';
import { EmptyState } from '../../ui/EmptyState';
import { ClipboardCheck, Check, AlertCircle, RotateCcw } from 'lucide-react';

interface PendingReviewsPanelProps {
  reviews: CoordinatorPlanningSummary[];
  onAction?: (reviewId: string, action: 'approve' | 'observe' | 'return', comment?: string) => Promise<void>;
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pendiente',
    observed: 'Observada',
    approved: 'Aprobada',
    reviewed: 'Revisada',
  };
  return map[status] ?? status;
}

function statusBadgeColor(
  status: string,
): 'amber' | 'violet' | 'green' | 'slate' {
  const map: Record<string, 'amber' | 'violet' | 'green' | 'slate'> = {
    pending: 'amber',
    observed: 'violet',
    approved: 'green',
    reviewed: 'green',
  };
  return map[status] ?? 'slate';
}

export default function PendingReviewsPanel({
  reviews,
  onAction,
}: PendingReviewsPanelProps) {
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="Sin revisiones pendientes"
        description="No hay planificaciones pendientes de revisión en este momento."
        iconColor="#7c3aed"
      />
    );
  }

  const handleAction = async (
    reviewId: string,
    action: 'approve' | 'observe' | 'return',
    comment?: string
  ) => {
    if (!onAction) return;
    setLoadingIds(prev => new Set(prev).add(reviewId));
    try {
      await onAction(reviewId, action, comment);
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(reviewId);
        return next;
      });
    }
  };

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="Sin revisiones pendientes"
        description="No hay planificaciones pendientes de revisión en este momento."
        iconColor="#7c3aed"
      />
    );
  }

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 overflow-hidden"
      aria-label="Panel de revisiones pendientes"
    >
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={16} className="text-violet-500" />
          <h3 className="text-sm font-bold text-slate-700">
            Revisiones pendientes ({reviews.length})
          </h3>
        </div>
      </div>
      <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
        {reviews.map((r) => (
          <div
            key={r.reviewId}
            className="px-4 py-3 hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {r.teacherName}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {r.courseName} · {r.subjectName}
                </p>
                {r.comments && (
                  <p className="text-xs text-slate-400 mt-1 italic truncate">
                    "{r.comments}"
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <Badge
                  color={statusBadgeColor(r.status)}
                  size="sm"
                >
                  {statusLabel(r.status)}
                </Badge>
                <span className="text-[10px] text-slate-400">
                  {new Date(r.createdAt).toLocaleDateString('es-CL')}
                </span>
                {onAction && r.status === 'pending' && (
                  <div className="flex items-center gap-1 mt-1">
                    <button
                      onClick={() => handleAction(r.reviewId, 'approve')}
                      disabled={loadingIds.has(r.reviewId)}
                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Aprobar revisión"
                      title="Aprobar"
                    >
                      <Check size={14} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => {
                        const comment = prompt('Comentario para observación (opcional):');
                        if (comment !== null) handleAction(r.reviewId, 'observe', comment);
                      }}
                      disabled={loadingIds.has(r.reviewId)}
                      className="p-1.5 rounded-lg text-violet-600 hover:bg-violet-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Observar revisión"
                      title="Observar"
                    >
                      <AlertCircle size={14} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => {
                        const comment = prompt('Comentario para devolución (requerido):');
                        if (comment !== null && comment.trim() !== '') handleAction(r.reviewId, 'return', comment.trim());
                      }}
                      disabled={loadingIds.has(r.reviewId)}
                      className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Devolver revisión"
                      title="Devolver"
                    >
                      <RotateCcw size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}