<?php

class RateLimit {
    private const WINDOW_SECONDS = 60;

    public static function check(string $ip, string $path = 'global', int $maxPerWindow = 300): array {
        try {
            $pdo = db();
            $windowStart = date('Y-m-d H:i:s', time() - self::WINDOW_SECONDS);

            // Clean old entries periodically (1% chance per request)
            if (rand(1, 100) === 1) {
                $pdo->prepare("DELETE FROM rate_limits WHERE window_start < ?")->execute([$windowStart]);
            }

            $stmt = $pdo->prepare(
                "SELECT SUM(request_count) as total FROM rate_limits WHERE ip_address = ? AND route_path = ? AND window_start > ?"
            );
            $stmt->execute([$ip, $path, $windowStart]);
            $total = (int)($stmt->fetchColumn() ?: 0);

            if ($total >= $maxPerWindow) {
                return ['ok' => false, 'retryAfter' => self::WINDOW_SECONDS];
            }

            $pdo->prepare(
                "INSERT INTO rate_limits (ip_address, route_path, request_count, window_start) VALUES (?, ?, 1, NOW())"
            )->execute([$ip, $path]);

            return ['ok' => true];
        } catch (Throwable $e) {
            Logger::error('Rate limit check failed:', $e->getMessage());
            return ['ok' => true]; // fail open (e.g. DB not migrated yet on localhost)
        }
    }

    public static function globalCheck(string $ip): array {
        $max = (int) env('RATE_LIMIT_PER_MINUTE', '900');
        return self::check($ip, 'global', $max > 0 ? $max : 900);
    }

    public static function getClientIp(): string {
        $headers = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CF_CONNECTING_IP', 'REMOTE_ADDR'];
        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ips = explode(',', $_SERVER[$header]);
                return trim($ips[0]);
            }
        }
        return '127.0.0.1';
    }
}
