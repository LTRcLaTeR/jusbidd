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
    role_id INTEGER REFERENCES roles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert bidder account
-- Password: password123 (hashed with bcrypt, rounds: 10)
-- Username: bidder1
-- Display Name: Bidder User
email, password, role_id) 
VALUES (
  'Bidder User', 
  'bidder1',
  'bidder1@example.com',r', 
  'bidder1', 
  '$2b$10$7vEnHYc0V01v.0V5d1xZ7OuXF0xFHEj.8gHlbJrFJuWMaLJLe4RWC',
  (SELECT id FROM roles WHERE name='bidder')
);

CREATE TABLE IF NOT EXISTS auctions (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  image TEXT,
  starting_price INTEGER,
  category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);