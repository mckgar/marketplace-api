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

exports.findAccountByUsername = async username => {
  try {
    const user = await pool.query(
      'SELECT * FROM accounts WHERE username = $1 LIMIT 1',
      [username]
    );
    return user.rows[0];
  } catch (err) {
    return err;
  }
};

exports.findAccountByEmail = async email => {
  try {
    const user = await pool.query(
      'SELECT * FROM accounts WHERE email = $1 LIMIT 1',
      [email]
    );
    return user.rows[0];
  } catch (err) {
    return err;
  }
};

exports.findAccountById = async accountId => {
  try {
    const user = await pool.query(
      'SELECT * FROM accounts WHERE account_id = $1 LIMIT 1',
      [accountId]
    );
    return user.rows[0];
  } catch (err) {
    return err;
  }
};

exports.updateFirstName = async (accountId, firstName) => {
  try {
    await pool.query(
      'UPDATE accounts SET first_name = $1 WHERE account_id = $2',
      [firstName, accountId]
    );
  } catch (err) {
    return err;
  }
};

exports.updateLastName = async (accountId, lastName) => {
  try {
    await pool.query(
      'UPDATE accounts SET last_name = $1 WHERE account_id = $2',
      [lastName, accountId]
    );
  } catch (err) {
    return err;
  }
};

exports.updateEmail = async (accountId, newEmail) => {
  try {
    await pool.query(
      'UPDATE accounts SET email = $1 WHERE account_id = $2',
      [newEmail, accountId]
    );
  } catch (err) {
    return err;
  }
};

exports.updatePassword = async (accountId, newHashedPassword) => {
  try {
    await pool.query(
      'UPDATE accounts SET hashedPassword = $1 WHERE account_id = $2',
      [newHashedPassword, accountId]
    );
  } catch (err) {
    return err;
  }
};
