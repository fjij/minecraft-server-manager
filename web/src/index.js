const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const mountRoutes = require('./routes');

const app = express();
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
mountRoutes(app);

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
})

module.exports = app;
