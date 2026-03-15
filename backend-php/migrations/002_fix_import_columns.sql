-- Optional schema fixes (run if tables already exist from 001_create_tables.sql)

-- categories.image_url was VARCHAR(500) but MongoDB exports can have base64 data URLs (1M+ chars)
ALTER TABLE categories MODIFY COLUMN image_url LONGTEXT DEFAULT NULL;

-- businesses.country is NOT NULL but MongoDB data may not have it; default to Pakistan
ALTER TABLE businesses MODIFY COLUMN country VARCHAR(100) NOT NULL DEFAULT 'Pakistan';

-- businesses.name may exceed 100 chars in MongoDB data
ALTER TABLE businesses MODIFY COLUMN name VARCHAR(255) NOT NULL;

-- businesses.phone may exceed 20 chars in MongoDB data
ALTER TABLE businesses MODIFY COLUMN phone VARCHAR(50) NOT NULL;

-- businesses.iban can contain URLs in some records
ALTER TABLE businesses MODIFY COLUMN iban VARCHAR(500) DEFAULT NULL;

-- Optional: review source id for deduplication
-- ALTER TABLE reviews ADD COLUMN IF NOT EXISTS mongo_id VARCHAR(30) DEFAULT NULL;
-- ALTER TABLE reviews ADD UNIQUE INDEX IF NOT EXISTS uk_mongo_id (mongo_id);
