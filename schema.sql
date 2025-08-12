-- KDS Database Schema
-- This schema defines the tables needed for the Kitchen Display System

-- Create enum for order status
CREATE TYPE order_status AS ENUM ('pending', 'ready', 'fulfilled');

-- Kitchen orders table
CREATE TABLE IF NOT EXISTS kitchen_orders (
  id SERIAL PRIMARY KEY,
  pos_order_id INTEGER NOT NULL,
  order_number INTEGER NOT NULL,
  status order_status DEFAULT 'pending',
  front_released BOOLEAN DEFAULT FALSE,
  is_fulfilled BOOLEAN DEFAULT FALSE,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Kitchen order items table
CREATE TABLE IF NOT EXISTS kitchen_order_items (
  id SERIAL PRIMARY KEY,
  kitchen_order_id INTEGER NOT NULL REFERENCES kitchen_orders(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  prepared_quantity INTEGER DEFAULT 0,
  fulfilled_quantity INTEGER DEFAULT 0,
  station VARCHAR(100),
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_kitchen_orders_status ON kitchen_orders(status);
CREATE INDEX idx_kitchen_orders_created_at ON kitchen_orders(created_at);
CREATE INDEX idx_kitchen_orders_updated_at ON kitchen_orders(updated_at);
CREATE INDEX idx_kitchen_order_items_order_id ON kitchen_order_items(kitchen_order_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update the updated_at column
CREATE TRIGGER update_kitchen_orders_updated_at BEFORE UPDATE
  ON kitchen_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kitchen_order_items_updated_at BEFORE UPDATE
  ON kitchen_order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to notify when KDS orders are updated
CREATE OR REPLACE FUNCTION notify_kds_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('kds_order_update', json_build_object(
    'operation', TG_OP,
    'order_id', COALESCE(NEW.id, OLD.id)
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for real-time notifications
CREATE TRIGGER kds_order_update_trigger
AFTER INSERT OR UPDATE OR DELETE ON kitchen_orders
FOR EACH ROW EXECUTE FUNCTION notify_kds_update();

CREATE TRIGGER kds_order_items_update_trigger
AFTER INSERT OR UPDATE OR DELETE ON kitchen_order_items
FOR EACH ROW EXECUTE FUNCTION notify_kds_update();