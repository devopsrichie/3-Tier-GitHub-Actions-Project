-- Auction Central: schema + seed data
-- Runs automatically on first MySQL start (docker-entrypoint-initdb.d).

CREATE DATABASE IF NOT EXISTS auction_db;
USE auction_db;

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('bidder', 'admin') NOT NULL DEFAULT 'bidder',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auctions (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  title          VARCHAR(200) NOT NULL,
  description    TEXT,
  location       VARCHAR(150) NOT NULL,
  property_type  VARCHAR(50)  NOT NULL DEFAULT 'Residential',
  image_url      VARCHAR(500),
  starting_price DECIMAL(14,2) NOT NULL,
  bid_increment  DECIMAL(14,2) NOT NULL DEFAULT 10000,
  starts_at      DATETIME NOT NULL,
  ends_at        DATETIME NOT NULL,
  created_by     INT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_auction_times (starts_at, ends_at)
);

CREATE TABLE IF NOT EXISTS bids (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  auction_id INT NOT NULL,
  user_id    INT NOT NULL,
  amount     DECIMAL(14,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  INDEX idx_bids_auction (auction_id, amount)
);

-- Default admin  ->  admin@auctioncentral.local / Admin@12345  (CHANGE THIS after first login)
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Auction Admin', 'admin@auctioncentral.local',
   '$2a$10$vKAaOKgXrtauUVB/sjZBceGGHmk7jtohjbif7Bsjyjh1vX4UBSqz6', 'admin');

-- Sample listings (times relative to first start so there is always something live)
INSERT INTO auctions (title, description, location, property_type, starting_price, bid_increment, starts_at, ends_at, created_by) VALUES
  ('3-Bed Family Home with Pool', 'Spacious family home on a 1,000 m² stand, double garage, staff quarters.',
   'Randburg, Johannesburg', 'Residential', 1850000, 25000,
   DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 DAY), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 DAY), 1),
  ('Sandton Executive Apartment', '2-bed, 2-bath apartment with balcony, 24-hour security and gym.',
   'Sandton, Johannesburg', 'Sectional Title', 1450000, 20000,
   DATE_SUB(UTC_TIMESTAMP(), INTERVAL 2 HOUR), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 3 DAY), 1),
  ('Retail Unit on High Street', 'Ground-floor retail space with strong foot traffic and long-term tenant.',
   'Pretoria Central', 'Commercial', 3200000, 50000,
   DATE_ADD(UTC_TIMESTAMP(), INTERVAL 2 DAY), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 9 DAY), 1),
  ('Vacant Stand in Estate', '650 m² vacant land in a secure lifestyle estate. Build-ready.',
   'Midrand', 'Vacant Land', 780000, 10000,
   DATE_ADD(UTC_TIMESTAMP(), INTERVAL 4 DAY), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 11 DAY), 1),
  ('Industrial Warehouse', '2,400 m² warehouse with yard, 3-phase power and roller doors.',
   'Germiston, Ekurhuleni', 'Industrial', 6500000, 100000,
   DATE_SUB(UTC_TIMESTAMP(), INTERVAL 10 DAY), DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 DAY), 1);
