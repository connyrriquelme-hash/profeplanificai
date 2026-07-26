import type { CoordinatorSignatureSummary } from '../../../types/classbookCoordinator';
import { Badge } from '../../ui/Badge';
import { EmptyState } from '../../ui/EmptyState';
import { PenLine, ExternalLink } from 'lucide-react';

interface PendingSignaturesPanelProps {
  signatures: CoordinatorSignatureSummary[];
  onOpenSession?: (sessionId: string) => void;
}

export default function PendingSignaturesPanel({
  signatures,
  onOpenSession,
}: PendingSignaturesPanelProps) {
  if (signatures.length === 0) {
    return (
      <EmptyState
        icon={PenLine}
        title="Sin firmas pendientes"
        description="Todas las sesiones tienen sus firmas al día."
        iconColor="#7c3aed"
      />
    );
  }

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 overflow-hidden"
      aria-label="Panel de firmas pendientes"
    >
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <PenLine size={16} className="text-amber-500" />
          <h3 className="text-sm font-bold text-slate-700">
            Firmas pendientes ({signatures.length})
          </h3>
        </div>
      </div>
      <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
        {signatures.map((s) => (
          <div
            key={s.sessionId}
            className="px-4 py-3 hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">
                  {new Date(s.date).toLocaleDateString('es-CL')}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {s.teacherName} · {s.courseName} · {s.subjectName}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <Badge color="amber" size="sm">
                  v{s.version}
                </Badge>
                <span className="text-[10px] text-slate-400">
                  Pend. desde {new Date(s.pendingSince).toLocaleDateString('es-CL')}
                </span>
                {onOpenSession && (
                  <button
                    onClick={() => onOpenSession(s.sessionId)}
                    className="mt-1 p-1.5 rounded-lg text-violet-600 hover:bg-violet-50 transition-colors flex items-center gap-1"
                    aria-label={`Abrir sesión ${s.sessionId}`}
                    title="Abrir sesión"
                  >
                    <ExternalLink size={12} strokeWidth={2.5} />
                    <span className="text-xs font-medium">Abrir</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}