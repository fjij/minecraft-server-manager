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

module.exports = {
  getServers,
  getServer,
  putServer,
  deleteServer
};
