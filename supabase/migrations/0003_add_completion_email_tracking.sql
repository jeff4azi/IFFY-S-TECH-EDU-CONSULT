-- ============================================
-- 0003_add_completion_email_tracking.sql
-- Tracks whether the "order completed" customer
-- email has already been sent, so a status toggle
-- back to completed never sends it twice.
-- ============================================

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS completion_email_sent_at TIMESTAMPTZ;