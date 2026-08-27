<?php
// Log de visitas propio de Glosa: mismo esquema que el de la web corporativa (anónimo, sin cookies,
// la IP nunca se guarda) más el PAÍS del visitante, resuelto contra una tabla local de rangos IP
// (geo-whois-asn-country, dominio público; la importa tools/geo-import.php). La usan index.php
// (registro), telegram-webhook.php y tools/telegram-daily.php (informes).
// La BD SQLite y el .env viven FUERA del webroot, en la carpeta GLOSA_DATA_DIR (variable de
// entorno: fastcgi_param en nginx y en la línea del cron). Sin ella, ../glosa-data.

if (!defined('VISITAS_DATA_DIR')) {
    define('VISITAS_DATA_DIR', getenv('GLOSA_DATA_DIR') ?: dirname(__DIR__) . '/glosa-data');
}
define('VISITAS_DB', VISITAS_DATA_DIR . '/glosa-visitas.sqlite');
define('VISITAS_SALT_FILE', VISITAS_DATA_DIR . '/glosa-visitas-salt.txt');
define('VISITAS_ENV_FILE', VISITAS_DATA_DIR . '/glosa.env');
define('VISITAS_RETENTION_DAYS', 400);

// Variables del .env: primero el de la carpeta de datos (glosa.env), después el local (.env
// junto a este fichero, ignorado por git). Formato KEY=valor, una por línea.
function visitas_env($key, $default = '')
{
    static $vars = null;
    if ($vars === null) {
        $vars = array();
        foreach (array(VISITAS_ENV_FILE, __DIR__ . '/.env') as $file) {
            if (!is_file($file)) {
                continue;
            }
            $parsed = @parse_ini_file($file, false, INI_SCANNER_RAW);
            if (is_array($parsed)) {
                $vars += $parsed;
            }
        }
    }
    return isset($vars[$key]) && $vars[$key] !== '' ? trim((string) $vars[$key]) : $default;
}

// Abre (y crea si hace falta) la BD. Devuelve SQLite3 o null si algo falla:
// la analítica jamás debe tumbar la página ni el webhook.
function visitas_db()
{
    if (!class_exists('SQLite3')) {
        return null;
    }
    try {
        $db = new SQLite3(VISITAS_DB);
        $db->busyTimeout(3000);
        $db->exec('PRAGMA journal_mode = WAL');
        $db->exec('CREATE TABLE IF NOT EXISTS visitas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts INTEGER NOT NULL,
            dia TEXT NOT NULL,
            path TEXT NOT NULL,
            pais TEXT NOT NULL DEFAULT "",
            lang TEXT NOT NULL DEFAULT "",
            ref TEXT NOT NULL DEFAULT "",
            visitante TEXT NOT NULL,
            ua TEXT NOT NULL DEFAULT ""
        )');
        $db->exec('CREATE INDEX IF NOT EXISTS idx_visitas_dia ON visitas(dia)');
        $db->exec('CREATE INDEX IF NOT EXISTS idx_visitas_pais ON visitas(pais)');
        // Rangos IP → país. Las IPs se guardan en hexadecimal de ancho fijo (8 para IPv4, 32 para
        // IPv6) para poder compararlas como texto; `fam` separa las dos familias.
        $db->exec('CREATE TABLE IF NOT EXISTS geo (
            fam INTEGER NOT NULL,
            ip_from TEXT NOT NULL,
            ip_to TEXT NOT NULL,
            pais TEXT NOT NULL
        )');
        $db->exec('CREATE INDEX IF NOT EXISTS idx_geo_from ON geo(fam, ip_from)');
        return $db;
    } catch (Exception $e) {
        return null;
    }
}

// Salt persistente para anonimizar visitantes (hash de IP+UA+día, la IP nunca se guarda).
function visitas_salt()
{
    if (is_file(VISITAS_SALT_FILE)) {
        return trim((string) file_get_contents(VISITAS_SALT_FILE));
    }
    $salt = bin2hex(random_bytes(32));
    @file_put_contents(VISITAS_SALT_FILE, $salt, LOCK_EX);
    @chmod(VISITAS_SALT_FILE, 0600);
    return $salt;
}

// UAs que no queremos contar
function visitas_es_bot($ua)
{
    return $ua === ''
        || preg_match('/bot|crawl|spider|slurp|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|scrapy|facebookexternalhit|whatsapp|telegrambot/i', $ua);
}

// IP → hexadecimal de ancho fijo (8 o 32 caracteres) y familia (4 o 6). null si no es una IP.
function visitas_ip_hex($ip)
{
    $bin = @inet_pton($ip);
    if ($bin === false) {
        return null;
    }
    return array(strlen($bin) === 4 ? 4 : 6, bin2hex($bin));
}

function visitas_ip_privada($ip)
{
    return filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false;
}

// Código ISO-3166 alpha-2 del país de la IP, o "" si no se sabe (tabla vacía, IP privada...).
function visitas_pais($db, $ip)
{
    if (!$db || $ip === '' || visitas_ip_privada($ip)) {
        return '';
    }
    $hex = visitas_ip_hex($ip);
    if (!$hex) {
        return '';
    }
    try {
        $st = $db->prepare('SELECT ip_to, pais FROM geo WHERE fam = :fam AND ip_from <= :ip ORDER BY ip_from DESC LIMIT 1');
        $st->bindValue(':fam', $hex[0], SQLITE3_INTEGER);
        $st->bindValue(':ip', $hex[1], SQLITE3_TEXT);
        $row = $st->execute()->fetchArray(SQLITE3_ASSOC);
        if ($row && strcmp($row['ip_to'], $hex[1]) >= 0) {
            return strtoupper((string) $row['pais']);
        }
    } catch (Exception $e) {
        // sin país
    }
    return '';
}

// Registra una visita a $path (la home es "/"). No hace nada con bots ni si la BD no está.
function visitas_registrar($path)
{
    date_default_timezone_set('Europe/Madrid');
    $ua = isset($_SERVER['HTTP_USER_AGENT']) ? substr((string) $_SERVER['HTTP_USER_AGENT'], 0, 200) : '';
    if (visitas_es_bot($ua)) {
        return;
    }
    $path = substr((string) $path, 0, 200);
    if ($path === '' || $path[0] !== '/') {
        $path = '/';
    }

    // Del referrer solo el host, y solo si es externo
    $ref = '';
    if (!empty($_SERVER['HTTP_REFERER'])) {
        $host = parse_url(substr((string) $_SERVER['HTTP_REFERER'], 0, 300), PHP_URL_HOST);
        $own = isset($_SERVER['HTTP_HOST']) ? strtolower((string) $_SERVER['HTTP_HOST']) : '';
        if ($host && strtolower($host) !== $own) {
            $ref = strtolower($host);
        }
    }
    // Idioma preferido del navegador (dos letras): dice en qué idioma leen los visitantes
    $lang = '';
    if (!empty($_SERVER['HTTP_ACCEPT_LANGUAGE']) && preg_match('/^\s*([a-z]{2})/i', (string) $_SERVER['HTTP_ACCEPT_LANGUAGE'], $m)) {
        $lang = strtolower($m[1]);
    }

    $ip = isset($_SERVER['REMOTE_ADDR']) ? (string) $_SERVER['REMOTE_ADDR'] : '';
    $dia = date('Y-m-d');
    $visitante = substr(hash('sha256', visitas_salt() . '|' . $dia . '|' . $ip . '|' . $ua), 0, 16);

    $db = visitas_db();
    if (!$db) {
        return;
    }
    $pais = visitas_pais($db, $ip);
    $st = $db->prepare('INSERT INTO visitas (ts, dia, path, pais, lang, ref, visitante, ua) VALUES (:ts, :dia, :path, :pais, :lang, :ref, :v, :ua)');
    $st->bindValue(':ts', time(), SQLITE3_INTEGER);
    $st->bindValue(':dia', $dia, SQLITE3_TEXT);
    $st->bindValue(':path', $path, SQLITE3_TEXT);
    $st->bindValue(':pais', $pais, SQLITE3_TEXT);
    $st->bindValue(':lang', $lang, SQLITE3_TEXT);
    $st->bindValue(':ref', $ref, SQLITE3_TEXT);
    $st->bindValue(':v', $visitante, SQLITE3_TEXT);
    $st->bindValue(':ua', $ua, SQLITE3_TEXT);
    $st->execute();

    // Purga oportunista de datos antiguos (~1 de cada 200 visitas)
    if (mt_rand(1, 200) === 1) {
        $limite = date('Y-m-d', time() - VISITAS_RETENTION_DAYS * 86400);
        $db->exec("DELETE FROM visitas WHERE dia < '" . $limite . "'");
    }
    $db->close();
}

// ---------------------------------------------------------------- informes (Telegram y cron)

// Bandera emoji a partir del código de país ("ES" → 🇪🇸). "??" si no hay país.
function visitas_bandera($cc)
{
    if (!preg_match('/^[A-Z]{2}$/', $cc)) {
        return "\u{1F3F3}";
    }
    $out = '';
    for ($i = 0; $i < 2; $i++) {
        $out .= mb_chr(0x1F1E6 + ord($cc[$i]) - ord('A'), 'UTF-8');
    }
    return $out;
}

function visitas_nombre_pais($cc)
{
    static $nombres = array(
        'ES' => 'España', 'MX' => 'México', 'AR' => 'Argentina', 'CO' => 'Colombia', 'CL' => 'Chile', 'PE' => 'Perú',
        'VE' => 'Venezuela', 'EC' => 'Ecuador', 'UY' => 'Uruguay', 'CU' => 'Cuba', 'DO' => 'R. Dominicana', 'GT' => 'Guatemala',
        'US' => 'EE. UU.', 'GB' => 'Reino Unido', 'IE' => 'Irlanda', 'CA' => 'Canadá', 'AU' => 'Australia',
        'DE' => 'Alemania', 'AT' => 'Austria', 'CH' => 'Suiza', 'IT' => 'Italia', 'FR' => 'Francia', 'PT' => 'Portugal',
        'BR' => 'Brasil', 'NL' => 'Países Bajos', 'BE' => 'Bélgica', 'PL' => 'Polonia', 'SE' => 'Suecia', 'NO' => 'Noruega',
        'DK' => 'Dinamarca', 'FI' => 'Finlandia', 'RU' => 'Rusia', 'UA' => 'Ucrania', 'TR' => 'Turquía', 'IN' => 'India',
        'CN' => 'China', 'JP' => 'Japón', 'KR' => 'Corea del Sur', 'MA' => 'Marruecos', 'PH' => 'Filipinas', 'RO' => 'Rumanía',
        'CZ' => 'Chequia', 'GR' => 'Grecia', 'HU' => 'Hungría', 'IL' => 'Israel', 'ID' => 'Indonesia', 'NG' => 'Nigeria',
        'ZA' => 'Sudáfrica', 'EG' => 'Egipto', 'SG' => 'Singapur', 'HK' => 'Hong Kong', 'TW' => 'Taiwán', 'NZ' => 'N. Zelanda',
    );
    if ($cc === '') {
        return 'desconocido';
    }
    return isset($nombres[$cc]) ? $nombres[$cc] : $cc;
}

// Texto del informe de visitas: hoy, ayer, 7 y 30 días, países, idiomas y procedencia.
function visitas_informe($diasPaises = 30)
{
    $db = visitas_db();
    if (!$db) {
        return "\u{26A0} No he podido abrir la base de datos de visitas (¿falta php-sqlite3 o la carpeta de datos?).";
    }
    date_default_timezone_set('Europe/Madrid');

    $rango = function ($desde, $hasta) use ($db) {
        $st = $db->prepare('SELECT COUNT(*) c, COUNT(DISTINCT visitante) u FROM visitas WHERE dia BETWEEN :a AND :b');
        $st->bindValue(':a', $desde, SQLITE3_TEXT);
        $st->bindValue(':b', $hasta, SQLITE3_TEXT);
        $r = $st->execute()->fetchArray(SQLITE3_ASSOC);
        return array((int) $r['c'], (int) $r['u']);
    };
    $top = function ($col, $desde, $limit, $extra = '') use ($db) {
        $st = $db->prepare("SELECT {$col} k, COUNT(*) c, COUNT(DISTINCT visitante) u FROM visitas WHERE dia >= :a {$extra} GROUP BY {$col} ORDER BY c DESC LIMIT {$limit}");
        $st->bindValue(':a', $desde, SQLITE3_TEXT);
        $res = $st->execute();
        $out = array();
        while ($row = $res->fetchArray(SQLITE3_ASSOC)) {
            $out[] = $row;
        }
        return $out;
    };

    $hoy = date('Y-m-d');
    $ayer = date('Y-m-d', strtotime('-1 day'));
    $hace7 = date('Y-m-d', strtotime('-6 days'));
    $hace30 = date('Y-m-d', strtotime('-29 days'));
    $desdePaises = date('Y-m-d', strtotime('-' . (max(1, (int) $diasPaises) - 1) . ' days'));

    list($cHoy, $uHoy) = $rango($hoy, $hoy);
    list($cAyer, $uAyer) = $rango($ayer, $ayer);
    list($c7, $u7) = $rango($hace7, $hoy);
    list($c30, $u30) = $rango($hace30, $hoy);

    $lines = array("\u{1F4D6} Visitas de Glosa\n");
    $lines[] = "Hoy: {$cHoy} visitas · {$uHoy} visitantes";
    $lines[] = "Ayer: {$cAyer} visitas · {$uAyer} visitantes";
    $lines[] = "Últimos 7 días: {$c7} visitas · {$u7} visitantes";
    $lines[] = "Últimos 30 días: {$c30} visitas · {$u30} visitantes";

    $paises = $top('pais', $desdePaises, 12);
    if ($paises) {
        $lines[] = "\n\u{1F30D} Países ({$diasPaises} días):";
        foreach ($paises as $i => $p) {
            $cc = (string) $p['k'];
            $lines[] = ($i + 1) . '. ' . visitas_bandera($cc) . ' ' . visitas_nombre_pais($cc) . ' — ' . $p['c'] . ' (' . $p['u'] . ' visitantes)';
        }
    }

    $langs = $top('lang', $hace30, 6, "AND lang != ''");
    if ($langs) {
        $lines[] = "\n\u{1F5E3} Idioma del navegador (30 días):";
        foreach ($langs as $i => $p) {
            $lines[] = ($i + 1) . '. ' . strtoupper($p['k']) . ' — ' . $p['c'];
        }
    }

    $refs = $top('ref', $hace30, 5, "AND ref != ''");
    if ($refs) {
        $lines[] = "\n\u{1F517} Procedencia externa (30 días):";
        foreach ($refs as $i => $p) {
            $lines[] = ($i + 1) . '. ' . $p['k'] . ' — ' . $p['c'];
        }
    }

    $geo = $db->querySingle('SELECT COUNT(*) FROM geo');
    if (!$geo) {
        $lines[] = "\n\u{26A0} La tabla de países está vacía: ejecuta tools/geo-import.php.";
    }
    if ($c30 === 0) {
        $lines[] = "\nTodavía no hay visitas registradas.";
    }

    $db->close();
    return implode("\n", $lines);
}
