-- Primary category: Importer and Exporter
-- Run once in phpMyAdmin (select your database first) or: mysql -u USER -p DB_NAME < 005_add_category_importer_exporter.sql

INSERT INTO categories (name, slug, icon, description, count, is_active, created_at)
VALUES (
  'Importer and Exporter',
  'importer-and-exporter',
  '📦',
  'Import, export, trading, and logistics businesses',
  0,
  1,
  NOW()
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  icon = VALUES(icon),
  description = VALUES(description),
  is_active = 1;

-- Optional subcategories (each line skips if that slug already exists for this category)
INSERT INTO subcategories (category_id, name, slug)
SELECT c.id, 'General Trading', 'general-trading'
FROM categories c
WHERE c.slug = 'importer-and-exporter'
  AND NOT EXISTS (SELECT 1 FROM subcategories s WHERE s.category_id = c.id AND s.slug = 'general-trading');

INSERT INTO subcategories (category_id, name, slug)
SELECT c.id, 'Freight & Logistics', 'freight-logistics'
FROM categories c
WHERE c.slug = 'importer-and-exporter'
  AND NOT EXISTS (SELECT 1 FROM subcategories s WHERE s.category_id = c.id AND s.slug = 'freight-logistics');

INSERT INTO subcategories (category_id, name, slug)
SELECT c.id, 'Customs & Clearance', 'customs-clearance'
FROM categories c
WHERE c.slug = 'importer-and-exporter'
  AND NOT EXISTS (SELECT 1 FROM subcategories s WHERE s.category_id = c.id AND s.slug = 'customs-clearance');

INSERT INTO subcategories (category_id, name, slug)
SELECT c.id, 'Textile & Garments', 'textile-garments'
FROM categories c
WHERE c.slug = 'importer-and-exporter'
  AND NOT EXISTS (SELECT 1 FROM subcategories s WHERE s.category_id = c.id AND s.slug = 'textile-garments');

INSERT INTO subcategories (category_id, name, slug)
SELECT c.id, 'Agriculture & Food', 'agriculture-food'
FROM categories c
WHERE c.slug = 'importer-and-exporter'
  AND NOT EXISTS (SELECT 1 FROM subcategories s WHERE s.category_id = c.id AND s.slug = 'agriculture-food');
