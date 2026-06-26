/**
 * Database Service - Abstracción para migrar de localStorage a Cloudflare D1.
 *
 * Modo actual: localStorage (modo 'local')
 * Modo futuro: Cloudflare D1 (modo 'cloudflare')
 *
 * Para activar D1, establecer:
 *   VITE_DB_MODE=cloudflare
 *   VITE_D1_URL=https://api.cloudflare.com/client/v4/accounts/{id}/d1/database/{db}/query
 *   VITE_D1_TOKEN=...
 */

type DbMode = 'local' | 'cloudflare';

interface DbConfig {
  mode: DbMode;
  d1Url?: string;
  d1Token?: string;
}

function getConfig(): DbConfig {
  const mode = (import.meta.env.VITE_DB_MODE as DbMode) || 'local';
  return {
    mode,
    d1Url: import.meta.env.VITE_D1_URL as string,
    d1Token: import.meta.env.VITE_D1_TOKEN as string,
  };
}

async function queryD1(sql: string, params?: unknown[]): Promise<unknown> {
  const cfg = getConfig();
  if (cfg.mode !== 'cloudflare' || !cfg.d1Url || !cfg.d1Token) {
    throw new Error('D1 no configurado. Usa modo local o configura VITE_D1_URL y VITE_D1_TOKEN.');
  }

  const r = await fetch(cfg.d1Url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cfg.d1Token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });

  if (!r.ok) throw new Error(`D1 error: ${r.status} ${await r.text()}`);
  const data = await r.json();
  return data;
}

export const db = {
  async query(sql: string, params?: unknown[]): Promise<unknown> {
    const cfg = getConfig();
    if (cfg.mode === 'cloudflare') {
      return queryD1(sql, params);
    }
    throw new Error('Usa storageService.ts para modo local (localStorage).');
  },

  async migrate(): Promise<void> {
    const cfg = getConfig();
    if (cfg.mode !== 'cloudflare') return;

    const migrations = [
      `CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY, email TEXT UNIQUE, nombre TEXT, rol TEXT DEFAULT 'docente',
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS materiales (
        id TEXT PRIMARY KEY, usuario_id TEXT, tipo TEXT, titulo TEXT, contenido TEXT,
        nivel TEXT, asignatura TEXT, oa TEXT, etiquetas TEXT, created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )`,
      `CREATE TABLE IF NOT EXISTS colaboracion (
        id TEXT PRIMARY KEY, usuario_id TEXT, titulo TEXT, contenido TEXT, tipo TEXT,
        nivel TEXT, asignatura TEXT, likes INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )`,
      `CREATE TABLE IF NOT EXISTS comentarios (
        id TEXT PRIMARY KEY, post_id TEXT, usuario_id TEXT, texto TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (post_id) REFERENCES colaboracion(id)
      )`,
      `CREATE TABLE IF NOT EXISTS drive_items (
        id TEXT PRIMARY KEY, usuario_id TEXT, nombre TEXT, tipo TEXT, contenido TEXT,
        nivel TEXT, asignatura TEXT, tamano INTEGER, created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      )`,
      // Biblioteca Creativa — objetivos de aprendizaje con indicadores y habilidades
      `CREATE TABLE IF NOT EXISTS learning_objectives (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        level TEXT NOT NULL,
        subject TEXT NOT NULL,
        axis TEXT,
        source TEXT DEFAULT 'oficial',
        text TEXT NOT NULL,
        indicators TEXT NOT NULL DEFAULT '[]',
        skills TEXT NOT NULL DEFAULT '[]'
      )`,
      // Migración: agregar indicadores y habilidades a la tabla objectives existente
      // (ejecutar solo si la columna no existe aún)
      `ALTER TABLE objectives ADD COLUMN indicators TEXT DEFAULT '[]'`,
      `ALTER TABLE objectives ADD COLUMN skills TEXT DEFAULT '[]'`,
    ];

    for (const sql of migrations) {
      await queryD1(sql);
    }
  },

  getMode(): DbMode {
    return getConfig().mode;
  },
};

export type { DbConfig, DbMode };
