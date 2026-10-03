<?php
// Descarga de libros en euskera de Armiarma (armiarma.eus/liburu-e) para el catálogo de Glosa.
// Su web no envía CORS, así que el navegador los pide a api.php?r=book/armiarma&m=kla&f=<fichero>.
// Solo se piden a ese host y a esa ruta, el nombre se valida y cada EPUB se guarda en la carpeta de
// datos: el segundo lector que lo abre ya no llega a Armiarma.

require_once __DIR__ . '/visitas-lib.php';

define('LIBROS_ARMIARMA_URL', 'https://armiarma.eus/liburu-e/jaitsi');
define('LIBROS_ARMIARMA_DIR', VISITAS_DATA_DIR . '/armiarma');
define('LIBROS_MAX_BYTES', 30 * 1024 * 1024);
define('LIBROS_ARMIARMA_MAX_HORA', 120); // descargas nuevas (no cacheadas) por IP y hora

// m: kla (clásicos vascos) o itz (traducciones). f: "Autor, Título" tal como lo lista Armiarma (js/armiarma.js).
function libros_armiarma_valido($m, $f)
{
    return is_string($m) && in_array($m, array('kla', 'itz'), true)
        && is_string($f) && strlen($f) >= 3 && strlen($f) <= 200
        && preg_match('//u', $f) === 1                      // UTF-8 válido
        && !preg_match('#[/\\\\\x00-\x1f<>"|?*]#', $f); // sin barras ni control; "Maite ere... neurriz" sí vale
}

function libros_armiarma_ruta($m, $f)
{
    return LIBROS_ARMIARMA_DIR . '/' . $m . '-' . sha1($f) . '.epub';
}

// Devuelve el EPUB (bytes) de la caché o, si no está, de Armiarma; null si Armiarma no lo da.
function libros_armiarma_epub($m, $f)
{
    $ruta = libros_armiarma_ruta($m, $f);
    if (is_file($ruta) && filesize($ruta) > 0) {
        return file_get_contents($ruta);
    }
    // Armiarma espera el nombre en ISO-8859-1 (Argaiñaratz): en UTF-8 devuelve un fichero vacío.
    $nombre = function_exists('mb_convert_encoding') ? mb_convert_encoding($f, 'ISO-8859-1', 'UTF-8') : utf8_decode($f);
    $url = LIBROS_ARMIARMA_URL . '?m=' . $m . '&f=' . rawurlencode($nombre . '.epub');
    $ctx = stream_context_create(array('http' => array(
        'timeout' => 30,
        'header' => "User-Agent: Glosa (glosa.dyndns.org)\r\n",
        'follow_location' => 0,
    )));
    $datos = @file_get_contents($url, false, $ctx, 0, LIBROS_MAX_BYTES + 1);
    if ($datos === false || strlen($datos) < 100 || strlen($datos) > LIBROS_MAX_BYTES || substr($datos, 0, 2) !== 'PK') {
        return null;
    }
    if (!is_dir(LIBROS_ARMIARMA_DIR)) {
        @mkdir(LIBROS_ARMIARMA_DIR, 0750, true);
    }
    // Sin caché (disco lleno, permisos) el libro se sirve igual; solo se volverá a pedir a Armiarma.
    $tmp = $ruta . '.' . getmypid() . '.tmp';
    if (@file_put_contents($tmp, $datos) === false || !@rename($tmp, $ruta)) {
        @unlink($tmp);
    }
    return $datos;
}
