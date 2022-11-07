const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

const loginRoute = database => {
  const router = express.Router();

  router.post('/', [
    body('username')
      .trim()
      .escape(),
    body('password')
      .trim()
      .escape(),
    body('email')
      .trim()
      .escape(),
    async (req, res, next) => {
      try {
        let user;
        if (req.body.username) {
          user = await database.findAccountByUsername(req.body.username);
        }
        if (req.body.email) {
          user = await database.findAccountByEmail(req.body.email);
        }
        if (user) {
          const valid = await bcrypt.compare(req.body.password, user.hashedpassword);
          if (valid) {
            const token = require('../issueToken')(user.account_id);
            res.status(200).json({
              token
            });
            return;
          }
        }
        res.status(400).json({
          errors: 'Login or password are incorrect'
        });
        return;
      } catch (err) {
        next(err);
      }
    }
  ]);

  return router;
}

module.exports = loginRoute;
