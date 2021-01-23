const serverRoutes = require('./server/routes');

module.exports = app => {
  app.use('/server', serverRoutes);
};
