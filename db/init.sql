create extension if not exists "uuid-ossp";

CREATE TABLE server (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  port INTEGER NOT NULL,
  volume TEXT NOT NULL
);

CREATE TABLE server_env (
  server_uuid UUID NOT NULL REFERENCES server (uuid),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (server_uuid, key)
);

CREATE TABLE server_backup (
  server_uuid UUID NOT NULL REFERENCES server (uuid),
  time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (server_uuid, time)
);

CREATE TABLE preset (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE preset_env (
  preset_uuid UUID NOT NULL REFERENCES preset (uuid),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (preset_uuid, key)
);
