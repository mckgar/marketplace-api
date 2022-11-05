const { Pool } = require('pg');

const pool = new Pool(
  {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'marketplace'
  }
);

exports.findAccountByUsername = async (username) => {
  try {
    const search = await pool.query(
      'SELECT * FROM accounts WHERE username = $1 LIMIT 1',
      [username]
    );
    return search.rows[0];
  } catch (err) {
    return err;
  }
};

exports.findAccountByEmail = async (email) => {
  try {
    const search = await pool.query(
      'SELECT * FROM accounts WHERE email = $1 LIMIT 1',
      [email]
    );
    return search.rows[0];
  } catch (err) {
    return err;
  }
};

exports.createAccount = async (username, hashedPassword, email) => {
  try {
    const newUser = await pool.query(
      'INSERT INTO accounts(username, hashedPassword, email) VALUES($1, $2, $3)',
      [username, hashedPassword, email]
    );
    return newUser.account_id;
  } catch (err) {
    return err;
  }
};
