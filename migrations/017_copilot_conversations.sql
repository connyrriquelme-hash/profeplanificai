-- ============================================================
-- MIGRACIÓN 017: Copilot conversacional — memoria de conversaciones
-- Fecha: 2026-08-19
-- Propósito: Persistir conversaciones y mensajes del copilot IA
-- (Fase 1: functions/api/copilot/chat.ts).
-- ============================================================

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS copilot_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Nueva conversación',
  active_context_json TEXT DEFAULT '{}',
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS copilot_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES copilot_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('user','assistant','tool')),
  content TEXT NOT NULL,
  tool_calls_json TEXT,
  tool_result_json TEXT,
  created_at DATETIME DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_copilot_conv_user ON copilot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_copilot_msg_conv ON copilot_messages(conversation_id);
