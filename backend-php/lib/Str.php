<?php

/**
 * UTF-8 safe string helpers with fallbacks when mbstring is not enabled.
 */
class Str {
    public static function len(string $s): int {
        if (function_exists('mb_strlen')) {
            return mb_strlen($s, 'UTF-8');
        }
        return strlen($s);
    }

    public static function substr(string $s, int $start, ?int $length = null): string {
        if (function_exists('mb_substr')) {
            return $length === null
                ? mb_substr($s, $start, null, 'UTF-8')
                : mb_substr($s, $start, $length, 'UTF-8');
        }
        return $length === null ? substr($s, $start) : substr($s, $start, $length);
    }
}
