<?php

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/lib/Logger.php';
require_once __DIR__ . '/lib/Response.php';
require_once __DIR__ . '/lib/Router.php';
require_once __DIR__ . '/lib/Sanitize.php';
require_once __DIR__ . '/lib/RateLimit.php';
require_once __DIR__ . '/lib/Geo.php';
require_once __DIR__ . '/lib/Geocode.php';
require_once __DIR__ . '/lib/DuplicateCheck.php';
require_once __DIR__ . '/lib/CloudinaryHelper.php';
require_once __DIR__ . '/lib/Email.php';
require_once __DIR__ . '/lib/GooglePing.php';
require_once __DIR__ . '/lib/Courier.php';
require_once __DIR__ . '/lib/Validator.php';
require_once __DIR__ . '/lib/PaymentProofLocalStorage.php';
require_once __DIR__ . '/lib/AdminSession.php';

// Load PHPMailer if available via composer
$autoload = __DIR__ . '/vendor/autoload.php';
if (file_exists($autoload)) require_once $autoload;

// Set security headers and handle CORS
Response::setSecurityHeaders();
Response::setCors();

// Global rate limiting
$clientIp = RateLimit::getClientIp();
$globalRl = RateLimit::globalCheck($clientIp);
if (!$globalRl['ok']) {
    header('Retry-After: ' . ($globalRl['retryAfter'] ?? 60));
    Response::error('Too many requests. Please try again later.', 429);
}

// Load route handlers
require_once __DIR__ . '/routes/business.php';
require_once __DIR__ . '/routes/business_related.php';
require_once __DIR__ . '/routes/categories.php';
require_once __DIR__ . '/routes/cities.php';
require_once __DIR__ . '/routes/search.php';
require_once __DIR__ . '/routes/reviews.php';
require_once __DIR__ . '/routes/provinces.php';
require_once __DIR__ . '/routes/areas.php';
require_once __DIR__ . '/routes/admin.php';
require_once __DIR__ . '/routes/geocode.php';
require_once __DIR__ . '/routes/sitemap_api.php';
require_once __DIR__ . '/routes/db_health.php';
require_once __DIR__ . '/routes/debug.php';
require_once __DIR__ . '/routes/profile.php';
require_once __DIR__ . '/routes/uploads.php';

$router = new Router();

// Register all routes (order matters: specific routes before parameterized ones)
registerUploadRoutes($router);
registerBusinessRelatedRoutes($router); // /api/business/related before /api/business/{slug}
registerBusinessRoutes($router);
registerCategoriesRoutes($router);
registerCitiesRoutes($router);
registerSearchRoutes($router);
registerReviewsRoutes($router);
registerProvincesRoutes($router);
registerAreasRoutes($router);
registerAdminRoutes($router);
registerGeocodeRoutes($router);
registerSitemapApiRoutes($router);
registerDbHealthRoutes($router);
registerDebugRoutes($router);
registerProfileRoutes($router);

// Static routes
$router->get('/', function($params) {
    Response::success(['message' => 'BizBranches API Server (PHP)', 'timestamp' => date('c')]);
});

$router->get('/api/ping', function($params) {
    Response::success(['message' => 'pong', 'timestamp' => date('c')]);
});

// Dispatch
$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];

if (!$router->dispatch($method, $uri)) {
    Response::error('Not found', 404);
}
