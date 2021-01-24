const Router = require('express-promise-router');
const control = require('./control');

const router = new Router();

router.get('/', async (req, res) => {
  const backups = await control.getBackups();
  res.send({ backups });
});

module.exports = router;
