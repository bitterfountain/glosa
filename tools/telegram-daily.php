<?php
// Informe diario por Telegram: cada mañana envía a los administradores (TELEGRAM_ALLOWED_IDS)
// las visitas de ayer por país y el resumen de 7 y 30 días. Lo lanza cron en el servidor:
//   0 9 * * * GLOSA_DATA_DIR=<carpeta de datos> php tools/telegram-daily.php
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require_once dirname(__DIR__) . '/visitas-lib.php';
date_default_timezone_set('Europe/Madrid');

$token = visitas_env('TELEGRAM_BOT_TOKEN');
$ids = array_filter(array_map('trim', explode(',', visitas_env('TELEGRAM_ALLOWED_IDS'))));
if (!$token || !$ids) {
    fwrite(STDERR, "Falta TELEGRAM_BOT_TOKEN o TELEGRAM_ALLOWED_IDS en el .env\n");
    exit(1);
}

$ayer = date('Y-m-d', strtotime('-1 day'));
$db = visitas_db();
$lines = array("\u{2600} Buenos días. Glosa ayer ({$ayer}):");
if ($db) {
    $st = $db->prepare('SELECT COUNT(*) c, COUNT(DISTINCT visitante) u FROM visitas WHERE dia = :d');
    $st->bindValue(':d', $ayer, SQLITE3_TEXT);
    $r = $st->execute()->fetchArray(SQLITE3_ASSOC);
    $lines[] = "{$r['c']} visitas · {$r['u']} visitantes";
    $st = $db->prepare('SELECT pais k, COUNT(*) c FROM visitas WHERE dia = :d GROUP BY pais ORDER BY c DESC LIMIT 10');
    $st->bindValue(':d', $ayer, SQLITE3_TEXT);
    $res = $st->execute();
    $paises = array();
    while ($row = $res->fetchArray(SQLITE3_ASSOC)) {
        $paises[] = visitas_bandera((string) $row['k']) . ' ' . visitas_nombre_pais((string) $row['k']) . ' ' . $row['c'];
    }
    if ($paises) {
        $lines[] = implode(' · ', $paises);
    }
    $db->close();
}
$texto = implode("\n", $lines) . "\n\n" . visitas_informe(30);

foreach ($ids as $chatId) {
    $ch = curl_init('https://api.telegram.org/bot' . $token . '/sendMessage');
    curl_setopt_array($ch, array(
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode(array('chat_id' => $chatId, 'text' => $texto, 'disable_web_page_preview' => true), JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER     => array('Content-Type: application/json'),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 20,
    ));
    curl_exec($ch);
    curl_close($ch);
}
