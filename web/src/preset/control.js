const db = require('../db');
const { PresetDoesNotExistError } = require('./exceptions');

async function getPresets() {
  const { rows } = await db.query('SELECT * FROM preset');
  return rows;
};

async function getPreset(name) {
  const { rows } = await db.query(
    'SELECT * FROM preset WHERE name = $1',
    [name]
  );
  if (rows.length === 0) {
    throw new PresetDoesNotExistError(name);
  }
  return rows[0];
};

async function putPreset(name) {
  await db.query(
    'INSERT INTO preset (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', 
    [name]
  );
};

async function deletePreset(name) {
  await getPreset(name);
  await db.query('DELETE FROM preset WHERE name = $1', [name]);
};

async function getPresetEnv(name) {
  await getPreset(name);
  const { rows } = await db.query(
    'SELECT * FROM preset_env WHERE preset_name = $1',
    [name]
  );
  return Object.fromEntries(rows.map(row => [row.key, row.value]));
};

async function putPresetEnv(name, env) {
  await getPreset(name);
  await db.query('DELETE FROM preset_env WHERE preset_name = $1', [name]);
  await Promise.all(Object.entries(env).map(([key, value]) => db.query(
    'INSERT INTO preset_env (preset_name, key, value) VALUES ($1, $2, $3)',
    [name, key, value]
  )));
};

module.exports = {
  getPresets,
  getPreset,
  putPreset,
  deletePreset,
  getPresetEnv,
  putPresetEnv,
};
