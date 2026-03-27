<?php

function registerSearchRoutes(Router $router): void {
    $router->get('/api/search', function($params) {
        try {
            $raw = trim($_GET['q'] ?? '');
            if (Str::len($raw) < 2) {
                Response::success(['businesses' => [], 'categories' => []]);
                return;
            }

            $pdo = db();
            $safe = Sanitize::safeSearchQuery($raw);
            $like = '%' . $safe . '%';

            $bStmt = $pdo->prepare(
                "SELECT id, name, city, category, logo_url as logoUrl, slug FROM businesses WHERE (name LIKE ? OR description LIKE ?) AND status = 'approved' LIMIT 5"
            );
            $bStmt->execute([$like, $like]);
            $businesses = $bStmt->fetchAll();
            foreach ($businesses as &$b) {
                $b['id'] = (string)$b['id'];
                $b['_id'] = $b['id'];
            }
            unset($b);

            $cStmt = $pdo->prepare("SELECT name, slug FROM categories WHERE name LIKE ? LIMIT 3");
            $cStmt->execute([$like]);
            $categories = $cStmt->fetchAll();

            Response::success(['businesses' => $businesses, 'categories' => $categories]);
        } catch (Exception $e) {
            Logger::error('Error fetching search suggestions:', $e->getMessage());
            Response::error('Failed to fetch search suggestions.', 500);
        }
    });
}
