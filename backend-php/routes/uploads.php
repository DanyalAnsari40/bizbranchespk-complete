<?php

/**
 * Serve locally stored payment proof images (GET only, strict filename).
 */
function registerUploadRoutes(Router $router): void {
    $router->get('/uploads/payment-proofs/{filename}', function($params) {
        $filename = $params['filename'] ?? '';
        if (!is_string($filename) || !preg_match('/^[0-9]+_[a-f0-9]+\.(jpg|png)$/i', $filename)) {
            http_response_code(404);
            header('Content-Type: text/plain; charset=utf-8');
            echo 'Not found';
            exit;
        }

        $safe = basename($filename);
        $dir = dirname(__DIR__) . '/uploads/payment-proofs';
        $path = $dir . '/' . $safe;

        $realDir = realpath($dir);
        $realFile = realpath($path);
        if ($realDir === false || $realFile === false || !str_starts_with($realFile, $realDir) || !is_file($realFile)) {
            http_response_code(404);
            header('Content-Type: text/plain; charset=utf-8');
            echo 'Not found';
            exit;
        }

        $mime = @mime_content_type($realFile) ?: 'application/octet-stream';
        if (!in_array($mime, ['image/jpeg', 'image/png'], true)) {
            http_response_code(404);
            exit;
        }

        header('Content-Type: ' . $mime);
        header('Cache-Control: public, max-age=86400');
        header('X-Content-Type-Options: nosniff');
        readfile($realFile);
        exit;
    });
}
