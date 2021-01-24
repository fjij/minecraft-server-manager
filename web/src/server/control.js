const db = require('../db');
const docker = require('../docker');

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
  const oldServer = await getServer(name);
  let volume;
  if (oldServer === undefined) {
    const res = await docker.createVolume({ Driver: 'local' });
    volume = res.name;
  } else {
    volume = oldServer.volume;
  }
  await db.query(
    'INSERT INTO server (name, port, volume) VALUES ($1, $2, $3)'
    + 'ON CONFLICT (name) DO UPDATE SET port = $2, volume = $3', 
    [name, server.port, volume]
  );
};

async function deleteServer(name) {
  const server = await getServer(name);
  await serverOff(name);
  await docker.getVolume(server.volume).remove();
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
  putServer,
  deleteServer,
  getServerEnv,
  putServerEnv,
  serverOn,
  getServerStatus,
  serverOff,
};
