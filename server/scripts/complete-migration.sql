-- Complete database migration script for production
-- Run this on your production database to ensure all columns exist

-- 1. Add ai_message column to coupons table (if not exists)
ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS ai_message TEXT;

COMMENT ON COLUMN coupons.ai_message IS 'AI-generated promotional message for the coupon';

-- 2. Add shipping_details column to orders table (if not exists)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_details JSONB;

COMMENT ON COLUMN orders.shipping_details IS 'Stores carrier, service type, estimated delivery, distance, etc.';

-- 3. Ensure discount column exists in orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0;

-- 4. Ensure total_items column exists in orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS total_items INTEGER DEFAULT 0;

-- 5. Ensure remaining_stock column exists in products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS remaining_stock INTEGER DEFAULT 0;

-- 6. Update remaining_stock for existing products
UPDATE products 
SET remaining_stock = total_stock - sold_count
WHERE remaining_stock = 0 OR remaining_stock IS NULL;

-- Verify all columns
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('coupons', 'orders', 'products')
    AND column_name IN ('ai_message', 'shipping_details', 'discount', 'total_items', 'remaining_stock')
ORDER BY table_name, column_name;
