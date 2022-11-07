const createPassport = database => {
  const passport = require('passport');

  const jwtStrategy = require('passport-jwt').Strategy;
  const extractJwt = require('passport-jwt').ExtractJwt;

  const opts = {};
  opts.jwtFromRequest = extractJwt.fromAuthHeaderAsBearerToken();
  opts.secretOrKey = process.env.JWT_SECRET;
  passport.use(new jwtStrategy(opts, async (payload, done) => {
    try {
      const user = await database.findAccountById(payload.account_id);
      if (user) {
        return done(null, user);
      }
      return done(null, false);
    } catch (err) {
      return done(err, false);
    }
  }));
}

module.exports = createPassport;
