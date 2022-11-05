const jwt = require('jsonwebtoken');

const issueToken = account_id => {
  const payload = {
    account_id
  };
  const opts = { expiresIn: 600 };
  const token = jwt.sign(payload, process.env.JWT_SECRET, opts);

  return token;
}

module.exports = issueToken;
