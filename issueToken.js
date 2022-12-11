const jwt = require('jsonwebtoken');

const issueToken = account_id => {
  const payload = {
    account_id
  };
  const opts = { expiresIn: '1 day' };
  const token = jwt.sign(payload, process.env.JWT_SECRET, opts);

  return token;
}

module.exports = issueToken;
