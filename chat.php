<?php
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

// ── Config ───────────────────────────────────────────────────
// 1. Get your free API key at: https://aistudio.google.com/app/apikey
// 2. Replace the placeholder below with your actual key
define('GEMINI_API_KEY', 'AIzaSyDuRK1TuoZnni_imVSBu1djOn6YKE1uU8Y');
define('GEMINI_MODEL',   'gemini-2.0-flash');
define('MAX_INPUT',      500);
define('RATE_LIMIT',     20);   // max messages per visitor per window
define('RATE_WINDOW',    600);  // window in seconds (10 minutes)

// ── Origin check — only accept requests from your own domain ─
$allowed = 'bookmorepro.com'; // ← change to your actual domain when live (e.g. bookmoreinfo.com)
$origin  = $_SERVER['HTTP_ORIGIN']  ?? '';
$referer = $_SERVER['HTTP_REFERER'] ?? '';
$host    = parse_url($origin ?: $referer, PHP_URL_HOST) ?? '';
// Strip www. for comparison
$host = preg_replace('/^www\./', '', strtolower($host));
if ($host !== strtolower($allowed) && $host !== 'localhost' && $host !== '127.0.0.1') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

// ── Session-based rate limiting ──────────────────────────────
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$now = time();
if (!isset($_SESSION['chat_count'], $_SESSION['chat_window_start'])) {
    $_SESSION['chat_count']        = 0;
    $_SESSION['chat_window_start'] = $now;
}
// Reset window if expired
if ($now - $_SESSION['chat_window_start'] > RATE_WINDOW) {
    $_SESSION['chat_count']        = 0;
    $_SESSION['chat_window_start'] = $now;
}
if ($_SESSION['chat_count'] >= RATE_LIMIT) {
    http_response_code(429);
    echo json_encode(['error' => 'Too many messages. Please wait a few minutes before continuing.']);
    exit;
}
$_SESSION['chat_count']++;

// ── Method check ─────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// ── Parse & validate input ───────────────────────────────────
$raw   = file_get_contents('php://input');
$input = json_decode($raw, true);

if (!$input || empty($input['message'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request']);
    exit;
}

$message = trim(strip_tags((string) $input['message']));
if ($message === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Empty message']);
    exit;
}
if (strlen($message) > MAX_INPUT) {
    $message = substr($message, 0, MAX_INPUT);
}

// ── Build conversation history (last 10 turns) ───────────────
$contents = [];
if (!empty($input['history']) && is_array($input['history'])) {
    foreach (array_slice($input['history'], -10) as $turn) {
        $role = $turn['role'] ?? '';
        $text = $turn['text'] ?? '';
        if (in_array($role, ['user', 'model'], true) && $text !== '') {
            $contents[] = [
                'role'  => $role,
                'parts' => [['text' => strip_tags((string) $text)]],
            ];
        }
    }
}
$contents[] = ['role' => 'user', 'parts' => [['text' => $message]]];

// ── System prompt ─────────────────────────────────────────────
$systemPrompt = <<<SYS
You are an AI assistant for BookMorePro, a premium booking and business growth service run by Farshad Darani, based in Vancouver, BC.

Your job:
- Help potential clients understand how BookMorePro works
- Answer questions about the service, process, and results
- Encourage qualified leads to book a free discovery call via the contact form

Key facts about BookMorePro:
- Helps coaches, consultants, and service-based businesses get more high-quality bookings
- Services: lead generation strategy, booking funnel optimisation, done-for-you outreach
- Typical results: clients see 20+ new qualified bookings per month within 90 days
- Process: Discovery call → Strategy → Execution → Scale
- Pricing: discussed on the discovery call (do not make up prices)

Guidelines:
- Be warm, confident, and concise — 2 to 3 sentences unless more detail is truly needed
- Never fabricate guarantees, numbers, or facts not listed above
- If someone asks something off-topic, politely redirect to BookMorePro
- To book a call or get started, direct them to scroll down to the contact form on the page
SYS;

// ── Call Gemini API ───────────────────────────────────────────
$payload = [
    'system_instruction' => ['parts' => [['text' => $systemPrompt]]],
    'contents'           => $contents,
    'generationConfig'   => [
        'maxOutputTokens' => 300,
        'temperature'     => 0.7,
    ],
];

$url = 'https://generativelanguage.googleapis.com/v1beta/models/'
     . GEMINI_MODEL . ':generateContent?key=' . GEMINI_API_KEY;

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($payload),
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_SSL_VERIFYPEER => true,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code(502);
    echo json_encode(['error' => 'AI service unavailable. Please try again.']);
    exit;
}

$data  = json_decode($response, true);
$reply = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;

if (!$reply) {
    http_response_code(502);
    echo json_encode(['error' => 'No response received. Please try again.']);
    exit;
}

echo json_encode(['reply' => trim($reply)]);
