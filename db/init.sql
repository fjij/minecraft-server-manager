create extension if not exists "uuid-ossp";

CREATE TABLE server (
  name TEXT PRIMARY KEY NOT NULL,
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  port INTEGER NOT NULL,
  path TEXT NOT NULL
);

CREATE TABLE server_env (
  server_name TEXT NOT NULL REFERENCES server (name),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (server_name, key)
);

CREATE TABLE backup (
  server_name TEXT NOT NULL REFERENCES server (name),
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  path TEXT NOT NULL,
  PRIMARY KEY (server_name, time)
);

CREATE TABLE preset (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE preset_env (
  preset_uuid UUID NOT NULL REFERENCES preset (uuid),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (preset_uuid, key)
);
