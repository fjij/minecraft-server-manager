const serverRoutes = require('./server/routes');
const presetRoutes = require('./preset/routes');
const backupRoutes = require('./backup/routes');

module.exports = app => {
  app.use('/server', serverRoutes);
  app.use('/preset', presetRoutes);
  app.use('/backup', backupRoutes);
};
