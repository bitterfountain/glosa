<?php
// Portada en producción: registra la visita (día, país, idioma del navegador, procedencia;
// anónima, sin cookies ni IP) y sirve index.html tal cual. Así la app sigue siendo estática y
// funciona abriendo index.html desde disco; el servidor sirve index.php antes que index.html.
// Además inyecta en el <head> las claves públicas de Google (cliente OAuth, clave del selector de
// Drive y número de proyecto) que lee js/auth.js: viven en glosa.env / .env, no en el repo. Sin ellas
// la app no enseña el inicio de sesión.
require_once __DIR__ . '/visitas-lib.php';

try {
    visitas_registrar('/');
} catch (Throwable $e) {
    // la analítica nunca rompe la página
}

$html = file_get_contents(__DIR__ . '/index.html');
$metas = '';
foreach (array('google-client-id' => 'GOOGLE_CLIENT_ID', 'google-api-key' => 'GOOGLE_API_KEY', 'google-app-id' => 'GOOGLE_APP_ID') as $name => $var) {
    $valor = visitas_env($var);
    if ($valor !== '') {
        $metas .= '  <meta name="' . $name . '" content="' . htmlspecialchars($valor, ENT_QUOTES, 'UTF-8') . '">' . "\n";
    }
}
if ($metas !== '') {
    $html = str_replace('</head>', $metas . '</head>', $html);
}

// Versión en cada script y hoja de estilos locales (?v=<fecha del fichero>): sin ella los navegadores
// (sobre todo en el móvil) guardan js/css durante días y no ven los cambios tras un despliegue.
$html = preg_replace_callback('#(src|href)="((?:js|css|vendor)/[^"?]+)"#', function ($m) {
    $mtime = @filemtime(__DIR__ . '/' . $m[2]);
    return $m[1] . '="' . $m[2] . ($mtime ? '?v=' . $mtime : '') . '"';
}, $html);

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache');
echo $html;
