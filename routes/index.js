const express = require('express');

const routes = database => {
  const router = express.Router();
  router.get('/', (req, res, next) => res.send('Under construction'));

  router.use('/account', require('./account')(database));
  router.use('/login', require('./login')(database));

  router.use('/item', require('./item')(database));
  router.use('/cart', require('./cart')(database));
  router.use('/orders', require('./orders')(database));

  return router;
};

module.exports = routes;
