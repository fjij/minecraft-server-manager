const serverRoutes = require('./server/routes');
const presetRoutes = require('./preset/routes');

module.exports = app => {
  app.use('/server', serverRoutes);
  app.use('/preset', presetRoutes);
};
