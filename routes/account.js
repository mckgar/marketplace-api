const express = require('express');
const { body, param, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const passport = require('passport');

const accountRoute = database => {
  const router = express.Router();
  require('../passport')(database);

  router.post('/', [
    body('username')
      .trim()
      .escape()
      .isLength({ min: 1 }).withMessage('Username is required')
      .isLength({ max: 20 }).withMessage('Username cannot exceed 20 characters')
      .custom(async value => {
        try {
          const search = await database.findAccountByUsername(value);
          if (search) {
            return Promise.reject('Username is already in use');
          }
        } catch (err) {
          console.log(err);
          return Promise.reject('An error has occured');
        }
      }),
    body('password')
      .trim()
      .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        returnScore: false
      })
      .escape(),
    body('email')
      .trim()
      .escape()
      .isEmail()
      .custom(async value => {
        try {
          const search = await database.findAccountByEmail(value);
          if (search) {
            return Promise.reject('Email is already in use');
          }
        } catch (err) {
          console.log(err);
          return Promise.reject('An error has occured');
        }
      }),
    async (req, res, next) => {
      const error = validationResult(req);
      if (!error.isEmpty()) {
        res.status(400).json(
          {
            errors: error.array()
          }
        );
        return;
      }
      try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = await database.createAccount(req.body.username, hashedPassword, req.body.email);
        const token = require('../issueToken')(user);
        res.status(201).json(
          {
            token
          }
        );
        return;
      } catch (err) {
        next(err);
      }
    }
  ]);

  router.put('/:username', [
    passport.authenticate('jwt', { session: false }),
    param('username')
      .trim()
      .escape(),
    body('first_name')
      .optional()
      .trim()
      .escape()
      .isLength({ min: 1 }).withMessage('first_name cannot be empty')
      .isLength({ max: 50 }).withMessage('first_name cannot exceed 50 characters'),
    body('last_name')
      .optional()
      .trim()
      .escape()
      .isLength({ min: 1 }).withMessage('last_name cannot be empty')
      .isLength({ max: 100 }).withMessage('last_name cannot exceed 100 characters'),
    body('email')
      .optional()
      .trim()
      .escape()
      .isEmail(),
    body('new_password')
      .optional()
      .trim()
      .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        returnScore: false
      })
      .escape(),
    async (req, res, next) => {
      if (req.user.username !== req.params.username) {
        res.sendStatus(403);
        return;
      }
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          errors: errors.array()
        });
        return;
      }
      if (!req.body.first_name && !req.body.last_name
        && !req.body.email && !req.body.new_password) {
        res.status(400).json({
          errors: 'No info has been given to update'
        });
        return;
      }
      try {
        if (req.body.first_name) {
          await database.updateFirstName(req.user.account_id, req.body.first_name);
        }
        if (req.body.last_name) {
          await database.updateLastName(req.user.account_id, req.body.last_name);
        }
        if (req.body.email) {
          await database.updateEmail(req.user.account_id, req.body.email);
        }
        if (req.body.new_password) {
          const hashedPassword = await bcrypt.hash(req.body.new_password, 10);
          await database.updatePassword(req.user.account_id, hashedPassword);
        }
        res.sendStatus(200);
        return;
      } catch (err) {
        next(err);
      }
    }
  ]);

  router.get('/:username', [
    param('username')
      .trim()
      .escape(),
    async (req, res, next) => {
      try {
        const user = await database.findAccountByUsername(req.params.username);
        if (user) {
          const items = await database.findItemsBySeller(user.account_id);
          res.status(200).json({
            user: {
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name,
              created_on: user.created_on,
            },
            items: items || []
          });
          return;
        }
        next();
      } catch (err) {
        next(err);
      }
    }
  ]);

  router.delete('/:username', [
    passport.authenticate('jwt', { session: false }),
    param('username')
      .trim()
      .escape(),
    async (req, res, next) => {
      if (req.user.username !== req.params.username) {
        res.sendStatus(403);
        return;
      }
      try {
        await database.deleteAccountById(req.user.account_id);
        res.sendStatus(200);
        return;
      } catch (err) {
        next(err)
      }
    }
  ]);

  return router;
}

module.exports = accountRoute;
