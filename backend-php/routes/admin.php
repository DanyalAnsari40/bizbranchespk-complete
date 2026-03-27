<?php

function admin_api_authorized(): bool {
    $adminSecret = env('ADMIN_SECRET');
    if (!$adminSecret) {
        return false;
    }
    $headerSecret = $_SERVER['HTTP_X_ADMIN_SECRET'] ?? '';
    $bearer = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!$headerSecret && str_starts_with($bearer, 'Bearer ')) {
        $headerSecret = substr($bearer, 7);
    }
    if ($headerSecret === $adminSecret) {
        return true;
    }
    return AdminSession::isLoggedIn();
}

function registerAdminRoutes(Router $router): void {
    // GET /api/admin/session — whether PHP session is logged in (for static export; no Node Route Handlers)
    $router->get('/api/admin/session', function($params) {
        Response::json(['ok' => AdminSession::isLoggedIn()]);
    });

    // POST /api/admin/session — login { "password": "..." }
    $router->post('/api/admin/session', function($params) {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $password = trim((string)($body['password'] ?? ''));
        if ($password === '' || !AdminSession::loginWithPassword($password)) {
            Response::error('Invalid password', 401);
        }
        Response::success([]);
    });

    // DELETE /api/admin/session — logout
    $router->delete('/api/admin/session', function($params) {
        AdminSession::logout();
        Response::success([]);
    });

    // GET /api/admin/business/pending — listings awaiting approval (X-Admin-Secret or session)
    $router->get('/api/admin/business/pending', function($params) {
        if (!env('ADMIN_SECRET')) Response::error('Missing ADMIN_SECRET', 500);
        if (!admin_api_authorized()) Response::error('Unauthorized', 401);

        try {
            $pdo = db();
            $stmt = $pdo->query(
                "SELECT id, name, sender_name, payment_proof_url, created_at FROM businesses WHERE status = 'pending' ORDER BY created_at ASC"
            );
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($rows as &$row) {
                if (isset($row['payment_proof_url'])) {
                    $row['payment_proof_url'] = payment_proof_url_for_display($row['payment_proof_url']);
                }
            }
            unset($row);

            Response::success(['businesses' => $rows]);
        } catch (Exception $e) {
            Logger::error('Error fetching admin pending businesses:', $e->getMessage());
            Response::error('Failed to fetch pending businesses.', 500);
        }
    });

    // POST /api/admin/business/approve — approve one pending listing
    $router->post('/api/admin/business/approve', function($params) {
        if (!env('ADMIN_SECRET')) Response::error('Missing ADMIN_SECRET', 500);
        if (!admin_api_authorized()) Response::error('Unauthorized', 401);

        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $id = (int)trim($body['id'] ?? '');
        if ($id <= 0) Response::error('Valid id is required', 400);

        try {
            $pdo = db();
            $pdo->beginTransaction();

            $sel = $pdo->prepare("SELECT * FROM businesses WHERE id = ? AND status = 'pending' FOR UPDATE");
            $sel->execute([$id]);
            $row = $sel->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                $pdo->rollBack();
                Response::error('Pending business not found', 404);
            }

            $now = date('Y-m-d H:i:s');
            $upd = $pdo->prepare(
                "UPDATE businesses SET status = 'approved', approved_at = ?, approved_by = 'admin', updated_at = NOW() WHERE id = ? AND status = 'pending'"
            );
            $upd->execute([$now, $id]);
            if ($upd->rowCount() === 0) {
                $pdo->rollBack();
                Response::error('Could not approve listing', 409);
            }

            $cat = trim($row['category'] ?? '');
            if ($cat !== '') {
                $pdo->prepare("UPDATE categories SET count = count + 1 WHERE slug = ? OR name = ?")->execute([$cat, $cat]);
            }

            $pdo->commit();

            GooglePing::pingSitemap();
            Email::sendConfirmation([
                'name' => trim($row['name']),
                'slug' => $row['slug'],
                'category' => trim($row['category'] ?? ''),
                'city' => trim($row['city'] ?? ''),
                'address' => trim($row['address'] ?? ''),
                'phone' => trim($row['phone'] ?? ''),
                'email' => trim($row['email'] ?? ''),
                'websiteUrl' => trim($row['website_url'] ?? ''),
            ]);

            Response::success(['id' => $id, 'message' => 'Business approved']);
        } catch (Exception $e) {
            if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
            Logger::error('Error approving business:', $e->getMessage());
            Response::error('Failed to approve business.', 500);
        }
    });

    // POST /api/admin/import-mongodb — upload JSON files and import into MySQL
    $router->post('/api/admin/import-mongodb', function($params) {
        $adminSecret = env('ADMIN_SECRET');
        if (!$adminSecret) Response::error('Missing ADMIN_SECRET', 500);

        $headerSecret = $_SERVER['HTTP_X_ADMIN_SECRET'] ?? '';
        if (empty($headerSecret) && isset($_POST['admin_secret'])) $headerSecret = (string)$_POST['admin_secret'];
        if ($headerSecret !== $adminSecret) Response::error('Unauthorized', 401);

        $scriptDir = __DIR__ . '/../scripts';
        $allowed = [
            'categories' => 'categories.json',
            'cities'     => 'cities.json',
            'businesses' => 'businesses.json',
            'reviews'    => 'reviews.json',
            'users'      => 'users.json',
        ];
        $saved = [];
        $importCollections = [];

        foreach ($allowed as $key => $filename) {
            if (empty($_FILES[$key]['tmp_name']) || !is_uploaded_file($_FILES[$key]['tmp_name'])) continue;

            $tmpContent = file_get_contents($_FILES[$key]['tmp_name']);
            $testJson = json_decode($tmpContent, true);
            if (!is_array($testJson) || empty($testJson)) {
                Response::error("File uploaded for '$key' is not valid JSON or is empty.", 400);
            }

            $path = $scriptDir . '/' . $filename;
            if (move_uploaded_file($_FILES[$key]['tmp_name'], $path)) {
                $saved[] = $filename;
                $importCollections[] = $key;
            }
        }

        if (empty($saved)) {
            Response::error('No valid JSON files uploaded. Use form fields: categories, cities, businesses, reviews, users.', 400);
        }

        $GLOBALS['import_only'] = $importCollections;

        define('MIGRATION_SILENT', true);
        ob_start();
        try {
            require $scriptDir . '/migrate_from_mongodb.php';
            $stats = runMongoMigration();
        } catch (Throwable $e) {
            ob_end_clean();
            Logger::error('Import error:', $e->getMessage());
            Response::error('Import failed: ' . $e->getMessage(), 500);
        }
        ob_end_clean();

        $errorDetails = $stats['error_details'] ?? [];
        unset($stats['error_details']);

        Response::success([
            'message'     => empty($errorDetails) ? 'Import completed successfully' : 'Import completed with some errors',
            'files_saved' => $saved,
            'collections_imported' => $importCollections,
            'stats'       => $stats,
            'errors'      => $errorDetails,
        ]);
    });

    // GET /api/admin/business-status — diagnose status distribution; POST to fix
    $router->get('/api/admin/business-status', function($params) {
        $adminSecret = env('ADMIN_SECRET');
        if (!$adminSecret) Response::error('Missing ADMIN_SECRET', 500);

        $bearer = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        $headerSecret = $_SERVER['HTTP_X_ADMIN_SECRET'] ?? '';
        if (!$headerSecret && str_starts_with($bearer, 'Bearer ')) $headerSecret = substr($bearer, 7);
        if ($headerSecret !== $adminSecret) Response::error('Unauthorized', 401);

        try {
            $pdo = db();

            $statusDist = $pdo->query("SELECT status, COUNT(*) as cnt FROM businesses GROUP BY status")->fetchAll();
            $approvedByDist = $pdo->query("SELECT approved_by, COUNT(*) as cnt FROM businesses GROUP BY approved_by")->fetchAll();
            $total = (int)$pdo->query("SELECT COUNT(*) FROM businesses")->fetchColumn();
            $approvedCount = (int)$pdo->query("SELECT COUNT(*) FROM businesses WHERE status = 'approved'")->fetchColumn();
            $notApproved = $total - $approvedCount;

            $sample = [];
            if ($notApproved > 0) {
                $stmt = $pdo->query("SELECT id, name, slug, status, approved_by FROM businesses WHERE status != 'approved' LIMIT 20");
                $sample = $stmt->fetchAll();
            }

            Response::success([
                'total_businesses' => $total,
                'approved' => $approvedCount,
                'not_approved' => $notApproved,
                'status_distribution' => $statusDist,
                'approved_by_distribution' => $approvedByDist,
                'sample_not_approved' => $sample,
                'fix_hint' => $notApproved > 0
                    ? "POST /api/admin/business-status with {\"action\":\"approve-all\"} to set all businesses to status='approved'"
                    : 'All businesses are already approved.',
            ]);
        } catch (Exception $e) {
            Logger::error('Error in business-status diagnostic:', $e->getMessage());
            Response::error('Diagnostic failed: ' . $e->getMessage(), 500);
        }
    });

    $router->post('/api/admin/business-status', function($params) {
        $adminSecret = env('ADMIN_SECRET');
        if (!$adminSecret) Response::error('Missing ADMIN_SECRET', 500);

        $bearer = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        $headerSecret = $_SERVER['HTTP_X_ADMIN_SECRET'] ?? '';
        if (!$headerSecret && str_starts_with($bearer, 'Bearer ')) $headerSecret = substr($bearer, 7);
        if ($headerSecret !== $adminSecret) Response::error('Unauthorized', 401);

        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $action = $body['action'] ?? '';

        if ($action !== 'approve-all') {
            Response::error('Send {"action":"approve-all"} to approve all businesses', 400);
        }

        try {
            $pdo = db();
            $before = (int)$pdo->query("SELECT COUNT(*) FROM businesses WHERE status != 'approved'")->fetchColumn();

            $pdo->exec("UPDATE businesses SET status = 'approved', approved_at = COALESCE(approved_at, NOW()), approved_by = COALESCE(NULLIF(approved_by, ''), 'auto') WHERE status != 'approved' OR status IS NULL OR status = ''");

            $after = (int)$pdo->query("SELECT COUNT(*) FROM businesses WHERE status != 'approved'")->fetchColumn();

            $pdo->exec("UPDATE categories c SET c.count = (SELECT COUNT(*) FROM businesses b WHERE LOWER(b.category) = LOWER(c.name) AND b.status = 'approved')");

            Response::success([
                'fixed' => $before - $after,
                'remaining_not_approved' => $after,
                'message' => ($before - $after) > 0
                    ? "Fixed {$before} businesses. All are now approved and visible on the website."
                    : 'All businesses were already approved.',
            ]);
        } catch (Exception $e) {
            Logger::error('Error fixing business statuses:', $e->getMessage());
            Response::error('Fix failed: ' . $e->getMessage(), 500);
        }
    });

    $router->get('/api/admin/submissions', function($params) {
        $adminSecret = env('ADMIN_SECRET');
        if (!$adminSecret) Response::error('Missing ADMIN_SECRET', 500);

        $bearer = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        $headerSecret = $_SERVER['HTTP_X_ADMIN_SECRET'] ?? '';
        if (!$headerSecret && str_starts_with($bearer, 'Bearer ')) $headerSecret = substr($bearer, 7);
        if ($headerSecret !== $adminSecret) Response::error('Unauthorized', 401);

        $ip = RateLimit::getClientIp();
        $rl = RateLimit::check($ip, 'admin-submissions', 60);
        if (!$rl['ok']) Response::error('Too many requests', 429);

        try {
            $pdo = db();
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min((int)($_GET['limit'] ?? 20), 100);
            $offset = ($page - 1) * $limit;

            $where = "approved_by = 'auto'";
            $bindParams = [];

            if (!empty($_GET['status'])) {
                $where .= " AND status = ?";
                $bindParams[] = $_GET['status'];
            }

            if (!empty($_GET['from'])) {
                $where .= " AND created_at >= ?";
                $bindParams[] = $_GET['from'];
            }
            if (!empty($_GET['to'])) {
                $where .= " AND created_at <= ?";
                $bindParams[] = $_GET['to'];
            }

            $countStmt = $pdo->prepare("SELECT COUNT(*) FROM businesses WHERE $where");
            $countStmt->execute($bindParams);
            $total = (int)$countStmt->fetchColumn();

            $stmt = $pdo->prepare("SELECT * FROM businesses WHERE $where ORDER BY created_at DESC LIMIT ? OFFSET ?");
            $stmt->execute([...$bindParams, $limit, $offset]);
            $businesses = enrichBusinessList($stmt->fetchAll());

            Response::success([
                'businesses' => $businesses,
                'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total, 'pages' => (int)ceil($total / $limit)]
            ]);
        } catch (Exception $e) {
            Logger::error('Error fetching admin submissions:', $e->getMessage());
            Response::error('Failed to fetch submissions', 500);
        }
    });
}
