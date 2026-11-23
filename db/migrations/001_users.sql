-- Ejecutar una sola vez sobre la base PostgreSQL de Ariel Connect.
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(13) NOT NULL UNIQUE,
  display_name VARCHAR(40) NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_created_at_idx ON users (created_at);
