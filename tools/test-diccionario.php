<?php
// Tests de diccionario-lib.php (diccionario aprendido online) sobre una carpeta temporal.
// Uso: php tools/test-diccionario.php   (sale con 1 si algo falla). No toca la carpeta de datos real.

$tmp = sys_get_temp_dir() . '/glosa-dicc-test-' . bin2hex(random_bytes(4));
mkdir($tmp);
putenv('GLOSA_DATA_DIR=' . $tmp);
require_once dirname(__DIR__) . '/diccionario-lib.php';

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

$entrada = array(array('p' => 'n', 'o' => 'wiktionary', 's' => array(array('t' => array('casa', 'hogar'), 'd' => 'A building for living in.'))));

// ---------------------------------------------------------------- pares y lectura en vacío
ok(dicc_par_valido('en-es') && !dicc_par_valido('en-fr') && !dicc_par_valido(array('en-es')) && !dicc_par_valido('../x'), 'solo acepta los pares conocidos');
ok(dicc_leer_crudo('en-fr') === null, 'par desconocido: nada que leer');
ok(dicc_leer_crudo('en-es') === '{"entries":{},"infl":{}}', 'par sin fichero: JSON vacío con objetos, no listas');
ok(!is_dir(DICC_DIR), 'leer no crea la carpeta');

// ---------------------------------------------------------------- normalización de la palabra
ok(dicc_normalizar_palabra('  Houses, ') === 'houses', 'quita puntuación y espacios de los extremos y pasa a minúsculas');
ok(dicc_normalizar_palabra('Straße') === 'straße' && dicc_normalizar_palabra('ÁRBOL') === 'árbol', 'minúsculas multibyte');
ok(dicc_normalizar_palabra("rock’n’roll") === "rock'n'roll", 'apóstrofos tipográficos → recto, como el cliente');
ok(dicc_normalizar_palabra('كتاب') === 'كتاب' && dicc_normalizar_palabra('說話') === '說話', 'árabe y chino pasan');
ok(dicc_normalizar_palabra('two words') === null, 'con espacio dentro no vale');
ok(dicc_normalizar_palabra('') === null && dicc_normalizar_palabra('...') === null && dicc_normalizar_palabra('123') === null, 'vacío, solo puntuación o solo números: no');
ok(dicc_normalizar_palabra(str_repeat('a', 65)) === null && dicc_normalizar_palabra(str_repeat('a', 64)) !== null, 'tope de 64 caracteres');
ok(dicc_normalizar_palabra('<b>x</b>') === null && dicc_normalizar_palabra(42) === null, 'nada de marcado ni tipos raros');

// ---------------------------------------------------------------- validación de entradas
ok(dicc_validar_entradas($entrada) === array(array('p' => 'n', 's' => array(array('t' => array('casa', 'hogar'), 'd' => 'A building for living in.')), 'o' => 'wiktionary')), 'entrada bien formada pasa tal cual');
ok(dicc_validar_entradas(array()) === null && dicc_validar_entradas('x') === null, 'lista vacía o no lista: no');
ok(dicc_validar_entradas(array(array('p' => 'n', 'o' => 'wiktionary', 's' => array(array('t' => array()))))) === null, 'acepción sin traducciones: no');
ok(dicc_validar_entradas(array(array('p' => 'n', 'o' => 'wiktionary', 's' => array(array('t' => array('<script>')))))) === null, 'traducción con marcado: no');
ok(dicc_validar_entradas(array(array('p' => 'n', 'o' => 'wiktionary', 's' => array(array('t' => array(str_repeat('x', 121))))))) === null, 'traducción demasiado larga: no');
ok(dicc_validar_entradas(array(array('p' => 'n', 'o' => 'wiktionary', 's' => array(array('t' => array('a'), 'd' => str_repeat('x', 301)))))) === null, 'definición demasiado larga: no');
ok(dicc_validar_entradas(array(array('p' => 'n', 'o' => 'wiktionary', 's' => array(array('t' => array('a'), 'd' => "x\ny"))))) !== null, 'saltos de línea en la definición se aplanan');
ok(dicc_validar_entradas(array(array('p' => 'n', 'o' => 'otro', 's' => array(array('t' => array('a')))))) === null, 'origen desconocido: no');
ok(dicc_validar_entradas(array(array('p' => 'n', 's' => array(array('t' => array('a')))))) === null, 'sin origen: no');
ok(dicc_validar_entradas(array(array('p' => 'sust. común', 'o' => 'mymemory', 's' => array(array('t' => array('a')))))) === null, 'categoría con espacios o puntos: no');
ok(dicc_validar_entradas(array(array('p' => '', 'o' => 'mymemory', 's' => array(array('t' => array('a')))))) !== null, 'categoría vacía sí vale (MyMemory no la da)');
$muchas = array_fill(0, 5, array('p' => 'n', 'o' => 'wiktionary', 's' => array(array('t' => array('a')))));
ok(dicc_validar_entradas($muchas) === null, 'más de 4 categorías: no');
$muchasAcep = array(array('p' => 'n', 'o' => 'wiktionary', 's' => array_fill(0, 7, array('t' => array('a')))));
ok(dicc_validar_entradas($muchasAcep) === null, 'más de 6 acepciones: no');
$muchasTrad = array(array('p' => 'n', 'o' => 'wiktionary', 's' => array(array('t' => array_fill(0, 11, 'a')))));
ok(dicc_validar_entradas($muchasTrad) === null, 'más de 10 traducciones: no');
$dup = dicc_validar_entradas(array(array('p' => 'n', 'o' => 'wiktionary', 's' => array(array('t' => array('casa', ' casa ', 'hogar'))))));
ok($dup[0]['s'][0]['t'] === array('casa', 'hogar'), 'traducciones repetidas se quitan');
$extra = dicc_validar_entradas(array(array('p' => 'n', 'o' => 'wiktionary', 'x' => 1, 's' => array(array('t' => array('a'), 'z' => 2)))));
ok($extra === array(array('p' => 'n', 's' => array(array('t' => array('a'))), 'o' => 'wiktionary')), 'campos desconocidos se descartan');

// ---------------------------------------------------------------- aprender
ok(dicc_aprender('en-fr', 'house', $entrada) === 'invalido', 'aprender con par desconocido: invalido');
ok(dicc_aprender('en-es', 'two words', $entrada) === 'invalido', 'palabra inválida: invalido');
ok(dicc_aprender('en-es', 'house', null, null) === 'invalido', 'sin entradas ni lema: invalido');
ok(dicc_aprender('en-es', 'house', array('rota')) === 'invalido', 'entradas mal formadas: invalido');
ok(dicc_aprender('en-es', 'houses', null, 'houses') === 'invalido', 'lema igual a la palabra: invalido');
ok(!is_file(dicc_ruta('en-es')), 'nada inválido crea el fichero');

ok(dicc_aprender('en-es', ' House ', $entrada) === 'nuevo', 'primera alta: nuevo');
ok(is_file(dicc_ruta('en-es')), 'crea dict-extra/en-es.json');
$leido = dicc_leer('en-es');
ok(isset($leido['entries']['house']) && $leido['entries']['house'][0]['s'][0]['t'] === array('casa', 'hogar'), 'se lee con la palabra normalizada');
ok(dicc_aprender('en-es', 'house', $entrada) === 'existente', 'segunda alta de la misma palabra: existente');
$otra = array(array('p' => 'v', 'o' => 'mymemory', 's' => array(array('t' => array('alojar')))));
ok(dicc_aprender('en-es', 'house', $otra) === 'existente' && dicc_leer('en-es')['entries']['house'][0]['p'] === 'n', 'la primera versión se conserva; no se pisa');

ok(dicc_aprender('en-es', 'Houses', null, 'house') === 'nuevo', 'flexión → lema: nuevo');
ok(dicc_leer('en-es')['infl']['houses'] === 'house', 'la flexión queda guardada');
ok(dicc_aprender('en-es', 'houses', null, 'house') === 'existente', 'misma flexión otra vez: existente');
ok(dicc_aprender('en-es', 'house', null, 'hous') === 'existente', 'una palabra con entrada propia no gana flexión');

ok(dicc_aprender('en-es', 'whilst', $entrada, 'while') === 'nuevo' && !isset(dicc_leer('en-es')['infl']['whilst']), 'con entradas y lema a la vez se guardan solo las entradas');

$raw = dicc_leer_crudo('en-es');
$json = json_decode($raw, true);
ok(is_array($json) && isset($json['entries']['house']) && isset($json['infl']['houses']), 'el JSON crudo es el que se sirve al cliente');
ok(strpos($raw, '\u') === false && strpos($raw, 'casa') !== false, 'JSON sin escapar unicode');

ok(dicc_leer_crudo('es-en') === '{"entries":{},"infl":{}}', 'el otro par sigue vacío');
ok(dicc_aprender('zh-es', '說話', array(array('p' => 'v', 'o' => 'wiktionary', 's' => array(array('t' => array('hablar'), 'd' => 'shuō huà'))))) === 'nuevo', 'chino como palabra');
ok(dicc_leer('zh-es')['entries']['說話'][0]['s'][0]['d'] === 'shuō huà', 'y se lee tal cual');

// ---------------------------------------------------------------- tope
file_put_contents(dicc_ruta('it-es'), json_encode(array('entries' => array_fill_keys(array_map(function ($i) { return 'w' . $i; }, range(1, DICC_MAX_PALABRAS)), $entrada), 'infl' => array())));
ok(dicc_aprender('it-es', 'nuova', $entrada) === 'lleno', 'par lleno: lleno');
ok(dicc_aprender('it-es', 'w1', $entrada) === 'existente', 'par lleno pero palabra ya presente: existente');

// ---------------------------------------------------------------- fichero corrupto
file_put_contents(dicc_ruta('de-es'), '{corrupto');
ok(dicc_leer('de-es') === array('entries' => array(), 'infl' => array()), 'JSON corrupto se lee como vacío');
ok(dicc_aprender('de-es', 'haus', $entrada) === 'nuevo' && isset(dicc_leer('de-es')['entries']['haus']), 'y la siguiente alta lo regenera');

// ---------------------------------------------------------------- limpieza
foreach (glob($tmp . '/dict-extra/*') as $f) {
    unlink($f);
}
@rmdir($tmp . '/dict-extra');
@rmdir($tmp);

echo "\n$n comprobaciones, $fallos fallos\n";
exit($fallos ? 1 : 0);
