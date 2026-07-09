import { useState, useCallback } from 'react';
import { Maximize2, X, Printer, Download, ChevronDown, ChevronUp } from 'lucide-react';
import type { PremiumRubric, RubricCriterion, RubricPerformanceLevel } from '../utils/premiumRubricModel';

const hexToCss = (hex: string) => `#${hex}`;

function RubricTable({ criteria, levels }: { criteria: RubricCriterion[]; levels: RubricPerformanceLevel[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="px-3 py-2.5 text-left font-bold text-gray-800 bg-gray-100 border border-gray-200 rounded-tl-lg min-w-[180px]">
              Criterio
            </th>
            {levels.map((level, i) => (
              <th
                key={level.id}
                className="px-3 py-2.5 text-center font-bold text-white border border-gray-200 min-w-[160px]"
                style={{
                  backgroundColor: hexToCss(level.color),
                  borderRadius: i === levels.length - 1 ? '0 8px 0 0' : undefined,
                }}
              >
                <div>{level.label}</div>
                <div className="text-[10px] font-normal opacity-80">{level.score} pts</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {criteria.map((criterion, ci) => (
            <tr key={criterion.id} className={ci % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
              <td className="px-3 py-3 border border-gray-200 font-medium text-gray-800 align-top">
                <div className="text-sm font-semibold">{criterion.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{criterion.description}</div>
                {criterion.weight && (
                  <div className="text-[10px] text-indigo-600 mt-1 font-medium">Peso: {criterion.weight}%</div>
                )}
              </td>
              {levels.map(level => {
                const indicator = criterion.indicators.find(ind => ind.levelId === level.id);
                return (
                  <td key={level.id} className="px-3 py-3 border border-gray-200 text-xs text-gray-700 align-top">
                    <div className="leading-relaxed">{indicator?.descriptor || '—'}</div>
                    {indicator?.evidence && (
                      <div className="mt-1.5 text-[10px] text-gray-500 italic">
                        Evidencia: {indicator.evidence}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FeedbackSection({ criteria, levels }: { criteria: RubricCriterion[]; levels: RubricPerformanceLevel[] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
      >
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        Retroalimentación sugerida por criterio
      </button>
      {expanded && (
        <div className="mt-3 space-y-3">
          {criteria.map(criterion => (
            <div key={criterion.id} className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
              <div className="text-xs font-bold text-indigo-800 mb-2">{criterion.name}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {levels.map(level => {
                  const indicator = criterion.indicators.find(ind => ind.levelId === level.id);
                  return indicator?.feedbackSuggestion ? (
                    <div key={level.id} className="flex items-start gap-2">
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: hexToCss(level.color) }}
                      />
                      <div>
                        <div className="text-[10px] font-semibold text-gray-600">{level.label}:</div>
                        <div className="text-xs text-gray-700">{indicator.feedbackSuggestion}</div>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DUASection({ adjustments }: { adjustments: string[] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-semibold text-purple-800 hover:text-purple-900 w-full text-left"
      >
        <span className="text-lg">🌈</span>
        Adecuaciones inclusivas / DUA
        {expanded ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
      </button>
      {expanded && (
        <ul className="mt-3 space-y-1.5">
          {adjustments.map((adj, i) => (
            <li key={i} className="text-xs text-purple-700 flex items-start gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              {adj}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SelfAssessmentSection({ selfAssessment }: { selfAssessment: { title: string; prompts: string[] } }) {
  return (
    <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📝</span>
        <span className="text-sm font-semibold text-amber-800">{selfAssessment.title}</span>
      </div>
      <div className="space-y-2">
        {selfAssessment.prompts.map((prompt, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-5 h-5 rounded border border-amber-300 bg-white flex-shrink-0 mt-0.5" />
            <span className="text-xs text-amber-700">{prompt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function generatePrintHTML(rubric: PremiumRubric): string {
  const levelsHeader = rubric.levels.map(l =>
    `<th style="background-color:${hexToCss(l.color)};color:#fff;padding:10px;text-align:center;font-size:13px;border:1px solid #ddd">${l.label}<br><span style="font-size:11px;opacity:0.8">${l.score} pts</span></th>`
  ).join('');

  const criteriaRows = rubric.criteria.map((c, ci) => {
    const bgColor = ci % 2 === 0 ? '#fff' : '#f9fafb';
    const cells = rubric.levels.map(l => {
      const ind = c.indicators.find(i => i.levelId === l.id);
      return `<td style="padding:10px;border:1px solid #ddd;font-size:12px;vertical-align:top;background-color:${bgColor}">
        <div style="line-height:1.5">${ind?.descriptor || '—'}</div>
        ${ind?.evidence ? `<div style="margin-top:6px;font-size:10px;color:#6b7280;font-style:italic">Evidencia: ${ind.evidence}</div>` : ''}
      </td>`;
    }).join('');
    return `<tr>
      <td style="padding:10px;border:1px solid #ddd;font-weight:600;font-size:13px;vertical-align:top;background-color:${bgColor}">
        ${c.name}<br><span style="font-weight:normal;font-size:11px;color:#6b7280">${c.description}</span>
      </td>
      ${cells}
    </tr>`;
  }).join('');

  const duaList = rubric.inclusiveAdjustments.map(a => `<li style="margin-bottom:4px;font-size:12px;color:#6b21a8">${a}</li>`).join('');
  const selfAssessList = rubric.studentSelfAssessment.prompts.map(p => `<li style="margin-bottom:4px;font-size:12px;color:#92400e">☐ ${p}</li>`).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${rubric.title}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:system-ui,-apple-system,sans-serif; color:#1f2937; padding:24px; max-width:1100px; margin:0 auto; }
  h1 { font-size:18px; font-weight:700; margin-bottom:4px; }
  .subtitle { font-size:13px; color:#6b7280; margin-bottom:16px; }
  .meta { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; }
  .badge { display:inline-block; padding:2px 10px; border-radius:9999px; font-size:11px; font-weight:600; }
  .section-title { font-size:14px; font-weight:700; margin:16px 0 8px; color:#374151; }
  table { width:100%; border-collapse:collapse; margin-bottom:16px; }
  .dua-box { background:#faf5ff; border:1px solid #e9d5ff; border-radius:8px; padding:12px; margin-bottom:16px; }
  .self-assess { background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:12px; }
  @media print { body { padding:12px; } }
</style>
</head>
<body>
<h1>${rubric.title}</h1>
<div class="subtitle">${rubric.subtitle}</div>
<div class="meta">
  <span class="badge" style="background:#ede9fe;color:#5b21b6">${rubric.nivel}</span>
  <span class="badge" style="background:#d1fae5;color:#065f46">${rubric.asignatura}</span>
  <span class="badge" style="background:#fef3c7;color:#92400e">${rubric.oa}</span>
</div>
<div style="margin-bottom:12px;font-size:12px"><strong>Meta de aprendizaje:</strong> ${rubric.learningGoal}</div>
<div style="margin-bottom:16px;font-size:12px"><strong>En lenguaje estudiante:</strong> <em>${rubric.studentFriendlyGoal}</em></div>

<table>
  <thead><tr><th style="background:#f3f4f6;padding:10px;text-align:left;font-size:13px;border:1px solid #ddd;min-width:180px">Criterio</th>${levelsHeader}</tr></thead>
  <tbody>${criteriaRows}</tbody>
</table>

<div class="dua-box">
  <div style="font-weight:700;font-size:13px;margin-bottom:6px;color:#6b21a8">🌈 Adecuaciones inclusivas / DUA</div>
  <ul style="padding-left:16px">${duaList}</ul>
</div>

<div class="self-assess">
  <div style="font-weight:700;font-size:13px;margin-bottom:6px;color:#92400e">📝 ${rubric.studentSelfAssessment.title}</div>
  <ul style="padding-left:16px">${selfAssessList}</ul>
</div>

<div style="margin-top:16px;font-size:11px;color:#9ca3af;text-align:center">
  Generado por PlanificaIA Chile — ${rubric.scoringFormula}
</div>
</body>
</html>`;
}

interface PremiumRubricPreviewProps {
  rubric: PremiumRubric;
}

export default function PremiumRubricPreview({ rubric }: PremiumRubricPreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handlePrint = useCallback(() => {
    const html = generatePrintHTML(rubric);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 300);
    }
  }, [rubric]);

  const handleDownloadHTML = useCallback(() => {
    const html = generatePrintHTML(rubric);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rubrica-${rubric.oa.replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rubric]);

  const content = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{rubric.title}</h3>
          <p className="text-sm text-gray-500">{rubric.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            <Printer size={14} /> Imprimir
          </button>
          <button
            onClick={handleDownloadHTML}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            <Download size={14} /> Descargar HTML
          </button>
          {!isFullscreen && (
            <button
              onClick={() => setIsFullscreen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              <Maximize2 size={14} /> Pantalla completa
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">{rubric.nivel}</span>
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">{rubric.asignatura}</span>
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">{rubric.oa}</span>
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">{rubric.criteria.length} criterios</span>
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">{rubric.totalScore} puntos</span>
      </div>

      <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 space-y-1">
        <div><strong>Meta de aprendizaje:</strong> {rubric.learningGoal}</div>
        <div><strong>En lenguaje estudiante:</strong> <em>{rubric.studentFriendlyGoal}</em></div>
        <div><strong>Puntaje:</strong> {rubric.scoringFormula}</div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <RubricTable criteria={rubric.criteria} levels={rubric.levels} />
        </div>
      </div>

      <FeedbackSection criteria={rubric.criteria} levels={rubric.levels} />
      <DUASection adjustments={rubric.inclusiveAdjustments} />
      <SelfAssessmentSection selfAssessment={rubric.studentSelfAssessment} />

      <div className="mt-4 p-3 bg-gray-50 rounded-xl">
        <div className="text-xs font-semibold text-gray-600 mb-2">Instrucciones de uso</div>
        <ol className="list-decimal list-inside space-y-1">
          {rubric.usageInstructions.map((inst, i) => (
            <li key={i} className="text-xs text-gray-600">{inst}</li>
          ))}
        </ol>
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-auto">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-800">Vista previa — Rúbrica Premium</span>
          <button
            onClick={() => setIsFullscreen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-w-6xl mx-auto p-6">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
      {content}
    </div>
  );
}
