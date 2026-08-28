<?php
// Tests de usuarios-lib.php (cuentas, sesiones y biblioteca sincronizada) sobre una BD temporal.
// Uso: php tools/test-usuarios.php   (sale con 1 si algo falla). No toca la carpeta de datos real.

$tmp = sys_get_temp_dir() . '/glosa-test-' . bin2hex(random_bytes(4));
mkdir($tmp);
putenv('GLOSA_DATA_DIR=' . $tmp);
require_once dirname(__DIR__) . '/usuarios-lib.php';

$fallos = 0;
$n = 0;
function ok($cond, $msg)
{
    global $fallos, $n;
    $n++;
    if ($cond) {
        echo "  ok  $msg\n";
    } else {
        $fallos++;
        echo "FALLO  $msg\n";
    }
}

$db = usuarios_db($tmp . '/test.sqlite');
ok($db !== null, 'abre la BD y crea las tablas');

// ---------------------------------------------------------------- verificación del token de Google
$CLIENT = '123-abc.apps.googleusercontent.com';
$ahora = 1700000000;
$respuesta = function ($extra = array()) {
    return function ($url) use ($extra) {
        return json_encode(array_merge(array(
            'sub' => '10001', 'aud' => '123-abc.apps.googleusercontent.com', 'iss' => 'https://accounts.google.com',
            'exp' => '1700003600', 'email' => 'ana@example.com', 'email_verified' => 'true', 'name' => 'Ana', 'picture' => 'https://lh3.googleusercontent.com/a',
        ), $extra));
    };
};
$p = usuarios_google_verificar(str_repeat('a', 40), $CLIENT, $respuesta(), $ahora);
ok(isset($p['sub']) && $p['sub'] === '10001' && $p['email'] === 'ana@example.com', 'token válido → perfil');
ok(usuarios_google_verificar('corto', $CLIENT, $respuesta(), $ahora)['error'] === 'token_invalido', 'token con forma inválida se rechaza sin llamar a Google');
ok(usuarios_google_verificar(str_repeat('a', 40), $CLIENT, $respuesta(array('aud' => 'otro')), $ahora)['error'] === 'aud', 'token para otro cliente (aud) se rechaza');
ok(usuarios_google_verificar(str_repeat('a', 40), $CLIENT, $respuesta(array('iss' => 'evil.example')), $ahora)['error'] === 'iss', 'emisor que no es Google se rechaza');
ok(usuarios_google_verificar(str_repeat('a', 40), $CLIENT, $respuesta(array('exp' => '1600000000')), $ahora)['error'] === 'caducado', 'token caducado se rechaza');
ok(usuarios_google_verificar(str_repeat('a', 40), $CLIENT, $respuesta(array('email_verified' => 'false')), $ahora)['error'] === 'email_sin_verificar', 'correo sin verificar se rechaza');
ok(usuarios_google_verificar(str_repeat('a', 40), $CLIENT, function ($u) { return '{"error":"invalid_token"}'; }, $ahora)['error'] === 'token_rechazado', 'error de Google se rechaza');
ok(usuarios_google_verificar(str_repeat('a', 40), $CLIENT, function ($u) { return false; }, $ahora)['error'] === 'token_rechazado', 'sin respuesta de Google se rechaza');
ok(usuarios_google_verificar(str_repeat('a', 40), '', $respuesta(), $ahora)['error'] === 'sin_client_id', 'sin GOOGLE_CLIENT_ID configurado no entra nadie');
ok(usuarios_google_verificar(str_repeat('a', 40), $CLIENT, $respuesta(array('picture' => 'http://inseguro/x')), $ahora)['picture'] === '', 'la foto solo se acepta por https');

// ---------------------------------------------------------------- usuarios y sesiones
$ana = usuarios_login($db, array('sub' => '10001', 'email' => 'ana@example.com', 'name' => 'Ana', 'picture' => ''));
$bea = usuarios_login($db, array('sub' => '10002', 'email' => 'bea@example.com', 'name' => 'Bea', 'picture' => ''));
ok($ana && $bea && $ana['id'] !== $bea['id'], 'crea dos usuarios distintos');
$ana2 = usuarios_login($db, array('sub' => '10001', 'email' => 'ana@example.com', 'name' => 'Ana María', 'picture' => ''));
ok($ana2['id'] === $ana['id'] && $ana2['name'] === 'Ana María', 'volver a entrar actualiza el perfil sin duplicar');

$tok = usuarios_sesion_crear($db, $ana['id'], $ahora);
ok(preg_match('/^[a-f0-9]{64}$/', $tok) === 1, 'el token de sesión es aleatorio de 64 hex');
$u = usuarios_sesion_usuario($db, $tok, $ahora + 10);
ok($u && (int) $u['id'] === (int) $ana['id'], 'la sesión devuelve a su usuario');
ok(usuarios_sesion_usuario($db, $tok, $ahora + USUARIOS_SESION_DIAS * 86400 + 1) === null, 'la sesión caduca a los 90 días');
ok(usuarios_sesion_usuario($db, str_repeat('0', 64), $ahora) === null, 'un token inventado no abre sesión');
ok(usuarios_sesion_usuario($db, "x' OR 1=1 --", $ahora) === null, 'un token con forma rara no abre sesión');
usuarios_sesion_borrar($db, $tok);
ok(usuarios_sesion_usuario($db, $tok, $ahora) === null, 'cerrar sesión invalida el token');

// ---------------------------------------------------------------- validación de libros
$libro = function ($extra = array()) {
    return array_merge(array(
        'key' => 'gb:1342', 'source' => array('kind' => 'gutenberg', 'ref' => '1342'), 'name' => 'Austen - Pride.epub', 'size' => 12345,
        'type' => 'epub', 'title' => 'Pride and Prejudice', 'author' => 'Jane Austen', 'pages' => 61, 'page' => 5,
        'pos' => array('block' => 3, 'offset' => 0.25), 'added' => 1000, 'lastOpened' => 2000, 'posAt' => 2000,
    ), $extra);
};
$v = usuarios_validar_libro($libro());
ok($v && $v['key'] === 'gb:1342' && $v['pos_block'] === 3 && abs($v['pos_offset'] - 0.25) < 1e-9, 'libro válido se sanea bien');
ok(usuarios_validar_libro('no') === null, 'un libro que no es objeto se rechaza');
ok(usuarios_validar_libro($libro(array('key' => 'malo:1'))) === null, 'clave con prefijo desconocido se rechaza');
ok(usuarios_validar_libro($libro(array('key' => ''))) === null, 'clave vacía se rechaza');
ok(usuarios_validar_libro($libro(array('source' => array('kind' => 'ftp')))) === null, 'origen desconocido se rechaza');
ok(usuarios_validar_libro($libro(array('title' => str_repeat('x', 1000))))['title'] === str_repeat('x', 300), 'título largo se recorta');
ok(usuarios_validar_libro($libro(array('page' => -4)))['page'] === 1, 'página negativa pasa a 1');
ok(usuarios_validar_libro($libro(array('pos' => array('block' => 1, 'offset' => 7))))['pos_offset'] === 1.0, 'offset fuera de rango se acota');
ok(usuarios_validar_libro($libro(array('type' => 'exe')))['type'] === '', 'tipo desconocido se vacía');

// ---------------------------------------------------------------- sincronización
$sync = function ($userId, $libros, $ahora = 5000) use ($db) {
    $limpios = array();
    foreach ($libros as $b) {
        $limpios[] = usuarios_validar_libro($b);
    }
    return usuarios_libros_sync($db, $userId, $limpios, $ahora);
};
$sync($ana['id'], array($libro()));
$lista = usuarios_libros($db, $ana['id']);
ok(count($lista) === 1 && $lista[0]['page'] === 5 && $lista[0]['pos']['block'] === 3, 'el primer dispositivo sube el libro');
ok(count(usuarios_libros($db, $bea['id'])) === 0, 'AISLAMIENTO: Bea no ve los libros de Ana');

// otro dispositivo llega con posición más vieja: no pisa
$sync($ana['id'], array($libro(array('page' => 2, 'posAt' => 1500, 'lastOpened' => 1500))));
ok(usuarios_libros($db, $ana['id'])[0]['page'] === 5, 'una posición más vieja no pisa la nueva');
// y con una más nueva: gana
$sync($ana['id'], array($libro(array('page' => 9, 'posAt' => 3000, 'lastOpened' => 3000, 'pos' => array('block' => 0, 'offset' => 0.5)))));
$l = usuarios_libros($db, $ana['id'])[0];
ok($l['page'] === 9 && $l['posAt'] === 3000 && $l['pos']['block'] === 0, 'una posición más nueva gana');
// metadatos: los pone quien lo abrió más tarde, aunque su posición sea vieja
$sync($ana['id'], array($libro(array('title' => 'Orgullo y prejuicio', 'page' => 1, 'posAt' => 100, 'lastOpened' => 4000))));
$l = usuarios_libros($db, $ana['id'])[0];
ok($l['title'] === 'Orgullo y prejuicio' && $l['page'] === 9, 'metadatos del que abrió más tarde; posición intacta');

// Bea tiene el mismo libro: filas separadas
$sync($bea['id'], array($libro(array('page' => 40, 'posAt' => 9000, 'lastOpened' => 9000))));
ok(usuarios_libros($db, $ana['id'])[0]['page'] === 9 && usuarios_libros($db, $bea['id'])[0]['page'] === 40, 'AISLAMIENTO: el mismo libro en dos usuarios no se mezcla');

// borrado con lápida
usuarios_libro_borrar($db, $ana['id'], 'gb:1342', 4500);
$lista = usuarios_libros($db, $ana['id']);
ok(count($lista) === 1 && !empty($lista[0]['deleted']) && $lista[0]['deletedAt'] === 4500, 'borrar deja una lápida con su marca');
ok(usuarios_libros($db, $bea['id'])[0]['page'] === 40, 'AISLAMIENTO: borrar el de Ana no toca el de Bea');
// un dispositivo rezagado lo vuelve a mandar con lastOpened anterior al borrado: sigue borrado
$sync($ana['id'], array($libro(array('lastOpened' => 4000, 'posAt' => 4000))));
ok(!empty(usuarios_libros($db, $ana['id'])[0]['deleted']), 'un dispositivo rezagado no resucita un libro borrado');
// se vuelve a abrir después del borrado: resucita
$sync($ana['id'], array($libro(array('lastOpened' => 6000, 'posAt' => 6000, 'page' => 12))));
$l = usuarios_libros($db, $ana['id'])[0];
ok(empty($l['deleted']) && $l['page'] === 12, 'abrirlo después del borrado lo resucita');
// borrar algo que no existe crea lápida (para dispositivos que aún lo tengan)
usuarios_libro_borrar($db, $ana['id'], 'local:x.pdf:10', 7000);
$lap = array_values(array_filter(usuarios_libros($db, $ana['id']), function ($b) { return $b['key'] === 'local:x.pdf:10'; }));
ok(count($lap) === 1 && !empty($lap[0]['deleted']), 'borrar un libro desconocido deja lápida igualmente');
// borrar sin marca del cliente: usa la del servidor y al menos last_opened+1
usuarios_libro_borrar($db, $ana['id'], 'gb:1342', 0, 8000);
ok(usuarios_libros($db, $ana['id'])[0]['deletedAt'] >= 8000, 'borrar sin marca usa la hora del servidor');

// varios libros y orden
$sync($bea['id'], array(
    $libro(array('key' => 'ws:ar:كليلة ودمنة', 'source' => array('kind' => 'wikisource', 'ref' => 'ar:كليلة ودمنة'), 'lastOpened' => 100, 'posAt' => 100)),
    $libro(array('key' => 'drive:abc123', 'source' => array('kind' => 'drive', 'ref' => 'abc123'), 'lastOpened' => 99999, 'posAt' => 99999)),
));
$lb = usuarios_libros($db, $bea['id']);
ok(count($lb) === 3 && $lb[0]['key'] === 'drive:abc123' && $lb[0]['source']['kind'] === 'drive', 'varios libros, ordenados por último abierto, con su origen');

// ---------------------------------------------------------------- rate limit y borrado de cuenta
$cabe = true;
for ($i = 0; $i < USUARIOS_LOGIN_MAX_HORA; $i++) {
    $cabe = usuarios_ratelimit($db, 'login:test', USUARIOS_LOGIN_MAX_HORA, 3600, $ahora) && $cabe;
}
ok($cabe, 'el rate limit deja pasar los primeros intentos');
ok(!usuarios_ratelimit($db, 'login:test', USUARIOS_LOGIN_MAX_HORA, 3600, $ahora), 'y frena el siguiente');
ok(usuarios_ratelimit($db, 'login:test', USUARIOS_LOGIN_MAX_HORA, 3600, $ahora + 3600), 'en la ventana siguiente vuelve a dejar pasar');

$tokBea = usuarios_sesion_crear($db, $bea['id'], $ahora);
usuarios_borrar($db, $bea['id']);
ok(usuarios_por_id($db, $bea['id']) === null, 'borrar la cuenta quita al usuario');
ok(count(usuarios_libros($db, $bea['id'])) === 0, 'y sus libros');
ok(usuarios_sesion_usuario($db, $tokBea, $ahora) === null, 'y sus sesiones');
ok(count(usuarios_libros($db, $ana['id'])) === 2, 'AISLAMIENTO: los libros de Ana siguen ahí');

$db->close();
array_map('unlink', glob($tmp . '/*'));
rmdir($tmp);
echo "\n$n comprobaciones, $fallos fallos\n";
exit($fallos ? 1 : 0);
