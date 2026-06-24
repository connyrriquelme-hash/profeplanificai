const apiUrl = (process.env.PLANIFICAIA_API_URL || 'https://planificaia-chile.pages.dev').replace(/\/$/, '');
const token = process.env.ADMIN_TOKEN;
if (!token) {
  console.error('Falta ADMIN_TOKEN. Configúralo solo en el entorno de ejecución.');
  console.error('Ejemplo: $env:ADMIN_TOKEN="tu-token"');
  process.exit(1);
}

const mode = process.env.MODE || 'full';
const maxPages = Math.max(1, Math.min(Number(process.env.MAX_PAGES || 300), 500));
const delayMs = Math.max(350, Number(process.env.DELAY_MS || 700));
const specificUrl = process.env.IMPORT_URL || '';

async function main() {
  if (mode === 'status') {
    const resp = await fetch(`${apiUrl}/api/admin/import-curriculum`, {
      headers: { 'x-admin-token': token },
    });
    const result = await resp.json();
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (mode === 'url' && specificUrl) {
    console.log(`Importando URL específica: ${specificUrl}`);
    const resp = await fetch(`${apiUrl}/api/admin/import-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify({ url: specificUrl }),
    });
    const result = await resp.json();
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`Iniciando importación completa del Currículum Nacional (max ${maxPages} páginas)...`);
  console.log(`API: ${apiUrl}`);
  console.log(`Delay entre requests: ${delayMs}ms`);
  console.log('');

  const startTime = Date.now();

  const resp = await fetch(`${apiUrl}/api/admin/import-curriculum`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
    body: JSON.stringify({ max_pages: maxPages, delay_ms: delayMs }),
  });

  const result = await resp.json();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  if (!resp.ok) {
    console.error('Error:', result);
    process.exit(1);
  }

  const d = result.data;
  console.log('=== RESULTADO DE IMPORTACIÓN ===');
  console.log(`Páginas procesadas: ${d.pagesProcessed}`);
  console.log(`OA encontrados:     ${d.itemsFound}`);
  console.log(`OA guardados:       ${d.itemsSaved}`);
  console.log(`Errores:            ${d.errors?.length || 0}`);
  console.log(`Tiempo total:       ${elapsed}s`);
  if (d.errors?.length) {
    console.log('\nErrores (primeros 5):');
    d.errors.slice(0, 5).forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
  }
  console.log('\nPara ver el estado actual:');
  console.log(`  $env:ADMIN_TOKEN="${token}" $env:MODE="status" node scripts/import-curriculum.mjs`);
}

main().catch(err => { console.error(err); process.exit(1); });
