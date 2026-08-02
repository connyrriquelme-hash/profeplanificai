#!/usr/bin/env node
/**
 * discover-indicator-urls.mjs
 *
 * FASE 1 (solo descubrimiento) del proyecto de importación de indicadores
 * de evaluación oficiales MINEDUC. NO descarga páginas de OA individuales
 * todavía, NO escribe a D1. Solo:
 *
 *   1. Descubre las páginas "índice por asignatura" de curriculumnacional.cl
 *      (portal/Ejes/), que cada una lista TODOS los OA de esa asignatura
 *      con su código y URL de detalle (ej. "MA05 OA 05" -> w3-article-....html).
 *   2. Cruza esos códigos contra nuestra tabla `objectives` en D1 (2599 OA).
 *   3. Reporta: URLs descubiertas, cuántos códigos matchean, cuáles no.
 *
 * Cortesía: 1 request cada DELAY_MS (default 1500ms), User-Agent honesto,
 * reintento con backoff exponencial en 429/503, progreso reanudable en
 * tmp/indicators-discovery/progress.json, HTML crudo guardado en
 * tmp/indicators-discovery/raw/ separado del parseo.
 *
 * Uso:
 *   node tools/discover-indicator-urls.mjs
 *   DELAY_MS=2000 node tools/discover-indicator-urls.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const OUT_DIR = join(PROJECT_ROOT, 'tmp', 'indicators-discovery');
const RAW_DIR = join(OUT_DIR, 'raw');
const PROGRESS_FILE = join(OUT_DIR, 'progress.json');
const REPORT_FILE = join(OUT_DIR, 'report.md');
const OA_MAP_FILE = join(OUT_DIR, 'discovered-oa-urls.json');

const ORIGIN = 'https://www.curriculumnacional.cl';
const USER_AGENT = 'PlanificaIA-Chile-Investigacion/1.0 (uso educativo no comercial; contacto: connyrriquelme@gmail.com)';
const DELAY_MS = Math.max(1000, Number(process.env.DELAY_MS || 1500));
const MAX_RETRIES = 5;
const DB_NAME = 'planificaia-db';

// ─── Seeds: páginas índice por asignatura ──────────────────────────────
// Descubiertas manualmente inspeccionando /portal/Ejes/ (menú de taxonomía
// Drupal, agrupado por "pnid"). Cada grupo es un ciclo/track distinto:
//   pnid 550 = Asignaturas 1°-8° Básico + 1°-2° Medio (Formación General)
//   pnid 753 = Asignaturas Educación Parvularia
//   pnid 754 = Asignaturas 3°-4° Medio (un track: Educación Media HC/FG)
//   pnid 755 = Asignaturas 3°-4° Medio (otro track: Formación General/Ciudadana)
// Se guardan aquí como fallback fijo, pero el script SIEMPRE intenta
// primero re-descubrirlos en vivo desde /portal/Ejes/ (ver discoverSeeds());
// esta lista solo se usa si ese descubrimiento en vivo falla.
const FALLBACK_SEEDS = [
  ['Lengua y Cultura de los Pueblos Originarios Ancestrales', '/portal/Ejes/148743.html'],
  ['Inglés (Propuesta curricular)', '/portal/Ejes/176612.html'],
  ['Religión', '/portal/Ejes/176736.html'],
  ['Matemática', '/portal/Ejes/49395.html'],
  ['Lenguaje y comunicación / Lengua y literatura', '/portal/Ejes/49396.html'],
  ['Ciencias naturales', '/portal/Ejes/49397.html'],
  ['Historia, geografía y ciencias sociales', '/portal/Ejes/49398.html'],
  ['Educación física y salud', '/portal/Ejes/49399.html'],
  ['Artes visuales', '/portal/Ejes/52049.html'],
  ['Inglés', '/portal/Ejes/52050.html'],
  ['Música', '/portal/Ejes/52051.html'],
  ['Orientación', '/portal/Ejes/52052.html'],
  ['Tecnología', '/portal/Ejes/52053.html'],
  ['Lengua indígena', '/portal/Ejes/77655.html'],
  ['Comunicación integral', '/portal/Ejes/150900.html'],
  ['Desarrollo personal y social', '/portal/Ejes/150927.html'],
  ['Interacción y comprensión del entorno', '/portal/Ejes/150967.html'],
  ['Inglés (Propuesta) NT', '/portal/Ejes/176678.html'],
  ['Artes (Media)', '/portal/Ejes/151053.html'],
  ['Ciencias (Media)', '/portal/Ejes/151110.html'],
  ['Educación física y salud (Media)', '/portal/Ejes/151162.html'],
  ['Filosofía (Media)', '/portal/Ejes/151417.html'],
  ['Historia, geografía y ciencias sociales (Media)', '/portal/Ejes/151448.html'],
  ['Lengua y literatura (Media)', '/portal/Ejes/151488.html'],
  ['Matemática (Media)', '/portal/Ejes/151516.html'],
  ['Artes (Media FG)', '/portal/Ejes/151186.html'],
  ['Ciencias para la ciudadanía', '/portal/Ejes/151205.html'],
  ['Educación ciudadana', '/portal/Ejes/151244.html'],
  ['Educación física y salud (Media FG)', '/portal/Ejes/151271.html'],
  ['Filosofía (Media FG)', '/portal/Ejes/151285.html'],
  ['Historia, geografía y ciencias sociales (Media FG)', '/portal/Ejes/151326.html'],
  ['Inglés (Media FG)', '/portal/Ejes/151335.html'],
  ['Lengua y literatura (Media FG)', '/portal/Ejes/151346.html'],
  ['Matemática (Media FG)', '/portal/Ejes/151366.html'],
];

// ─── HTTP cortés: UA honesto, delay fijo, backoff exponencial ──────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function politeFetch(url, { retries = 0 } = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'es-CL,es;q=0.9' },
    redirect: 'follow',
  });

  if ((res.status === 429 || res.status === 503) && retries < MAX_RETRIES) {
    const backoffMs = DELAY_MS * 2 ** (retries + 1);
    console.warn(`   [${res.status}] ${url} -> reintento ${retries + 1}/${MAX_RETRIES} en ${backoffMs}ms`);
    await sleep(backoffMs);
    return politeFetch(url, { retries: retries + 1 });
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} en ${url}`);
  }

  // El sitio redirige rutas "bonitas" (/portal/Ejes/Matematica/) a rutas
  // legacy numericas (/614/w3-propertyvalue-XXXXX.html); los hrefs
  // relativos dentro del HTML se resuelven contra la URL FINAL post-
  // redirect, no contra la URL originalmente pedida.
  return { text: await res.text(), finalUrl: res.url };
}

// ─── Progreso reanudable ────────────────────────────────────────────────

function loadProgress() {
  if (!existsSync(PROGRESS_FILE)) {
    return { fetchedSeeds: {}, oaUrls: {} };
  }
  try {
    return JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'));
  } catch {
    console.warn('   progress.json corrupto, empezando de cero.');
    return { fetchedSeeds: {}, oaUrls: {} };
  }
}

function saveProgress(progress) {
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf-8');
}

function slugForSeed(pathname) {
  return pathname.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');
}

// El sitio NO redirige (num_redirects=0): las rutas "bonitas"
// (/portal/Ejes/Matematica/) se sirven directo con HTTP 200, pero cada
// página declara <base href="/NNN/w3-propertyname-XXXXX.html"> apuntando
// a su ruta legacy numerica real. Los hrefs relativos del documento
// (w3-article-....html, w3-propertyvalue-....html) SOLO resuelven
// correctamente contra ese <base>, nunca contra la URL "bonita" pedida.
function resolveBase(html, requestUrl) {
  const baseMatch = html.match(/<base\s+href="([^"]+)"/i);
  if (baseMatch) return new URL(baseMatch[1], ORIGIN).toString();
  return requestUrl;
}

// ─── Descubrimiento en vivo de las páginas índice por asignatura ───────

async function discoverSeeds(progress) {
  const rootUrl = `${ORIGIN}/portal/Ejes/`;
  console.log(`\n1. Descubriendo páginas índice por asignatura desde ${rootUrl} ...`);

  let html;
  try {
    ({ text: html } = await politeFetch(rootUrl));
    mkdirSync(RAW_DIR, { recursive: true });
    writeFileSync(join(RAW_DIR, '_root-portal-ejes.html'), html, 'utf-8');
  } catch (err) {
    console.warn(`   ERROR descubriendo en vivo (${err.message}). Uso lista fallback fija.`);
    return FALLBACK_SEEDS.map(([name, path]) => ({ name, url: `${ORIGIN}${path}` }));
  }

  // Grupos pnid a crawlear: 550/753/754/755 son los nodos "asignatura"
  // (Básica+1°-2°Medio, Parvularia, Media HC, Media FG). Algunas
  // asignaturas (Matemática, Música, Ed. Física, Inglés) exponen ahí
  // mismo el listado plano de OA; otras (Ciencias Naturales, Lenguaje,
  // Historia, Artes, Tecnología, Orientación, Filosofía) son solo una
  // página de aterrizaje que enumera sus "Ejes" — esos Ejes viven como
  // nodos hijos dentro del grupo 576 (confirmado: "Ciencias de la Vida",
  // "Ciencias Físicas y Químicas" etc. aparecen ahí). Se crawlean ambos
  // grupos por igual; los nodos que no tengan OA directamente simplemente
  // no aportan codigos (no rompen nada).
  const SUBJECT_PNIDS = new Set(['550', '753', '754', '755', '576']);
  const linkPattern = /class="pnid-(\d+)[^"]*"\s+href="(w3-propertyvalue-\d+\.html)"\s+title="Ir a ([^"]*)"/g;

  const base = resolveBase(html, rootUrl);
  const seeds = [];
  const seen = new Set();
  let match;
  while ((match = linkPattern.exec(html))) {
    const [, pnid, relHref, title] = match;
    if (!SUBJECT_PNIDS.has(pnid)) continue;
    const absUrl = new URL(relHref, base).toString();
    if (seen.has(absUrl)) continue;
    seen.add(absUrl);
    seeds.push({ name: title.trim(), url: absUrl });
  }

  if (seeds.length === 0) {
    console.warn('   No se encontraron seeds en vivo (¿cambió el HTML del sitio?). Uso lista fallback fija.');
    return FALLBACK_SEEDS.map(([name, path]) => ({ name, url: `${ORIGIN}${path}` }));
  }

  console.log(`   Encontradas ${seeds.length} páginas índice por asignatura (en vivo).`);
  return seeds;
}

// ─── Extracción de código OA + URL de detalle desde una página índice ─

function extractOaLinks(html, pageUrl) {
  // Patrón visto en /portal/Ejes/Matematica/: <a href="w3-article-17473.html">MA01 OA 01</a>
  // El código puede incluir OA, OAH, OAA u OAC (electivos 3°-4° Medio,
  // ej. "FI-ESTE-3Y4-OAC-01"), con o sin espacio antes del sufijo final.
  // El sufijo normalmente es 1-3 caracteres (ej. "01", "A") pero Lengua y
  // Cultura de Pueblos Originarios usa sufijos de 4 (ej. "LC01 OA LF01")
  // — se amplia a 1-6 para cubrir ese caso sin perder los demas.
  const pattern = /<a[^>]*href="(w3-article-\d+\.html)"[^>]*>\s*([A-ZÑ0-9]+(?:-[A-ZÑ0-9]+)*\s*-?\s*OA[ACH]?\s*-?\s*[A-ZÑ0-9]{1,6})\s*<\/a>/gi;
  const found = new Map();
  let match;
  while ((match = pattern.exec(html))) {
    const [, relHref, rawCode] = match;
    const code = rawCode.replace(/\s+/g, ' ').trim().toUpperCase();
    const absUrl = new URL(relHref, pageUrl).toString();
    found.set(code, absUrl);
  }
  return found;
}

// ─── Consulta D1 (una sola vez, todos los códigos) ─────────────────────

function fetchAllObjectiveCodes() {
  console.log('\n3. Consultando los 2599 codigos de OA reales en D1 (planificaia-db, remoto)...');
  const cmd = `npx wrangler d1 execute ${DB_NAME} --remote --command "SELECT code FROM objectives;" --json`;
  const output = execSync(cmd, { encoding: 'utf-8', cwd: PROJECT_ROOT, timeout: 60000, maxBuffer: 1024 * 1024 * 50 });
  const match = output.match(/\[[\s\S]*\]/);
  if (!match) throw new Error(`No se pudo parsear la salida de wrangler:\n${output.slice(0, 500)}`);
  const parsed = JSON.parse(match[0]);
  const rows = parsed?.[0]?.results ?? [];
  console.log(`   Codigos obtenidos de D1: ${rows.length}`);
  return rows.map((r) => String(r.code).toUpperCase());
}

// Re-procesa el HTML ya descargado en tmp/indicators-discovery/raw/ SIN
// hacer ningun request de red. Util cuando se corrige un bug de parseo
// (ej. el regex de sufijo) despues de haber corrido el crawl completo.
function reparseFromDisk() {
  console.log(`\n1-2. Modo --reparse: releyendo HTML de ${RAW_DIR} (sin red)...`);
  const files = readdirSync(RAW_DIR).filter((f) => f.endsWith('.html') && !f.startsWith('_root'));
  const oaUrls = {};
  for (const file of files) {
    const html = readFileSync(join(RAW_DIR, file), 'utf-8');
    const base = resolveBase(html, ORIGIN);
    const oaLinks = extractOaLinks(html, base);
    for (const [code, url] of oaLinks) {
      if (!oaUrls[code]) oaUrls[code] = { url, sourcePage: file };
    }
  }
  console.log(`   ${files.length} archivos releidos, ${Object.keys(oaUrls).length} codigos OA totales.`);
  return oaUrls;
}

// ─── Main ───────────────────────────────────────────────────────────────

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(RAW_DIR, { recursive: true });

  const isReparse = process.argv.includes('--reparse');
  if (isReparse) {
    const oaUrls = reparseFromDisk();
    writeFileSync(OA_MAP_FILE, JSON.stringify(oaUrls, null, 2), 'utf-8');
    return finishReport(oaUrls, 0);
  }

  const progress = loadProgress();

  const seeds = await discoverSeeds(progress);

  console.log(`\n2. Procesando ${seeds.length} páginas índice (${DELAY_MS}ms entre requests)...`);
  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    const slug = slugForSeed(new URL(seed.url).pathname);

    if (progress.fetchedSeeds[seed.url]) {
      console.log(`   [${i + 1}/${seeds.length}] (ya procesado, saltando) ${seed.name}`);
      continue;
    }

    console.log(`   [${i + 1}/${seeds.length}] ${seed.name} -> ${seed.url}`);
    let html;
    try {
      ({ text: html } = await politeFetch(seed.url));
    } catch (err) {
      console.error(`      ERROR: ${err.message}`);
      progress.fetchedSeeds[seed.url] = { ok: false, error: err.message, oaFound: 0 };
      saveProgress(progress);
      await sleep(DELAY_MS);
      continue;
    }

    writeFileSync(join(RAW_DIR, `${slug}.html`), html, 'utf-8');

    const base = resolveBase(html, seed.url);
    const oaLinks = extractOaLinks(html, base);
    for (const [code, url] of oaLinks) {
      if (!progress.oaUrls[code]) {
        progress.oaUrls[code] = { url, sourcePage: seed.name };
      }
    }

    progress.fetchedSeeds[seed.url] = { ok: true, oaFound: oaLinks.size };
    saveProgress(progress);
    console.log(`      ${oaLinks.size} codigos OA encontrados (acumulado: ${Object.keys(progress.oaUrls).length})`);

    if (i < seeds.length - 1) await sleep(DELAY_MS);
  }

  writeFileSync(OA_MAP_FILE, JSON.stringify(progress.oaUrls, null, 2), 'utf-8');
  finishReport(progress.oaUrls, seeds.length);
}

function finishReport(oaUrls, seedsCount) {
  const d1Codes = fetchAllObjectiveCodes();
  const discoveredCodes = new Set(Object.keys(oaUrls));

  const matched = d1Codes.filter((c) => discoveredCodes.has(c));
  const unmatched = d1Codes.filter((c) => !discoveredCodes.has(c));
  const extraOnSite = [...discoveredCodes].filter((c) => !d1Codes.includes(c));

  console.log(`\n═══════════════════════════════════════════════════`);
  console.log(`  RESUMEN DE DESCUBRIMIENTO`);
  console.log(`═══════════════════════════════════════════════════`);
  console.log(`  Paginas indice procesadas:      ${seedsCount}`);
  console.log(`  URLs de OA descubiertas:        ${discoveredCodes.size}`);
  console.log(`  Codigos D1 (objectives):        ${d1Codes.length}`);
  console.log(`  Matchean (D1 -> sitio):         ${matched.length}`);
  console.log(`  SIN match (D1 sin URL):         ${unmatched.length}`);
  console.log(`  Extra en sitio (sin OA en D1):  ${extraOnSite.length}`);
  console.log(`═══════════════════════════════════════════════════\n`);

  const reportLines = [
    '# Reporte de descubrimiento de indicadores MINEDUC (Fase 1)',
    '',
    `- Paginas indice procesadas: ${seedsCount}`,
    `- URLs de OA descubiertas: ${discoveredCodes.size}`,
    `- Codigos en D1 (objectives): ${d1Codes.length}`,
    `- Matchean (tienen URL en el sitio): ${matched.length}`,
    `- SIN match (codigo D1 sin URL encontrada): ${unmatched.length}`,
    `- Extra en el sitio (URL encontrada pero sin OA correspondiente en D1): ${extraOnSite.length}`,
    '',
    '## Codigos D1 SIN URL descubierta (huecos de cobertura)',
    '',
    ...unmatched.map((c) => `- ${c}`),
    '',
    '## Codigos extra en el sitio (sin match en D1, revisar formato/normalizacion)',
    '',
    ...extraOnSite.slice(0, 400).map((c) => `- ${c} -> ${oaUrls[c]?.url}`),
  ];
  writeFileSync(REPORT_FILE, reportLines.join('\n'), 'utf-8');
  console.log(`Reporte completo guardado en: ${REPORT_FILE}`);
  console.log(`Mapa codigo->URL guardado en: ${OA_MAP_FILE}`);
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
