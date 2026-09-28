-- ============================================
-- 0004_add_order_total_price.sql
-- Stores the final computed price (base price + any
-- dynamic-pricing fees) at the time the order was placed.
-- NULL when the service price isn't numeric
-- (e.g. "Contact for Price") or for orders made before this migration.
-- ============================================

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS total_price NUMERIC;