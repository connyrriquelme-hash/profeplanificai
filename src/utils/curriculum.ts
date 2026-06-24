import { getDB } from '../services/curriculumService';
import type { CurriculumItem } from '../types';

export function buildOAContext(nivel: string, asignatura: string, oaText: string): string {
  const db = getDB();
  const matching = db.filter((o) => o.curso === nivel && o.asignatura === asignatura);
  if (matching.length === 0) return '';

  const partes: string[] = ['## Contexto curricular - OA vigentes en Chile'];
  const oaLower = oaText.toLowerCase();

  const exactos = matching.filter(
    (o) =>
      oaText.includes(o.id) ||
      o.id.toLowerCase().includes(oaLower) ||
      o.oa.toLowerCase().includes(oaLower) ||
      o.habilidad.toLowerCase().includes(oaLower) ||
      o.indicadores.some((i) => i.toLowerCase().includes(oaLower)),
  );

  const relevantes = exactos.length > 0 ? exactos : matching.slice(0, 3);

  for (const oa of relevantes) {
    partes.push('');
    partes.push(`### ${oa.id} — ${oa.asignatura} — ${oa.curso}`);
    partes.push(oa.oa);
    partes.push(`**Eje:** ${oa.eje}`);
    partes.push(`**Habilidades:** ${oa.habilidad}`);
    if (oa.indicadores.length > 0) {
      partes.push(`**Indicadores de logro:**`);
      oa.indicadores.forEach((ind) => partes.push(`- ${ind}`));
    }
  }

  if (relevantes.length < matching.length) {
    partes.push('');
    partes.push(`*Hay ${matching.length - relevantes.length} OA${matching.length - relevantes.length > 1 ? 's' : ''} más para ${nivel} - ${asignatura}. Se muestran los más relevantes.*`);
  }

  return partes.join('\n');
}

export function buildCurriculumHeader(
  nivel: string,
  asignatura: string,
  oa: string,
  habilidad: string,
  indicadores: string[],
  oaId?: string,
): string {
  const partes: string[] = [
    '## 📋 Datos curriculares',
    '',
    `**OA trabajado:** ${oaId ? `${oaId} — ` : ''}${oa}`,
    `**Habilidad a desarrollar:** ${habilidad}`,
  ];
  if (indicadores.length > 0) {
    partes.push('', '**Indicadores de evaluación:**');
    indicadores.slice(0, 6).forEach((ind, i) => partes.push(`${i + 1}. ${ind}`));
  }
  partes.push(
    '',
    '**Evidencia de aprendizaje:** Producto, registro o desempeño que demuestre el logro del OA.',
    '**Evaluación asociada:** Instrumento formativo o sumativo alineado a los indicadores.',
    '',
    '---',
    '',
  );
  return partes.join('\n');
}

export function buildCurriculumHeaderFromItem(item: CurriculumItem): string {
  return buildCurriculumHeader(
    item.curso,
    item.asignatura,
    item.oa,
    item.habilidad,
    item.indicadores,
    item.id,
  );
}
