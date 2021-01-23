const db = require('../src/db');
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../src');
const should = chai.should();

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

  describe('/GET server', () => {

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

});
