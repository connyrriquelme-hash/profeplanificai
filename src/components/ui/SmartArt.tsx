import type { ReactNode } from 'react';

export type SmartArtType = 'process' | 'cycle' | 'hierarchy' | 'comparison';

export interface SmartArtNode {
  id: string;
  label: string;
  description?: string;
  icon?: string;
}

export interface SmartArtEdge {
  from: string;
  to: string;
  label?: string;
}

interface SmartArtProps {
  type: SmartArtType;
  nodes: SmartArtNode[];
  edges?: SmartArtEdge[];
  className?: string;
  compact?: boolean;
}

const THEME = {
  primary: '#213885',
  secondary: '#5F3475',
  accent: '#893172',
  beige: '#ECDFD2',
  gray: '#CCCACC',
  text: '#1A1A2E',
} as const;

function getNodeColor(index: number, total: number): string {
  const colors = [THEME.primary, THEME.secondary, THEME.accent];
  return colors[index % colors.length];
}

function ProcessDiagram({ nodes, compact }: { nodes: SmartArtNode[]; compact?: boolean }) {
  const nodeSize = compact ? { w: 120, h: 60 } : { w: 160, h: 80 };
  const gap = compact ? 30 : 50;
  const arrowW = compact ? 20 : 30;
  const totalW = nodes.length * nodeSize.w + (nodes.length - 1) * (gap + arrowW);
  const svgH = compact ? 100 : 140;

  return (
    <svg viewBox={`0 0 ${totalW + 40} ${svgH}`} className="w-full h-auto" role="img" aria-label="Diagrama de proceso">
      {nodes.map((node, i) => {
        const x = 20 + i * (nodeSize.w + gap + arrowW);
        const y = (svgH - nodeSize.h) / 2;
        const color = getNodeColor(i, nodes.length);

        return (
          <g key={node.id}>
            <rect x={x} y={y} width={nodeSize.w} height={nodeSize.h} rx={12} fill={color} className="drop-shadow-md" />
            <text x={x + nodeSize.w / 2} y={y + nodeSize.h / 2 - (compact ? 0 : 4)} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={compact ? 12 : 14} fontWeight={600}>
              {node.label}
            </text>
            {node.description && !compact && (
              <text x={x + nodeSize.w / 2} y={y + nodeSize.h / 2 + 16} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.8)" fontSize={10}>
                {node.description}
              </text>
            )}
            {i < nodes.length - 1 && (
              <>
                <defs>
                  <marker id={`arrow-${i}`} markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill={THEME.gray} />
                  </marker>
                </defs>
                <line x1={x + nodeSize.w + 4} y1={y + nodeSize.h / 2} x2={x + nodeSize.w + gap + arrowW - 4} y2={y + nodeSize.h / 2} stroke={THEME.gray} strokeWidth={2} markerEnd={`url(#arrow-${i})`} />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function CycleDiagram({ nodes, compact }: { nodes: SmartArtNode[]; compact?: boolean }) {
  const size = compact ? 180 : 260;
  const cx = size / 2;
  const cy = size / 2;
  const radius = compact ? 60 : 90;
  const nodeR = compact ? 28 : 38;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto max-w-[280px] mx-auto" role="img" aria-label="Diagrama de ciclo">
      <defs>
        <marker id="cycle-arrow" markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill={THEME.gray} />
        </marker>
      </defs>
      {nodes.map((node, i) => {
        const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        const color = getNodeColor(i, nodes.length);

        return (
          <g key={node.id}>
            <circle cx={x} cy={y} r={nodeR} fill={color} className="drop-shadow-md" />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={compact ? 10 : 12} fontWeight={600}>
              {node.label.length > 12 ? node.label.slice(0, 12) + '…' : node.label}
            </text>
          </g>
        );
      })}
      {nodes.map((_, i) => {
        const a1 = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
        const a2 = (2 * Math.PI * ((i + 1) % nodes.length)) / nodes.length - Math.PI / 2;
        const x1 = cx + (radius - nodeR - 6) * Math.cos(a1);
        const y1 = cy + (radius - nodeR - 6) * Math.sin(a1);
        const x2 = cx + (radius - nodeR - 6) * Math.cos(a2);
        const y2 = cy + (radius - nodeR - 6) * Math.sin(a2);

        return <line key={`edge-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={THEME.gray} strokeWidth={2} markerEnd="url(#cycle-arrow)" />;
      })}
    </svg>
  );
}

function HierarchyDiagram({ nodes, compact }: { nodes: SmartArtNode[]; compact?: boolean }) {
  const levels = new Map<number, SmartArtNode[]>();
  nodes.forEach((n, i) => {
    const level = i === 0 ? 0 : Math.floor(Math.log2(i + 1));
    const arr = levels.get(level) || [];
    arr.push(n);
    levels.set(level, arr);
  });

  const maxLevel = Math.max(...levels.keys());
  const nodeW = compact ? 100 : 130;
  const nodeH = compact ? 40 : 50;
  const levelH = compact ? 60 : 80;
  const svgH = (maxLevel + 1) * (nodeH + levelH) + 20;
  const svgW = (levels.get(0)?.length || 1) * (nodeW + 30) * Math.pow(2, maxLevel);

  const positions = new Map<string, { x: number; y: number }>();

  for (let lvl = 0; lvl <= maxLevel; lvl++) {
    const nodesInLevel = levels.get(lvl) || [];
    const totalW = nodesInLevel.length * (nodeW + 20);
    const startX = (svgW - totalW) / 2;

    nodesInLevel.forEach((n, i) => {
      positions.set(n.id, {
        x: startX + i * (nodeW + 20) + nodeW / 2,
        y: 20 + lvl * (nodeH + levelH) + nodeH / 2,
      });
    });
  }

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto" role="img" aria-label="Diagrama jerárquico">
      {nodes.map((node, i) => {
        if (i === 0) return null;
        const parentIdx = Math.floor((i - 1) / 2);
        const parent = nodes[parentIdx];
        const pPos = positions.get(parent.id);
        const nPos = positions.get(node.id);
        if (!pPos || !nPos) return null;

        return <line key={`edge-${i}`} x1={pPos.x} y1={pPos.y + nodeH / 2} x2={nPos.x} y2={nPos.y - nodeH / 2} stroke={THEME.gray} strokeWidth={2} />;
      })}
      {nodes.map((node, i) => {
        const pos = positions.get(node.id);
        if (!pos) return null;
        const color = getNodeColor(i, nodes.length);

        return (
          <g key={node.id}>
            <rect x={pos.x - nodeW / 2} y={pos.y - nodeH / 2} width={nodeW} height={nodeH} rx={8} fill={color} className="drop-shadow-md" />
            <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={compact ? 10 : 12} fontWeight={600}>
              {node.label.length > 14 ? node.label.slice(0, 14) + '…' : node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ComparisonDiagram({ nodes, compact }: { nodes: SmartArtNode[]; compact?: boolean }) {
  const cols = Math.min(nodes.length, 3);
  const cardW = compact ? 120 : 160;
  const cardH = compact ? 80 : 100;
  const gap = 20;
  const svgW = cols * cardW + (cols - 1) * gap + 40;
  const svgH = cardH + 60;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto" role="img" aria-label="Diagrama comparativo">
      {nodes.slice(0, cols).map((node, i) => {
        const x = 20 + i * (cardW + gap);
        const y = 40;
        const color = getNodeColor(i, nodes.length);

        return (
          <g key={node.id}>
            <rect x={x} y={y} width={cardW} height={cardH} rx={12} fill={color} className="drop-shadow-md" />
            <text x={x + cardW / 2} y={y + 20} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={compact ? 11 : 13} fontWeight={700}>
              {node.label}
            </text>
            {node.description && !compact && (
              <foreignObject x={x + 8} y={y + 34} width={cardW - 16} height={cardH - 44}>
                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 10, lineHeight: '1.3', textAlign: 'center', overflow: 'hidden' }}>
                  {node.description}
                </div>
              </foreignObject>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function SmartArt({ type, nodes, compact = false }: SmartArtProps) {
  if (nodes.length === 0) return null;

  switch (type) {
    case 'process':
      return <ProcessDiagram nodes={nodes} compact={compact} />;
    case 'cycle':
      return <CycleDiagram nodes={nodes} compact={compact} />;
    case 'hierarchy':
      return <HierarchyDiagram nodes={nodes} compact={compact} />;
    case 'comparison':
      return <ComparisonDiagram nodes={nodes} compact={compact} />;
    default:
      return null;
  }
}
