require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('morgan');
const createError = require('http-errors');

const createApp = (database) => {
  const app = express();

  app.use(cors({
    origin: process.env.FRONTEND_URL
  }));
  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  const routes = require('./routes/index')(database);
  app.use('/', routes);

  app.use((req, res, next) => {
    next(createError(404));
  });

  app.use((err, req, res, next) => {
    const message = req.app.get('env') === 'production' ? 'Oops, an error occured' : err.message;
    if (req.app.get('env') !== 'production' && err.status !== 404) {
      console.log(err);
    }

    return res.status(err.status || 500).json(
      {
        message
      }
    )
  });

  return app;
}

module.exports = createApp;
