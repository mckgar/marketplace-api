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
      `
      SELECT * FROM accounts
      WHERE username = $1
      LIMIT 1
      `,
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
      `
      SELECT * FROM accounts
      WHERE email = $1
      LIMIT 1
      `,
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
      `
      SELECT * FROM accounts
      WHERE account_id = $1
      LIMIT 1
      `,
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
      `
      UPDATE accounts
      SET first_name = $1
      WHERE account_id = $2
      `,
      [firstName, accountId]
    );
  } catch (err) {
    return Promise.reject(err);
  }
};

exports.updateLastName = async (accountId, lastName) => {
  try {
    await pool.query(
      `
      UPDATE accounts
      SET last_name = $1
      WHERE account_id = $2
      `,
      [lastName, accountId]
    );
  } catch (err) {
    return Promise.reject(err);
  }
};

exports.updateEmail = async (accountId, newEmail) => {
  try {
    await pool.query(
      `
      UPDATE accounts
      SET email = $1
      WHERE account_id = $2
      `,
      [newEmail, accountId]
    );
  } catch (err) {
    return Promise.reject(err);
  }
};

exports.updatePassword = async (accountId, newHashedPassword) => {
  try {
    await pool.query(
      `
      UPDATE accounts
      SET hashedPassword = $1
      WHERE account_id = $2
      `,
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
      `
      DELETE FROM accounts
      WHERE account_id = $1
      `,
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
  } catch (err) {
    return Promise.reject(err);
  }
};

// Find many items

exports.retrieveItems = async (price, category, offset, limit) => {
  try {
    const priceClause = price === 'relevent' ? '' :
      price === 'low' ? 'ORDER BY price' : 'ORDER BY price DESC';
    const categoryClause = category === 'all' ?
      ['books', 'clothing', 'toys', 'games', 'accessories', 'decorations', 'office'] :
      [category];
    const search = await pool.query(
      `
      SELECT
        item_id,
        item_name AS name,
        price,
        quantity,
        accounts.username AS seller,
        categories.category_name AS category 
      FROM items
      LEFT JOIN accounts on items.seller = accounts.account_id
      LEFT JOIN categories on items.category = categories.category_id
      WHERE categories.category_name = ANY ($3)
      ${priceClause}
      LIMIT $2 OFFSET $1
      `,
      [offset, limit, categoryClause]
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
      SELECT 
        item_id,
        item_name AS name,
        price,
        quantity,
        accounts.username AS seller,
        categories.category_name AS category
      FROM items
      LEFT JOIN accounts on items.seller = accounts.account_id
      LEFT JOIN categories on items.category = categories.category_id
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
      `
      SELECT 
        item_id,
        item_name AS name,
        item_description AS description,
        price,
        quantity,
        date_added,
        accounts.username AS seller,
        categories.category_name AS category
      FROM items
      LEFT JOIN accounts on items.seller = accounts.account_id
      LEFT JOIN categories on items.category = categories.category_id
      WHERE item_id = $1
      LIMIT 1
      `,
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
      `
      UPDATE items
      SET item_name = $1
      WHERE item_id = $2
      `,
      [name, itemId]
    );
  } catch (err) {
    return Promise.reject(err);
  }
};

exports.updateItemDescription = async (itemId, description) => {
  try {
    await pool.query(
      `
      UPDATE items
      SET item_description = $1
      WHERE item_id = $2
      `,
      [description, itemId]
    );
  } catch (err) {
    return Promise.reject(err);
  }
};

exports.updateItemPrice = async (itemId, price) => {
  try {
    await pool.query(
      `
      UPDATE items
      SET price = $1
      WHERE item_id = $2
      `,
      [price, itemId]
    );
  } catch (err) {
    return Promise.reject(err);
  }
};

exports.updateItemQuantity = async (itemId, quantity) => {
  try {
    await pool.query(
      `
      UPDATE items
      SET quantity = $1
      WHERE item_id = $2
      `,
      [quantity, itemId]
    );
  } catch (err) {
    return Promise.reject(err);
  }
};

exports.updateItemCategory = async (itemId, category) => {
  try {
    await pool.query(
      `
      UPDATE items
      SET category = $1
      WHERE item_id = $2
      `,
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
      `
      DELETE FROM items
      WHERE item_id = $1
      `,
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
      `
      SELECT * FROM categories
      WHERE category_name = $1
      LIMIT 1
      `,
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
      SELECT
        items.item_id,
        items.item_name AS name,
        items.price,
        cart_items.quantity,
        accounts.username AS seller,
        categories.category_name AS category,
        cart_items.date_placed
      FROM carts
      LEFT JOIN cart_items ON carts.cart_id = cart_items.cart
      LEFT JOIN items ON cart_items.item = items.item_id
      LEFT JOIN accounts ON items.seller = accounts.account_id
      LEFT JOIN categories ON items.category = categories.category_id
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
    const maxQuantity = await pool.query(
      `
      SELECT quantity FROM items
      WHERE item_id = $1
      LIMIT 1
      `,
      [itemId]
    );
    const quantityToUse = Math.min(maxQuantity.rows[0].quantity, quantity);
    await pool.query(
      `
      INSERT INTO cart_items(cart, item, quantity, date_placed)
      VALUES($1, $2, $3, NOW())
      `,
      [cartId.rows[0].cart_id, itemId, quantityToUse]
    );
  } catch (err) {
    return Promise.reject(err);
  }
}

exports.removeItemFromCart = async (accountId, itemId, quantity) => {
  try {
    const cartId = await pool.query(
      `
      SELECT cart_id FROM carts
      WHERE cart_owner = $1
      LIMIT 1
      `,
      [accountId]
    );
    const maxQuantity = await pool.query(
      `
      SELECT quantity FROM cart_items
      WHERE item = $1 AND cart = $2
      LIMIT 1
      `,
      [itemId, cartId.rows[0].cart_id]
    );
    if (maxQuantity.rows[0].quantity > quantity) {
      const quantityToUse = maxQuantity.rows[0].quantity - quantity;
      await pool.query(
        `
        UPDATE cart_items
        SET quantity = $3
        WHERE cart = $1 AND item = $2
        `,
        [cartId.rows[0].cart_id, itemId, quantityToUse]
      );
    } else {
      await pool.query(
        `
        DELETE FROM cart_items
        WHERE cart = $1 AND item = $2
        `,
        [cartId.rows[0].cart_id, itemId]
      );
    }
  } catch (err) {
    return Promise.reject(err)
  }
}

// Create order

exports.submitOrder = async (email, cart) => {
  try {
    const order = await pool.query(
      `
      INSERT INTO orders(purchased_by, time_of_purchase)
      VALUES ($1, NOW())
      `,
      [email]
    );
    for (const item of cart) {
      const info = await pool.query(
        `
        SELECT price, quantity FROM items
        WHERE item_id = $1
        `,
        [item.item_id]
      );
      const quantityToUse = Math.min(info.rows[0].quantity, item.quantity);
      await pool.query(
        `
        INSERT INTO order_items(order_id, item_id, quantity, total)
        VALUES ($1, $2, $3, $4)
        `,
        [order.rows[0].order_id, item.item_id, quantityToUse, quantityToUse * info.rows[0].price]
      );
      await pool.query(
        `
        UPDATE items
        SET quantity = $1
        WHERE item_id = $2
        `,
        [info.quantity - quantityToUse, item.item_id]
      );
    }
    await pool.query(
      `
      UPDATE orders
      SET amount_total = (
        SELECT SUM(order_items.total) FROM order_items
        WHERE order_items.order_id = $1
      )
      WHERE order_id = $1
      `,
      [order.rows[0].order_id]
    );
  } catch (err) {
    return Promise.reject(err);
  }
}
