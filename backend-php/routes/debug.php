<?php

function registerDebugRoutes(Router $router): void {
    // Upload diagnostics - available in all environments for troubleshooting
    $router->get('/api/test-upload', function($params) {
        header('Content-Type: text/html; charset=utf-8');
        echo getTestUploadPage();
        exit;
    });
    $router->post('/api/test-upload', function($params) {
        header('Content-Type: text/html; charset=utf-8');
        echo getTestUploadPage(true);
        exit;
    });

    if (isProd()) return;

    $router->get('/api/debug', function($params) {
        try {
            $pdo = db();
            $counts = [];
            foreach (['businesses', 'categories', 'cities', 'reviews'] as $table) {
                $counts[$table] = (int)$pdo->query("SELECT COUNT(*) FROM $table")->fetchColumn();
            }
            Response::success(['counts' => $counts]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    });
}

function getTestUploadPage(bool $handlePost = false): string {
    $results = runUploadDiagnostics($handlePost);
    return renderTestUploadHtml($results);
}

function runUploadDiagnostics(bool $handlePost): array {
    $r = [
        'env' => [],
        'php' => [],
        'cloudinary_config' => [],
        'cloudinary_upload' => null,
        'files_status' => [],
    ];

    // 1. .env loading and Cloudinary vars
    $cloudName = env('CLOUDINARY_CLOUD_NAME');
    $apiKey = env('CLOUDINARY_API_KEY');
    $apiSecret = env('CLOUDINARY_API_SECRET');
    $r['env']['cloud_name'] = ['ok' => !empty($cloudName), 'value' => $cloudName ? substr($cloudName, 0, 4) . '***' : 'MISSING'];
    $r['env']['api_key'] = ['ok' => !empty($apiKey), 'value' => $apiKey ? substr($apiKey, 0, 6) . '***' : 'MISSING'];
    $r['env']['api_secret'] = ['ok' => !empty($apiSecret), 'value' => $apiSecret ? '***' . substr($apiSecret, -4) : 'MISSING'];
    $r['env']['all_cloudinary_set'] = $r['env']['cloud_name']['ok'] && $r['env']['api_key']['ok'] && $r['env']['api_secret']['ok'];

    // 2. PHP upload limits
    $r['php']['upload_max_filesize'] = ini_get('upload_max_filesize');
    $r['php']['post_max_size'] = ini_get('post_max_size');
    $r['php']['max_file_uploads'] = ini_get('max_file_uploads');
    $r['php']['file_uploads'] = ini_get('file_uploads');
    $r['php']['memory_limit'] = ini_get('memory_limit');

    // 3. Files received
    $r['files_status']['logo_key_exists'] = isset($_FILES['logo']);
    $r['files_status']['logo_error'] = $_FILES['logo']['error'] ?? null;
    $r['files_status']['logo_error_text'] = uploadErrorText($_FILES['logo']['error'] ?? UPLOAD_ERR_NO_FILE);
    $r['files_status']['logo_size'] = $_FILES['logo']['size'] ?? 0;
    $r['files_status']['logo_name'] = $_FILES['logo']['name'] ?? null;
    $r['files_status']['logo_tmp_exists'] = !empty($_FILES['logo']['tmp_name']) && is_uploaded_file($_FILES['logo']['tmp_name'] ?? '');
    $r['files_status']['post_empty'] = empty($_POST) && empty($_FILES);

    // 4. Cloudinary upload test (only on POST with valid file)
    if ($handlePost && !empty($_FILES['logo']) && $_FILES['logo']['error'] === UPLOAD_ERR_OK && !empty($_FILES['logo']['tmp_name'])) {
        $up = CloudinaryHelper::upload($_FILES['logo']['tmp_name']);
        if ($up) {
            $r['cloudinary_upload'] = ['ok' => true, 'url' => $up['url'] ?? null, 'public_id' => $up['public_id'] ?? null];
        } else {
            $r['cloudinary_upload'] = ['ok' => false, 'message' => 'CloudinaryHelper::upload() returned null'];
        }
    } elseif ($handlePost) {
        $r['cloudinary_upload'] = ['ok' => false, 'message' => 'No valid file received. Error: ' . ($r['files_status']['logo_error_text'] ?? 'unknown')];
    }

    return $r;
}

function uploadErrorText(int $code): string {
    $map = [
        UPLOAD_ERR_OK => 'No error',
        UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize',
        UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE in form',
        UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
        UPLOAD_ERR_NO_FILE => 'No file was uploaded',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
        UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the upload',
    ];
    return $map[$code] ?? 'Unknown error (' . $code . ')';
}

function renderTestUploadHtml(array $r): string {
    $base = rtrim(env('SITE_URL', 'https://bizbranches.pk'), '/');
    $url = $base . '/api/test-upload';
    $row = fn($label, $ok, $value) => '<tr><td>' . htmlspecialchars($label) . '</td><td class="' . ($ok ? 'ok' : 'fail') . '">' . ($ok ? '✓ OK' : '✗ FAIL') . '</td><td>' . htmlspecialchars($value ?? '') . '</td></tr>';
    $uploadResult = '';
    if ($r['cloudinary_upload'] !== null) {
        $u = $r['cloudinary_upload'];
        if ($u['ok']) {
            $uploadResult = '<div class="result ok"><strong>Cloudinary upload: SUCCESS</strong><br>URL: <a href="' . htmlspecialchars($u['url']) . '" target="_blank" rel="noopener">' . htmlspecialchars($u['url']) . '</a><br>Public ID: ' . htmlspecialchars($u['public_id']) . '</div>';
        } else {
            $uploadResult = '<div class="result fail"><strong>Cloudinary upload: FAILED</strong><br>' . htmlspecialchars($u['message']) . '</div>';
        }
    }
    return '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BizBranches Upload Diagnostics</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;max-width:800px;margin:40px auto;padding:20px;background:#f5f5f5;}
h1{color:#1a1a1a;border-bottom:2px solid #2563eb;padding-bottom:8px;}
h2{color:#374151;margin-top:28px;font-size:1.1em;}
table{width:100%;border-collapse:collapse;background:white;box-shadow:0 1px 3px rgba(0,0,0,.1);}
th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #e5e7eb;}
th{background:#f9fafb;font-weight:600;}
.ok{color:#059669;}
.fail{color:#dc2626;}
.result{max-width:100%;padding:14px;margin:16px 0;border-radius:8px;word-break:break-all;}
.result.ok{background:#d1fae5;color:#065f46;}
.result.fail{background:#fee2e2;color:#991b1b;}
form{background:white;padding:20px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.1);margin:20px 0;}
input[type=file]{margin:10px 0;}
button{background:#2563eb;color:white;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-size:1em;}
button:hover{background:#1d4ed8;}
p.note{color:#6b7280;font-size:0.9em;margin-top:20px;}
a{color:#2563eb;}
</style>
</head>
<body>
<h1>BizBranches – Upload Diagnostics</h1>
<p>Use this page to diagnose why business logos are not saving to Cloudinary.</p>

<h2>1. Environment (Cloudinary)</h2>
<table>
<thead><tr><th>Check</th><th>Status</th><th>Value</th></tr></thead>
<tbody>
' . $row('CLOUDINARY_CLOUD_NAME', $r['env']['cloud_name']['ok'], $r['env']['cloud_name']['value']) . '
' . $row('CLOUDINARY_API_KEY', $r['env']['api_key']['ok'], $r['env']['api_key']['value']) . '
' . $row('CLOUDINARY_API_SECRET', $r['env']['api_secret']['ok'], $r['env']['api_secret']['value']) . '
' . $row('All Cloudinary vars set', $r['env']['all_cloudinary_set'], $r['env']['all_cloudinary_set'] ? 'Yes' : 'No') . '
</tbody>
</table>

<h2>2. PHP Upload Limits</h2>
<table>
<thead><tr><th>Setting</th><th>Status</th><th>Value</th></tr></thead>
<tbody>
' . $row('upload_max_filesize', true, $r['php']['upload_max_filesize']) . '
' . $row('post_max_size', true, $r['php']['post_max_size']) . '
' . $row('max_file_uploads', true, $r['php']['max_file_uploads']) . '
' . $row('file_uploads enabled', (bool)ini_get('file_uploads'), ini_get('file_uploads') ? 'Yes' : 'No') . '
' . $row('memory_limit', true, $r['php']['memory_limit']) . '
</tbody>
</table>

<h2>3. File Upload Status (this request)</h2>
<table>
<thead><tr><th>Check</th><th>Status</th><th>Value</th></tr></thead>
<tbody>
' . $row('$_FILES["logo"] exists', $r['files_status']['logo_key_exists'], $r['files_status']['logo_key_exists'] ? 'Yes' : 'No') . '
' . $row('Upload error code', $r['files_status']['logo_error'] === UPLOAD_ERR_OK, ($r['files_status']['logo_error'] ?? 'N/A') . ' – ' . $r['files_status']['logo_error_text']) . '
' . $row('File size (bytes)', $r['files_status']['logo_size'] > 0, (string)$r['files_status']['logo_size']) . '
' . $row('File name', true, (string)($r['files_status']['logo_name'] ?? '–')) . '
' . $row('Temp file exists', $r['files_status']['logo_tmp_exists'], $r['files_status']['logo_tmp_exists'] ? 'Yes' : 'No') . '
</tbody>
</table>

' . ($uploadResult ? '<h2>4. Cloudinary Upload Test Result</h2>' . $uploadResult : '') . '

<h2>4. Test Cloudinary Upload</h2>
<form method="post" action="' . htmlspecialchars($url) . '" enctype="multipart/form-data">
<label for="logo">Choose a small image (PNG, JPG, WebP):</label><br>
<input type="file" id="logo" name="logo" accept="image/png,image/jpeg,image/webp" required><br><br>
<button type="submit">Upload to Cloudinary</button>
</form>

<p class="note"><strong>Remove this route after fixing</strong> – for security, delete or protect /api/test-upload when done.</p>
</body>
</html>';
}
