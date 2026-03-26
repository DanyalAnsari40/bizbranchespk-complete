<?php

function registerCitiesRoutes(Router $router): void {
    $router->get('/api/cities/countries', function($params) {
        $countries = ['Australia', 'Canada', 'Pakistan', 'Saudi Arabia', 'UAE', 'United Kingdom', 'United States'];
        Response::cached(['countries' => $countries], 's-maxage=86400, stale-while-revalidate=604800');
    });

    $router->get('/api/cities', function($params) {
        try {
            $country = trim($_GET['country'] ?? '');
            $isPakistan = strtolower($country) === 'pakistan';

            if ($isPakistan) {
                $cities = loadPakistanCities();
                if (empty($cities)) {
                    $cities = loadPakistanCitiesFromJson();
                }
            } else {
                $cities = array_merge(getGlobalCities(), loadPakistanCitiesFromJson());
                if ($country) {
                    $cities = array_filter($cities, fn($c) => $c['country'] === $country);
                    $cities = array_values($cities);
                }
            }

            usort($cities, fn($a, $b) => strcmp($a['name'], $b['name']));
            Response::cached(['cities' => $cities], 's-maxage=3600, stale-while-revalidate=86400');
        } catch (Exception $e) {
            Logger::error('Error fetching cities:', $e->getMessage());
            Response::error('Failed to fetch cities', 500);
        }
    });

    $router->post('/api/cities', function($params) {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $name = trim($body['name'] ?? '');
        $country = trim($body['country'] ?? '');
        if (!$name || !$country) Response::error('Name and country are required', 400);
        Response::success(['city' => ['id' => toSlug($name), 'name' => $name, 'country' => $country]]);
    });
}

function loadPakistanCitiesFromJson(): array {
    $path = __DIR__ . '/../data/pakistan-cities.json';
    if (file_exists($path)) {
        $data = json_decode(file_get_contents($path), true);
        if (is_array($data)) return $data;
    }
    return [];
}

function loadPakistanCities(): array {
    $base = Courier::getBaseUrl();
    if (!$base) return loadPakistanCitiesFromJson();

    $pathsToTry = ['/cities', '/city', '/GetCities', '/merchant/cities', '/api/cities'];
    foreach ($pathsToTry as $p) {
        try {
            $data = Courier::get($p);
            if (!$data) continue;
            $list = normalizeCourierCities($data);
            if (!empty($list)) return $list;
        } catch (Exception $e) { continue; }
    }
    return loadPakistanCitiesFromJson();
}

function normalizeCourierCities($raw): array {
    $arr = is_array($raw) ? $raw : ($raw['data'] ?? $raw['cities'] ?? $raw['city_list'] ?? $raw['results'] ?? []);
    if (!is_array($arr) || empty($arr)) return [];
    $result = [];
    foreach ($arr as $it) {
        $name = $it['name'] ?? $it['city_name'] ?? $it['cityName'] ?? $it['label'] ?? '';
        $id = $it['id'] ?? $it['city_id'] ?? $it['value'] ?? toSlug($name);
        if (!$name) continue;
        $result[] = ['id' => (string)$id, 'name' => trim($name), 'country' => 'Pakistan'];
    }
    return $result;
}

function getGlobalCities(): array {
    return [
        ['id'=>'new-york','name'=>'New York','country'=>'United States'],
        ['id'=>'los-angeles','name'=>'Los Angeles','country'=>'United States'],
        ['id'=>'chicago','name'=>'Chicago','country'=>'United States'],
        ['id'=>'houston','name'=>'Houston','country'=>'United States'],
        ['id'=>'london','name'=>'London','country'=>'United Kingdom'],
        ['id'=>'birmingham','name'=>'Birmingham','country'=>'United Kingdom'],
        ['id'=>'manchester','name'=>'Manchester','country'=>'United Kingdom'],
        ['id'=>'toronto','name'=>'Toronto','country'=>'Canada'],
        ['id'=>'montreal','name'=>'Montreal','country'=>'Canada'],
        ['id'=>'vancouver','name'=>'Vancouver','country'=>'Canada'],
        ['id'=>'sydney','name'=>'Sydney','country'=>'Australia'],
        ['id'=>'melbourne','name'=>'Melbourne','country'=>'Australia'],
        ['id'=>'brisbane','name'=>'Brisbane','country'=>'Australia'],
        ['id'=>'dubai','name'=>'Dubai','country'=>'UAE'],
        ['id'=>'abu-dhabi','name'=>'Abu Dhabi','country'=>'UAE'],
        ['id'=>'sharjah','name'=>'Sharjah','country'=>'UAE'],
        ['id'=>'riyadh','name'=>'Riyadh','country'=>'Saudi Arabia'],
        ['id'=>'jeddah','name'=>'Jeddah','country'=>'Saudi Arabia'],
        ['id'=>'mecca','name'=>'Mecca','country'=>'Saudi Arabia'],
    ];
}
