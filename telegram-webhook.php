<?php
// Webhook del bot de Telegram @GlosaEBookReaderBot: informes del log de visitas de Glosa.
// Comandos: /stats (o "visitas"), /hoy, /semana, /mes, /paises [días], /ayuda, /id.
// Seguridad: secret token de Telegram en cabecera (X-Telegram-Bot-Api-Secret-Token) + allowlist
// de IDs de chat (TELEGRAM_ALLOWED_IDS, separados por comas). Todo vive en glosa.env (carpeta de datos).
// Alta del webhook (una vez, desde el servidor):
//   curl -s "https://api.telegram.org/bot$TOKEN/setWebhook" -d url=https://<dominio>/telegram-webhook.php -d secret_token=$SECRET
require_once __DIR__ . '/visitas-lib.php';

date_default_timezone_set('Europe/Madrid');

$secret = visitas_env('TELEGRAM_WEBHOOK_SECRET');
$header = isset($_SERVER['HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN']) ? $_SERVER['HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN'] : '';
if (!$secret || !hash_equals($secret, $header)) {
    http_response_code(403);
    die('forbidden');
}

function tg_api($method, $params)
{
    $token = visitas_env('TELEGRAM_BOT_TOKEN');
    if (!$token) {
        return null;
    }
    $ch = curl_init('https://api.telegram.org/bot' . $token . '/' . $method);
    curl_setopt_array($ch, array(
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($params, JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER     => array('Content-Type: application/json'),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 20,
    ));
    $res = curl_exec($ch);
    curl_close($ch);
    return json_decode((string) $res, true);
}

function tg_send($chatId, $text, $keyboard = null)
{
    $p = array('chat_id' => $chatId, 'text' => $text, 'disable_web_page_preview' => true);
    if ($keyboard !== null) {
        $p['reply_markup'] = $keyboard;
    }
    return tg_api('sendMessage', $p);
}

function tg_menu_keyboard()
{
    return array(
        'keyboard' => array(
            array(array('text' => '/stats'), array('text' => '/hoy')),
            array(array('text' => '/semana'), array('text' => '/mes')),
            array(array('text' => '/paises 7'), array('text' => '/paises 90')),
        ),
        'resize_keyboard' => true,
        'is_persistent' => true,
    );
}

function tg_allowed($chatId)
{
    $ids = array_filter(array_map('trim', explode(',', visitas_env('TELEGRAM_ALLOWED_IDS'))));
    return in_array((string) $chatId, $ids, true);
}

// Resumen corto de un solo día (hoy o ayer) con sus países.
function tg_dia_text($dia, $titulo)
{
    $db = visitas_db();
    if (!$db) {
        return "\u{26A0} Sin base de datos de visitas.";
    }
    $st = $db->prepare('SELECT COUNT(*) c, COUNT(DISTINCT visitante) u FROM visitas WHERE dia = :d');
    $st->bindValue(':d', $dia, SQLITE3_TEXT);
    $r = $st->execute()->fetchArray(SQLITE3_ASSOC);
    $lines = array("\u{1F4D6} Glosa · {$titulo} ({$dia})", "{$r['c']} visitas · {$r['u']} visitantes");
    $st = $db->prepare('SELECT pais k, COUNT(*) c FROM visitas WHERE dia = :d GROUP BY pais ORDER BY c DESC LIMIT 10');
    $st->bindValue(':d', $dia, SQLITE3_TEXT);
    $res = $st->execute();
    $paises = array();
    while ($row = $res->fetchArray(SQLITE3_ASSOC)) {
        $paises[] = visitas_bandera((string) $row['k']) . ' ' . visitas_nombre_pais((string) $row['k']) . ' ' . $row['c'];
    }
    if ($paises) {
        $lines[] = implode(' · ', $paises);
    }
    $db->close();
    return implode("\n", $lines);
}

// ---------- Update ----------

$update = json_decode(file_get_contents('php://input'), true);
if (!is_array($update) || !isset($update['message'])) {
    http_response_code(200);
    exit;
}
$chatId = $update['message']['chat']['id'];
$text = isset($update['message']['text']) ? trim((string) $update['message']['text']) : '';
$lower = mb_strtolower($text, 'UTF-8');
$lower = preg_replace('/@\w+$/', '', $lower); // "/stats@GlosaEBookReaderBot" en grupos

if (!tg_allowed($chatId)) {
    // Sin allowlist no se sirve nada; el ID se enseña para que el admin lo añada al .env
    // (y se apunta en la carpeta de datos para poder leerlo desde el servidor sin copiarlo a mano).
    $quien = isset($update['message']['from']['username']) ? '@' . $update['message']['from']['username'] : '';
    @file_put_contents(VISITAS_DATA_DIR . '/glosa-telegram-unknown.log', date('c') . " chat_id={$chatId} {$quien}
", FILE_APPEND | LOCK_EX);
    tg_send($chatId, "\u{1F512} Este bot solo responde a sus administradores.\nTu ID de chat es: {$chatId}\n(añádelo a TELEGRAM_ALLOWED_IDS en el .env de Glosa)");
    http_response_code(200);
    exit;
}

if ($lower === '/id') {
    tg_send($chatId, "Tu ID de chat es: {$chatId}");
} elseif (in_array($lower, array('/start', '/ayuda', 'ayuda', 'help', '/help', 'menu', 'menú'), true)) {
    tg_send($chatId, "\u{1F4D6} Bot de visitas de Glosa\n\n"
        . "/stats — resumen: hoy, ayer, 7 y 30 días, países, idiomas y procedencia\n"
        . "/hoy — visitas de hoy por país\n"
        . "/ayer — visitas de ayer por país\n"
        . "/semana — países de los últimos 7 días\n"
        . "/mes — países de los últimos 30 días\n"
        . "/paises N — países de los últimos N días\n"
        . "/id — tu ID de chat\n\n"
        . "Cada mañana a las 9:00 llega solo el resumen del día anterior.", tg_menu_keyboard());
} elseif (in_array($lower, array('/stats', 'stats', 'visitas', '/visitas', 'estadisticas', 'estadísticas'), true)) {
    tg_send($chatId, visitas_informe(30), tg_menu_keyboard());
} elseif ($lower === '/hoy' || $lower === 'hoy') {
    tg_send($chatId, tg_dia_text(date('Y-m-d'), 'hoy'), tg_menu_keyboard());
} elseif ($lower === '/ayer' || $lower === 'ayer') {
    tg_send($chatId, tg_dia_text(date('Y-m-d', strtotime('-1 day')), 'ayer'), tg_menu_keyboard());
} elseif ($lower === '/semana' || $lower === 'semana') {
    tg_send($chatId, visitas_informe(7), tg_menu_keyboard());
} elseif ($lower === '/mes' || $lower === 'mes') {
    tg_send($chatId, visitas_informe(30), tg_menu_keyboard());
} elseif (preg_match('/^\/?pa[ií]ses(?:\s+(\d{1,3}))?$/u', $lower, $m)) {
    $dias = isset($m[1]) ? max(1, min(365, (int) $m[1])) : 30;
    tg_send($chatId, visitas_informe($dias), tg_menu_keyboard());
} elseif ($text !== '') {
    tg_send($chatId, "No te he entendido. Escribe /ayuda para ver los comandos.", tg_menu_keyboard());
}

http_response_code(200);
