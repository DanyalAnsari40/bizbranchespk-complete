<?php

/**
 * Browser session for /admin UI (static export friendly — no Node Route Handlers).
 * Complement X-Admin-Secret for scripts/automation.
 */
class AdminSession {
    public static function start(): void {
        if (session_status() !== PHP_SESSION_NONE) {
            return;
        }
        $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
        session_start([
            'cookie_httponly' => true,
            'cookie_samesite' => 'Lax',
            'cookie_secure' => $secure,
            'cookie_path' => '/',
        ]);
    }

    public static function isLoggedIn(): bool {
        self::start();
        return !empty($_SESSION['bizbranches_admin']);
    }

    public static function loginWithPassword(string $password): bool {
        self::start();
        $expected = (string)(env('ADMIN_PANEL_PASSWORD') ?: env('ADMIN_SECRET') ?: '');
        if ($expected === '') {
            return false;
        }
        if (!hash_equals($expected, $password)) {
            return false;
        }
        $_SESSION['bizbranches_admin'] = true;
        return true;
    }

    public static function logout(): void {
        self::start();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'] ?? '', $p['secure'], $p['httponly']);
        }
        session_destroy();
    }
}
