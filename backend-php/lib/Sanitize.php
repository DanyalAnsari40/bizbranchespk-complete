<?php

class Sanitize {
    public static function escapeRegex(string $s): string {
        return preg_quote($s, '/');
    }

    public static function safeSearchQuery(string $input): string {
        $trimmed = trim(Str::substr($input, 0, 200));
        return self::escapeRegex($trimmed);
    }

    public static function escapeHtml(string $s): string {
        return htmlspecialchars($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
}
