import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function CollapsibleSection({ title, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card collapsible-section" style={{ marginBottom: 12 }}>
      <button
        className="collapsible-header"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px', border: 'none', background: 'transparent',
          cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--ink)',
        }}
      >
        <ChevronDown
          size={16}
          style={{ transition: 'transform .2s', transform: open ? 'rotate(0)' : 'rotate(-90deg)' }}
        />
        {title}
      </button>
      {open && <div className="collapsible-body" style={{ padding: '0 16px 16px' }}>{children}</div>}
    </div>
  );
}
