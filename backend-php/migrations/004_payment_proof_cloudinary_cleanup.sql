-- Store Cloudinary public ID for payment proof and track verification timestamp.
-- Run after existing migrations on production databases.

ALTER TABLE businesses
  ADD COLUMN payment_proof_public_id VARCHAR(255) NULL AFTER payment_proof_url,
  ADD COLUMN payment_proof_verified_at DATETIME NULL AFTER payment_proof_public_id;

