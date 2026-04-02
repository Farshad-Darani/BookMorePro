<?php
/**
 * BookMorePro — Contact Form Handler
 * Sends notification to Farshad + auto-reply to sender via Hostinger SMTP
 */

header('Content-Type: application/json');

// ── Origin / referer check ────────────────────────────────────────────────
$allowed = ['https://bookmorepro.com', 'https://www.bookmorepro.com'];
$origin  = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
$ok      = false;
foreach ($allowed as $a) {
    if (str_starts_with($origin, $a)) { $ok = true; break; }
}
if (!$ok && !in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'])) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Forbidden']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

// ── Rate limiting — max 3 submissions per hour per visitor ───────────────
session_start();
$now = time();
if (!isset($_SESSION['contact_times'])) $_SESSION['contact_times'] = [];
$_SESSION['contact_times'] = array_filter(
    $_SESSION['contact_times'],
    fn($t) => $now - $t < 3600
);
if (count($_SESSION['contact_times']) >= 3) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => 'Too many submissions. Try again later.']);
    exit;
}

// ── Sanitize & validate inputs ───────────────────────────────────────────
$name    = trim(strip_tags($_POST['name']    ?? ''));
$email   = trim($_POST['email']              ?? '');
$service = trim(strip_tags($_POST['service'] ?? ''));
$message = trim(strip_tags($_POST['message'] ?? ''));
$gotcha  = $_POST['_gotcha']                 ?? '';

if ($gotcha) {
    // Honeypot triggered — silently succeed so bots think it worked
    echo json_encode(['ok' => true]);
    exit;
}

if (!$name || !$email || !$message) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing required fields.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid email address.']);
    exit;
}

// ── PHPMailer ─────────────────────────────────────────────────────────────
require __DIR__ . '/vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// SMTP credentials
define('SMTP_HOST', 'smtp.hostinger.com');
define('SMTP_PORT', 465);
define('SMTP_USER', 'info@bookmorepro.com');
define('SMTP_PASS', 'B1bmp1234?');

$serviceLabel = $service ?: 'Not specified';
$firstName    = explode(' ', $name)[0];

function buildMailer(): PHPMailer {
    $m = new PHPMailer(true);
    $m->isSMTP();
    $m->Host       = SMTP_HOST;
    $m->SMTPAuth   = true;
    $m->Username   = SMTP_USER;
    $m->Password   = SMTP_PASS;
    $m->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $m->Port       = SMTP_PORT;
    $m->CharSet    = 'UTF-8';
    return $m;
}

try {
    // ── 1. Notification email to Farshad ─────────────────────────────────
    $notify = buildMailer();
    $notify->setFrom(SMTP_USER, 'BookMorePro Website');
    $notify->addAddress(SMTP_USER, 'Farshad Darani');
    $notify->addReplyTo($email, $name);
    $notify->Subject = "New Inquiry from {$name} — BookMorePro";
    $notify->isHTML(true);
    $notify->Body = "
    <div style='font-family:sans-serif;max-width:600px;margin:0 auto;background:#0F1520;color:#E8EAF6;padding:32px;border-radius:12px;'>
        <h2 style='color:#F5A623;margin:0 0 24px;font-size:20px;'>New Contact Form Submission</h2>
        <table style='width:100%;border-collapse:collapse;margin-bottom:24px;'>
            <tr>
                <td style='padding:10px 0;color:#8892A4;width:110px;vertical-align:top;'>Name</td>
                <td style='padding:10px 0;'><strong>" . htmlspecialchars($name) . "</strong></td>
            </tr>
            <tr>
                <td style='padding:10px 0;color:#8892A4;vertical-align:top;'>Email</td>
                <td style='padding:10px 0;'><a href='mailto:" . htmlspecialchars($email) . "' style='color:#00C2FF;text-decoration:none;'>" . htmlspecialchars($email) . "</a></td>
            </tr>
            <tr>
                <td style='padding:10px 0;color:#8892A4;vertical-align:top;'>Service</td>
                <td style='padding:10px 0;'>" . htmlspecialchars($serviceLabel) . "</td>
            </tr>
        </table>
        <hr style='border:none;border-top:1px solid #1E293B;margin:0 0 20px;'>
        <p style='color:#8892A4;margin:0 0 10px;font-size:13px;text-transform:uppercase;letter-spacing:1px;'>Message</p>
        <p style='margin:0;line-height:1.75;color:#E8EAF6;'>" . nl2br(htmlspecialchars($message)) . "</p>
    </div>";

    $notify->AltBody =
        "New inquiry from: {$name}\n" .
        "Email: {$email}\n" .
        "Service: {$serviceLabel}\n\n" .
        $message;

    $notify->send();

    // ── 2. Auto-reply to the sender ───────────────────────────────────────
    $reply = buildMailer();
    $reply->setFrom(SMTP_USER, 'Farshad Darani — BookMorePro');
    $reply->addAddress($email, $name);
    $reply->Subject = "Got your message, {$firstName} — I'll be in touch soon";
    $reply->isHTML(true);
    $reply->Body = "
    <div style='font-family:sans-serif;max-width:600px;margin:0 auto;background:#0F1520;color:#E8EAF6;padding:40px 32px;border-radius:12px;'>
        <div style='margin-bottom:28px;'>
            <span style='font-size:22px;font-weight:700;color:#F0F4FF;'>Book</span><span style='font-size:22px;font-weight:700;color:#0A5A72;'>More</span><span style='font-size:22px;font-weight:700;color:#F0F4FF;'>Pro</span>
        </div>
        <h2 style='margin:0 0 16px;font-size:22px;color:#F0F4FF;'>Thanks for reaching out, {$firstName}!</h2>
        <p style='color:#8892A4;line-height:1.75;margin:0 0 16px;'>
            I've received your message and will get back to you within <strong style='color:#F0F4FF;'>24 hours</strong>.
        </p>
        <p style='color:#8892A4;line-height:1.75;margin:0 0 32px;'>
            In the meantime, feel free to explore my work at
            <a href='https://bookmorepro.com' style='color:#00C2FF;text-decoration:none;'>bookmorepro.com</a>.
        </p>
        <hr style='border:none;border-top:1px solid #1E293B;margin:0 0 24px;'>
        <p style='color:#4B5563;font-size:13px;margin:0;line-height:1.6;'>
            — Farshad Darani &middot;
            <a href='https://bookmorepro.com' style='color:#4B5563;text-decoration:none;'>BookMorePro.com</a>
            &middot; Vancouver, BC
        </p>
    </div>";

    $reply->AltBody =
        "Hi {$firstName},\n\n" .
        "Thanks for reaching out! I've received your message and will get back to you within 24 hours.\n\n" .
        "In the meantime, feel free to explore my work at https://bookmorepro.com\n\n" .
        "— Farshad Darani\n" .
        "BookMorePro.com · Vancouver, BC";

    $reply->send();

    // Record this submission
    $_SESSION['contact_times'][] = $now;

    echo json_encode(['ok' => true]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Could not send email. Please try again.']);
}
