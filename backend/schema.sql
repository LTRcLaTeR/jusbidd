CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL
);

INSERT INTO roles (name) VALUES
('bidder'), ('seller'), ('admin');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    display_name VARCHAR(100) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    profile_image TEXT,
    role_id INTEGER REFERENCES roles(id),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (display_name, username, email, password, role_id)
VALUES
('Bidder Demo', 'bidderdemo', 'bidder@example.com', '$2b$10$GFWjH9KzOL1E8fm8MwXQce/Ms7qE836S8OWZFiS64GAy61uHBH1rO', 1),
('Seller Demo', 'sellerdemo', 'seller@example.com', '$2b$10$GFWjH9KzOL1E8fm8MwXQce/Ms7qE836S8OWZFiS64GAy61uHBH1rO', 2),
('Admin Demo', 'admindemo', 'admin@example.com', '$2b$10$GFWjH9KzOL1E8fm8MwXQce/Ms7qE836S8OWZFiS64GAy61uHBH1rO', 3);

CREATE TABLE IF NOT EXISTS auctions (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  image TEXT,
  starting_price INTEGER,
  current_bid INTEGER DEFAULT 0,
  category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  seller_id INTEGER REFERENCES users(id),
  seller_username VARCHAR(100),
  bid_increment INTEGER DEFAULT 100,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bids (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  auction_id INTEGER REFERENCES auctions(id),
  bid_amount INTEGER,
  bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  auction_id INTEGER REFERENCES auctions(id),
  sender_id INTEGER REFERENCES users(id),
  receiver_id INTEGER REFERENCES users(id),
  content TEXT,
  image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  reporter_id INTEGER REFERENCES users(id),
  target_id INTEGER REFERENCES users(id),
  report_type VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_ratings (
  id SERIAL PRIMARY KEY,
  rater_id INTEGER REFERENCES users(id),
  target_id INTEGER REFERENCES users(id),
  rating VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(rater_id, target_id)
);