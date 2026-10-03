<?php
// Tests de libros-lib.php (descarga de EPUB de Armiarma) sobre una carpeta temporal.
// Uso: php tools/test-libros.php   (sale con 1 si algo falla). Sin red: no descarga nada.

$tmp = sys_get_temp_dir() . '/glosa-libros-test-' . bin2hex(random_bytes(4));
mkdir($tmp);
putenv('GLOSA_DATA_DIR=' . $tmp);
require_once dirname(__DIR__) . '/libros-lib.php';

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

// ---------------------------------------------------------------- validación
$lista = file_get_contents(dirname(__DIR__) . '/js/armiarma.js');
$ini = strpos($lista, '= [') + 2; // el comentario de cabecera también lleva corchetes
$json = json_decode(substr($lista, $ini, strrpos($lista, ']') - $ini + 1), true);
ok(is_array($json) && count($json) > 300, 'js/armiarma.js se lee y trae más de 300 libros');
$malos = array();
foreach ($json as $b) {
    if (!libros_armiarma_valido($b[0], $b[1])) {
        $malos[] = $b[1];
    }
}
ok(!$malos, 'todos los libros de la lista pasan la validación' . ($malos ? ': ' . implode(' | ', array_slice($malos, 0, 5)) : ''));
ok(libros_armiarma_valido('kla', 'Pierre Argaiñaratz, Deboten brebiarioa'), 'acepta nombres con eñe');
ok(!libros_armiarma_valido('xxx', 'Juan Antonio Mogel, Peru Abarka'), 'rechaza otra sección');
ok(!libros_armiarma_valido('kla', '../../etc/passwd'), 'rechaza rutas');
ok(!libros_armiarma_valido('kla', 'a/b'), 'rechaza barras');
ok(!libros_armiarma_valido('kla', "a\nb, c"), 'rechaza saltos de línea');
ok(!libros_armiarma_valido('kla', "Mogel\xff, Peru"), 'rechaza UTF-8 inválido');
ok(!libros_armiarma_valido('kla', str_repeat('a', 201)), 'rechaza nombres larguísimos');
ok(!libros_armiarma_valido(array('kla'), 'x, y'), 'rechaza tipos raros');

// ---------------------------------------------------------------- caché
$ruta = libros_armiarma_ruta('kla', 'Juan Antonio Mogel, Peru Abarka');
ok(strpos($ruta, $tmp) === 0 && substr($ruta, -5) === '.epub', 'la caché vive en la carpeta de datos');
mkdir(dirname($ruta), 0750, true);
file_put_contents($ruta, "PK\x03\x04prueba");
ok(libros_armiarma_epub('kla', 'Juan Antonio Mogel, Peru Abarka') === "PK\x03\x04prueba", 'un libro en caché se sirve sin ir a Armiarma');

array_map('unlink', glob(dirname($ruta) . '/*'));
rmdir(dirname($ruta));
rmdir($tmp);
echo "\n$n comprobaciones, $fallos fallos\n";
exit($fallos ? 1 : 0);
