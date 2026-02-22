<?php

function registerAdminRoutes(Router $router): void {
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
