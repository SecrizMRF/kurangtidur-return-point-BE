-- -- create database in psql first:
-- -- CREATE DATABASE return_point;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  type VARCHAR(10) NOT NULL, -- 'found' or 'lost'
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  date TIMESTAMP,
  description TEXT,
  status VARCHAR(20) DEFAULT 'dicari' CHECK (status IN ('dicari', 'ditemukan', 'diclaim')),
  contact VARCHAR(100),
  photo TEXT, -- store path or URL
  reporter VARCHAR(100),
  created_at TIMESTAMP DEFAULT now()
);

-- History/Activity Log Table for tracking item changes
CREATE TABLE item_history (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'status_changed', 'deleted')),
  old_data JSONB, -- Store old values as JSON (NULL for created/deleted actions)
  new_data JSONB, -- Store new values as JSON (NULL for deleted actions)
  changed_by VARCHAR(100) NOT NULL, -- Username who made the change
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  description TEXT, -- Human-readable description of what changed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX idx_item_history_item_id ON item_history(item_id);
CREATE INDEX idx_item_history_changed_at ON item_history(changed_at DESC);
CREATE INDEX idx_item_history_action ON item_history(action);
CREATE INDEX idx_items_type_created ON items(type, created_at DESC);
