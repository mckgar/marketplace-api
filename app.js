require('dotenv').config();
const express = require('express');
const logger = require('morgan');
const createError = require('http-errors');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

module.exports = app;
