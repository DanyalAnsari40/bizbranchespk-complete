-- Payment proof, sender name, and listing workflow (pending until admin approves)
-- Run after 001/002 on existing databases.

ALTER TABLE businesses
  ADD COLUMN payment_proof_url TEXT NULL AFTER logo_public_id,
  ADD COLUMN sender_name VARCHAR(255) NULL AFTER payment_proof_url;

-- Narrow status enum to pending | approved (map legacy rejected to pending)
UPDATE businesses SET status = 'pending' WHERE status = 'rejected';

ALTER TABLE businesses
  MODIFY COLUMN status ENUM('pending','approved') NOT NULL DEFAULT 'pending';
