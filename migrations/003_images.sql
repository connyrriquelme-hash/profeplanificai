CREATE TABLE IF NOT EXISTS image_cache (
  cache_key TEXT PRIMARY KEY,
  context_json TEXT NOT NULL,
  prompt TEXT NOT NULL,
  url TEXT NOT NULL,
  source TEXT NOT NULL,
  license TEXT,
  author TEXT,
  attribution TEXT,
  provider_meta TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_image_cache_expires_at ON image_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_image_cache_source ON image_cache(source);
