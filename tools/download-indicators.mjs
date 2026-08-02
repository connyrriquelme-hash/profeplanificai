#!/usr/bin/env node
/**
 * download-indicators.mjs
 *
 * FASE 2 (solo descarga) del proyecto de importacion de indicadores
 * oficiales MINEDUC. Descarga el HTML crudo de cada pagina de OA que
 * matcheo en la Fase 1 (tmp/indicators-discovery/discovered-oa-urls.json)
 * contra nuestra tabla `objectives` en D1. NO parsea indicadores, NO
 * escribe nada a D1 — eso es Fase 3, y arranca solo despues de confirmar
 * que esta descarga quedo completa y sana.
 *
 * Cortesia: 1.5-2s entre requests (configurable via DELAY_MS), User-Agent
 * honesto, backoff exponencial en 429/503, progreso reanudable en
 * tmp/indicators-progress.json (guardado despues de CADA pagina), HTML
 * crudo en tmp/indicators-raw/. Si hay 20 fallos consecutivos, PAUSA la
 * corrida (no sigue insistiendo) y reporta.
 *
 * Uso:
 *   node tools/download-indicators.mjs
 *   DELAY_MS=2000 node tools/download-indicators.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const RAW_DIR = join(PROJECT_ROOT, 'tmp', 'indicators-raw');
const PROGRESS_FILE = join(PROJECT_ROOT, 'tmp', 'indicators-progress.json');
const DISCOVERED_FILE = join(PROJECT_ROOT, 'tmp', 'indicators-discovery', 'discovered-oa-urls.json');
const DB_NAME = 'planificaia-db';

const USER_AGENT = 'PlanificaIA-Chile-Investigacion/1.0 (uso educativo no comercial; contacto: connyrriquelme@gmail.com)';
const DELAY_MS = Math.max(1000, Number(process.env.DELAY_MS || 1500));
const MAX_RETRIES = 5;
const MAX_CONSECUTIVE_FAILURES = 20;
const PROGRESS_REPORT_INTERVAL = 100;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class HttpError extends Error {
  constructor(status, url) {
    super(`HTTP ${status} en ${url}`);
    this.status = status;
    this.url = url;
  }
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

  if (!res.ok) throw new HttpError(res.status, url);
  return res.text();
}

function loadProgress() {
  if (!existsSync(PROGRESS_FILE)) {
    return { startedAt: new Date().toISOString(), completed: {}, failed: {}, log: [] };
  }
  try {
    const p = JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'));
    delete p.pausedAt;
    delete p.pausedReason;
    delete p.finishedAt;
    return p;
  } catch {
    console.warn('   progress.json corrupto, empezando de cero.');
    return { startedAt: new Date().toISOString(), completed: {}, failed: {}, log: [] };
  }
}

function saveProgress(p) {
  writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2), 'utf-8');
}

function slugForCode(code) {
  return code.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function getD1MatchedCodes() {
  console.log('Consultando codigos de OA reales en D1 (planificaia-db, remoto)...');
  const cmd = `npx wrangler d1 execute ${DB_NAME} --remote --command "SELECT code FROM objectives;" --json`;
  const output = execSync(cmd, { encoding: 'utf-8', cwd: PROJECT_ROOT, timeout: 60000, maxBuffer: 1024 * 1024 * 50 });
  const match = output.match(/\[[\s\S]*\]/);
  if (!match) throw new Error(`No se pudo parsear la salida de wrangler:\n${output.slice(0, 500)}`);
  const parsed = JSON.parse(match[0]);
  const rows = parsed?.[0]?.results ?? [];
  console.log(`   Codigos D1: ${rows.length}`);
  return new Set(rows.map((r) => String(r.code).toUpperCase()));
}

function dirSizeBytes(dir) {
  let total = 0;
  if (!existsSync(dir)) return 0;
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const st = statSync(p);
    if (st.isFile()) total += st.size;
  }
  return total;
}

function printSummary(progress, totalTargets) {
  const completedCount = Object.keys(progress.completed).length;
  const failedCount = Object.keys(progress.failed).length;
  const endTime = progress.finishedAt || progress.pausedAt || new Date().toISOString();
  const durationMin = (new Date(endTime) - new Date(progress.startedAt)) / 60000;
  const totalBytes = dirSizeBytes(RAW_DIR);

  console.log(`\n═══════════════════════════════════════════════════`);
  console.log(`  RESUMEN DE DESCARGA`);
  console.log(`═══════════════════════════════════════════════════`);
  console.log(`  Objetivo total:              ${totalTargets}`);
  console.log(`  Completadas:                 ${completedCount}`);
  console.log(`  Fallidas:                    ${failedCount}`);
  console.log(`  Restantes:                   ${totalTargets - completedCount - failedCount}`);
  console.log(`  Tamano tmp/indicators-raw/:  ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Duracion:                    ${durationMin.toFixed(1)} min`);
  if (progress.pausedReason) console.log(`  PAUSADA: ${progress.pausedReason}`);
  console.log(`═══════════════════════════════════════════════════`);

  if (failedCount > 0) {
    console.log(`\nFallidas (codigo -> HTTP -> url):`);
    for (const [code, info] of Object.entries(progress.failed)) {
      console.log(`  ${code} -> ${info.status} -> ${info.url}`);
    }
  }
}

async function main() {
  mkdirSync(RAW_DIR, { recursive: true });

  const discovered = JSON.parse(readFileSync(DISCOVERED_FILE, 'utf-8'));
  const d1Codes = getD1MatchedCodes();
  const targets = Object.entries(discovered).filter(([code]) => d1Codes.has(code));

  console.log(`Total descubiertos en Fase 1: ${Object.keys(discovered).length}`);
  console.log(`Coinciden con D1 (a descargar): ${targets.length}`);

  const progress = loadProgress();
  const alreadyDone = Object.keys(progress.completed).length;
  if (alreadyDone > 0) {
    console.log(`Reanudando: ${alreadyDone} paginas ya completadas en una corrida previa, se saltan.`);
  }

  let consecutiveFailures = 0;

  for (let i = 0; i < targets.length; i++) {
    const [code, info] = targets[i];

    if (progress.completed[code]) continue;

    const slug = slugForCode(code);
    const rawFile = join(RAW_DIR, `${slug}.html`);

    try {
      const html = await politeFetch(info.url);
      writeFileSync(rawFile, html, 'utf-8');
      progress.completed[code] = { url: info.url, fetchedAt: new Date().toISOString(), bytes: Buffer.byteLength(html, 'utf-8') };
      delete progress.failed[code];
      consecutiveFailures = 0;
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 'ERROR';
      progress.failed[code] = { url: info.url, status, message: err.message, failedAt: new Date().toISOString() };
      consecutiveFailures++;
      console.error(`   [FAIL ${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}] ${code} -> ${status}: ${err.message}`);
    }

    const completedCount = Object.keys(progress.completed).length;
    const failedCount = Object.keys(progress.failed).length;
    const remaining = targets.length - completedCount - failedCount;

    if ((completedCount + failedCount) % PROGRESS_REPORT_INTERVAL === 0) {
      const entry = { at: new Date().toISOString(), completed: completedCount, failed: failedCount, remaining };
      progress.log.push(entry);
      console.log(`[progreso] ${entry.at} completadas=${completedCount} fallidas=${failedCount} restantes=${remaining}`);
    }

    saveProgress(progress);

    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.error(`\n>>> PAUSANDO: ${consecutiveFailures} fallos consecutivos pese al backoff. Posible bloqueo del sitio. <<<`);
      progress.pausedAt = new Date().toISOString();
      progress.pausedReason = `${consecutiveFailures} fallos consecutivos`;
      saveProgress(progress);
      printSummary(progress, targets.length);
      process.exit(2);
    }

    if (i < targets.length - 1) await sleep(DELAY_MS);
  }

  progress.finishedAt = new Date().toISOString();
  saveProgress(progress);
  printSummary(progress, targets.length);
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
