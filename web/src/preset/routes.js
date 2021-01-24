const Router = require('express-promise-router');
const control = require('./control');

const router = new Router();

router.get('/', async (req, res) => {
  const presets = await control.getPresets();
  res.send({ presets });
});

router.get('/:name', async (req, res) => {
  const preset = await control.getPreset(req.params.name);
  res.send({ preset });
});

router.put('/:name', async (req, res) => {
  await control.putPreset(req.params.name, req.body.preset);
  res.send();
});

router.delete('/:name', async (req, res) => {
  await control.deletePreset(req.params.name);
  res.send();
});

router.get('/:name/env', async (req, res) => {
  const env = await control.getPresetEnv(req.params.name);
  res.send({ env });
});

router.put('/:name/env', async (req, res) => {
  await control.putPresetEnv(req.params.name, req.body.env);
  res.send();
});

module.exports = router;
