<?php
// Descarga la tabla IP → país (geo-whois-asn-country, dominio público / PDDL, del proyecto
// sapics/ip-location-db, servida por jsDelivr) y la carga en la tabla `geo` de la BD de visitas.
// Se ejecuta por CLI en el servidor, como el usuario del servidor web, y una vez al mes por cron:
//   GLOSA_DATA_DIR=<carpeta de datos> php tools/geo-import.php
// Sustituye la tabla entera en una transacción: si la descarga falla, la tabla vieja se queda.

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require_once dirname(__DIR__) . '/visitas-lib.php';

$sources = array(
    4 => 'https://cdn.jsdelivr.net/npm/@ip-location-db/geo-whois-asn-country/geo-whois-asn-country-ipv4.csv',
    6 => 'https://cdn.jsdelivr.net/npm/@ip-location-db/geo-whois-asn-country/geo-whois-asn-country-ipv6.csv',
);

$db = visitas_db();
if (!$db) {
    fwrite(STDERR, "No se pudo abrir la BD de visitas\n");
    exit(1);
}

$rows = array();
foreach ($sources as $fam => $url) {
    $csv = @file_get_contents($url);
    if ($csv === false || strlen($csv) < 1000) {
        fwrite(STDERR, "Descarga fallida: {$url}\n");
        exit(1);
    }
    $n = 0;
    foreach (explode("\n", $csv) as $line) {
        $line = trim($line);
        if ($line === '') {
            continue;
        }
        $p = explode(',', $line);
        if (count($p) < 3) {
            continue;
        }
        $a = visitas_ip_hex($p[0]);
        $b = visitas_ip_hex($p[1]);
        if (!$a || !$b || $a[0] !== $fam) {
            continue;
        }
        $rows[] = array($fam, $a[1], $b[1], strtoupper(trim($p[2])));
        $n++;
    }
    fwrite(STDERR, "IPv{$fam}: {$n} rangos\n");
}

$db->exec('BEGIN');
$db->exec('DELETE FROM geo');
$st = $db->prepare('INSERT INTO geo (fam, ip_from, ip_to, pais) VALUES (?, ?, ?, ?)');
foreach ($rows as $r) {
    $st->bindValue(1, $r[0], SQLITE3_INTEGER);
    $st->bindValue(2, $r[1], SQLITE3_TEXT);
    $st->bindValue(3, $r[2], SQLITE3_TEXT);
    $st->bindValue(4, $r[3], SQLITE3_TEXT);
    $st->execute();
    $st->reset();
}
$db->exec('COMMIT');
$db->exec('VACUUM');
fwrite(STDERR, 'Tabla geo: ' . count($rows) . " rangos cargados\n");

// Comprobación rápida
foreach (array('8.8.8.8' => 'US', '2.136.0.1' => 'ES', '2a00:1450:4001::1' => '') as $ip => $esperado) {
    fwrite(STDERR, "  {$ip} → " . visitas_pais($db, $ip) . "\n");
}
$db->close();
