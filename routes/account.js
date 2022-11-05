const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

const accountRoute = (database) => {
  const router = express.Router();

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

  return router;
}

module.exports = accountRoute;
