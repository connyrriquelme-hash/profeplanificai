import type { PedagogicalEngineEnv } from '../../core/types';

interface ConfigRow {
  id: string;
  category: string;
  value_key: string;
  label: string;
  sort_order: number;
  metadata_json: string;
}

export async function onRequestGet(context: EventContext<PedagogicalEngineEnv>): Promise<Response> {
  try {
    const url = new URL(context.request.url);
    const category = url.searchParams.get('category') || '';

    let query = 'SELECT id, category, value_key, label, sort_order, metadata_json FROM app_config WHERE active = 1';
    const params: unknown[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY category, sort_order';

    const { results } = await context.env.CORE_DB.prepare(query).bind(...params).all<ConfigRow>();

    const grouped: Record<string, Array<{ id: string; value: string; label: string; metadata: any }>> = {};
    for (const row of results) {
      if (!grouped[row.category]) grouped[row.category] = [];
      let metadata = {};
      try { metadata = JSON.parse(row.metadata_json); } catch {}
      grouped[row.category].push({
        id: row.id,
        value: row.value_key,
        label: row.label,
        metadata,
      });
    }

    return Response.json({ ok: true, data: grouped, count: results.length }, {
      headers: { 'Cache-Control': 'public, max-age=300' },
    });
  } catch (err) {
    console.error('[config/options] GET error:', err);
    return Response.json({ error: 'Error al obtener configuración.' }, { status: 500 });
  }
}
