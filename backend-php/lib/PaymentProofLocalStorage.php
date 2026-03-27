<?php

/**
 * Temporary local storage for payment proof images (testing).
 * Replace with Cloudinary or secure object storage in production.
 */
class PaymentProofLocalStorage {
    public const RELATIVE_PREFIX = '/uploads/payment-proofs/';
    public const MAX_BYTES = 2 * 1024 * 1024;

    /** @var array<string, true> */
    private const ALLOWED_MIME = [
        'image/jpeg' => true,
        'image/png' => true,
    ];

    public static function uploadDirectory(): string {
        return dirname(__DIR__) . '/uploads/payment-proofs';
    }

    public static function ensureDirectoryExists(): void {
        $dir = self::uploadDirectory();
        if (is_dir($dir)) {
            return;
        }
        if (!@mkdir($dir, 0755, true) && !is_dir($dir)) {
            throw new RuntimeException('Could not create uploads/payment-proofs directory');
        }
    }

    /**
     * Validate and move upload; returns DB path e.g. /uploads/payment-proofs/1730000000_abc123.jpg
     *
     * @param array $file $_FILES['paymentProof']
     */
    public static function save(array $file): string {
        self::ensureDirectoryExists();

        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            throw new InvalidArgumentException('Payment proof upload is required');
        }
        if (($file['size'] ?? 0) > self::MAX_BYTES) {
            throw new InvalidArgumentException('Payment proof must be 2MB or smaller');
        }
        if (($file['size'] ?? 0) <= 0) {
            throw new InvalidArgumentException('Invalid file');
        }

        $tmp = $file['tmp_name'] ?? '';
        if ($tmp === '' || !is_uploaded_file($tmp)) {
            throw new InvalidArgumentException('Invalid upload');
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = $finfo ? finfo_file($finfo, $tmp) : '';
        if ($finfo) {
            finfo_close($finfo);
        }
        if ($mime === 'image/jpg') {
            $mime = 'image/jpeg';
        }
        if (!isset(self::ALLOWED_MIME[$mime])) {
            throw new InvalidArgumentException('Only JPG, JPEG, and PNG images are allowed');
        }

        if (@getimagesize($tmp) === false) {
            throw new InvalidArgumentException('File is not a valid image');
        }

        $ext = $mime === 'image/png' ? 'png' : 'jpg';

        $filename = time() . '_' . uniqid() . '.' . $ext;
        if (!preg_match('/^[0-9]+_[a-f0-9]+\.(jpg|png)$/i', $filename)) {
            throw new RuntimeException('Invalid generated filename');
        }

        $dest = self::uploadDirectory() . '/' . $filename;
        if (is_file($dest)) {
            throw new RuntimeException('File already exists; retry upload');
        }

        if (!move_uploaded_file($tmp, $dest)) {
            throw new RuntimeException('Could not save payment proof file');
        }

        return self::RELATIVE_PREFIX . $filename;
    }
}
