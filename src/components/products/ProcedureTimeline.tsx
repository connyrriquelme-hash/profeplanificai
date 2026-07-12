/** Procedure Timeline Component

Displays procedure steps as a numbered timeline.
*/

interface ProcedureStep {
  step: number;
  instruction: string;
  teacherSupport?: string;
  studentAction?: string;
  visualCue?: string;
  estimatedMinutes?: number;
}

interface ProcedureTimelineProps {
  procedure: ProcedureStep[];
  className?: string;
  style?: React.CSSProperties;
}

function VisualIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
  );
}

export function ProcedureTimeline({ procedure, className, style }: ProcedureTimelineProps) {
  if (!procedure || procedure.length === 0) {
    return (
      <p className="text-gray-500 text-sm italic">No hay pasos de procedimiento definidos.</p>
    );
  }

  return (
    <div className={`procedure-timeline space-y-4 ${className || ''}`} style={style}>
      {procedure.map((step, index) => (
        <StepItem key={index} step={step} index={index} total={procedure.length} />
      ))}
    </div>
  );
}

function StepItem({ step, index, total }: { step: ProcedureStep; index: number; total: number }) {
  const {
    instruction,
    teacherSupport,
    studentAction,
    visualCue,
    estimatedMinutes
  } = step;

  return (
    <article key={index} className="procedure-step relative">
      <div className="flex gap-4">
        <div className="flex-shrink-0 relative">
          <span
            className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm"
            aria-label={`Paso ${step.step}`}
          >
            {step.step}
          </span>
          {index < total - 1 && (
            <div className="absolute left-3.5 top-8 bottom-0 w-0.5 bg-gray-200" aria-hidden="true" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">{instruction}</h4>
            
            <div className="space-y-2 mt-3">
              {teacherSupport && (
                <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                  <div className="flex items-center gap-1.5 text-indigo-800 text-sm mb-1">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L9.889 15 8 17.361l8-5.554 2.03 1.27L20 9.214V6a2 2 0 00-2-2h-4a2 2 0 00-2 2v.677l-5.606 2.803A1 1 0 012 11.5V6a2 2 0 012-2h4a2 2 0 012 2v.677l5.606 2.803A1 1 0 0118 8.5V8a2 2 0 00-2 2v.677l-8 4.5 2.03 1.27L15 19.17V16a2 2 0 00-2 2h-4a2 2 0 01-2-2v-.677l-5.606-2.803A1 1 0 012 11.5V6a2 2 0 012-2h4a2 2 0 012 2v.677l5.606 2.803A1 1 0 0118 8.5V8a2 2 0 00-2 2v.677l-8 4.5 2.03 1.27L15 19.17V16a2 2 0 00-2 2h-4a2 2 0 01-2-2v-.677l-5.606-2.803A1 1 0 012 11.5V6a2 2 0 012-2h4a2 2 0 012 2v.677l5.606 2.803A1 1 0 0118 8.5V8a2 2 0 00-2 2v.677l-8 4.5 2.03 1.27L15 19.17V16a2 2 0 00-2 2h-4a2 2 0 01-2-2z" />
                    </svg>
                    <span className="font-medium">Apoyo docente:</span>
                  </div>
                  <p className="text-indigo-700 text-sm mt-1">{teacherSupport}</p>
                </div>
              )}
              {studentAction && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                  <div className="flex items-center gap-1.5 text-green-800 text-sm mb-1">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L9.889 15 8 17.361l8-5.554 2.03 1.27L20 9.214V6a2 2 0 00-2-2h-4a2 2 0 00-2 2v.677l-5.606 2.803A1 1 0 012 11.5V6a2 2 0 012-2h4a2 2 0 012 2v.677l5.606 2.803A1 1 0 0118 8.5V8a2 2 0 00-2 2v.677l-8 4.5 2.03 1.27L15 19.17V16a2 2 0 00-2 2h-4a2 2 0 01-2-2v-.677l-5.606-2.803A1 1 0 012 11.5V6a2 2 0 012-2h4a2 2 0 012 2v.677l5.606 2.803A1 1 0 0118 8.5V8a2 2 0 00-2 2v.677l-8 4.5 2.03 1.27L15 19.17V16a2 2 0 00-2 2h-4a2 2 0 01-2-2z" />
                    </svg>
                    <span className="font-medium">Acción del estudiante:</span>
                  </div>
                  <p className="text-green-700 text-sm mt-1">{studentAction}</p>
                </div>
              )}
              {visualCue && (
                <div className="bg-teal-50 p-3 rounded-lg border border-teal-100">
                  <div className="flex items-center gap-1.5 text-teal-800 text-sm mb-1">
                    <VisualIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">Pista visual:</span>
                  </div>
                  <p className="text-teal-700 text-sm">{visualCue}</p>
                </div>
              )}
              {estimatedMinutes && (
                <div className="flex items-center gap-1.5 text-amber-800 text-sm bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Tiempo estimado:</span>
                  <span>{estimatedMinutes} min</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}