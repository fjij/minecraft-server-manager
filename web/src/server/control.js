const db = require('../db');

async function getServers() {
  const { rows } = await db.query('SELECT * FROM server');
  return rows;
};

async function getServer(name) {
  const { rows } = await db.query(
    'SELECT * FROM server WHERE name = $1',
    [name]
  );
  return rows[0];
};

async function putServer(name, server) {
  await db.query(
    'INSERT INTO server (name, port, path) VALUES ($1, $2, $3)'
    + 'ON CONFLICT (name) DO UPDATE SET port = $2, path = $3', 
    [name, server.port, server.path]
  );
};

async function deleteServer(name) {
  await db.query('DELETE FROM server WHERE name = $1', [name]);
};

async function getServerEnv(name) {
  const { rows } = await db.query(
    'SELECT * FROM server_env WHERE server_name = $1',
    [name]
  );
  return Object.fromEntries(rows.map(row => [row.key, row.value]));
};

async function putServerEnv(name, env) {
  await db.query('DELETE FROM server_env WHERE server_name = $1', [name]);
  await Promise.all(Object.entries(env).map(([key, value]) => db.query(
    'INSERT INTO server_env (server_name, key, value) VALUES ($1, $2, $3)',
    [name, key, value]
  )));
};

module.exports = {
  getServers,
  getServer,
  putServer,
  deleteServer,
  getServerEnv,
  putServerEnv
};
