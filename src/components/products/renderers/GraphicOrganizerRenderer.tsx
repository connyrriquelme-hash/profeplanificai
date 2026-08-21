/**
 * GraphicOrganizerRenderer — Premium renderer with SVG diagrams.
 *
 * Renders concept maps, mind maps, flowcharts, Venn diagrams,
 * KWL tables, and cycle diagrams using inline SVG.
 */

import { useMemo } from 'react';
import { ProductHeader } from '../ProductHeader';
import { useCoverImage } from '../useCoverImage';
import { ProductActionBar } from '../ProductActionBar';
import type { PedagogicalProduct, GraphicOrganizerNode } from '../types';

interface GraphicOrganizerRendererProps {
  product: PedagogicalProduct;
  className?: string;
  style?: React.CSSProperties;
  onProductChange?: (updated: PedagogicalProduct) => void;
}

const TYPE_LABELS: Record<string, string> = {
  concept_map: 'Mapa Conceptual', mind_map: 'Mapa Mental',
  flowchart: 'Diagrama de Flujo', venn: 'Diagrama de Venn',
  kwl: 'Tabla KWL', cycle: 'Diagrama de Ciclo',
};

const NODE_COLORS = ['#B5471F', '#06BFAD', '#F2A413', '#7F58A6', '#F24162', '#3B82F6'];

/* ─── SVG Diagrams ─── */

function MindMapSVG({ central, nodes }: { central: string; nodes: GraphicOrganizerNode[] }) {
  const cx = 400, cy = 250, r = 160;
  const angles = nodes.map((_, i) => (i / nodes.length) * 2 * Math.PI - Math.PI / 2);

  return (
    <svg viewBox="0 0 800 500" className="w-full h-auto">
      {/* Central node */}
      <circle cx={cx} cy={cy} r={50} fill="#B5471F" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="white" fontSize="13" fontWeight="bold" className="select-none">
        {central.length > 20 ? central.slice(0, 18) + '…' : central}
      </text>

      {nodes.map((node, i) => {
        const angle = angles[i];
        const nx = cx + r * Math.cos(angle);
        const ny = cy + r * Math.sin(angle);
        const color = node.color || NODE_COLORS[i % NODE_COLORS.length];

        return (
          <g key={i}>
            {/* Connection line */}
            <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth="2" strokeOpacity="0.4" />
            {/* Node circle */}
            <circle cx={nx} cy={ny} r={35} fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2" />
            <text x={nx} y={ny} textAnchor="middle" dominantBaseline="central" fill={color} fontSize="11" fontWeight="600" className="select-none">
              {node.label.length > 15 ? node.label.slice(0, 13) + '…' : node.label}
            </text>
            {/* Children */}
            {node.children?.slice(0, 3).map((child, ci) => {
              const spread = 0.3;
              const childAngle = angle + (ci - 1) * spread;
              const childR = r + 70;
              const childX = cx + childR * Math.cos(childAngle);
              const childY = cy + childR * Math.sin(childAngle);
              return (
                <g key={ci}>
                  <line x1={nx} y1={ny} x2={childX} y2={childY} stroke={color} strokeWidth="1" strokeOpacity="0.3" strokeDasharray="4,3" />
                  <rect x={childX - 45} y={childY - 12} width={90} height={24} rx={12} fill={color} fillOpacity="0.08" stroke={color} strokeWidth="1" strokeOpacity="0.3" />
                  <text x={childX} y={childY} textAnchor="middle" dominantBaseline="central" fill={color} fontSize="9" className="select-none">
                    {child.length > 16 ? child.slice(0, 14) + '…' : child}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

function FlowchartSVG({ nodes }: { nodes: GraphicOrganizerNode[] }) {
  const w = 800, nodeH = 50, gap = 30, startY = 40;
  const nodeW = 200;

  return (
    <svg viewBox={`0 0 ${w} ${startY + nodes.length * (nodeH + gap)}`} className="w-full h-auto">
      {nodes.map((node, i) => {
        const y = startY + i * (nodeH + gap);
        const color = NODE_COLORS[i % NODE_COLORS.length];
        return (
          <g key={i}>
            <rect x={(w - nodeW) / 2} y={y} width={nodeW} height={nodeH} rx={12} fill={color} fillOpacity="0.1" stroke={color} strokeWidth="2" />
            <text x={w / 2} y={y + nodeH / 2} textAnchor="middle" dominantBaseline="central" fill={color} fontSize="12" fontWeight="600" className="select-none">
              {node.label.length > 25 ? node.label.slice(0, 23) + '…' : node.label}
            </text>
            {i < nodes.length - 1 && (
              <>
                <line x1={w / 2} y1={y + nodeH} x2={w / 2} y2={y + nodeH + gap} stroke="#94A3B8" strokeWidth="2" />
                <polygon points={`${w / 2 - 5},${y + nodeH + gap - 6} ${w / 2 + 5},${y + nodeH + gap - 6} ${w / 2},${y + nodeH + gap}`} fill="#94A3B8" />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function CycleSVG({ nodes }: { nodes: GraphicOrganizerNode[] }) {
  const cx = 400, cy = 220, r = 150;
  const angles = nodes.map((_, i) => (i / nodes.length) * 2 * Math.PI - Math.PI / 2);

  return (
    <svg viewBox="0 0 800 440" className="w-full h-auto">
      {/* Cycle ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E2E8F0" strokeWidth="3" strokeDasharray="8,4" />
      {nodes.map((node, i) => {
        const angle = angles[i];
        const nx = cx + r * Math.cos(angle);
        const ny = cy + r * Math.sin(angle);
        const nextAngle = angles[(i + 1) % nodes.length];
        const arrowX = cx + (r - 15) * Math.cos((angle + nextAngle) / 2 + (nextAngle < angle ? Math.PI : 0));
        const arrowY = cy + (r - 15) * Math.sin((angle + nextAngle) / 2 + (nextAngle < angle ? Math.PI : 0));
        const color = NODE_COLORS[i % NODE_COLORS.length];

        return (
          <g key={i}>
            <circle cx={nx} cy={ny} r={30} fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2" />
            <text x={nx} y={ny} textAnchor="middle" dominantBaseline="central" fill={color} fontSize="10" fontWeight="600" className="select-none">
              {node.label.length > 12 ? node.label.slice(0, 10) + '…' : node.label}
            </text>
            {/* Arrow to next */}
            <circle cx={arrowX} cy={arrowY} r={4} fill={color} fillOpacity="0.5" />
          </g>
        );
      })}
    </svg>
  );
}

function KWLTable({ nodes }: { nodes: GraphicOrganizerNode[] }) {
  const cols = ['K — Sé', 'W — Quiero Saber', 'A — Aprendí'] as const;
  const colColors = ['#B5471F', '#F2A413', '#06BFAD'];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cols.map((title, ci) => (
        <div key={ci} className="rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="px-4 py-2.5 text-center" style={{ backgroundColor: colColors[ci] + '15' }}>
            <p className="text-sm font-bold" style={{ color: colColors[ci] }}>{title}</p>
          </div>
          <div className="p-3 space-y-1.5 min-h-[120px]">
            {nodes.filter((_, i) => i % 3 === ci).length > 0
              ? nodes.filter((_, i) => i % 3 === ci).map((n, i) => (
                  <div key={i} className="text-xs text-[var(--ink)] bg-white rounded-lg px-3 py-2 border border-[var(--border)]">
                    {n.label}
                  </div>
                ))
              : <p className="text-xs text-[var(--muted)] italic">Agregar…</p>
            }
          </div>
        </div>
      ))}
    </div>
  );
}

function VennSVG({ nodes }: { nodes: GraphicOrganizerNode[] }) {
  const circles = nodes.slice(0, 3);
  const positions = [
    { cx: 340, cy: 200 },
    { cx: 460, cy: 200 },
    { cx: 400, cy: 300 },
  ];
  const colors = ['#B5471F', '#06BFAD', '#F2A413'];

  return (
    <svg viewBox="0 0 800 420" className="w-full h-auto">
      {circles.map((node, i) => (
        <g key={i}>
          <circle cx={positions[i].cx} cy={positions[i].cy} r={100} fill={colors[i]} fillOpacity="0.1" stroke={colors[i]} strokeWidth="2" />
          <text x={positions[i].cx} y={positions[i].cy - 50} textAnchor="middle" fill={colors[i]} fontSize="12" fontWeight="bold" className="select-none">
            {node.label}
          </text>
          {node.children?.slice(0, 3).map((child, ci) => (
            <text key={ci} x={positions[i].cx} y={positions[i].cy - 25 + ci * 18} textAnchor="middle" fill={colors[i]} fontSize="9" className="select-none" fillOpacity="0.8">
              {child.length > 18 ? child.slice(0, 16) + '…' : child}
            </text>
          ))}
        </g>
      ))}
    </svg>
  );
}

function ConceptMapSVG({ central, nodes }: { central?: string; nodes: GraphicOrganizerNode[] }) {
  const cx = 400, cy = 250;
  const positions = nodes.map((_, i) => {
    const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + 180 * Math.cos(angle), y: cy + 150 * Math.sin(angle) };
  });

  return (
    <svg viewBox="0 0 800 500" className="w-full h-auto">
      {/* Central concept */}
      <rect x={cx - 60} y={cy - 25} width={120} height={50} rx={25} fill="#B5471F" fillOpacity="0.15" stroke="#B5471F" strokeWidth="2" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="#B5471F" fontSize="12" fontWeight="bold" className="select-none">
        {(central || 'Concepto').length > 16 ? (central || 'Concepto').slice(0, 14) + '…' : (central || 'Concepto')}
      </text>

      {nodes.map((node, i) => {
        const pos = positions[i];
        const color = NODE_COLORS[i % NODE_COLORS.length];
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={pos.x} y2={pos.y} stroke={color} strokeWidth="1.5" strokeOpacity="0.3" />
            <rect x={pos.x - 55} y={pos.y - 18} width={110} height={36} rx={18} fill={color} fillOpacity="0.1" stroke={color} strokeWidth="1.5" />
            <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fill={color} fontSize="10" fontWeight="600" className="select-none">
              {node.label.length > 14 ? node.label.slice(0, 12) + '…' : node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Main Renderer ─── */

export function GraphicOrganizerRenderer({ product, className, style, onProductChange }: GraphicOrganizerRendererProps) {
  const cover = useCoverImage(product, onProductChange);
  const { metadata, data } = product;
  const nodes = (data.nodes as GraphicOrganizerNode[]) || [];
  const organizerType = (data.organizerType as string) || 'concept_map';
  const centralConcept = data.centralConcept as string | undefined;
  const instructions = data.instructions as string | undefined;

  const diagram = useMemo(() => {
    switch (organizerType) {
      case 'mind_map':
        return <MindMapSVG central={centralConcept || metadata.title} nodes={nodes} />;
      case 'flowchart':
        return <FlowchartSVG nodes={nodes} />;
      case 'cycle':
        return <CycleSVG nodes={nodes} />;
      case 'venn':
        return <VennSVG nodes={nodes} />;
      case 'kwl':
        return <KWLTable nodes={nodes} />;
      case 'concept_map':
      default:
        return <ConceptMapSVG central={centralConcept} nodes={nodes} />;
    }
  }, [organizerType, centralConcept, nodes, metadata.title]);

  return (
    <div
      className={`graphic-organizer-renderer w-full space-y-6 p-4 md:p-6 lg:p-8 print:m-0 print:max-w-none print:p-0 ${className || ''}`}
      style={style}
    >
      <ProductHeader
        title={metadata.title}
        subtitle={metadata.subtitle || TYPE_LABELS[organizerType] || 'Organizador Gráfico'}
        level={metadata.level}
        subject={metadata.subject}
        oaCode={metadata.oaCode}
        oaText={metadata.oaText}
        date={metadata.date}
        teacherName={metadata.teacherName}
        className="mb-6"
        coverImageUrl={cover.coverImageUrl}
        onGenerateCoverImage={cover.canGenerate ? cover.generate : undefined}
        isGeneratingCoverImage={cover.isGenerating}
        coverImageError={cover.error}
      />

      {instructions && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
          <p className="text-sm text-[var(--ink)]">{instructions}</p>
        </div>
      )}

      {/* Diagram */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-6 shadow-sm overflow-hidden">
        {nodes.length > 0 ? diagram : (
          <div className="py-12 text-center text-[var(--muted)]">
            <p className="text-sm">Sin elementos para mostrar</p>
          </div>
        )}
      </div>

      {/* Node details list */}
      {nodes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {nodes.map((node, i) => {
            const color = NODE_COLORS[i % NODE_COLORS.length];
            return (
              <div key={i} className="rounded-xl border border-[var(--border)] bg-white p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <p className="text-sm font-semibold text-[var(--ink)]">{node.label}</p>
                </div>
                {node.children && node.children.length > 0 && (
                  <ul className="ml-5 space-y-0.5">
                    {node.children.map((child, ci) => (
                      <li key={ci} className="text-xs text-[var(--muted)]">• {child}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action bar */}
      <div className="print:hidden">
        <ProductActionBar product={product} />
      </div>
    </div>
  );
}
