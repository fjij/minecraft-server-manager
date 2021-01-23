const Router = require('express-promise-router');

const router = new Router();

router.get('/helloworld', async (req, res) => {
  res.send('Hello :)');
});

module.exports = router;
