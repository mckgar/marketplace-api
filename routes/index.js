const express = require('express');

const routes = (database) => {
  const router = express.Router();
  router.get('/', (req, res, next) => res.send('Under construction'));

  router.use('/account', require('./account')(database));
  router.use('/login', require('./login')(database));

  return router;
};

module.exports = routes;
