<?php
// Cuentas de Glosa (inicio de sesión con Google) y biblioteca sincronizada: índice de libros abiertos
// con su origen y la posición de lectura, por usuario. La usa api.php. Los libros en sí nunca pasan
// por aquí: solo su ficha. La BD SQLite vive fuera del webroot, en la misma carpeta de datos que la
// de visitas (GLOSA_DATA_DIR, ver visitas-lib.php), en su propio fichero.
//
// Sincronización: cada libro lleva una clave por origen (gb:<id>, ws:<idioma>:<título>,
// drive:<fileId>, local:<nombre>:<tamaño>) y marcas de tiempo puestas por el cliente (ms): pos_at
// (último guardado de posición) y last_opened. Gana siempre la marca más nueva, tanto al recibir
// como al devolver. Un libro borrado queda como lápida (deleted_at) para que los demás dispositivos
// lo quiten también; si alguien lo vuelve a abrir después de borrarlo, resucita.

require_once __DIR__ . '/visitas-lib.php';

define('USUARIOS_DB', VISITAS_DATA_DIR . '/glosa-usuarios.sqlite');
define('USUARIOS_COOKIE', 'glosa_s');
define('USUARIOS_SESION_DIAS', 90);
define('USUARIOS_LOGIN_MAX_HORA', 30);   // intentos de login por IP y hora
define('USUARIOS_LIBROS_MAX', 2000);     // libros por usuario
define('USUARIOS_TEXTO_MAX', 300);       // longitud máxima de título, autor, nombre, clave...
define('USUARIOS_LAPIDA_DIAS', 120);     // cuánto se conserva la lápida de un libro borrado

// Abre (y crea si hace falta) la BD. Devuelve SQLite3 o null si algo falla.
function usuarios_db($path = USUARIOS_DB)
{
    if (!class_exists('SQLite3')) {
        return null;
    }
    try {
        $db = new SQLite3($path);
        $db->busyTimeout(3000);
        $db->exec('PRAGMA journal_mode = WAL');
        $db->exec('PRAGMA foreign_keys = ON');
        $db->exec('CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            google_sub TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL DEFAULT "",
            name TEXT NOT NULL DEFAULT "",
            picture TEXT NOT NULL DEFAULT "",
            created_at INTEGER NOT NULL,
            last_login_at INTEGER NOT NULL
        )');
        $db->exec('CREATE TABLE IF NOT EXISTS sessions (
            token_hash TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL
        )');
        $db->exec('CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)');
        $db->exec('CREATE TABLE IF NOT EXISTS user_books (
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            key TEXT NOT NULL,
            source_kind TEXT NOT NULL DEFAULT "local",
            source_ref TEXT NOT NULL DEFAULT "",
            name TEXT NOT NULL DEFAULT "",
            size INTEGER NOT NULL DEFAULT 0,
            type TEXT NOT NULL DEFAULT "",
            title TEXT NOT NULL DEFAULT "",
            author TEXT NOT NULL DEFAULT "",
            pages INTEGER NOT NULL DEFAULT 0,
            page INTEGER NOT NULL DEFAULT 1,
            pos_block INTEGER NOT NULL DEFAULT -1,
            pos_offset REAL NOT NULL DEFAULT 0,
            added INTEGER NOT NULL DEFAULT 0,
            last_opened INTEGER NOT NULL DEFAULT 0,
            pos_at INTEGER NOT NULL DEFAULT 0,
            updated_at INTEGER NOT NULL DEFAULT 0,
            deleted_at INTEGER,
            PRIMARY KEY (user_id, key)
        )');
        $db->exec('CREATE TABLE IF NOT EXISTS ratelimit (
            bucket TEXT PRIMARY KEY,
            n INTEGER NOT NULL,
            ventana INTEGER NOT NULL
        )');
        return $db;
    } catch (Exception $e) {
        return null;
    }
}

function usuarios_ahora_ms()
{
    return (int) round(microtime(true) * 1000);
}

// ---------------------------------------------------------------- Google

// Pide a Google los datos del ID token (JWT que devuelve el botón "Iniciar sesión con Google").
// $fetch: callable(url) => string|false, sustituible en los tests. Devuelve el cuerpo decodificado o null.
function usuarios_google_tokeninfo($idToken, $fetch = null)
{
    $url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . rawurlencode($idToken);
    if ($fetch === null) {
        $fetch = 'usuarios_http_get';
    }
    $body = $fetch($url);
    if (!is_string($body) || $body === '') {
        return null;
    }
    $data = json_decode($body, true);
    return is_array($data) ? $data : null;
}

function usuarios_http_get($url)
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, array(
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 8,
            CURLOPT_CONNECTTIMEOUT => 5,
        ));
        $res = curl_exec($ch);
        curl_close($ch);
        return $res;
    }
    $ctx = stream_context_create(array('http' => array('timeout' => 8, 'ignore_errors' => true)));
    return @file_get_contents($url, false, $ctx);
}

// Comprueba el ID token y devuelve el perfil (sub, email, name, picture) o un código de error.
// $clientId: nuestro cliente OAuth; el token debe ir dirigido a él (aud) y venir de Google (iss).
function usuarios_google_verificar($idToken, $clientId, $fetch = null, $ahora = null)
{
    if (!is_string($idToken) || strlen($idToken) < 20 || strlen($idToken) > 4096 || !preg_match('/^[A-Za-z0-9_\-.]+$/', $idToken)) {
        return array('error' => 'token_invalido');
    }
    if ($clientId === '') {
        return array('error' => 'sin_client_id');
    }
    $info = usuarios_google_tokeninfo($idToken, $fetch);
    if (!$info || isset($info['error']) || empty($info['sub'])) {
        return array('error' => 'token_rechazado');
    }
    if (!isset($info['aud']) || !hash_equals($clientId, (string) $info['aud'])) {
        return array('error' => 'aud');
    }
    if (!isset($info['iss']) || !in_array($info['iss'], array('accounts.google.com', 'https://accounts.google.com'), true)) {
        return array('error' => 'iss');
    }
    $ahora = $ahora === null ? time() : $ahora;
    if (!isset($info['exp']) || (int) $info['exp'] < $ahora) {
        return array('error' => 'caducado');
    }
    if (isset($info['email_verified']) && !in_array($info['email_verified'], array(true, 'true', 1, '1'), true)) {
        return array('error' => 'email_sin_verificar');
    }
    return array(
        'sub' => (string) $info['sub'],
        'email' => isset($info['email']) ? substr((string) $info['email'], 0, 200) : '',
        'name' => isset($info['name']) ? substr((string) $info['name'], 0, 120) : '',
        'picture' => isset($info['picture']) && preg_match('#^https://#', (string) $info['picture']) ? substr((string) $info['picture'], 0, 400) : '',
    );
}

// ---------------------------------------------------------------- usuarios y sesiones

// Crea o actualiza el usuario a partir del perfil de Google. Devuelve su fila.
function usuarios_login($db, $perfil)
{
    $ahora = time();
    $st = $db->prepare('INSERT INTO users (google_sub, email, name, picture, created_at, last_login_at)
        VALUES (:sub, :email, :name, :picture, :ahora, :ahora)
        ON CONFLICT(google_sub) DO UPDATE SET email = excluded.email, name = excluded.name, picture = excluded.picture, last_login_at = excluded.last_login_at');
    $st->bindValue(':sub', $perfil['sub'], SQLITE3_TEXT);
    $st->bindValue(':email', $perfil['email'], SQLITE3_TEXT);
    $st->bindValue(':name', $perfil['name'], SQLITE3_TEXT);
    $st->bindValue(':picture', $perfil['picture'], SQLITE3_TEXT);
    $st->bindValue(':ahora', $ahora, SQLITE3_INTEGER);
    $st->execute();
    return usuarios_por_sub($db, $perfil['sub']);
}

function usuarios_por_sub($db, $sub)
{
    $st = $db->prepare('SELECT * FROM users WHERE google_sub = :sub');
    $st->bindValue(':sub', $sub, SQLITE3_TEXT);
    $row = $st->execute()->fetchArray(SQLITE3_ASSOC);
    return $row ?: null;
}

function usuarios_por_id($db, $id)
{
    $st = $db->prepare('SELECT * FROM users WHERE id = :id');
    $st->bindValue(':id', (int) $id, SQLITE3_INTEGER);
    $row = $st->execute()->fetchArray(SQLITE3_ASSOC);
    return $row ?: null;
}

// Lo que ve el navegador de un usuario.
function usuarios_publico($user)
{
    return array(
        'id' => (int) $user['id'],
        'email' => (string) $user['email'],
        'name' => (string) $user['name'],
        'picture' => (string) $user['picture'],
    );
}

// Abre una sesión y devuelve el token en claro (va a la cookie; en la BD solo su hash).
function usuarios_sesion_crear($db, $userId, $ahora = null)
{
    $ahora = $ahora === null ? time() : $ahora;
    $token = bin2hex(random_bytes(32));
    $st = $db->prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (:h, :u, :c, :e)');
    $st->bindValue(':h', hash('sha256', $token), SQLITE3_TEXT);
    $st->bindValue(':u', (int) $userId, SQLITE3_INTEGER);
    $st->bindValue(':c', $ahora, SQLITE3_INTEGER);
    $st->bindValue(':e', $ahora + USUARIOS_SESION_DIAS * 86400, SQLITE3_INTEGER);
    $st->execute();
    // limpieza oportunista de sesiones caducadas
    $db->exec('DELETE FROM sessions WHERE expires_at < ' . (int) $ahora);
    return $token;
}

// Usuario de un token de sesión, o null si no existe o caducó.
function usuarios_sesion_usuario($db, $token, $ahora = null)
{
    if (!is_string($token) || !preg_match('/^[a-f0-9]{64}$/', $token)) {
        return null;
    }
    $ahora = $ahora === null ? time() : $ahora;
    $st = $db->prepare('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = :h AND s.expires_at > :ahora');
    $st->bindValue(':h', hash('sha256', $token), SQLITE3_TEXT);
    $st->bindValue(':ahora', $ahora, SQLITE3_INTEGER);
    $row = $st->execute()->fetchArray(SQLITE3_ASSOC);
    return $row ?: null;
}

function usuarios_sesion_borrar($db, $token)
{
    if (!is_string($token) || $token === '') {
        return;
    }
    $st = $db->prepare('DELETE FROM sessions WHERE token_hash = :h');
    $st->bindValue(':h', hash('sha256', $token), SQLITE3_TEXT);
    $st->execute();
}

// Borra el usuario con todo lo suyo (sesiones y libros caen por la clave foránea).
function usuarios_borrar($db, $userId)
{
    $st = $db->prepare('DELETE FROM users WHERE id = :id');
    $st->bindValue(':id', (int) $userId, SQLITE3_INTEGER);
    $st->execute();
}

// Contador por ventana de tiempo. Devuelve true si la petición cabe.
function usuarios_ratelimit($db, $bucket, $max, $ventanaSeg, $ahora = null)
{
    $ahora = $ahora === null ? time() : $ahora;
    $ventana = (int) floor($ahora / $ventanaSeg);
    $st = $db->prepare('SELECT n, ventana FROM ratelimit WHERE bucket = :b');
    $st->bindValue(':b', $bucket, SQLITE3_TEXT);
    $row = $st->execute()->fetchArray(SQLITE3_ASSOC);
    $n = $row && (int) $row['ventana'] === $ventana ? (int) $row['n'] + 1 : 1;
    $st = $db->prepare('INSERT INTO ratelimit (bucket, n, ventana) VALUES (:b, :n, :v) ON CONFLICT(bucket) DO UPDATE SET n = excluded.n, ventana = excluded.ventana');
    $st->bindValue(':b', $bucket, SQLITE3_TEXT);
    $st->bindValue(':n', $n, SQLITE3_INTEGER);
    $st->bindValue(':v', $ventana, SQLITE3_INTEGER);
    $st->execute();
    return $n <= $max;
}

// ---------------------------------------------------------------- libros

// Sanea un libro tal como lo manda el navegador. Devuelve el array limpio o null si no vale.
function usuarios_validar_libro($b)
{
    if (!is_array($b) || !isset($b['key']) || !is_string($b['key'])) {
        return null;
    }
    $key = $b['key'];
    if ($key === '' || strlen($key) > USUARIOS_TEXTO_MAX || !preg_match('/^(gb|ws|drive|local):/', $key)) {
        return null;
    }
    $source = isset($b['source']) && is_array($b['source']) ? $b['source'] : array();
    $kind = isset($source['kind']) && is_string($source['kind']) ? $source['kind'] : 'local';
    if (!in_array($kind, array('local', 'gutenberg', 'wikisource', 'drive'), true)) {
        return null;
    }
    $texto = function ($v, $max = USUARIOS_TEXTO_MAX) {
        return is_scalar($v) ? substr(trim((string) $v), 0, $max) : '';
    };
    $entero = function ($v, $min = 0) {
        return is_numeric($v) ? max($min, (int) $v) : $min;
    };
    $pos = isset($b['pos']) && is_array($b['pos']) ? $b['pos'] : array();
    $type = $texto(isset($b['type']) ? $b['type'] : '', 10);
    if (!in_array($type, array('pdf', 'epub', 'html', 'txt', ''), true)) {
        $type = '';
    }
    return array(
        'key' => $key,
        'source_kind' => $kind,
        'source_ref' => $texto(isset($source['ref']) ? $source['ref'] : ''),
        'name' => $texto(isset($b['name']) ? $b['name'] : ''),
        'size' => $entero(isset($b['size']) ? $b['size'] : 0),
        'type' => $type,
        'title' => $texto(isset($b['title']) ? $b['title'] : ''),
        'author' => $texto(isset($b['author']) ? $b['author'] : ''),
        'pages' => $entero(isset($b['pages']) ? $b['pages'] : 0),
        'page' => $entero(isset($b['page']) ? $b['page'] : 1, 1),
        'pos_block' => isset($pos['block']) && is_numeric($pos['block']) ? (int) $pos['block'] : -1,
        // la fracción puede ser algo negativa (ver Viewer.position en js/viewer.js)
        'pos_offset' => isset($pos['offset']) && is_numeric($pos['offset']) ? max(-1.0, min(1.0, (float) $pos['offset'])) : 0.0,
        'added' => $entero(isset($b['added']) ? $b['added'] : 0),
        'last_opened' => $entero(isset($b['lastOpened']) ? $b['lastOpened'] : 0),
        'pos_at' => $entero(isset($b['posAt']) ? $b['posAt'] : 0),
    );
}

// Fila de la BD → ficha tal como la entiende js/library.js.
function usuarios_libro_publico($row)
{
    if ($row['deleted_at'] !== null) {
        return array('key' => $row['key'], 'deleted' => true, 'deletedAt' => (int) $row['deleted_at']);
    }
    return array(
        'key' => $row['key'],
        'source' => array('kind' => $row['source_kind'], 'ref' => $row['source_ref']),
        'name' => $row['name'],
        'size' => (int) $row['size'],
        'type' => $row['type'],
        'title' => $row['title'],
        'author' => $row['author'],
        'pages' => (int) $row['pages'],
        'page' => (int) $row['page'],
        'pos' => (int) $row['pos_at'] > 0 ? array('block' => (int) $row['pos_block'], 'offset' => (float) $row['pos_offset']) : null,
        'added' => (int) $row['added'],
        'lastOpened' => (int) $row['last_opened'],
        'posAt' => (int) $row['pos_at'],
    );
}

// Todos los libros del usuario (las lápidas incluidas, para que el cliente borre lo borrado en otro sitio).
function usuarios_libros($db, $userId)
{
    $st = $db->prepare('SELECT * FROM user_books WHERE user_id = :u ORDER BY last_opened DESC');
    $st->bindValue(':u', (int) $userId, SQLITE3_INTEGER);
    $res = $st->execute();
    $out = array();
    while ($row = $res->fetchArray(SQLITE3_ASSOC)) {
        $out[] = usuarios_libro_publico($row);
    }
    return $out;
}

function usuarios_libro_fila($db, $userId, $key)
{
    $st = $db->prepare('SELECT * FROM user_books WHERE user_id = :u AND key = :k');
    $st->bindValue(':u', (int) $userId, SQLITE3_INTEGER);
    $st->bindValue(':k', $key, SQLITE3_TEXT);
    $row = $st->execute()->fetchArray(SQLITE3_ASSOC);
    return $row ?: null;
}

function usuarios_libros_contar($db, $userId)
{
    $st = $db->prepare('SELECT COUNT(*) AS n FROM user_books WHERE user_id = :u');
    $st->bindValue(':u', (int) $userId, SQLITE3_INTEGER);
    $row = $st->execute()->fetchArray(SQLITE3_ASSOC);
    return $row ? (int) $row['n'] : 0;
}

// Incorpora los libros que manda un dispositivo (ya saneados) y devuelve cuántos cambiaron algo.
// Reglas: si no existe, se crea; si está borrado y el dispositivo lo abrió después del borrado,
// resucita; la posición se toma solo si su marca es más nueva; los metadatos los pone quien lo abrió
// más tarde.
function usuarios_libros_sync($db, $userId, $libros, $ahora = null)
{
    $ahora = $ahora === null ? usuarios_ahora_ms() : $ahora;
    $cambios = 0;
    $total = usuarios_libros_contar($db, $userId);
    $db->exec('BEGIN');
    try {
        // las lápidas viejas ya han hecho su trabajo (todo dispositivo activo las ha visto)
        $st = $db->prepare('DELETE FROM user_books WHERE user_id = :u AND deleted_at IS NOT NULL AND deleted_at < :lim');
        $st->bindValue(':u', (int) $userId, SQLITE3_INTEGER);
        $st->bindValue(':lim', $ahora - USUARIOS_LAPIDA_DIAS * 86400000, SQLITE3_INTEGER);
        $st->execute();
        foreach ($libros as $b) {
            $row = usuarios_libro_fila($db, $userId, $b['key']);
            if (!$row) {
                if ($total >= USUARIOS_LIBROS_MAX) {
                    continue;
                }
                usuarios_libro_insertar($db, $userId, $b, $ahora);
                $total++;
                $cambios++;
                continue;
            }
            if ($row['deleted_at'] !== null) {
                if ($b['last_opened'] <= (int) $row['deleted_at']) {
                    continue; // sigue borrado: el cliente lo quitará al recibir la lápida
                }
                usuarios_libro_actualizar($db, $userId, $b, $ahora, true);
                $cambios++;
                continue;
            }
            $posNueva = $b['pos_at'] > (int) $row['pos_at'];
            $abiertoDespues = $b['last_opened'] > (int) $row['last_opened'];
            if (!$posNueva && !$abiertoDespues) {
                continue;
            }
            $merged = $b;
            if (!$posNueva) {
                $merged['page'] = (int) $row['page'];
                $merged['pos_block'] = (int) $row['pos_block'];
                $merged['pos_offset'] = (float) $row['pos_offset'];
                $merged['pos_at'] = (int) $row['pos_at'];
            }
            if (!$abiertoDespues) {
                foreach (array('name', 'size', 'type', 'title', 'author', 'pages', 'last_opened') as $f) {
                    $merged[$f] = $row[$f];
                }
            }
            $merged['added'] = (int) $row['added'] ?: $b['added'];
            usuarios_libro_actualizar($db, $userId, $merged, $ahora, false);
            $cambios++;
        }
        $db->exec('COMMIT');
    } catch (Exception $e) {
        $db->exec('ROLLBACK');
        throw $e;
    }
    return $cambios;
}

function usuarios_libro_insertar($db, $userId, $b, $ahora)
{
    $st = $db->prepare('INSERT INTO user_books (user_id, key, source_kind, source_ref, name, size, type, title, author, pages, page, pos_block, pos_offset, added, last_opened, pos_at, updated_at, deleted_at)
        VALUES (:u, :key, :source_kind, :source_ref, :name, :size, :type, :title, :author, :pages, :page, :pos_block, :pos_offset, :added, :last_opened, :pos_at, :updated_at, NULL)');
    usuarios_libro_bind($st, $userId, $b, $ahora);
    $st->execute();
}

function usuarios_libro_actualizar($db, $userId, $b, $ahora, $resucitar)
{
    $st = $db->prepare('UPDATE user_books SET source_kind = :source_kind, source_ref = :source_ref, name = :name, size = :size, type = :type, title = :title, author = :author, pages = :pages, page = :page, pos_block = :pos_block, pos_offset = :pos_offset, added = :added, last_opened = :last_opened, pos_at = :pos_at, updated_at = :updated_at' . ($resucitar ? ', deleted_at = NULL' : '') . '
        WHERE user_id = :u AND key = :key');
    usuarios_libro_bind($st, $userId, $b, $ahora);
    $st->execute();
}

function usuarios_libro_bind($st, $userId, $b, $ahora)
{
    $st->bindValue(':u', (int) $userId, SQLITE3_INTEGER);
    $st->bindValue(':key', $b['key'], SQLITE3_TEXT);
    $st->bindValue(':source_kind', $b['source_kind'], SQLITE3_TEXT);
    $st->bindValue(':source_ref', $b['source_ref'], SQLITE3_TEXT);
    $st->bindValue(':name', $b['name'], SQLITE3_TEXT);
    $st->bindValue(':size', (int) $b['size'], SQLITE3_INTEGER);
    $st->bindValue(':type', $b['type'], SQLITE3_TEXT);
    $st->bindValue(':title', $b['title'], SQLITE3_TEXT);
    $st->bindValue(':author', $b['author'], SQLITE3_TEXT);
    $st->bindValue(':pages', (int) $b['pages'], SQLITE3_INTEGER);
    $st->bindValue(':page', (int) $b['page'], SQLITE3_INTEGER);
    $st->bindValue(':pos_block', (int) $b['pos_block'], SQLITE3_INTEGER);
    $st->bindValue(':pos_offset', (float) $b['pos_offset'], SQLITE3_FLOAT);
    $st->bindValue(':added', (int) $b['added'], SQLITE3_INTEGER);
    $st->bindValue(':last_opened', (int) $b['last_opened'], SQLITE3_INTEGER);
    $st->bindValue(':pos_at', (int) $b['pos_at'], SQLITE3_INTEGER);
    $st->bindValue(':updated_at', (int) $ahora, SQLITE3_INTEGER);
}

// Marca un libro como borrado ($at: marca del cliente en ms). Si no existía, crea la lápida igual, para
// que un dispositivo que aún lo tenga lo quite. Devuelve true si había algo que borrar.
function usuarios_libro_borrar($db, $userId, $key, $at, $ahora = null)
{
    $ahora = $ahora === null ? usuarios_ahora_ms() : $ahora;
    $at = $at > 0 ? (int) $at : $ahora;
    $row = usuarios_libro_fila($db, $userId, $key);
    if (!$row) {
        $st = $db->prepare('INSERT INTO user_books (user_id, key, updated_at, deleted_at) VALUES (:u, :k, :upd, :del)');
        $st->bindValue(':u', (int) $userId, SQLITE3_INTEGER);
        $st->bindValue(':k', $key, SQLITE3_TEXT);
        $st->bindValue(':upd', $ahora, SQLITE3_INTEGER);
        $st->bindValue(':del', $at, SQLITE3_INTEGER);
        $st->execute();
        return false;
    }
    $st = $db->prepare('UPDATE user_books SET deleted_at = :del, updated_at = :upd WHERE user_id = :u AND key = :k');
    $st->bindValue(':u', (int) $userId, SQLITE3_INTEGER);
    $st->bindValue(':k', $key, SQLITE3_TEXT);
    $st->bindValue(':upd', $ahora, SQLITE3_INTEGER);
    $st->bindValue(':del', max($at, (int) $row['last_opened'] + 1), SQLITE3_INTEGER);
    $st->execute();
    return $row['deleted_at'] === null;
}
