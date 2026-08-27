<?php
// Portada en producción: registra la visita (día, país, idioma del navegador, procedencia;
// anónima, sin cookies ni IP) y sirve index.html tal cual. Así la app sigue siendo estática y
// funciona abriendo index.html desde disco; el servidor sirve index.php antes que index.html.
require_once __DIR__ . '/visitas-lib.php';

try {
    visitas_registrar('/');
} catch (Throwable $e) {
    // la analítica nunca rompe la página
}

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache');
readfile(__DIR__ . '/index.html');
