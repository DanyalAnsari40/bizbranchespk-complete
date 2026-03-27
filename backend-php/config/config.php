<?php

function loadEnv(string $path): void {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (strpos($line, '=') === false) continue;
        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        if ((str_starts_with($value, '"') && str_ends_with($value, '"')) ||
            (str_starts_with($value, "'") && str_ends_with($value, "'"))) {
            $value = substr($value, 1, -1);
        }
        if (!isset($_ENV[$key]) && getenv($key) === false) {
            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }
}

function env(string $key, mixed $default = null): mixed {
    $value = $_ENV[$key] ?? getenv($key);
    if ($value === false || $value === null) return $default;
    return $value;
}

function isProd(): bool {
    return env('NODE_ENV', '') === 'production' || env('APP_ENV', '') === 'production';
}

/** Absolute URL for stored payment proof path (or pass-through if already absolute). */
function payment_proof_url_for_display(?string $stored): ?string {
    if ($stored === null || trim($stored) === '') {
        return null;
    }
    if (preg_match('#^https?://#i', $stored)) {
        return $stored;
    }
    $base = rtrim((string)env('SITE_URL', env('BACKEND_URL', 'http://localhost:3002')), '/');
    return $base . $stored;
}

// Load .env (api/.env on cPanel, or root .env for local dev)
loadEnv(__DIR__ . '/../.env');
loadEnv(__DIR__ . '/../../.env');
