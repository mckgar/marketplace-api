const express = require('express');
const { body, validationResult } = require('express-validator');

const ordersRoute = database => {
  const router = express.Router();

  router.post('/', [
    body('email')
      .trim()
      .escape()
      .isEmail(),
    body('cart')
      .isArray()
      .bail()
      .toArray()
      .isLength({ min: 1 }),
    body('cart.*.item_id')
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
          console.error(err);
          return Promise.reject('Oops, something went wrong');
        }
      }),
    body('cart.*.quantity')
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
        await database.submitOrder(req.body.email, req.body.cart);
        res.sendStatus(201);
        return;
      } catch (err) {
        next(err);
      }
    }
  ]);

  return router;
}

module.exports = ordersRoute;
