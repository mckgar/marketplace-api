const express = require('express');
const { body, query, validationResult } = require('express-validator');
const passport = require('passport');

const cartRoute = database => {
  const router = express.Router();
  require('../passport')(database);

  router.get('/', [
    passport.authenticate('jwt', { session: false }),
    async (req, res, next) => {
      try {
        const cart = await database.findCartByUser(req.user.account_id);
        res.status(200).json({
          cart: cart || []
        });
        return;
      } catch (err) {
        next(err);
      }
    }
  ]);

  router.put('/', [
    passport.authenticate('jwt', { session: false }),
    query('m')
      .trim()
      .escape()
      .custom(value => {
        if (!['add', 'remove'].includes(value)) {
          return Promise.reject('Invalid method: must be \'add\' or \'remove\'');
        } else {
          return true;
        }
      }),
    body('item_id')
      .trim()
      .escape()
      .isUUID()
      .bail()
      .custom(async value => {
        try {
          const item = await database.findItemById(value);
          if (!item) {
            return Promise.reject('Item not found');
          }
        } catch (err) {
          console.error(`Item ID validation error: ${err}`);
          return Promise.reject(err);
        }
      }),
    body('quantity')
      .trim()
      .escape()
      .isInt({ min: 1 })
      .bail()
      .toInt(),
    async (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          errors: errors.array()
        });
        return;
      }
      try {
        if (req.query.m === 'add') {
          await database.addItemToCart(req.user.account_id, req.body.item_id, req.body.quantity);
        }
        if (req.query.m === 'remove') {
          await database.removeItemFromCart(req.user.account_id, req.body.item_id, req.body.quantity);
        }
        res.sendStatus(200);
        return;
      } catch (err) {
        next(err)
      }
    }
  ]);

  return router;
}

module.exports = cartRoute;
