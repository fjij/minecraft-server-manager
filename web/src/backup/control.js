const fs = require('fs');
const path = require('path');
const docker = require('../docker');

async function getBackups() {
  const names = fs.readdirSync(process.env.BACKUP_PATH);
  return names.map(name => ({ name }));
};

function getMounts(backup, volume) {
  return [
    {
      Target: '/volume',
      Source: volume,
      Type: 'volume'
    },
    {
      Target: '/backup',
      Source: path.join(process.env.HOST_BACKUP_PATH, backup.name),
      Type: 'bind'
    }
  ]
}

async function loadBackup(backup, volume) {
  const Mounts = getMounts(backup, volume);
  const container = await docker.createContainer({ 
    Image: process.env.BACKUP_IMAGE,
    Cmd: [ 'cp', '-r', '/backup/.', '/volume' ],
    HostConfig: { Mounts }
  });
  await container.start();
  await container.wait();
  await container.remove();
};

async function createBackup(backup, volume) {
  const Mounts = getMounts(backup, volume);
  fs.mkdirSync(path.join(process.env.BACKUP_PATH, backup.name));
  const container = await docker.createContainer({ 
    Image: process.env.BACKUP_IMAGE,
    Cmd: [ 'cp', '-r', '/volume/.', '/backup' ],
    HostConfig: { Mounts }
  });
  await container.start();
  await container.wait();
  await container.remove();
};

module.exports = {
  getBackups,
  loadBackup,
  createBackup
}
