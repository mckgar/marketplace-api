/* 
 * To set up, first use create database query
 * Next switch into marketplace
 * Finally copy and paste then run all remaining queries
 */

 /* Create database */

CREATE DATABASE marketplace;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

/* Create Tables */

CREATE TABLE accounts (
  account_id uuid PRIMARY KEY DEFAULT UUID_GENERATE_V4(),
  username VARCHAR(20) UNIQUE NOT NULL,
  hashedPassword VARCHAR(255) NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_on TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE roles (
  role_id uuid PRIMARY KEY DEFAULT UUID_GENERATE_V4(),
  role_name VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE account_roles (
  role_id uuid NOT NULL,
  account_id uuid NOT NULL,
  date_added TIMESTAMP NOT NULL,
  PRIMARY KEY (role_id, account_id),
  FOREIGN KEY (role_id)
    REFERENCES roles (role_id),
  FOREIGN KEY (account_id)
    REFERENCES accounts (account_id)
);

CREATE TABLE seller_ratings (
  rating_id uuid PRIMARY KEY DEFAULT UUID_GENERATE_V4(),
  seller uuid NOT NULL,
  rater uuid NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  date_rated TIMESTAMP NOT NULL,
  FOREIGN KEY (seller)
    REFERENCES accounts (account_id),
  FOREIGN KEY (rater)
    REFERENCES accounts (account_id)
);

CREATE TABLE categories (
  category_id uuid PRIMARY KEY DEFAULT UUID_GENERATE_V4(),
  category_name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE items (
  item_id uuid PRIMARY KEY DEFAULT UUID_GENERATE_V4(),
  item_name VARCHAR(255) NOT NULL,
  item_description VARCHAR(1024),
  price decimal NOT NULL,
  seller uuid NOT NULL,
  quantity INTEGER NOT NULL,
  category uuid NOT NULL,
  date_added TIMESTAMP NOT NULL,
  FOREIGN KEY (seller)
    REFERENCES accounts (account_id),
  FOREIGN KEY (category)
    REFERENCES categories (category_id)
);

CREATE TABLE carts (
  cart_id uuid PRIMARY KEY DEFAULT UUID_GENERATE_V4(),
  cart_owner uuid NOT NULL,
  FOREIGN KEY (cart_owner)
    REFERENCES accounts (account_id)
);

CREATE TABLE cart_items (
  cart uuid NOT NULL,
  item uuid NOT NULL,
  quantity INTEGER NOT NULL,
  date_placed TIMESTAMP NOT NULL,
  FOREIGN KEY (cart)
    REFERENCES carts (cart_id),
  FOREIGN KEY (item)
    REFERENCES items (item_id)
);

CREATE TABLE orders (
  order_id uuid PRIMARY KEY DEFAULT UUID_GENERATE_V4(),
  purchased_by VARCHAR(255) NOT NULL,
  amount_total decimal NOT NULL,
  time_of_purchase TIMESTAMP NOT NULL,
  FOREIGN KEY (purchased_by)
    REFERENCES accounts (account_id)
);

CREATE TABLE order_items (
  order_id uuid NOT NULL,
  item_id uuid NOT NULL,
  quantity INTEGER NOT NULL,
  total DECIMAL NOT NULL,
  FOREIGN KEY (order_id)
    REFERENCES orders (order_id),
  FOREIGN KEY (item_id)
    REFERENCES items (item_id)
);

/* Populate required information */

INSERT INTO categories(category_name) 
VALUES 
  ('clothing'),
  ('books'),
  ('toys'),
  ('games'),
  ('accessories'),
  ('decorations'),
  ('office');

