-- Add email column to customers table for email-based rewards
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email text;

-- Allow lookup by email per shop
CREATE UNIQUE INDEX IF NOT EXISTS customers_shop_email_uniq
  ON customers (shop_slug, email)
  WHERE email IS NOT NULL;
