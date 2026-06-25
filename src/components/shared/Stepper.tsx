import { Check, ArrowRight, ArrowLeft } from 'lucide-react';

interface StepperProps {
  steps: string[];
  current: number;
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <div className="stepper">
      {steps.map((label, i) => {
        const num = i + 1;
        const active = num === current;
        const done = num < current;
        return (
          <div key={i} className={`stepper-step${active ? ' active' : ''}${done ? ' done' : ''}`}>
            <div className="stepper-circle">{done ? <Check size={14} /> : num}</div>
            <span className="stepper-label">{label}</span>
            {i < steps.length - 1 && <div className={`stepper-line${done ? ' done' : ''}`} />}
          </div>
        );
      })}
      <style>{`
        .stepper { display: flex; align-items: center; gap: 0; margin-bottom: 24px; padding: 4px 0; }
        .stepper-step { display: flex; align-items: center; gap: 8px; flex: 1; position: relative; }
        .stepper-circle { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; background: var(--card2); color: var(--muted); border: 2px solid var(--line); flex-shrink: 0; transition: all var(--t-base); }
        .stepper-step.active .stepper-circle { background: linear-gradient(135deg, var(--brand), var(--brand2)); color: #fff; border-color: transparent; box-shadow: 0 0 16px rgba(109,93,252,0.3); }
        .stepper-step.done .stepper-circle { background: var(--success); color: #fff; border-color: var(--success); }
        .stepper-label { font-size: 12px; font-weight: 600; color: var(--muted); white-space: nowrap; transition: color var(--t-base); }
        .stepper-step.active .stepper-label { color: var(--ink); }
        .stepper-step.done .stepper-label { color: var(--success); }
        .stepper-line { flex: 1; height: 2px; background: var(--line); margin: 0 12px; border-radius: 1px; transition: background var(--t-base); }
        .stepper-line.done { background: var(--success); }
      `}</style>
    </div>
  );
}
