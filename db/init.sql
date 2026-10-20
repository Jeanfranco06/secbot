-- ============================================================
-- SecBot — Esquema inicial Fase 0
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS vector;

-- ---------- Usuarios y roles ----------
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id INT REFERENCES roles(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by UUID REFERENCES users(id),
  PRIMARY KEY (user_id, role_id)
);

INSERT INTO roles (name, description) VALUES
  ('admin', 'Administrador del sistema'),
  ('security_analyst', 'Analista de seguridad'),
  ('employee', 'Empleado usuario final');

-- ---------- KB ----------
CREATE TABLE kb_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source_uri TEXT,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('policy','runbook','faq','other')),
  version TEXT NOT NULL DEFAULT '1.0',
  owner TEXT,
  classification TEXT NOT NULL DEFAULT 'internal'
    CHECK (classification IN ('public','internal','confidential')),
  effective_date DATE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft','active','obsolete')),
  checksum TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE kb_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1024) NOT NULL,
  token_count INT,
  section TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, chunk_index)
);

CREATE INDEX idx_kb_chunks_embedding
  ON kb_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
CREATE INDEX idx_kb_chunks_document_id ON kb_chunks(document_id);
CREATE INDEX idx_kb_chunks_metadata_gin ON kb_chunks USING gin(metadata);

-- ---------- Conversaciones ----------
CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  title TEXT,
  source TEXT NOT NULL DEFAULT 'web',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chat_history(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  citations JSONB,
  intent TEXT,
  confidence NUMERIC(4,3),
  latency_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_chat_created
  ON chat_messages(chat_id, created_at);

-- ---------- Tickets ----------
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('P1','P2','P3','P4')),
  status TEXT NOT NULL DEFAULT 'nuevo'
    CHECK (status IN ('nuevo','en_progreso','resuelto','cerrado','cancelado')),
  source TEXT NOT NULL DEFAULT 'chatbot',
  chat_id UUID REFERENCES chat_history(id),
  reported_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  due_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tickets_status_severity ON tickets(status, severity);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);

-- Secuencia para ticket_number
CREATE SEQUENCE IF NOT EXISTS ticket_seq START 1;

-- ---------- Auditoría ----------
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  ip INET,
  user_agent TEXT,
  input JSONB,
  output JSONB,
  result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_user_created ON audit_log(user_id, created_at);
CREATE INDEX idx_audit_log_module_created ON audit_log(module, created_at);

CREATE OR REPLACE FUNCTION prevent_audit_change()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log es append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_no_update
BEFORE UPDATE OR DELETE ON audit_log
FOR EACH ROW EXECUTE FUNCTION prevent_audit_change();