<?php

$DEFAULT_SUBCATEGORIES = [
    'importer-and-exporter' => [['name'=>'General Trading','slug'=>'general-trading'],['name'=>'Freight & Logistics','slug'=>'freight-logistics'],['name'=>'Customs & Clearance','slug'=>'customs-clearance'],['name'=>'Textile & Garments','slug'=>'textile-garments'],['name'=>'Agriculture & Food','slug'=>'agriculture-food']],
    'beauty-salon' => [['name'=>'Hair Care','slug'=>'hair-care'],['name'=>'Makeup','slug'=>'makeup'],['name'=>'Skin Care','slug'=>'skin-care'],['name'=>'Nail Salon','slug'=>'nail-salon'],['name'=>'Spa','slug'=>'spa']],
    'automotive' => [['name'=>'Car Repair','slug'=>'car-repair'],['name'=>'Car Wash','slug'=>'car-wash'],['name'=>'Tyres & Wheels','slug'=>'tyres-wheels'],['name'=>'Car Accessories','slug'=>'car-accessories'],['name'=>'Showroom','slug'=>'showroom']],
    'restaurants' => [['name'=>'Fast Food','slug'=>'fast-food'],['name'=>'BBQ','slug'=>'bbq'],['name'=>'Pakistani','slug'=>'pakistani'],['name'=>'Chinese','slug'=>'chinese'],['name'=>'Cafe','slug'=>'cafe']],
    'healthcare' => [['name'=>'Clinic','slug'=>'clinic'],['name'=>'Hospital','slug'=>'hospital'],['name'=>'Pharmacy','slug'=>'pharmacy'],['name'=>'Dentist','slug'=>'dentist'],['name'=>'Laboratory','slug'=>'laboratory']],
    'education' => [['name'=>'School','slug'=>'school'],['name'=>'College','slug'=>'college'],['name'=>'University','slug'=>'university'],['name'=>'Coaching','slug'=>'coaching'],['name'=>'Training Center','slug'=>'training-center']],
    'shopping' => [['name'=>'Clothing','slug'=>'clothing'],['name'=>'Electronics','slug'=>'electronics'],['name'=>'Groceries','slug'=>'groceries'],['name'=>'Footwear','slug'=>'footwear'],['name'=>'Jewelry','slug'=>'jewelry']],
];

function registerCategoriesRoutes(Router $router): void {
    global $DEFAULT_SUBCATEGORIES;

    $router->get('/api/categories', function($params) use ($DEFAULT_SUBCATEGORIES) {
        try {
            $pdo = db();
            $q = trim($_GET['q'] ?? '');
            $slug = trim($_GET['slug'] ?? '');
            $limit = min(max((int)($_GET['limit'] ?? 10), 1), 200);
            $noCache = ($_GET['nocache'] ?? '') === '1';

            if ($slug) {
                $stmt = $pdo->prepare("SELECT name, slug, count, image_url as imageUrl, icon FROM categories WHERE slug = ? AND is_active = 1");
                $stmt->execute([$slug]);
                $category = $stmt->fetch();
                if (!$category) Response::error('Category not found', 404);

                $subStmt = $pdo->prepare("SELECT name, slug FROM subcategories WHERE category_id = (SELECT id FROM categories WHERE slug = ?)");
                $subStmt->execute([$slug]);
                $subs = $subStmt->fetchAll();
                $category['subcategories'] = !empty($subs) ? $subs : ($DEFAULT_SUBCATEGORIES[$slug] ?? []);

                $cache = $noCache ? 'no-store, must-revalidate' : 's-maxage=3600, stale-while-revalidate=86400';
                Response::cached(['category' => $category], $cache);
                return;
            }

            $where = "is_active = 1";
            $bindParams = [];
            if ($q) {
                $where .= " AND (name LIKE ? OR slug LIKE ?)";
                $bindParams[] = '%' . $q . '%';
                $bindParams[] = '%' . $q . '%';
            }

            $stmt = $pdo->prepare("SELECT id, name, slug, count, image_url as imageUrl, icon FROM categories WHERE $where ORDER BY count DESC, name ASC LIMIT ?");
            $stmt->execute([...$bindParams, $limit]);
            $categories = $stmt->fetchAll();

            if (empty($categories)) {
                $stmt2 = $pdo->prepare("SELECT DISTINCT category FROM businesses WHERE category IS NOT NULL AND category != '' LIMIT ?");
                $stmt2->execute([$limit]);
                $cats = $stmt2->fetchAll(PDO::FETCH_COLUMN);
                $categories = array_map(function($cat) use ($DEFAULT_SUBCATEGORIES) {
                    $s = toSlug($cat);
                    return ['name' => $cat, 'slug' => $s, 'count' => 0, 'imageUrl' => null, 'icon' => '🏢', 'subcategories' => $DEFAULT_SUBCATEGORIES[$s] ?? []];
                }, $cats);
            } else {
                foreach ($categories as &$c) {
                    if (!$c['slug'] && $c['name']) $c['slug'] = toSlug($c['name']);
                    $subStmt = $pdo->prepare("SELECT name, slug FROM subcategories WHERE category_id = ?");
                    $subStmt->execute([$c['id']]);
                    $subs = $subStmt->fetchAll();
                    $c['subcategories'] = !empty($subs) ? $subs : ($DEFAULT_SUBCATEGORIES[$c['slug']] ?? []);
                    unset($c['id']);
                }
                unset($c);
            }

            $cache = $noCache ? 'no-store, must-revalidate' : 's-maxage=3600, stale-while-revalidate=86400';
            Response::cached(['categories' => $categories], $cache);
        } catch (Exception $e) {
            Logger::error('Error fetching categories:', $e->getMessage());
            Response::error('Failed to fetch businesses', 500);
        }
    });
}

function toSlug(string $s): string {
    return preg_replace('/-+/', '-', preg_replace('/[^a-z0-9\s-]/', '', preg_replace('/\s+/', '-', strtolower(trim($s)))));
}
