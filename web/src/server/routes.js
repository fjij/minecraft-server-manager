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

router.put('/:name', async (req, res) => {
  await control.putServer(req.params.name, req.body.server);
  res.send();
});

router.delete('/:name', async (req, res) => {
  await control.deleteServer(req.params.name);
  res.send();
});

module.exports = router;
