const db = require('../src/db');
const docker = require('../src/docker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../src');
const should = chai.should();
const expect = chai.expect;
const presetTesting = require('./preset');
const backupUtils = require('../src/backup/control.js');
const fs = require('fs');
const path = require('path');

chai.use(chaiHttp);

let serverSeed = 0;
async function mockServer({mockVolume}={}) {
  let volume = 'some-volume';
  if (mockVolume) {
    const res = await docker.createVolume({ Driver: 'local' });
    volume = res.name;
  }
  const server = {
    name: `server${serverSeed}`,
    created: new Date(Date.now() + 1000*serverSeed),
    port: 1234 + serverSeed,
    volume
  };
  await db.query(
    'INSERT INTO server (name, created, port, volume) VALUES ($1, $2, $3, $4)',
    [server.name, server.created, server.port, server.volume]
  );
  serverSeed ++;
  server.created = JSON.parse(JSON.stringify(server.created));
  return server;
}

let envSeed = 0;
async function mockEnv(server, count = 2) {
  const env = {};
  for(let i = 0; i < count; i ++) {
    env[`ENV${envSeed}`] = `VALUE${envSeed}`;
    envSeed ++;
  }
  await Promise.all(Object.keys(env).map(async key => await db.query(
    'INSERT INTO server_env (server_name, key, value) VALUES ($1, $2, $3)',
    [server.name, key, env[key]]
  )));
  return env;
}

async function clearServerTables() {
  await db.query('DELETE FROM server_env');
  await db.query('DELETE FROM server');
}

describe('Server', () => {

  afterEach(clearServerTables);

  describe('GET server', () => {

    it('should list servers', async () => {
      const servers = [
        await mockServer(),
        await mockServer()
      ];
      const res = await chai.request(app).get('/server');
      res.should.have.status(200);
      res.body.should.eql({
        servers
      });
    });

  });

  describe('GET server/:name', () => {

    it('should get a singular server', async () => {
      const server = await mockServer();
      const res = await chai.request(app).get(`/server/${server.name}`);
      res.should.have.status(200);
      expect(res.body).to.eql({
        server
      });
    });

    it('should fail for a server that does not exist', async () => {
      const res = await chai.request(app).get(`/server/imaginary`);
      res.should.have.status(404);
      expect(res.body).to.eql({
        error: {
          message: 'Server does not exist: imaginary'
        }
      });
    });

  });

  describe('POST server/:name', () => {

    it('should create a server and volume', async () => {
      const server = {
        name: 'asdf',
        port: 1234,
      }
      const res = await chai.request(app).post(`/server/${server.name}`).send({
        server
      });
      res.should.have.status(200);
      const { rows } = await db.query(
        'SELECT * FROM server WHERE name = $1',
        [server.name]
      );
      expect(rows.length).to.eql(1);
      expect(rows[0].port).to.eql(server.port);
      const { Volumes } = await docker.listVolumes({});
      expect(Volumes.map(v => v.Name)).to.include(rows[0].volume);
      await docker.getVolume(rows[0].volume).remove();
    });

    it( 'should create a server/volume from backup and backup existing servers', 
      async () => {
      fs.mkdirSync(path.join(process.env.BACKUP_PATH, 'asdf'));
      fs.writeFileSync(path.join(process.env.BACKUP_PATH, 'asdf', 'hi'), 'hi');
      const backup = { name: 'asdf' };
      const server = { name: 'asdf', port: 1234, };
      await docker.createImage({ fromImage: process.env.BACKUP_IMAGE });

      const res = await chai.request(app).post(`/server/${server.name}`).send({
        server, backup
      });
      res.should.have.status(200);
      const { rows } = await db.query(
        'SELECT * FROM server WHERE name = $1', [server.name]
      );
      await backupUtils.createBackup({ name: 'test_backup' }, rows[0].volume);
      expect(fs.existsSync(path.join(process.env.BACKUP_PATH, 'test_backup', 'hi')))
        .to.be.true;
      await docker.getVolume(rows[0].volume).remove();
      fs.rmdirSync(
        path.join(process.env.BACKUP_PATH, 'asdf'), 
        {recursive: true}
      );
      fs.rmdirSync(
        path.join(process.env.BACKUP_PATH, 'test_backup'), 
        {recursive: true}
      );
    });

    it('should fail if that server already exists', async () => {

      const server = await mockServer();
      const res = await chai.request(app).post(`/server/${server.name}`).send({
        server
      });
      res.should.have.status(409);
      expect(res.body).to.eql({
        error: {
          message: `Server already exists: ${server.name}`
        }
      });
    });

    it('should create a server from a preset', async () => {
      const server = {
        name: 'asdf',
        port: 1234,
      }
      const preset = await presetTesting.mockPreset();
      const env = await presetTesting.mockEnv(preset);
      const res = await chai.request(app).post(`/server/${server.name}`).send({
        server,
        preset
      });
      res.should.have.status(200);
      const { rows } = await db.query(
        'SELECT * FROM server_env WHERE server_name = $1',
        [server.name]
      );
      expect(Object.fromEntries(rows.map(rows => [rows.key, rows.value])))
        .to.eql(env);

      {
        const { rows } = await db.query(
          'SELECT * FROM server WHERE name = $1',
          [server.name]
        );
        await docker.getVolume(rows[0].volume).remove();
      }

      await db.query('DELETE FROM preset_env');
    });

  });

  describe('PUT server/:name', () => {

    it('should create a server and volume', async () => {
      const server = {
        name: 'asdf',
        port: 1234,
      }
      const res = await chai.request(app).put(`/server/${server.name}`).send({
        server
      });
      res.should.have.status(200);
      const { rows } = await db.query(
        'SELECT * FROM server WHERE name = $1',
        [server.name]
      );
      expect(rows.length).to.eql(1);
      expect(rows[0].port).to.eql(server.port);
      const { Volumes } = await docker.listVolumes({});
      expect(Volumes.map(v => v.Name)).to.include(rows[0].volume);
      await docker.getVolume(rows[0].volume).remove();
    });

    it('should update a server', async () => {
      const server = await mockServer();
      server.port ++;
      const res = await chai.request(app).put(`/server/${server.name}`).send({
        server
      });
      res.should.have.status(200);
      const { rows } = await db.query(
        'SELECT * FROM server WHERE name = $1',
        [server.name]
      );
      expect(rows.length).to.eql(1);
      expect(rows[0].port).to.eql(server.port);
    });

  });

  describe('DELETE server/:name', () => {

    it('should delete a server and volume', async () => {
      const server = await mockServer({ mockVolume: true });
      const res = await chai.request(app).delete(`/server/${server.name}`);
      res.should.have.status(200);
      const { rows } = await db.query(
        'SELECT * FROM server WHERE name = $1',
        [server.name]
      );
      expect(rows.length).to.eql(0);
      const { Volumes } = await docker.listVolumes({});
      expect(Volumes.map(v => v.Name)).to.not.include(server.volume);
    });

  });

  describe('GET server/:name/env', () => {

    it('should get a server\'s env', async () => {
      const server = await mockServer();
      const env = await mockEnv(server);
      const res = await chai.request(app).get(`/server/${server.name}/env`);
      res.should.have.status(200);
      expect(res.body).to.eql({
        env
      });
    });

  });

  describe('PUT server/:name/env', () => {

    it('should create a server\'s env for a new server', async () => {
      const server = await mockServer();
      const env = {
        'SOME_VARIABLE': '0',
        'ANOTHER_VARIABLE': '2',
      }
      const res = await chai.request(app).put(`/server/${server.name}/env`)
        .send({ env });
      res.should.have.status(200);
      const { rows } = await db.query(
        'SELECT * FROM server_env WHERE server_name = $1',
        [server.name]
      );
      expect(Object.fromEntries(rows.map(rows => [rows.key, rows.value])))
        .to.eql(env);
    });

    it('should update a server\'s env', async () => {
      const server = await mockServer();
      const env = await mockEnv(server);
      env['PIZZA'] = 'yummy';
      const res = await chai.request(app).put(`/server/${server.name}/env`)
        .send({ env });
      res.should.have.status(200);
      const { rows } = await db.query(
        'SELECT * FROM server_env WHERE server_name = $1',
        [server.name]
      );
      expect(Object.fromEntries(rows.map(rows => [rows.key, rows.value])))
        .to.eql(env);
    });

    it('should clear a server\'s env when empty', async () => {
      const server = await mockServer();
      await mockEnv(server);
      const res = await chai.request(app).put(`/server/${server.name}/env`)
        .send({ env: {} });
      res.should.have.status(200);
      const { rows } = await db.query(
        'SELECT * FROM server_env WHERE server_name = $1',
        [server.name]
      );
      expect(rows.length).to.eql(0);
    });

  });

  describe('POST server/:name/on', () => {

    it('should turn on a server', async () => {
      const server = await mockServer();
      const res = await chai.request(app).post(`/server/${server.name}/on`);
      res.should.have.status(200);
      const { State } = await docker.getContainer(server.name).inspect();
      expect(State.Status === 'running' || State.Status === 'exited')
        .to.be.true;
      await docker.getContainer(server.name).stop();
      await docker.getContainer(server.name).remove();
    });

  });

  describe('Get server/:name/status', () => {

    it('should get a server\'s status', async () => {
      const server = await mockServer();
      await docker.createImage({ fromImage: process.env.SERVER_IMAGE });
      await docker.createContainer({
        name: server.name,
        Image: process.env.SERVER_IMAGE,
      });
      await docker.getContainer(server.name).start();
      const res = await chai.request(app).get(`/server/${server.name}/status`);
      res.should.have.status(200);
      expect(res.body.status).to.equal('running');
      await docker.getContainer(server.name).stop();
      await docker.getContainer(server.name).remove();
    });

  });

  describe('POST server/:name/off', () => {

    it('should turn off a server', async () => {
      const server = await mockServer();
      await docker.createImage({ fromImage: process.env.SERVER_IMAGE });
      await docker.createContainer({
        name: server.name,
        Image: process.env.SERVER_IMAGE,
      });
      await docker.getContainer(server.name).start();
      const res = await chai.request(app).post(`/server/${server.name}/off`);
      res.should.have.status(200);
      const containers = await docker.listContainers({ all: true });
      const containerNames = containers
        .map(container => container.Names)
        .reduce((a, b) => [...a, ...b]);
      expect(containerNames).to.not.include(`/${server.name}`);
    });

  });

});
