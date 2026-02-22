<?php
/**
 * MongoDB → MySQL Migration Script
 *
 * Reads JSON files exported from MongoDB and inserts/updates rows in MySQL.
 *
 * Can be invoked in two ways:
 *   1. CLI:  php migrate_from_mongodb.php          (imports all files found in scripts/)
 *   2. API:  The admin import route sets $GLOBALS['import_only'] to limit which collections run.
 *
 * Each section validates the JSON structure before inserting.
 * Uses ON DUPLICATE KEY UPDATE so re-running is safe and won't create duplicates.
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/Logger.php';

function runMongoMigration(): array {
    $pdo = db();
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $scriptDir = __DIR__;
    $stats   = ['categories' => 0, 'subcategories' => 0, 'cities' => 0, 'businesses' => 0, 'reviews' => 0, 'users' => 0, 'errors' => 0, 'skipped' => 0];
    $errors  = [];
    $importOnly = $GLOBALS['import_only'] ?? null;

    $shouldImport = function (string $collection) use ($importOnly): bool {
        if ($importOnly === null) return true;
        return in_array($collection, $importOnly, true);
    };

    // Apply schema fixes
    applySchemaFixes($pdo);

    // ─── CATEGORIES ────────────────────────────────────────────────
    $catFile = "$scriptDir/categories.json";
    if ($shouldImport('categories') && file_exists($catFile)) {
        migrationLog("Importing categories...");
        $raw = file_get_contents($catFile);
        $categories = json_decode($raw, true);

        if (!is_array($categories) || empty($categories)) {
            $errors[] = "Could not parse categories.json or it is empty";
        } elseif (!validateJsonStructure($categories[0], ['name'], 'categories')) {
            $errors[] = "categories.json does not look like category data (missing 'name' field). Did you upload the wrong file?";
        } else {
            $catIdMap = [];
            $stmt = $pdo->prepare("INSERT INTO categories (name, slug, icon, description, image_url, image_public_id, count, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE name=VALUES(name), icon=VALUES(icon), description=VALUES(description), image_url=VALUES(image_url), count=VALUES(count)");

            foreach ($categories as $cat) {
                try {
                    $slug = $cat['slug'] ?? toSlugMigrate($cat['name'] ?? '');
                    $createdAt = parseMongoDate($cat['createdAt'] ?? null);

                    $imageUrl = $cat['imageUrl'] ?? null;

                    $stmt->execute([
                        $cat['name'] ?? '',
                        $slug,
                        $cat['icon'] ?? null,
                        $cat['description'] ?? null,
                        $imageUrl,
                        $cat['imagePublicId'] ?? null,
                        (int)($cat['count'] ?? 0),
                        isset($cat['isActive']) ? (int)$cat['isActive'] : 1,
                        $createdAt,
                    ]);
                    $catIdMap[$slug] = $pdo->lastInsertId() ?: getCategoryIdBySlug($pdo, $slug);
                    $stats['categories']++;

                    if (!empty($cat['subcategories']) && is_array($cat['subcategories'])) {
                        $subStmt = $pdo->prepare("INSERT IGNORE INTO subcategories (category_id, name, slug) VALUES (?, ?, ?)");
                        foreach ($cat['subcategories'] as $sub) {
                            if (empty($sub['name']) || empty($sub['slug'])) continue;
                            $catId = $catIdMap[$slug] ?? getCategoryIdBySlug($pdo, $slug);
                            if ($catId) {
                                $subStmt->execute([$catId, $sub['name'], $sub['slug']]);
                                $stats['subcategories']++;
                            }
                        }
                    }
                } catch (Exception $e) {
                    migrationLog("  ERROR category '{$cat['name']}': {$e->getMessage()}");
                    $errors[] = "category '{$cat['name']}': {$e->getMessage()}";
                    $stats['errors']++;
                }
            }
            migrationLog("  Imported {$stats['categories']} categories, {$stats['subcategories']} subcategories");
        }
    }

    // ─── CITIES ────────────────────────────────────────────────────
    $cityFile = "$scriptDir/cities.json";
    if ($shouldImport('cities') && file_exists($cityFile)) {
        migrationLog("Importing cities...");
        $cities = json_decode(file_get_contents($cityFile), true);

        if (!is_array($cities) || empty($cities)) {
            $errors[] = "Could not parse cities.json or it is empty";
        } elseif (!validateJsonStructure($cities[0], ['name'], 'cities')) {
            $errors[] = "cities.json does not look like city data (missing 'name' field). Did you upload the wrong file?";
        } else {
            $stmt = $pdo->prepare("INSERT INTO cities (name, slug, province, country, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE name=VALUES(name), province=VALUES(province), country=VALUES(country)");

            foreach ($cities as $city) {
                try {
                    $slug = $city['slug'] ?? toSlugMigrate($city['name'] ?? '');
                    $createdAt = parseMongoDate($city['createdAt'] ?? null);
                    $stmt->execute([
                        $city['name'] ?? '',
                        $slug,
                        $city['province'] ?? null,
                        $city['country'] ?? 'Pakistan',
                        isset($city['isActive']) ? (int)$city['isActive'] : 1,
                        $createdAt,
                    ]);
                    $stats['cities']++;
                } catch (Exception $e) {
                    migrationLog("  ERROR city '{$city['name']}': {$e->getMessage()}");
                    $errors[] = "city '{$city['name']}': {$e->getMessage()}";
                    $stats['errors']++;
                }
            }
            migrationLog("  Imported {$stats['cities']} cities");
        }
    }

    // ─── BUSINESSES ────────────────────────────────────────────────
    $bizFile = "$scriptDir/businesses.json";
    if ($shouldImport('businesses') && file_exists($bizFile)) {
        migrationLog("Importing businesses...");
        $raw = file_get_contents($bizFile);
        $businesses = json_decode($raw, true);
        unset($raw);

        if (!is_array($businesses) || empty($businesses)) {
            $errors[] = "Could not parse businesses.json or it is empty";
        } elseif (!validateJsonStructure($businesses[0], ['name', 'slug', 'category', 'city'], 'businesses')) {
            $errors[] = "businesses.json does not look like business data (missing required fields: name, slug, category, city). Did you upload the wrong file?";
        } else {
            $mongoIdMap = [];

            $stmt = $pdo->prepare("INSERT INTO businesses (
                name, slug, category, sub_category, country, province, city, area, postal_code,
                address, phone, phone_digits, contact_person, whatsapp, email, description,
                website_url, website_normalized, facebook_url, gmb_url, youtube_url,
                profile_username, swift_code, branch_code, city_dialing_code, iban,
                logo_url, logo_public_id, status, approved_at, approved_by,
                featured, featured_at, rating_avg, rating_count,
                latitude, longitude, location_verified, source, created_by, created_at, updated_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            ON DUPLICATE KEY UPDATE
                name=VALUES(name), category=VALUES(category), sub_category=VALUES(sub_category),
                province=VALUES(province), city=VALUES(city), area=VALUES(area),
                address=VALUES(address), phone=VALUES(phone), phone_digits=VALUES(phone_digits),
                email=VALUES(email), description=VALUES(description),
                website_url=VALUES(website_url), facebook_url=VALUES(facebook_url),
                logo_url=VALUES(logo_url), logo_public_id=VALUES(logo_public_id),
                status=VALUES(status), updated_at=VALUES(updated_at)");

            foreach ($businesses as $biz) {
                try {
                    if (empty($biz['name']) || empty($biz['slug'])) {
                        $stats['skipped']++;
                        continue;
                    }

                    $mongoId = extractMongoId($biz['_id'] ?? null);
                    $slug = $biz['slug'] ?? toSlugMigrate($biz['name'] ?? '');
                    $createdAt  = parseMongoDate($biz['createdAt'] ?? null);
                    $updatedAt  = parseMongoDate($biz['updatedAt'] ?? null);
                    $approvedAt = !empty($biz['approvedAt']) ? parseMongoDate($biz['approvedAt']) : null;
                    $featuredAt = !empty($biz['featuredAt']) ? parseMongoDate($biz['featuredAt']) : null;

                    $lat = isset($biz['latitude']) ? (float)$biz['latitude'] : null;
                    $lng = isset($biz['longitude']) ? (float)$biz['longitude'] : null;
                    if (($lat === null || $lng === null) && isset($biz['location']['coordinates'])) {
                        $lng = (float)$biz['location']['coordinates'][0];
                        $lat = (float)$biz['location']['coordinates'][1];
                    }

                    $rawApprovedBy = $biz['approvedBy'] ?? null;
                    $approvedByVal = in_array($rawApprovedBy, ['auto', 'admin'], true) ? $rawApprovedBy : 'auto';

                    $stmt->execute([
                        mb_substr($biz['name'] ?? '', 0, 255),
                        $slug,
                        $biz['category'] ?? '',
                        $biz['subCategory'] ?? $biz['subcategory'] ?? null,
                        $biz['country'] ?? 'Pakistan',
                        $biz['province'] ?? null,
                        $biz['city'] ?? '',
                        $biz['area'] ?? null,
                        $biz['postalCode'] ?? $biz['zipCode'] ?? null,
                        mb_substr($biz['address'] ?? '', 0, 500),
                        mb_substr($biz['phone'] ?? '', 0, 50),
                        $biz['phoneDigits'] ?? preg_replace('/\D/', '', $biz['phone'] ?? ''),
                        $biz['contactPerson'] ?? null,
                        $biz['whatsapp'] ?? null,
                        $biz['email'] ?? '',
                        $biz['description'] ?? '',
                        $biz['websiteUrl'] ?? $biz['website'] ?? null,
                        $biz['websiteNormalized'] ?? null,
                        $biz['facebookUrl'] ?? null,
                        $biz['gmbUrl'] ?? null,
                        $biz['youtubeUrl'] ?? null,
                        $biz['profileUsername'] ?? null,
                        $biz['swiftCode'] ?? null,
                        $biz['branchCode'] ?? null,
                        $biz['cityDialingCode'] ?? null,
                        $biz['iban'] ?? null,
                        $biz['logoUrl'] ?? null,
                        $biz['logoPublicId'] ?? null,
                        'approved',
                        $approvedAt ?: date('Y-m-d H:i:s'),
                        $approvedByVal,
                        (int)($biz['featured'] ?? 0),
                        $featuredAt,
                        (float)($biz['ratingAvg'] ?? 0),
                        (int)($biz['ratingCount'] ?? 0),
                        $lat,
                        $lng,
                        (int)($biz['locationVerified'] ?? 0),
                        $biz['source'] ?? null,
                        $biz['createdBy'] ?? null,
                        $createdAt,
                        $updatedAt,
                    ]);

                    $insertedId = $pdo->lastInsertId();
                    if ($mongoId && $insertedId) {
                        $mongoIdMap[$mongoId] = $insertedId;
                    } elseif ($mongoId) {
                        $lookupStmt = $pdo->prepare("SELECT id FROM businesses WHERE slug = ?");
                        $lookupStmt->execute([$slug]);
                        $found = $lookupStmt->fetchColumn();
                        if ($found) $mongoIdMap[$mongoId] = $found;
                    }

                    $stats['businesses']++;
                    if ($stats['businesses'] % 500 === 0) {
                        migrationLog("  ... {$stats['businesses']} businesses imported");
                    }
                } catch (Exception $e) {
                    $bizName = $biz['name'] ?? 'unknown';
                    migrationLog("  ERROR business '$bizName': {$e->getMessage()}");
                    $errors[] = "business '$bizName': {$e->getMessage()}";
                    $stats['errors']++;
                }
            }
            migrationLog("  Imported {$stats['businesses']} businesses");

            file_put_contents("$scriptDir/mongo_id_map.json", json_encode($mongoIdMap, JSON_PRETTY_PRINT));
            migrationLog("  Saved MongoDB→MySQL ID mapping to mongo_id_map.json");
        }
    }

    // ─── REVIEWS ───────────────────────────────────────────────────
    $reviewFile = "$scriptDir/reviews.json";
    if ($shouldImport('reviews') && file_exists($reviewFile)) {
        migrationLog("Importing reviews...");

        if (empty($mongoIdMap) && file_exists("$scriptDir/mongo_id_map.json")) {
            $mongoIdMap = json_decode(file_get_contents("$scriptDir/mongo_id_map.json"), true) ?? [];
        }
        if (empty($mongoIdMap)) $mongoIdMap = [];

        $reviews = json_decode(file_get_contents($reviewFile), true);

        if (!is_array($reviews) || empty($reviews)) {
            $errors[] = "Could not parse reviews.json or it is empty";
        } elseif (!validateJsonStructure($reviews[0], ['businessId', 'rating'], 'reviews')) {
            $errors[] = "reviews.json does not look like review data (missing 'businessId' or 'rating'). Did you upload the wrong file?";
        } else {
            $hasMongoIdCol = columnExists($pdo, 'reviews', 'mongo_id');

            if ($hasMongoIdCol) {
                $stmt = $pdo->prepare("INSERT INTO reviews (business_id, name, rating, comment, created_at, mongo_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE name=VALUES(name), rating=VALUES(rating), comment=VALUES(comment)");
            } else {
                $stmt = $pdo->prepare("INSERT INTO reviews (business_id, name, rating, comment, created_at) VALUES (?, ?, ?, ?, ?)");
            }

            $skipped = 0;

            foreach ($reviews as $rev) {
                try {
                    $mongoBusinessId = $rev['businessId'] ?? '';
                    $mysqlBusinessId = $mongoIdMap[$mongoBusinessId] ?? null;

                    if (!$mysqlBusinessId) {
                        $lookupStmt = $pdo->prepare("SELECT id FROM businesses WHERE slug = ? LIMIT 1");
                        $lookupStmt->execute([$mongoBusinessId]);
                        $mysqlBusinessId = $lookupStmt->fetchColumn();
                    }

                    if (!$mysqlBusinessId) {
                        $skipped++;
                        continue;
                    }

                    $mongoRevId = extractMongoId($rev['_id'] ?? null);
                    $createdAt = parseMongoDate($rev['createdAt'] ?? null);

                    if ($hasMongoIdCol && $mongoRevId) {
                        $stmt->execute([
                            (int)$mysqlBusinessId,
                            mb_substr($rev['name'] ?? 'Anonymous', 0, 100),
                            min(5, max(1, (int)($rev['rating'] ?? 5))),
                            $rev['comment'] ?? '',
                            $createdAt,
                            $mongoRevId,
                        ]);
                    } elseif ($hasMongoIdCol) {
                        $stmt->execute([
                            (int)$mysqlBusinessId,
                            mb_substr($rev['name'] ?? 'Anonymous', 0, 100),
                            min(5, max(1, (int)($rev['rating'] ?? 5))),
                            $rev['comment'] ?? '',
                            $createdAt,
                            null,
                        ]);
                    } else {
                        $stmt->execute([
                            (int)$mysqlBusinessId,
                            mb_substr($rev['name'] ?? 'Anonymous', 0, 100),
                            min(5, max(1, (int)($rev['rating'] ?? 5))),
                            $rev['comment'] ?? '',
                            $createdAt,
                        ]);
                    }
                    $stats['reviews']++;
                } catch (Exception $e) {
                    migrationLog("  ERROR review: {$e->getMessage()}");
                    $errors[] = "review: {$e->getMessage()}";
                    $stats['errors']++;
                }
            }
            migrationLog("  Imported {$stats['reviews']} reviews (skipped $skipped with unknown business)");
            $stats['skipped'] += $skipped;
        }
    }

    // ─── USERS ─────────────────────────────────────────────────────
    $userFile = "$scriptDir/users.json";
    if ($shouldImport('users') && file_exists($userFile)) {
        migrationLog("Importing users...");
        $users = json_decode(file_get_contents($userFile), true);

        if (!is_array($users) || empty($users)) {
            $errors[] = "Could not parse users.json or it is empty";
        } elseif (!validateJsonStructure($users[0], ['name'], 'users')) {
            $errors[] = "users.json does not look like user data. Did you upload the wrong file?";
        } else {
            $stmt = $pdo->prepare("INSERT INTO users (username, handle, name, full_name, display_name, title, headline, role, avatar_url, photo_url, image_url, picture, email, created_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), email=VALUES(email)");

            foreach ($users as $user) {
                try {
                    $createdAt = parseMongoDate($user['createdAt'] ?? null);
                    $stmt->execute([
                        $user['username'] ?? $user['handle'] ?? $user['name'] ?? ('user_' . $stats['users']),
                        $user['handle'] ?? null,
                        $user['name'] ?? null,
                        $user['fullName'] ?? null,
                        $user['displayName'] ?? null,
                        $user['title'] ?? null,
                        $user['headline'] ?? null,
                        $user['role'] ?? null,
                        $user['avatarUrl'] ?? null,
                        $user['photoUrl'] ?? null,
                        $user['imageUrl'] ?? null,
                        $user['picture'] ?? null,
                        $user['email'] ?? null,
                        $createdAt,
                    ]);
                    $stats['users']++;
                } catch (Exception $e) {
                    $uName = $user['name'] ?? $user['username'] ?? 'unknown';
                    migrationLog("  ERROR user '$uName': {$e->getMessage()}");
                    $errors[] = "user '$uName': {$e->getMessage()}";
                    $stats['errors']++;
                }
            }
            migrationLog("  Imported {$stats['users']} users");
        }
    }

    // ─── RECALCULATE CATEGORY COUNTS ──────────────────────────────
    if ($shouldImport('categories') || $shouldImport('businesses')) {
        migrationLog("Recalculating category business counts...");
        try {
            $pdo->exec("UPDATE categories c SET c.count = (SELECT COUNT(*) FROM businesses b WHERE LOWER(b.category) = LOWER(c.name) AND b.status = 'approved')");
            migrationLog("  Done");
        } catch (Exception $e) {
            $errors[] = "recalc categories: {$e->getMessage()}";
        }
    }

    // ─── RECALCULATE REVIEW AGGREGATES ────────────────────────────
    if ($shouldImport('reviews') || $shouldImport('businesses')) {
        migrationLog("Recalculating business rating aggregates...");
        try {
            $pdo->exec("UPDATE businesses b SET
                b.rating_avg = COALESCE((SELECT ROUND(AVG(r.rating), 2) FROM reviews r WHERE r.business_id = b.id), 0),
                b.rating_count = COALESCE((SELECT COUNT(*) FROM reviews r WHERE r.business_id = b.id), 0)
            ");
            migrationLog("  Done");
        } catch (Exception $e) {
            $errors[] = "recalc reviews: {$e->getMessage()}";
        }
    }

    $stats['error_details'] = $errors;
    return $stats;
}

// ─── Helper functions ─────────────────────────────────────────

function applySchemaFixes(PDO $pdo): void {
    try {
        $pdo->exec("ALTER TABLE categories MODIFY COLUMN image_url LONGTEXT DEFAULT NULL");
    } catch (Exception $e) { /* column already correct or table doesn't exist yet */ }

    try {
        $pdo->exec("ALTER TABLE businesses MODIFY COLUMN country VARCHAR(100) NOT NULL DEFAULT 'Pakistan'");
    } catch (Exception $e) { }

    try {
        $pdo->exec("ALTER TABLE businesses MODIFY COLUMN name VARCHAR(255) NOT NULL");
    } catch (Exception $e) { }

    try {
        $pdo->exec("ALTER TABLE businesses MODIFY COLUMN phone VARCHAR(50) NOT NULL");
    } catch (Exception $e) { }

    try {
        $pdo->exec("ALTER TABLE businesses MODIFY COLUMN iban VARCHAR(500) DEFAULT NULL");
    } catch (Exception $e) { }

    try {
        $colCheck = $pdo->query("SHOW COLUMNS FROM reviews LIKE 'mongo_id'")->fetch();
        if (!$colCheck) {
            $pdo->exec("ALTER TABLE reviews ADD COLUMN mongo_id VARCHAR(30) DEFAULT NULL");
            $pdo->exec("ALTER TABLE reviews ADD UNIQUE INDEX uk_mongo_id (mongo_id)");
        }
    } catch (Exception $e) { }
}

function validateJsonStructure(array $firstItem, array $requiredKeys, string $collectionName): bool {
    $itemKeys = array_keys($firstItem);
    foreach ($requiredKeys as $key) {
        if (!in_array($key, $itemKeys, true)) {
            migrationLog("  VALIDATION FAIL: $collectionName missing key '$key'. Found keys: " . implode(', ', $itemKeys));
            return false;
        }
    }
    return true;
}

function columnExists(PDO $pdo, string $table, string $column): bool {
    try {
        $result = $pdo->query("SHOW COLUMNS FROM `$table` LIKE '$column'")->fetch();
        return (bool)$result;
    } catch (Exception $e) {
        return false;
    }
}

function parseMongoDate($val): string {
    if (!$val) return date('Y-m-d H:i:s');
    if (is_string($val)) {
        $ts = strtotime($val);
        return $ts ? date('Y-m-d H:i:s', $ts) : date('Y-m-d H:i:s');
    }
    if (is_array($val) && isset($val['$date'])) {
        $d = $val['$date'];
        if (is_string($d)) return date('Y-m-d H:i:s', strtotime($d));
        if (is_array($d) && isset($d['$numberLong'])) return date('Y-m-d H:i:s', (int)($d['$numberLong'] / 1000));
    }
    return date('Y-m-d H:i:s');
}

function extractMongoId($val): ?string {
    if (!$val) return null;
    if (is_string($val)) return $val;
    if (is_array($val) && isset($val['$oid'])) return $val['$oid'];
    return null;
}

function toSlugMigrate(string $s): string {
    return substr(preg_replace('/-+/', '-', preg_replace('/[^a-z0-9\s-]/', '', preg_replace('/\s+/', '-', strtolower(trim($s))))), 0, 140);
}

function getCategoryIdBySlug(PDO $pdo, string $slug): ?int {
    $stmt = $pdo->prepare("SELECT id FROM categories WHERE slug = ?");
    $stmt->execute([$slug]);
    $id = $stmt->fetchColumn();
    return $id ? (int)$id : null;
}

function migrationLog(string $msg): void {
    if (!defined('MIGRATION_SILENT')) {
        echo $msg . "\n";
    }
}

// ─── CLI execution ────────────────────────────────────────────
if (php_sapi_name() === 'cli' || !defined('MIGRATION_SILENT')) {
    echo "=== BizBranches MongoDB → MySQL Migration ===\n\n";
    $stats = runMongoMigration();
    echo "\n=== Migration Complete ===\n";
    echo "Categories:    {$stats['categories']}\n";
    echo "Subcategories: {$stats['subcategories']}\n";
    echo "Cities:        {$stats['cities']}\n";
    echo "Businesses:    {$stats['businesses']}\n";
    echo "Reviews:       {$stats['reviews']}\n";
    echo "Users:         {$stats['users']}\n";
    echo "Skipped:       {$stats['skipped']}\n";
    echo "Errors:        {$stats['errors']}\n";
    if (!empty($stats['error_details'])) {
        echo "\nError details:\n";
        foreach ($stats['error_details'] as $err) echo "  - $err\n";
    }
}
