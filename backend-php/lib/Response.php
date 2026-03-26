<?php

class Response {
    public static function json(array $data, int $status = 200, array $headers = []): void {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        foreach ($headers as $key => $value) {
            header("$key: $value");
        }
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function success(array $data): void {
        self::json(array_merge(['ok' => true], $data));
    }

    public static function error(string $message, int $status = 500, array $extra = []): void {
        $headers = ($status === 404) ? ['Cache-Control' => 'no-store, no-cache, must-revalidate'] : [];
        self::json(array_merge(['ok' => false, 'error' => $message], $extra), $status, $headers);
    }

    public static function cached(array $data, string $cacheControl = 's-maxage=300, stale-while-revalidate=600'): void {
        $noCache = (env('DISABLE_CACHE', '') === '1' || env('DISABLE_CACHE', '') === 'true' || env('APP_ENV', '') === 'testing' || env('APP_ENV', '') === 'local');
        $header = $noCache ? 'no-store, no-cache, must-revalidate' : $cacheControl;
        self::json(array_merge(['ok' => true], $data), 200, ['Cache-Control' => $header]);
    }

    public static function setSecurityHeaders(): void {
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header('Permissions-Policy: camera=(), microphone=(), geolocation=(self)');
    }

    public static function setCors(): void {
        $allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            env('FRONTEND_URL', 'http://localhost:3000'),
        ];
        $siteUrl = env('SITE_URL', env('NEXT_PUBLIC_SITE_URL'));
        if ($siteUrl) {
            $allowedOrigins[] = $siteUrl;
            $allowedOrigins[] = rtrim($siteUrl, '/');
            if (str_starts_with($siteUrl, 'https://')) {
                $allowedOrigins[] = str_replace('https://', 'http://', $siteUrl);
            }
        }

        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if ($origin && in_array(rtrim($origin, '/'), array_map(fn($o) => rtrim($o, '/'), $allowedOrigins))) {
            header("Access-Control-Allow-Origin: $origin");
        } elseif (!$origin && env('APP_ENV') === 'production') {
            // Same-origin requests (no Origin header) on cPanel single-domain setup
            header("Access-Control-Allow-Origin: " . ($siteUrl ?: '*'));
        }
        header('Access-Control-Allow-Methods: GET, HEAD, OPTIONS, POST, PUT, PATCH, DELETE');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, x-admin-secret');
        header('Access-Control-Max-Age: 86400');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
