<?php
// API de cuentas y biblioteca sincronizada de Glosa. Un único punto de entrada, api.php?r=<ruta>,
// para no tocar la configuración del servidor (todo .php ya va a PHP). JSON en ambos sentidos.
//
//   POST auth/google   { credential }        inicia sesión con el ID token de Google → { user }
//   POST auth/logout                          cierra la sesión (borra la cookie)
//   GET  me                                   { user } o 401
//   DELETE me                                 borra la cuenta y todo lo suyo
//   GET  books                                { books }
//   POST books/sync    { books: [...] }       incorpora los libros del dispositivo → { books } (todos)
//   POST books/remove  { key, at }            borra un libro (lápida para los demás dispositivos)
//
// Sesión: cookie HttpOnly. CSRF: toda petición que no sea GET exige la cabecera X-Requested-With
// (un formulario de otra web no puede ponerla) y, si el navegador manda Origin, que coincida con el
// Host. Las respuestas de error llevan { ok: false, error: "<código>" }.

require_once __DIR__ . '/usuarios-lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function api_responder($code, $data)
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function api_error($code, $error)
{
    api_responder($code, array('ok' => false, 'error' => $error));
}

function api_cuerpo()
{
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) {
        return array();
    }
    if (strlen($raw) > 2000000) {
        api_error(413, 'demasiado_grande');
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : array();
}

function api_es_https()
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
}

function api_cookie_sesion($token, $expira)
{
    setcookie(USUARIOS_COOKIE, $token, array(
        'expires' => $expira,
        'path' => '/',
        'secure' => api_es_https(),
        'httponly' => true,
        'samesite' => 'Lax',
    ));
}

// Solo el navegador de la propia app llama aquí con métodos que escriben.
function api_comprobar_csrf()
{
    if (!isset($_SERVER['HTTP_X_REQUESTED_WITH']) || $_SERVER['HTTP_X_REQUESTED_WITH'] !== 'Glosa') {
        api_error(403, 'csrf');
    }
    if (isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] !== '' && $_SERVER['HTTP_ORIGIN'] !== 'null') {
        $origen = parse_url($_SERVER['HTTP_ORIGIN'], PHP_URL_HOST);
        $host = isset($_SERVER['HTTP_HOST']) ? preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST']) : '';
        if ($origen === null || $origen === false || strcasecmp((string) $origen, $host) !== 0) {
            api_error(403, 'origen');
        }
    }
}

$metodo = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';
$ruta = isset($_GET['r']) ? trim((string) $_GET['r'], '/') : '';
$db = usuarios_db();
if (!$db) {
    api_error(503, 'sin_bd');
}
if ($metodo !== 'GET') {
    api_comprobar_csrf();
}
$token = isset($_COOKIE[USUARIOS_COOKIE]) ? (string) $_COOKIE[USUARIOS_COOKIE] : '';
$user = $token !== '' ? usuarios_sesion_usuario($db, $token) : null;

switch ($metodo . ' ' . $ruta) {
    case 'POST auth/google':
        $ip = isset($_SERVER['REMOTE_ADDR']) ? (string) $_SERVER['REMOTE_ADDR'] : '';
        if (!usuarios_ratelimit($db, 'login:' . hash('sha256', $ip), USUARIOS_LOGIN_MAX_HORA, 3600)) {
            api_error(429, 'demasiados_intentos');
        }
        $cuerpo = api_cuerpo();
        $credential = isset($cuerpo['credential']) ? $cuerpo['credential'] : '';
        $perfil = usuarios_google_verificar($credential, visitas_env('GOOGLE_CLIENT_ID'));
        if (isset($perfil['error'])) {
            api_error(401, $perfil['error']);
        }
        $user = usuarios_login($db, $perfil);
        $nuevo = usuarios_sesion_crear($db, $user['id']);
        api_cookie_sesion($nuevo, time() + USUARIOS_SESION_DIAS * 86400);
        api_responder(200, array('ok' => true, 'user' => usuarios_publico($user)));
        break;

    case 'POST auth/logout':
        usuarios_sesion_borrar($db, $token);
        api_cookie_sesion('', time() - 3600);
        api_responder(200, array('ok' => true));
        break;

    case 'GET me':
        if (!$user) {
            api_error(401, 'sin_sesion');
        }
        api_responder(200, array('ok' => true, 'user' => usuarios_publico($user)));
        break;

    case 'DELETE me':
        if (!$user) {
            api_error(401, 'sin_sesion');
        }
        usuarios_borrar($db, $user['id']);
        api_cookie_sesion('', time() - 3600);
        api_responder(200, array('ok' => true));
        break;

    case 'GET books':
        if (!$user) {
            api_error(401, 'sin_sesion');
        }
        api_responder(200, array('ok' => true, 'books' => usuarios_libros($db, $user['id'])));
        break;

    case 'POST books/sync':
        if (!$user) {
            api_error(401, 'sin_sesion');
        }
        $cuerpo = api_cuerpo();
        $entrada = isset($cuerpo['books']) && is_array($cuerpo['books']) ? $cuerpo['books'] : null;
        if ($entrada === null || count($entrada) > USUARIOS_LIBROS_MAX) {
            api_error(400, 'libros_invalidos');
        }
        $limpios = array();
        foreach ($entrada as $b) {
            $ok = usuarios_validar_libro($b);
            if ($ok === null) {
                api_error(400, 'libro_invalido');
            }
            $limpios[] = $ok;
        }
        usuarios_libros_sync($db, $user['id'], $limpios);
        api_responder(200, array('ok' => true, 'books' => usuarios_libros($db, $user['id'])));
        break;

    case 'POST books/remove':
        if (!$user) {
            api_error(401, 'sin_sesion');
        }
        $cuerpo = api_cuerpo();
        $key = isset($cuerpo['key']) && is_string($cuerpo['key']) ? $cuerpo['key'] : '';
        if ($key === '' || strlen($key) > USUARIOS_TEXTO_MAX || !preg_match('/^(gb|ws|drive|local):/', $key)) {
            api_error(400, 'clave_invalida');
        }
        $at = isset($cuerpo['at']) && is_numeric($cuerpo['at']) ? (int) $cuerpo['at'] : 0;
        usuarios_libro_borrar($db, $user['id'], $key, $at);
        api_responder(200, array('ok' => true));
        break;

    default:
        api_error(404, 'ruta');
}
