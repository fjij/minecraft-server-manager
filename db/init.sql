CREATE TABLE server (
  name TEXT PRIMARY KEY NOT NULL,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  port INTEGER NOT NULL,
  volume TEXT NOT NULL
);

CREATE TABLE server_env (
  server_name TEXT NOT NULL REFERENCES server (name) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (server_name, key)
);

CREATE TABLE preset (
  name TEXT UNIQUE NOT NULL,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE preset_env (
  preset_name TEXT NOT NULL REFERENCES preset (name) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (preset_name, key)
);
