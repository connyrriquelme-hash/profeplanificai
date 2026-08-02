import { readFileSync, writeFileSync, existsSync } from 'fs';

const PROGRESS_FILE = 'tmp/indicators-progress.json';
const RAW_DIR = 'tmp/indicators-raw';
const OUT_FILE = 'tmp/indicators-parsed.json';
const TAIL_MARKER = '<div class="hidden ntg-kv-metadata">';
const FORM_MARKER = 'forminvisible';

const SHORT_THRESHOLD = 15;
const LONG_THRESHOLD = 600;

function slugForCode(code) {
  return code.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&aacute;/gi, 'á').replace(/&eacute;/gi, 'é').replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó').replace(/&uacute;/gi, 'ú').replace(/&uuml;/gi, 'ü')
    .replace(/&ntilde;/gi, 'ñ').replace(/&Aacute;/g, 'Á').replace(/&Eacute;/g, 'É')
    .replace(/&Iacute;/g, 'Í').replace(/&Oacute;/g, 'Ó').replace(/&Uacute;/g, 'Ú')
    .replace(/&Ntilde;/g, 'Ñ').replace(/&Uuml;/g, 'Ü')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

function stripTags(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function norm(s) {
  return s.replace(/\s+/g, ' ').trim();
}

// Devuelve rangos [start,end] del contenido interno de cada <li> de nivel superior
// (soporta <ul><li> anidados dentro de un <li> padre sin romper el conteo).
function topLevelLiRanges(html) {
  const re = /<li[^>]*>|<\/li>/gi;
  let m;
  let depth = 0;
  let start = -1;
  const ranges = [];
  while ((m = re.exec(html))) {
    const isOpen = m[0][1] !== '/';
    if (isOpen) {
      if (depth === 0) start = re.lastIndex;
      depth++;
    } else {
      depth--;
      if (depth === 0 && start !== -1) {
        ranges.push([start, m.index]);
        start = -1;
      }
    }
  }
  return ranges;
}

function extractOaText(html) {
  // El contenedor es <div class="articulo"><h2 class="texto ...">CODE</h2>[cuerpo]</div><div class="botones">
  // [cuerpo] normalmente es <h3 class="abstract">texto</h3>, pero en fichas de Habilidades (OAH)
  // es <p>...</p> + <ul><li>...</li></ul> (texto compuesto en viñetas) - se toma todo el cuerpo tal cual.
  const startM = html.match(/<div class="articulo"><h2 class="texto[^"]*"[^>]*>([^<]*)<\/h2>/);
  if (!startM) return null;
  const bodyStart = startM.index + startM[0].length;
  const bodyEndRel = html.slice(bodyStart).indexOf('<div class="botones"');
  if (bodyEndRel === -1) return null;
  const body = html.slice(bodyStart, bodyStart + bodyEndRel);
  const oaText = stripTags(body);
  if (!oaText) return null;
  return { siteCode: stripTags(startM[1]), oaText };
}

function extractIndicators(html) {
  const startIdx = html.indexOf('<h2>Indicadores</h2>');
  if (startIdx === -1) return null;
  // La seccion real de indicadores termina antes del widget de "reportar un problema"
  // (clase forminvisible) o del bloque de metadata oculta; ambos son compartidos por
  // toda la plantilla del sitio y a veces envuelven checkboxes en <ul><li> que si no se
  // recortan se cuelan como falsos indicadores (ej. "Contenido"/"Diseno"/"Estructura").
  const candidates = [FORM_MARKER, TAIL_MARKER]
    .map((marker) => html.indexOf(marker, startIdx))
    .filter((idx) => idx !== -1);
  const endIdx = candidates.length ? Math.min(...candidates) : html.length;
  const section = html.slice(startIdx, endIdx);

  // Divide la seccion en bloques por unidad: cada bloque empieza en un <h3>...</h3>
  const h3Re = /<h3[^>]*>([^<]*)<\/h3>/gi;
  const blocks = [];
  let m;
  let lastEnd = null;
  let lastUnit = null;
  while ((m = h3Re.exec(section))) {
    if (lastUnit !== null) blocks.push({ unit: lastUnit, content: section.slice(lastEnd, m.index) });
    lastUnit = stripTags(m[1]);
    lastEnd = h3Re.lastIndex;
  }
  if (lastUnit !== null) blocks.push({ unit: lastUnit, content: section.slice(lastEnd) });

  const indicators = [];
  for (const block of blocks) {
    for (const [s, e] of topLevelLiRanges(block.content)) {
      const text = stripTags(block.content.slice(s, e));
      if (text) indicators.push({ unit: block.unit, text });
    }
  }
  return indicators;
}

function parseOne(code, meta) {
  const slug = slugForCode(code);
  const filePath = `${RAW_DIR}/${slug}.html`;
  const record = {
    code,
    slug,
    url: meta.url,
    siteCode: null,
    oaText: null,
    indicators: [],
    indicatorCount: 0,
    warnings: [],
  };

  if (!existsSync(filePath)) {
    record.warnings.push('archivo_no_encontrado');
    return record;
  }

  const html = readFileSync(filePath, 'utf-8');

  const oa = extractOaText(html);
  if (oa) {
    record.siteCode = oa.siteCode;
    record.oaText = oa.oaText;
  } else {
    record.warnings.push('sin_texto_oa');
  }

  if (record.siteCode && record.siteCode.toLowerCase() !== code.toLowerCase()) {
    record.warnings.push('codigo_no_coincide_con_sitio');
  }

  const indicators = extractIndicators(html);
  if (indicators === null) {
    record.warnings.push('sin_seccion_indicadores');
  } else {
    const seen = new Map();
    for (const ind of indicators) {
      const text = norm(ind.text);
      if (!text) {
        record.warnings.push('indicador_vacio');
        continue;
      }
      const key = text.toLowerCase();
      if (seen.has(key)) record.warnings.push('indicador_duplicado');
      seen.set(key, true);
      if (text.length < SHORT_THRESHOLD) record.warnings.push('indicador_muy_corto');
      if (text.length > LONG_THRESHOLD) record.warnings.push('indicador_muy_largo');
      if (/<[a-z!/]|&[a-z]+;/i.test(text)) record.warnings.push('html_sin_limpiar');
      record.indicators.push({ unit: ind.unit, text });
    }
  }

  record.indicatorCount = record.indicators.length;
  if (record.indicatorCount === 0 && !record.warnings.includes('sin_seccion_indicadores')) {
    record.warnings.push('seccion_presente_sin_indicadores');
  }
  record.warnings = [...new Set(record.warnings)];
  return record;
}

function main() {
  const progress = JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'));
  const codes = Object.keys(progress.completed);
  const results = [];

  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    results.push(parseOne(code, progress.completed[code]));
    if ((i + 1) % 300 === 0) console.log(`  parseados ${i + 1}/${codes.length}...`);
  }

  writeFileSync(OUT_FILE, JSON.stringify(results, null, 2), 'utf-8');

  const withIndicators = results.filter((r) => r.indicatorCount > 0);
  const withoutIndicators = results.filter((r) => r.indicatorCount === 0);
  const counts = withIndicators.map((r) => r.indicatorCount);
  const avg = counts.length ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;
  const min = counts.length ? Math.min(...counts) : 0;
  const max = counts.length ? Math.max(...counts) : 0;

  const anomalyCounts = {};
  for (const r of results) for (const w of r.warnings) anomalyCounts[w] = (anomalyCounts[w] || 0) + 1;

  console.log('\n=== ESTADISTICAS DE PARSEO ===');
  console.log('Total OA parseados:', results.length);
  console.log('Con indicadores (>0):', withIndicators.length);
  console.log('Sin indicadores (0):', withoutIndicators.length);
  console.log('Promedio indicadores (sobre los que tienen >0):', avg.toFixed(2));
  console.log('Rango:', min, '-', max);
  console.log('\nAnomalias (conteo de ocurrencias, un OA puede tener varias):');
  console.log(anomalyCounts);
  console.log('\nCodigos SIN indicadores:');
  for (const r of withoutIndicators) console.log(' -', r.code, r.warnings.length ? `(${r.warnings.join(',')})` : '');

  console.log(`\nOutput escrito en ${OUT_FILE}`);
}

main();
