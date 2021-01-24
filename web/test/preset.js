const db = require('../src/db');
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../src');
const should = chai.should();
const expect = chai.expect;

chai.use(chaiHttp);

let presetSeed = 0;
async function mockPreset() {
  const preset = {
    name: `preset${presetSeed}`,
    created: new Date(Date.now() + 1000*presetSeed),
  };
  await db.query(
    'INSERT INTO preset (name, created) VALUES ($1, $2)',
    [preset.name, preset.created]
  );
  presetSeed ++;
  preset.created = JSON.parse(JSON.stringify(preset.created));
  return preset;
}

let envSeed = 0;
async function mockEnv(preset, count = 2) {
  const env = {};
  for(let i = 0; i < count; i ++) {
    env[`ENV${envSeed}`] = `VALUE${envSeed}`;
    envSeed ++;
  }
  await Promise.all(Object.keys(env).map(async key => await db.query(
    'INSERT INTO preset_env (preset_name, key, value) VALUES ($1, $2, $3)',
    [preset.name, key, env[key]]
  )));
  return env;
}

async function clearPresetTables() {
  await db.query('DELETE FROM preset');
}

describe('Preset', () => {

  afterEach(clearPresetTables);

  describe('GET preset', () => {

    it('should list presets', async () => {
      const presets = [
        await mockPreset(),
        await mockPreset()
      ];
      const res = await chai.request(app).get('/preset');
      res.should.have.status(200);
      res.body.should.eql({ presets });
    });

  });

  describe('GET preset/:name', () => {

    it('should get a singular preset', async () => {
      const preset = await mockPreset();
      const res = await chai.request(app).get(`/preset/${preset.name}`);
      res.should.have.status(200);
      expect(res.body).to.eql({ preset });
    });

    it('should fail for a preset that does not exist', async () => {
      const res = await chai.request(app).get(`/preset/imaginary`);
      res.should.have.status(404);
      expect(res.body).to.eql({
        error: {
          message: 'Preset does not exist: imaginary'
        }
      });
    });

  });

  describe('DELETE preset/:name', () => {

    it('should delete a preset', async () => {
      const preset = await mockPreset();
      const res = await chai.request(app).delete(`/preset/${preset.name}`);
      res.should.have.status(200);
      const { rows } = await db.query(
        'SELECT * FROM preset WHERE name = $1',
        [preset.name]
      );
      expect(rows.length).to.eql(0);
    });

  });

  describe('GET preset/:name/env', () => {

    it('should get a preset\'s env', async () => {
      const preset = await mockPreset();
      const env = await mockEnv(preset);
      const res = await chai.request(app).get(`/preset/${preset.name}/env`);
      res.should.have.status(200);
      expect(res.body).to.eql({
        env
      });
    });

  });

  describe('PUT preset/:name/env', () => {

    it('should create a preset\'s env for a new preset', async () => {
      const preset = await mockPreset();
      const env = {
        'SOME_VARIABLE': '0',
        'ANOTHER_VARIABLE': '2',
      }
      const res = await chai.request(app).put(`/preset/${preset.name}/env`)
        .send({ env });
      res.should.have.status(200);
      const { rows } = await db.query(
        'SELECT * FROM preset_env WHERE preset_name = $1',
        [preset.name]
      );
      expect(Object.fromEntries(rows.map(rows => [rows.key, rows.value])))
        .to.eql(env);
    });

    it('should update a preset\'s env', async () => {
      const preset = await mockPreset();
      const env = await mockEnv(preset);
      env['PIZZA'] = 'yummy';
      const res = await chai.request(app).put(`/preset/${preset.name}/env`)
        .send({ env });
      res.should.have.status(200);
      const { rows } = await db.query(
        'SELECT * FROM preset_env WHERE preset_name = $1',
        [preset.name]
      );
      expect(Object.fromEntries(rows.map(rows => [rows.key, rows.value])))
        .to.eql(env);
    });

    it('should clear a preset\'s env when empty', async () => {
      const preset = await mockPreset();
      await mockEnv(preset);
      const res = await chai.request(app).put(`/preset/${preset.name}/env`)
        .send({ env: {} });
      res.should.have.status(200);
      const { rows } = await db.query(
        'SELECT * FROM preset_env WHERE preset_name = $1',
        [preset.name]
      );
      expect(rows.length).to.eql(0);
    });

  });

});

module.exports = {
  mockEnv,
  mockPreset
}
