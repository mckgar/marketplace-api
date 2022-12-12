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

// Create account

exports.createAccount = async (username, hashedPassword, email) => {
  try {
    // Create account
    await pool.query(
      `
      INSERT INTO accounts(username, hashedPassword, email) 
      VALUES($1, $2, $3)
      `,
      [username, hashedPassword, email]
    );
    const newUser = await pool.query(
      `
      SELECT account_id FROM accounts
      WHERE username = $1
      LIMIT 1
      `,
      [username]
    );
    console.log(newUser.rows[0].account_id);
    // Create cart
    await pool.query(
      `
      INSERT INTO carts(cart_owner)
      VALUES($1)
      `,
      [newUser.rows[0].account_id]
    )
    return newUser.rows[0].account_id;
  } catch (err) {
    return Promise.reject(err);
  }
};

// Find account

exports.findAccountByUsername = async username => {
  try {
    const user = await pool.query(
      'SELECT * FROM accounts WHERE username = $1 LIMIT 1',
      [username]
    );
    return user.rows[0];
  } catch (err) {
    return Promise.reject(err);
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
    return Promise.reject(err);
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
    return Promise.reject(err);
  }
};

// Update account

exports.updateFirstName = async (accountId, firstName) => {
  try {
    await pool.query(
      'UPDATE accounts SET first_name = $1 WHERE account_id = $2',
      [firstName, accountId]
    );
  } catch (err) {
    return Promise.reject(err);
  }
};

exports.updateLastName = async (accountId, lastName) => {
  try {
    await pool.query(
      'UPDATE accounts SET last_name = $1 WHERE account_id = $2',
      [lastName, accountId]
    );
  } catch (err) {
    return Promise.reject(err);
  }
};

exports.updateEmail = async (accountId, newEmail) => {
  try {
    await pool.query(
      'UPDATE accounts SET email = $1 WHERE account_id = $2',
      [newEmail, accountId]
    );
  } catch (err) {
    return Promise.reject(err);
  }
};

exports.updatePassword = async (accountId, newHashedPassword) => {
  try {
    await pool.query(
      'UPDATE accounts SET hashedPassword = $1 WHERE account_id = $2',
      [newHashedPassword, accountId]
    );
  } catch (err) {
    return Promise.reject(err);
  }
};

// Delete account

exports.deleteAccountById = async accountId => {
  try {
    const cartId = await pool.query(
      `
      SELECT cart_id FROM carts
      WHERE cart_owner = $1
      `,
      [accountId]
    );
    await pool.query(
      `
      DELETE FROM cart_items
      WHERE cart = $1
      `,
      [cartId.rows[0].cart_id]
    );
    await pool.query(
      `
      DELETE FROM carts
      WHERE cart_owner = $1
      `,
      [accountId]
    );
    await pool.query(
      `
      DELETE FROM items
      WHERE seller = $1
      `,
      [accountId]
    );
    await pool.query(
      'DELETE FROM accounts WHERE account_id = $1',
      [accountId]
    );
  } catch (err) {
    return Promise.reject(err);
  }
}

// Create item

exports.saveItem = async (sellerId, name, description, price, quantity, category) => {
  try {
    const newItem = await pool.query(
      `
      INSERT INTO items(seller, item_name, item_description, price, quantity, category, date_added) 
      VALUES($1, $2, $3, $4, $5, $6, NOW())
      `,
      [sellerId, name, description, price, quantity, category]
    );
    return newItem.item_id;
  } catch (err) {
    return Promise.reject(err);
  }
};

// Find many items

exports.retrieveItems = async (price, category, offset, limit) => {
  try {
    const priceClause = price === 'relevent' ? '' :
      price === 'low' ? 'ORDER BY price' : 'ORDER BY price DESC';
    const categoryClause = category === 'all' ? '' : `WHERE category = ${category}`;
    const search = await pool.query(
      `
      SELECT * FROM items
      ${categoryClause}
      ${priceClause}
      LIMIT $2 OFFSET $1
      `,
      [offset, limit]
    );
    return search.rows;
  } catch (err) {
    return Promise.reject(err)
  }
};

exports.findItemsBySeller = async sellerId => {
  try {
    const search = await pool.query(
      `
      SELECT * FROM items
      WHERE seller = $1
      `,
      [sellerId]
    );
    return search.rows;
  } catch (err) {
    return Promise.reject(err);
  }
};

// Find item

exports.findItemById = async (itemId) => {
  try {
    const search = await pool.query(
      'SELECT * FROM items WHERE item_id = $1 LIMIT 1',
      [itemId]
    );
    const item = search.rows[0];
    return item;
  } catch (err) {
    return Promise.reject(err);
  }
};

// Update item

exports.updateItemName = async (itemId, name) => {
  try {
    await pool.query(
      'UPDATE items SET item_name = $1 WHERE item_id = $2',
      [name, itemId]
    );
  } catch (err) {
    return Promise.reject(err);
  }
};

exports.updateItemDescription = async (itemId, description) => {
  try {
    await pool.query(
      'UPDATE items SET item_description = $1 WHERE item_id = $2',
      [description, itemId]
    );
  } catch (err) {
    return Promise.reject(err);
  }
};

exports.updateItemPrice = async (itemId, price) => {
  try {
    await pool.query(
      'UPDATE items SET price = $1 WHERE item_id = $2',
      [price, itemId]
    );
  } catch (err) {
    return Promise.reject(err);
  }
};

exports.updateItemQuantity = async (itemId, quantity) => {
  try {
    await pool.query(
      'UPDATE items SET quantity = $1 WHERE item_id = $2',
      [quantity, itemId]
    );
  } catch (err) {
    return Promise.reject(err);
  }
};

exports.updateItemCategory = async (itemId, category) => {
  try {
    await pool.query(
      'UPDATE items SET category = $1 WHERE item_id = $2',
      [category, itemId]
    );
  } catch (err) {
    return Promise.reject(err);
  }
};

// Delete item

exports.deleteItem = async itemId => {
  try {
    await pool.query(
      'DELETE FROM items WHERE item_id = $1',
      [itemId]
    )
  } catch (err) {
    return Promise.reject(err);
  }
}

// Find category

exports.findCategoryByName = async name => {
  try {
    const search = await pool.query(
      'SELECT * FROM categories WHERE category_name = $1 LIMIT 1',
      [name]
    );
    return search.rows[0];
  } catch (err) {
    return Promise.reject(err);
  }
};

// Retrieve cart

exports.findCartByUser = async accountId => {
  try {
    const cart = await pool.query(
      `
      SELECT * FROM carts
      LEFT JOIN cart_items ON carts.cart_id = cart_items.cart
      WHERE cart_owner = $1
      `,
      [accountId]
    );
    return cart.rows;
  } catch (err) {
    return Promise.reject(err);
  }
}

// Modify cart

exports.addItemToCart = async (accountId, itemId, quantity) => {
  try {
    const cartId = await pool.query(
      `
      SELECT cart_id FROM carts
      WHERE cart_owner = $1
      LIMIT 1
      `,
      [accountId]
    );
    console.log(cartId);
    const maxQuantity = await pool.query(
      `
      SELECT quantity FROM items
      WHERE item_id = $1
      LIMIT 1
      `,
      [itemId]
    ).rows[0];
    const quantityToUse = Math.min(maxQuantity, quantity)
    await pool.query(
      `
      INSERT INTO cart_items(cart, item, quantity, date_placed)
      VALUES($1, $2, $3, NOW())
      `,
      [cartId, itemId, quantityToUse]
    );
  } catch (err) {
    return Promise.reject(err);
  }
}
