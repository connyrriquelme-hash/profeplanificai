import { AlertTriangle, CheckCircle2, CircleAlert } from 'lucide-react';

interface QualityReviewPanelProps {
  status: 'ready' | 'draft' | 'blocked';
  score: number;
  issues: Array<{ severity: 'error' | 'warning'; message: string }>;
}

export function QualityReviewPanel({ status, score, issues }: QualityReviewPanelProps) {
  const ready = status === 'ready';
  return (
    <section className={`border-b px-4 py-3 ${ready ? 'border-emerald-200 bg-emerald-50' : status === 'blocked' ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50'}`}>
      <div className="flex items-start gap-2">
        {ready ? <CheckCircle2 size={17} className="mt-0.5 text-emerald-600" /> : <AlertTriangle size={17} className={`mt-0.5 ${status === 'blocked' ? 'text-rose-600' : 'text-amber-600'}`} />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-slate-800">Revisión pedagógica</h3>
            <span className="text-[11px] font-semibold text-slate-600">{score}/100</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-600">{ready ? 'El producto cumple los controles básicos para revisión final docente.' : status === 'blocked' ? 'Hay problemas que deben corregirse antes de aplicarlo.' : 'Es un borrador y necesita revisión docente.'}</p>
          {issues.length > 0 && <ul className="mt-2 space-y-1">{issues.slice(0, 4).map((issue, index) => <li key={`${issue.message}-${index}`} className="flex gap-1.5 text-[10px] text-slate-600"><CircleAlert size={12} className="mt-0.5 flex-shrink-0" />{issue.message}</li>)}</ul>}
        </div>
      </div>
    </section>
  );
}