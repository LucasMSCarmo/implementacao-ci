CREATE TABLE tasks (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(120) NOT NULL,
  description TEXT,
  done        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
