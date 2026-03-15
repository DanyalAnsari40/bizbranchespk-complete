<?php

function registerAdminRoutes(Router $router): void {
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
