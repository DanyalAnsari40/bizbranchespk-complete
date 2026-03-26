<?php

function registerBusinessRoutes(Router $router): void {

    // GET /api/business/pending
    $router->get('/api/business/pending', function($params) {
        try {
            $pdo = db();
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min((int)($_GET['limit'] ?? 20), 100);
            $offset = ($page - 1) * $limit;

            $stmt = $pdo->prepare(
                "SELECT * FROM businesses WHERE status = 'pending' AND source IS NULL AND created_by IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?"
            );
            $stmt->execute([$limit, $offset]);
            $businesses = $stmt->fetchAll();

            $countStmt = $pdo->prepare("SELECT COUNT(*) FROM businesses WHERE status = 'pending' AND source IS NULL AND created_by IS NULL");
            $countStmt->execute();
            $total = (int)$countStmt->fetchColumn();

            $enriched = enrichBusinessList($businesses);

            Response::success([
                'businesses' => $enriched,
                'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total, 'pages' => (int)ceil($total / $limit)]
            ]);
        } catch (Exception $e) {
            Logger::error('Error fetching pending businesses:', $e->getMessage());
            Response::error('Failed to fetch pending businesses.', 500);
        }
    });

    // GET /api/business/featured
    $router->get('/api/business/featured', function($params) {
        try {
            $pdo = db();
            $limit = min((int)($_GET['limit'] ?? 8), 48);

            $stmt = $pdo->prepare(
                "SELECT id, name, slug, category, city, logo_url, logo_public_id, featured_at, created_at FROM businesses WHERE status = 'approved' AND featured = 1 ORDER BY featured_at DESC, created_at DESC LIMIT ?"
            );
            $stmt->execute([$limit]);
            $businesses = enrichBusinessList($stmt->fetchAll());

            Response::cached(['businesses' => $businesses], 's-maxage=300, stale-while-revalidate=600');
        } catch (Exception $e) {
            Logger::error('Error fetching featured businesses:', $e->getMessage());
            Response::error('Failed to fetch featured businesses.', 500);
        }
    });

    // GET /api/business/recent
    $router->get('/api/business/recent', function($params) {
        try {
            $pdo = db();
            $limit = min((int)($_GET['limit'] ?? 12), 48);

            $stmt = $pdo->prepare(
                "SELECT id, name, slug, category, city, logo_url, logo_public_id, featured_at, created_at FROM businesses WHERE status = 'approved' ORDER BY created_at DESC LIMIT ?"
            );
            $stmt->execute([$limit]);
            $businesses = enrichBusinessList($stmt->fetchAll());

            Response::cached(['businesses' => $businesses], 's-maxage=300, stale-while-revalidate=600');
        } catch (Exception $e) {
            Logger::error('Error fetching recent businesses:', $e->getMessage());
            Response::error('Failed to fetch recent businesses.', 500);
        }
    });

    // GET /api/business/nearby
    $router->get('/api/business/nearby', function($params) {
        try {
            $lat = (float)($_GET['lat'] ?? 0);
            $lng = (float)($_GET['lng'] ?? 0);
            if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180 || ($lat == 0 && $lng == 0)) {
                Response::error('Valid lat and lng are required', 400);
            }

            $pdo = db();
            $limit = min((int)($_GET['limit'] ?? 24), 60);
            $category = trim($_GET['category'] ?? '');
            $q = trim($_GET['q'] ?? '');
            $maxDistanceKm = 10;

            $sql = "SELECT *, (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance_km FROM businesses WHERE status = 'approved' AND location_verified = 1 AND latitude IS NOT NULL AND longitude IS NOT NULL";
            $bindParams = [$lat, $lng, $lat];

            if ($category) {
                $slugForm = str_replace([' ', '&'], ['-', '-'], $category);
                $nameForm = str_replace('-', ' ', $category);
                $sql .= " AND (LOWER(category) = LOWER(?) OR LOWER(category) = LOWER(?))";
                $bindParams[] = $slugForm;
                $bindParams[] = $nameForm;
            }
            if ($q) {
                $sql .= " AND (name LIKE ? OR category LIKE ? OR sub_category LIKE ? OR description LIKE ?)";
                $like = '%' . $q . '%';
                $bindParams = array_merge($bindParams, [$like, $like, $like, $like]);
            }

            $sql .= " HAVING distance_km <= ? ORDER BY distance_km ASC, featured DESC, rating_avg DESC, created_at DESC LIMIT ?";
            $bindParams[] = $maxDistanceKm;
            $bindParams[] = $limit;

            $stmt = $pdo->prepare($sql);
            $stmt->execute($bindParams);
            $businesses = $stmt->fetchAll();

            $enriched = array_map(function($b) {
                $b['distanceKm'] = round((float)$b['distance_km'], 2);
                return enrichBusinessRow($b);
            }, $businesses);

            Response::cached(['businesses' => $enriched], 's-maxage=60, stale-while-revalidate=120');
        } catch (Exception $e) {
            Logger::error('Error fetching nearby businesses:', $e->getMessage());
            Response::error('Failed to fetch nearby businesses.', 500);
        }
    });

    // GET /api/business - List with filters
    $router->get('/api/business', function($params) {
        try {
            $pdo = db();
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min((int)($_GET['limit'] ?? 20), 100);
            $offset = ($page - 1) * $limit;

            $where = ["status = 'approved'"];
            $bindParams = [];

            if (!empty($_GET['category'])) {
                $cat = trim($_GET['category']);
                $slugForm = str_replace([' ', '&'], ['-', '-'], $cat);
                $nameForm = str_replace('-', ' ', $cat);
                $where[] = "(LOWER(category) = LOWER(?) OR LOWER(category) = LOWER(?))";
                $bindParams[] = $slugForm;
                $bindParams[] = $nameForm;
            }

            if (!empty($_GET['subCategory']) || !empty($_GET['subcategory'])) {
                $sub = trim($_GET['subCategory'] ?? $_GET['subcategory']);
                $slugForm = str_replace(' ', '-', $sub);
                $nameForm = str_replace('-', ' ', $sub);
                $where[] = "(LOWER(sub_category) = LOWER(?) OR LOWER(sub_category) = LOWER(?))";
                $bindParams[] = $slugForm;
                $bindParams[] = $nameForm;
            }

            if (!empty($_GET['city'])) {
                $where[] = "LOWER(city) = LOWER(?)";
                $bindParams[] = trim($_GET['city']);
            }

            if (!empty($_GET['area'])) {
                $where[] = "LOWER(area) = LOWER(?)";
                $bindParams[] = trim($_GET['area']);
            }

            $q = trim($_GET['q'] ?? '');
            $orderBy = "created_at DESC";

            if ($q) {
                $safe = Sanitize::safeSearchQuery($q);
                if ($safe) {
                    $like = '%' . $safe . '%';
                    $where[] = "(name LIKE ? OR category LIKE ? OR sub_category LIKE ? OR description LIKE ?)";
                    $bindParams = array_merge($bindParams, [$like, $like, $like, $like]);

                    $orderBy = "CASE 
                        WHEN LOWER(category) = LOWER('{$safe}') THEN 100
                        WHEN LOWER(category) LIKE LOWER('%{$safe}%') THEN 50
                        WHEN LOWER(sub_category) LIKE LOWER('%{$safe}%') THEN 40
                        WHEN LOWER(name) LIKE LOWER('{$safe}%') THEN 30
                        WHEN LOWER(name) LIKE LOWER('%{$safe}%') THEN 20
                        WHEN LOWER(description) LIKE LOWER('%{$safe}%') THEN 5
                        ELSE 0
                    END DESC, created_at DESC";
                }
            }

            $whereClause = implode(' AND ', $where);

            $countStmt = $pdo->prepare("SELECT COUNT(*) FROM businesses WHERE $whereClause");
            $countStmt->execute($bindParams);
            $total = (int)$countStmt->fetchColumn();

            $stmt = $pdo->prepare("SELECT * FROM businesses WHERE $whereClause ORDER BY $orderBy LIMIT ? OFFSET ?");
            $stmt->execute([...$bindParams, $limit, $offset]);
            $businesses = enrichBusinessList($stmt->fetchAll());

            Response::cached([
                'businesses' => $businesses,
                'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total, 'pages' => (int)ceil($total / $limit)]
            ], 's-maxage=300, stale-while-revalidate=600');
        } catch (Exception $e) {
            Logger::error('Error fetching businesses:', $e->getMessage());
            Response::error('Failed to fetch businesses.', 500);
        }
    });

    // PATCH /api/business - Admin approve/reject
    $router->patch('/api/business', function($params) {
        try {
            $adminSecret = env('ADMIN_SECRET');
            if (!$adminSecret) Response::error('Missing ADMIN_SECRET', 500);

            $bearer = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
            $headerSecret = $_SERVER['HTTP_X_ADMIN_SECRET'] ?? '';
            if (!$headerSecret && str_starts_with($bearer, 'Bearer ')) {
                $headerSecret = substr($bearer, 7);
            }
            if ($headerSecret !== $adminSecret) Response::error('Unauthorized', 401);

            $body = json_decode(file_get_contents('php://input'), true) ?? [];
            $id = (int)trim($body['id'] ?? '');
            $status = trim($body['status'] ?? '');
            if (!$id || !in_array($status, ['approved', 'pending', 'rejected'])) {
                Response::error('id and valid status are required', 400);
            }

            $pdo = db();
            $stmt = $pdo->prepare("UPDATE businesses SET status = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$status, $id]);

            if ($stmt->rowCount() === 0) Response::error('Business not found', 404);

            if ($status === 'approved') {
                GooglePing::pingSitemap();
            }

            Response::success(['modifiedCount' => $stmt->rowCount()]);
        } catch (Exception $e) {
            Response::error('Failed to update status.', 500);
        }
    });

    // POST /api/business/check-duplicates
    $router->post('/api/business/check-duplicates', function($params) {
        $ip = RateLimit::getClientIp();
        $rl = RateLimit::check($ip, 'check-duplicates', 60);
        if (!$rl['ok']) Response::error('Too many requests', 429);

        try {
            $body = json_decode(file_get_contents('php://input'), true) ?? [];
            $name = trim($body['name'] ?? '');
            $phone = trim($body['phone'] ?? '');
            $email = trim($body['email'] ?? '');

            if (!$name && !$phone && !$email) {
                Response::error('At least one of name+city+category, phone, or email is required', 400);
            }

            $conflicts = DuplicateCheck::check($body);
            Response::success([
                'hasDuplicates' => DuplicateCheck::hasAnyConflict($conflicts),
                'conflicts' => $conflicts,
            ]);
        } catch (Exception $e) {
            Logger::error('Error checking duplicates:', $e->getMessage());
            Response::error('Internal server error.', 500);
        }
    });

    // POST /api/business - Create business
    $router->post('/api/business', function($params) {
        $ip = RateLimit::getClientIp();
        $rl = RateLimit::check($ip, 'business-create', 10);
        if (!$rl['ok']) Response::error('Too many submissions. Try again later.', 429);

        try {
            $pdo = db();

            $data = $_POST;
            $data['subCategory'] = $data['subcategory'] ?? $data['subCategory'] ?? '';

            foreach (['websiteUrl', 'facebookUrl', 'gmbUrl', 'youtubeUrl'] as $f) {
                $val = trim($data[$f] ?? '');
                if ($val && !preg_match('#^https?://#i', $val)) $data[$f] = 'https://' . $val;
            }

            if (!empty($data['description']) && strpos($data['description'], 'Business Not Found') !== false) {
                Response::error('Invalid description content detected', 400, ['details' => 'Description field contains error messages']);
            }

            $errors = Validator::validateCreateBusiness($data);
            if (!empty($errors)) {
                Response::error('Validation failed', 400, ['details' => $errors]);
            }

            $latitude = isset($data['latitude']) ? (float)$data['latitude'] : null;
            $longitude = isset($data['longitude']) ? (float)$data['longitude'] : null;
            $locationVerified = false;

            if ($latitude !== null && $longitude !== null && $latitude >= -90 && $latitude <= 90 && $longitude >= -180 && $longitude <= 180) {
                $locationVerified = true;
            } else {
                $geo = Geocode::geocodeAddress(
                    trim($data['address']),
                    trim($data['city']),
                    trim($data['area'] ?? ''),
                    trim($data['country'])
                );
                if ($geo) {
                    $latitude = $geo['latitude'];
                    $longitude = $geo['longitude'];
                    $locationVerified = true;
                }
            }

            $conflicts = DuplicateCheck::check($data);
            if (DuplicateCheck::hasAnyConflict($conflicts)) {
                Response::error('We already have this in our directory. Please update the fields below or search the site to find your existing listing.', 409, ['conflicts' => $conflicts]);
            }

            $logoUrl = null;
            $logoPublicId = null;
            if (!empty($_FILES['logo']) && $_FILES['logo']['size'] > 0 && $_FILES['logo']['error'] === UPLOAD_ERR_OK) {
                $uploaded = CloudinaryHelper::upload($_FILES['logo']['tmp_name']);
                if ($uploaded) {
                    $logoUrl = $uploaded['url'];
                    $logoPublicId = $uploaded['public_id'];
                }
            }

            $baseSlug = preg_replace('/-+/', '-', preg_replace('/[^a-z0-9\s-]/', '', preg_replace('/\s+/', '-', strtolower(trim($data['name'])))));
            $baseSlug = substr($baseSlug, 0, 120) ?: 'business-' . time();
            $uniqueSlug = $baseSlug;
            $attempt = 0;
            while (true) {
                $chk = $pdo->prepare("SELECT id FROM businesses WHERE slug = ?");
                $chk->execute([$uniqueSlug]);
                if (!$chk->fetch()) break;
                $attempt++;
                $uniqueSlug = $baseSlug . '-' . $attempt;
            }

            $normalized = DuplicateCheck::getNormalizedForInsert(trim($data['phone']), trim($data['websiteUrl'] ?? ''));
            $now = date('Y-m-d H:i:s');

            $stmt = $pdo->prepare("INSERT INTO businesses (name, slug, category, sub_category, country, province, city, area, postal_code, address, phone, phone_digits, contact_person, whatsapp, email, description, website_url, website_normalized, facebook_url, gmb_url, youtube_url, profile_username, swift_code, branch_code, city_dialing_code, iban, logo_url, logo_public_id, status, approved_at, approved_by, featured, latitude, longitude, location_verified, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");

            $stmt->execute([
                trim($data['name']), $uniqueSlug, trim($data['category']), trim($data['subCategory'] ?? '') ?: null,
                trim($data['country']), trim($data['province'] ?? '') ?: null, trim($data['city']),
                trim($data['area'] ?? '') ?: null, trim($data['postalCode'] ?? '') ?: null,
                trim($data['address']), trim($data['phone']), $normalized['phoneDigits'],
                trim($data['contactPerson'] ?? '') ?: null, trim($data['whatsapp'] ?? '') ?: null,
                trim($data['email']), trim($data['description']),
                trim($data['websiteUrl'] ?? '') ?: null, $normalized['websiteNormalized'],
                trim($data['facebookUrl'] ?? '') ?: null, trim($data['gmbUrl'] ?? '') ?: null,
                trim($data['youtubeUrl'] ?? '') ?: null, trim($data['profileUsername'] ?? '') ?: null,
                trim($data['swiftCode'] ?? '') ?: null, trim($data['branchCode'] ?? '') ?: null,
                trim($data['cityDialingCode'] ?? '') ?: null, trim($data['iban'] ?? '') ?: null,
                $logoUrl, $logoPublicId, 'approved', $now, 'auto', 0, $latitude, $longitude,
                $locationVerified ? 1 : 0, $now,
            ]);

            $insertId = (int)$pdo->lastInsertId();

            $pdo->prepare("UPDATE categories SET count = count + 1 WHERE slug = ?")->execute([trim($data['category'])]);

            GooglePing::pingSitemap();
            Email::sendConfirmation([
                'name' => trim($data['name']),
                'slug' => $uniqueSlug,
                'category' => trim($data['category']),
                'city' => trim($data['city']),
                'address' => trim($data['address']),
                'phone' => trim($data['phone']),
                'email' => trim($data['email']),
                'websiteUrl' => trim($data['websiteUrl'] ?? ''),
            ]);

            Response::json([
                'ok' => true,
                'id' => $insertId,
                'slug' => $uniqueSlug,
                'business' => ['id' => $insertId, 'slug' => $uniqueSlug, 'name' => trim($data['name'])],
            ], 201);
        } catch (Exception $e) {
            Logger::error('Business creation error:', $e->getMessage());
            Response::error('Internal server error.', 500);
        }
    });

    // GET /api/business/{slug} - Get by slug or numeric ID
    $router->get('/api/business/{slug}', function($params) {
        try {
            $pdo = db();
            $param = trim($params['slug'] ?? '');
            $param = rawurldecode($param);
            if (!$param) Response::error('Slug or id is required', 400);

            $business = null;
            if (ctype_digit($param)) {
                $stmt = $pdo->prepare("SELECT * FROM businesses WHERE id = ? AND status = 'approved'");
                $stmt->execute([(int)$param]);
                $business = $stmt->fetch();
            }
            if (!$business) {
                $stmt = $pdo->prepare("SELECT * FROM businesses WHERE slug = ? AND status = 'approved'");
                $stmt->execute([$param]);
                $business = $stmt->fetch();
            }

            if (!$business) Response::error('Business not found', 404);

            $enriched = enrichBusinessRow($business);
            Response::cached(['business' => $enriched], 's-maxage=3600, stale-while-revalidate=86400');
        } catch (Exception $e) {
            Logger::error('Error fetching business:', $e->getMessage());
            Response::error('Failed to fetch business. Please try again later.', 500);
        }
    });
}

function enrichBusinessRow(array $row): array {
    $row['logoUrl'] = $row['logo_url'] ?: CloudinaryHelper::buildCdnUrl($row['logo_public_id'] ?? null);
    return [
        'id' => (string)$row['id'],
        '_id' => (string)$row['id'],
        'name' => $row['name'],
        'slug' => $row['slug'],
        'category' => $row['category'],
        'subCategory' => $row['sub_category'] ?? null,
        'country' => $row['country'] ?? null,
        'province' => $row['province'] ?? null,
        'city' => $row['city'],
        'area' => $row['area'] ?? null,
        'postalCode' => $row['postal_code'] ?? null,
        'address' => $row['address'] ?? null,
        'phone' => $row['phone'] ?? null,
        'phoneDigits' => $row['phone_digits'] ?? null,
        'contactPerson' => $row['contact_person'] ?? null,
        'whatsapp' => $row['whatsapp'] ?? null,
        'email' => $row['email'] ?? null,
        'description' => $row['description'] ?? null,
        'websiteUrl' => $row['website_url'] ?? null,
        'websiteNormalized' => $row['website_normalized'] ?? null,
        'facebookUrl' => $row['facebook_url'] ?? null,
        'gmbUrl' => $row['gmb_url'] ?? null,
        'youtubeUrl' => $row['youtube_url'] ?? null,
        'profileUsername' => $row['profile_username'] ?? null,
        'swiftCode' => $row['swift_code'] ?? null,
        'branchCode' => $row['branch_code'] ?? null,
        'cityDialingCode' => $row['city_dialing_code'] ?? null,
        'iban' => $row['iban'] ?? null,
        'logoUrl' => $row['logoUrl'] ?? $row['logo_url'] ?? null,
        'logoPublicId' => $row['logo_public_id'] ?? null,
        'status' => $row['status'],
        'approvedAt' => $row['approved_at'] ?? null,
        'approvedBy' => $row['approved_by'] ?? null,
        'featured' => (bool)($row['featured'] ?? false),
        'featuredAt' => $row['featured_at'] ?? null,
        'ratingAvg' => (float)($row['rating_avg'] ?? 0),
        'ratingCount' => (int)($row['rating_count'] ?? 0),
        'latitude' => $row['latitude'] !== null ? (float)$row['latitude'] : null,
        'longitude' => $row['longitude'] !== null ? (float)$row['longitude'] : null,
        'locationVerified' => (bool)($row['location_verified'] ?? false),
        'createdAt' => $row['created_at'] ?? null,
        'updatedAt' => $row['updated_at'] ?? null,
        'distanceKm' => $row['distanceKm'] ?? ($row['distance_km'] ?? null),
    ];
}

function enrichBusinessList(array $rows): array {
    return array_map('enrichBusinessRow', $rows);
}
