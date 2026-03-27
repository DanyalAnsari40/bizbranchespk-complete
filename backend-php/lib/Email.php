<?php

use PHPMailer\PHPMailer\PHPMailer;

class Email {
    private static function send(string $to, string $subject, string $html, string $text, string $contextName = ''): void {
        $to = trim($to);
        if ($to === '') return;

        $host = env('SMTP_HOST');
        $user = env('SMTP_USER');
        $pass = env('SMTP_PASS');
        if (!$host || !$user || !$pass) {
            Logger::error('Email not sent: SMTP not configured');
            return;
        }

        $port = (int)env('SMTP_PORT', 465);
        $fromName = env('EMAIL_FROM_NAME', 'BizBranches Support');
        $fromEmail = env('EMAIL_FROM', $user);
        $replyTo = env('EMAIL_REPLY_TO', $fromEmail);

        try {
            $mail = new PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = $host;
            $mail->SMTPAuth = true;
            $mail->Username = $user;
            $mail->Password = $pass;
            $mail->SMTPSecure = $port === 587 ? PHPMailer::ENCRYPTION_STARTTLS : PHPMailer::ENCRYPTION_SMTPS;
            $mail->Port = $port;
            $mail->setFrom($fromEmail, $fromName);
            $mail->addAddress($to);
            $mail->addReplyTo($replyTo);
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $html;
            $mail->AltBody = $text;
            $mail->CharSet = 'UTF-8';
            $mail->send();
            Logger::error('[Email] Sent successfully' . ($contextName ? ' for: ' . $contextName : ''));
        } catch (Exception $e) {
            Logger::error('[Email] Failed' . ($contextName ? ' for: ' . $contextName : '') . ' | ' . $e->getMessage());
        }
    }

    public static function sendSubmissionReceived(array $business): void {
        $email = trim($business['email'] ?? '');
        if (empty($email)) return;

        $supportEmail = env('SUPPORT_EMAIL', env('EMAIL_FROM', 'support@bizbranches.pk'));
        $slugRaw = trim((string)($business['slug'] ?? ''));
        $slugSafe = Sanitize::escapeHtml($slugRaw);

        $name = Sanitize::escapeHtml($business['name']);

        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>We received your listing</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 640px; margin: 0 auto; padding: 20px;">
  <h2 style="margin:0 0 12px; color:#0f766e;">We received your business listing</h2>
  <p>Hi,</p>
  <p>Thank you for submitting <strong>{$name}</strong> to BizBranches.</p>
  <p>Your listing has been received and is now under admin review and payment verification.</p>
  <p><strong>Estimated review time:</strong> up to 6 hours.</p>
  <p><strong>Reference slug:</strong> <code>{$slugSafe}</code></p>
  <p>We will email you again as soon as your listing is approved and live.</p>
  <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">Need help? Contact us at {$supportEmail}</p>
</body>
</html>
HTML;

        $text = "We received your business listing.\n\n" .
            "Business: {$business['name']}\n" .
            "Reference slug: {$slugRaw}\n" .
            "Status: Pending approval and payment verification (up to 6 hours).\n\n" .
            "We will email you again when your listing is live.";

        self::send($email, 'We received your business listing', $html, $text, $business['name'] ?? '');
    }

    public static function sendConfirmation(array $business): void {
        $email = trim($business['email'] ?? '');
        if (empty($email)) return;

        $siteUrl = rtrim(env('SITE_URL', env('NEXT_PUBLIC_SITE_URL', 'https://bizbranches.pk')), '/');
        $slugRaw = trim((string)($business['slug'] ?? ''));
        $listingUrl = $siteUrl . '/' . urlencode($slugRaw);
        $supportEmail = env('SUPPORT_EMAIL', env('EMAIL_FROM', 'support@bizbranches.pk'));

        $name = Sanitize::escapeHtml($business['name']);
        $slugSafe = Sanitize::escapeHtml($slugRaw);

        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Your listing is now live</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 640px; margin: 0 auto; padding: 20px;">
  <h2 style="margin:0 0 12px; color:#059669;">Your business listing is now live on BizBranches</h2>
  <p>Hi,</p>
  <p>Great news - your business listing <strong>{$name}</strong> has been approved and published.</p>
  <p><strong>Listing slug:</strong> <code>{$slugSafe}</code></p>
  <p style="margin: 18px 0;">
    <a href="{$listingUrl}" style="display:inline-block;background:#059669;color:#fff;padding:12px 22px;text-decoration:none;border-radius:8px;">View your listing</a>
  </p>
  <p>Thank you for listing with BizBranches.</p>
  <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">Need help? Contact us at {$supportEmail}</p>
</body>
</html>
HTML;

        $text = "Your business listing is now live on BizBranches.\n\n" .
            "Business: {$business['name']}\n" .
            "Listing slug: {$slugRaw}\n" .
            "View listing: {$listingUrl}\n\n" .
            "Thank you for listing with BizBranches.";

        self::send($email, 'Your business listing is now live on BizBranches', $html, $text, $business['name'] ?? '');
    }
}
