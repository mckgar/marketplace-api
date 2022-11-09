const express = require('express');
const { body, param, validationResult } = require('express-validator');
const passport = require('passport');

const itemRoute = database => {
  const router = express.Router();
  require('../passport')(database);

  router.post('/', [
    passport.authenticate('jwt', { session: false }),
    body('category')
      .trim()
      .escape()
      .isLength({ min: 1 }).withMessage('Category name is required')
      .isLength({ max: 255 }).withMessage('Category was not found'),
    body('name')
      .trim()
      .escape()
      .isLength({ min: 1 }).withMessage('Name is required')
      .isLength({ max: 255 }).withMessage('Name cannot exceed 255 characters'),
    body('description')
      .trim()
      .escape()
      .isLength({ min: 1 }).withMessage('Description is required')
      .isLength({ max: 1024 }).withMessage('Description cannot exceed 1024 characters'),
    body('price')
      .trim()
      .escape()
      .isFloat({ min: 0 })
      .bail()
      .toFloat(),
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
        const category = await database.findCategoryByName(req.body.category);
        if (category !== null) {
          await database.saveItem(
            req.user.account_id,
            req.body.name,
            req.body.description,
            req.body.price,
            req.body.quantity,
            category
          );
          res.sendStatus(201);
          return;
        }
        res.status(400).json({
          errors: [{
            param: 'category',
            message: 'Category was not found',
            value: req.body.category
          }]
        });
        return;
      } catch (err) {
        next(err);
      }
    }
  ]);

  router.get('/:itemId', [
    param('itemId')
      .trim()
      .escape()
      .isUUID(),
    async (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Only error can be invalid id
        next();
        return;
      }
      try {
        // Aggregates and joins data in function, reduce external calls; rename?
        const item = await database.findItemById(req.params.itemId);
        if (item) {
          res.status(200).json({
            item: {
              name: item.name,
              description: item.description,
              seller: item.seller,
              price: item.price,
              quantity: item.quantity,
              category: item.category,
              date_added: item.date_added
            }
          });
          return;
        }
        next();
        return;
      } catch (err) {
        next(err);
      }
    }
  ])

  return router;
}

module.exports = itemRoute;
