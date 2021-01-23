const db = require('../src/db');
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

async function clearServerTables() {
  await Promise.all([
    db.query('DELETE FROM server'),
    db.query('DELETE FROM server_env'),
  ]);
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

});
