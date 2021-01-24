const Router = require('express-promise-router');
const control = require('./control');

const router = new Router();

router.get('/', async (req, res) => {
  const servers = await control.getServers();
  res.send({ servers });
});

router.get('/:name', async (req, res) => {
  const server = await control.getServer(req.params.name);
  res.send({ server });
});

router.post('/:name', async (req, res) => {
  await control.createServer(
    req.params.name,
    req.body.server,
    req.body.preset,
    req.body.backup
  );
  res.send();
});

router.put('/:name', async (req, res) => {
  await control.putServer(req.params.name, req.body.server);
  res.send();
});

router.delete('/:name', async (req, res) => {
  await control.deleteServer(req.params.name);
  res.send();
});

router.get('/:name/env', async (req, res) => {
  const env = await control.getServerEnv(req.params.name);
  res.send({ env });
});

router.put('/:name/env', async (req, res) => {
  await control.putServerEnv(req.params.name, req.body.env);
  res.send();
});

router.get('/:name/status', async (req, res) => {
  const status = await control.getServerStatus(req.params.name);
  res.send({ status });
});

router.post('/:name/on', async (req, res) => {
  await control.serverOn(req.params.name);
  res.send();
});

router.post('/:name/off', async (req, res) => {
  await control.serverOff(req.params.name);
  res.send();
});

router.post('/:name/backup', async (req, res) => {
  await control.backupServer(req.params.name);
  res.send();
});

module.exports = router;
