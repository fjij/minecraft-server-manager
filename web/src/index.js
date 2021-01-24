const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const mountRoutes = require('./routes');
const docker = require('./docker');
const errorHandler = require('./errorHandler');
  

const app = express();
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
mountRoutes(app);
app.use(errorHandler);

const port = process.env.PORT;

async function main() {
  await docker.createImage({ fromImage: process.env.SERVER_IMAGE });
  await docker.createImage({ fromImage: process.env.BACKUP_IMAGE });
  app.listen(port, () => {
    console.log(`App listening on port ${port}`);
  })
}

main();

module.exports = app;
