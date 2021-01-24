const db = require('../src/db');
const docker = require('../src/docker');
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../src');
const should = chai.should();
const expect = chai.expect;

chai.use(chaiHttp);

let serverSeed = 0;
async function mockServer() {
  const server = {
    name: `server${serverSeed}`,
    created: new Date(Date.now() + 1000*serverSeed),
    port: 1234 + serverSeed,
    path: `/srv/minecraft/server${serverSeed}`
  };
  await db.query(
    'INSERT INTO server (name, created, port, path) VALUES ($1, $2, $3, $4)',
    [server.name, server.created, server.port, server.path]
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
      res.body.should.be.eql({
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

  });

  describe('PUT server/:name', () => {

    it('should create a server', async () => {
      const server = {
        name: 'asdf',
        port: 1234,
        path: '/srv/minecraft/asdf'
      }
      const res = await chai.request(app).put(`/server/${server.name}`).send({
        server
      });
      res.should.have.status(200);
      const { rows } = await db.query(
        'SELECT name, port, path FROM server WHERE name = $1',
        [server.name]
      );
      expect(rows.length).to.eql(1);
      expect(rows[0].port).to.eql(server.port);
      expect(rows[0].path).to.eql(server.path);
    });

    it('should update a server', async () => {
      const server = await mockServer();
      server.port ++;
      const res = await chai.request(app).put(`/server/${server.name}`).send({
        server
      });
      res.should.have.status(200);
      const { rows } = await db.query(
        'SELECT name, port, path FROM server WHERE name = $1',
        [server.name]
      );
      expect(rows.length).to.eql(1);
      expect(rows[0].port).to.eql(server.port);
      expect(rows[0].path).to.eql(server.path);
    });

  });

  describe('DELETE server/:name', () => {

    it('should delete a server', async () => {
      const server = await mockServer();
      const res = await chai.request(app).delete(`/server/${server.name}`);
      res.should.have.status(200);
      const { rows } = await db.query(
        'SELECT * FROM server WHERE name = $1',
        [server.name]
      );
      expect(rows.length).to.eql(0);
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
      expect(State.Status).to.equal('running');
      await docker.getContainer(server.name).stop();
      await docker.getContainer(server.name).remove();
    });

  });

  describe('Get server/:name/status', () => {

    it('should get a server\'s status', async () => {
      const server = await mockServer();
      await docker.createImage({ fromImage: 'itzg/minecraft-server' });
      await docker.createContainer({
        name: server.name,
        Image: 'itzg/minecraft-server',
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
      await docker.createImage({ fromImage: 'itzg/minecraft-server' });
      await docker.createContainer({
        name: server.name,
        Image: 'itzg/minecraft-server',
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
