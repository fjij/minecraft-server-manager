const db = require('../db');
const docker = require('../docker');
const { 
  ServerDoesNotExistError,
  ServerAlreadyExistsError
} = require('./exceptions');

async function getServers() {
  const { rows } = await db.query('SELECT * FROM server');
  return rows;
};

async function getServer(name) {
  const { rows } = await db.query(
    'SELECT * FROM server WHERE name = $1',
    [name]
  );
  if (rows.length === 0) {
    throw new ServerDoesNotExistError(name);
  }
  return rows[0];
};

async function serverExists(name) {
  const { rows } = await db.query(
    'SELECT * FROM server WHERE name = $1',
    [name]
  );
  return rows.length > 0;
};

async function createServer(name, server, preset=null) {
  if (await serverExists(name)) {
    throw new ServerAlreadyExistsError(name);
  }
  const res = await docker.createVolume({ Driver: 'local' });
  const volume = res.name;
  await db.query(
    'INSERT INTO server (name, port, volume) VALUES ($1, $2, $3)',
    [name, server.port, volume]
  );
  if (preset && preset.name) {
    const { rows } = await db.query(
      'SELECT * FROM preset_env WHERE preset_name = $1',
      [preset.name]
    );
    await Promise.all(rows.map(row => db.query(
      'INSERT INTO server_env (server_name, key, value) VALUES ($1, $2, $3)',
      [name, row.key, row.value]
    )));
  }
}

async function updateServer(name, server) {
  await getServer(name);
  await db.query(
    'UPDATE server SET port = $1 WHERE name = $2',
    [server.port, name]
  );
}

async function putServer(name, server) {
  if (await serverExists(name)) {
    await updateServer(name, server);
  } else {
    await createServer(name, server);
  }
};

async function deleteServer(name) {
  const server = await getServer(name);
  await serverOff(name);
  await docker.getVolume(server.volume).remove();
  await db.query('DELETE FROM server WHERE name = $1', [name]);
};

async function getServerEnv(name) {
  await getServer(name);
  const { rows } = await db.query(
    'SELECT * FROM server_env WHERE server_name = $1',
    [name]
  );
  return Object.fromEntries(rows.map(row => [row.key, row.value]));
};

async function putServerEnv(name, env) {
  await getServer(name);
  await db.query('DELETE FROM server_env WHERE server_name = $1', [name]);
  await Promise.all(Object.entries(env).map(([key, value]) => db.query(
    'INSERT INTO server_env (server_name, key, value) VALUES ($1, $2, $3)',
    [name, key, value]
  )));
};

async function serverOn(name) {
  const server = await getServer(name);
  const env = await getServerEnv(name);
  await docker.createContainer({ 
    name: server.name,
    Image: 'itzg/minecraft-server',
    Env: Object.entries(env).map(([key, value]) => `${key}=${value}`),
    HostConfig: {
      PortBindings: {
        '25565/tcp': [
          {
            HostPort: server.port.toString()
          }
        ]
      },
      Mounts: [
        {
          Target: '/data',
          Source: server.volume,
          Type: 'volume'
        }
      ]
    }
  });
  await docker.getContainer(server.name).start();
};

async function getServerStatus(name) {
  const server = await getServer(name);
  try {
    const { State } = await docker.getContainer(server.name).inspect();
    return State.Status;
  } catch {
    return 'none';
  }
};

async function serverOff(name) {
  const server = await getServer(name);
  try { await docker.getContainer(server.name).stop(); } catch (e) { }
  try { await docker.getContainer(server.name).remove(); } catch (e) { }
};

module.exports = {
  getServers,
  getServer,
  createServer,
  updateServer,
  serverExists,
  putServer,
  deleteServer,
  getServerEnv,
  putServerEnv,
  serverOn,
  getServerStatus,
  serverOff,
};
