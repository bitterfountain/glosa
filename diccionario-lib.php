<?php
// Diccionario aprendido: palabras que no estaban en los diccionarios incrustados (dict/*.js) y que el
// navegador resolvió online (Wiktionary, MyMemory). Se guardan por par de idiomas en un JSON estático
// de la carpeta de datos (dict-extra/<par>.json), con el mismo formato que dict/*.js:
//
//   { "entries": { "palabra": [ { "p": "n", "s": [ { "t": ["traducción"], "d": "definición" } ], "o": "wiktionary" } ] },
//     "infl":    { "forma": "lema" } }
//
// El cliente carga ese JSON junto al diccionario incrustado y lo funde en memoria (js/dictionary.js),
// así la palabra que un lector consultó online ya está "en el diccionario" para todos. No se tocan los
// ficheros de dict/: son un checkout de git con caché larga; regenerarlos con tools/build_dict.py
// puede incorporar estos JSON cuando toque (--extra).
//
// Toda entrada la manda un navegador, así que aquí se sanea todo: par en la lista, palabra corta y
// solo con letras, pocas acepciones, traducciones cortas, categoría gramatical de una lista. Escritura
// con bloqueo exclusivo del fichero; tope de palabras por par.

require_once __DIR__ . '/visitas-lib.php';

define('DICC_DIR', VISITAS_DATA_DIR . '/dict-extra');
define('DICC_MAX_PALABRAS', 50000);   // palabras aprendidas por par
define('DICC_MAX_ENTRADAS', 4);       // categorías gramaticales por palabra
define('DICC_MAX_ACEPCIONES', 6);     // acepciones por categoría
define('DICC_MAX_TRADUCCIONES', 10);  // traducciones por acepción
define('DICC_MAX_TRAD_LEN', 120);
define('DICC_MAX_DEF_LEN', 300);
define('DICC_MAX_PALABRA_LEN', 64);
define('DICC_APRENDER_MAX_HORA', 600); // altas por IP y hora

$DICC_PARES = array(
    'en-es', 'es-en', 'it-es', 'de-es', 'it-en', 'de-en', 'en-it', 'es-it', 'de-it', 'en-de', 'es-de', 'it-de',
    'es-ar', 'en-ar', 'ar-es', 'ar-en', 'zh-es', 'zh-en',
);
$DICC_ORIGENES = array('wiktionary', 'mymemory');

function dicc_par_valido($pair)
{
    global $DICC_PARES;
    return is_string($pair) && in_array($pair, $DICC_PARES, true);
}

function dicc_ruta($pair)
{
    return DICC_DIR . '/' . $pair . '.json';
}

function dicc_vacio()
{
    return array('entries' => new stdClass(), 'infl' => new stdClass());
}

// Decodifica el JSON de un par; array con 'entries' e 'infl' (arrays asociativos, vacíos si no hay fichero).
function dicc_decodificar($raw)
{
    $data = $raw === '' ? null : json_decode($raw, true);
    if (!is_array($data)) {
        $data = array();
    }
    return array(
        'entries' => isset($data['entries']) && is_array($data['entries']) ? $data['entries'] : array(),
        'infl' => isset($data['infl']) && is_array($data['infl']) ? $data['infl'] : array(),
    );
}

function dicc_codificar($data)
{
    // Objetos vacíos como {} y no [] para que el cliente pueda leer .entries sin comprobar el tipo.
    $out = array(
        'entries' => count($data['entries']) ? $data['entries'] : new stdClass(),
        'infl' => count($data['infl']) ? $data['infl'] : new stdClass(),
    );
    return json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

// Contenido crudo del JSON de un par (cadena, "{}"-equivalente si no existe) para servirlo tal cual.
function dicc_leer_crudo($pair)
{
    if (!dicc_par_valido($pair)) {
        return null;
    }
    $ruta = dicc_ruta($pair);
    if (!is_file($ruta)) {
        return dicc_codificar(array('entries' => array(), 'infl' => array()));
    }
    $raw = @file_get_contents($ruta);
    return $raw === false ? null : $raw;
}

function dicc_leer($pair)
{
    $raw = dicc_leer_crudo($pair);
    return $raw === null ? null : dicc_decodificar($raw);
}

// Palabra normalizada como hace el cliente (minúsculas, sin puntuación en los extremos) o null si no vale.
function dicc_normalizar_palabra($word)
{
    if (!is_string($word)) {
        return null;
    }
    $w = trim($word);
    $w = str_replace(array("\u{2018}", "\u{2019}", "\u{02BC}"), "'", $w);
    $w = preg_replace('/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/u', '', $w);
    if ($w === null || $w === '') {
        return null;
    }
    $w = mb_strtolower($w, 'UTF-8');
    if (mb_strlen($w, 'UTF-8') > DICC_MAX_PALABRA_LEN || !preg_match("/^[\p{L}\p{M}\p{N}'\\-]+$/u", $w) || !preg_match('/\p{L}/u', $w)) {
        return null;
    }
    return $w;
}

function dicc_texto_limpio($s, $max)
{
    if (!is_string($s)) {
        return null;
    }
    $s = trim(preg_replace('/\s+/u', ' ', $s));
    if ($s === '' || mb_strlen($s, 'UTF-8') > $max || preg_match('/[\x00-\x1F\x7F<>]/u', $s)) {
        return null;
    }
    return $s;
}

// Sanea las entradas de una palabra tal como las manda el navegador. Devuelve la lista limpia o null.
function dicc_validar_entradas($entries)
{
    global $DICC_ORIGENES;
    if (!is_array($entries) || !count($entries) || count($entries) > DICC_MAX_ENTRADAS) {
        return null;
    }
    $limpias = array();
    foreach ($entries as $e) {
        if (!is_array($e) || !isset($e['s']) || !is_array($e['s']) || !count($e['s']) || count($e['s']) > DICC_MAX_ACEPCIONES) {
            return null;
        }
        $p = isset($e['p']) ? $e['p'] : '';
        if (!is_string($p) || !preg_match('/^[a-zA-Z]{0,24}$/', $p)) {
            return null;
        }
        $o = isset($e['o']) ? $e['o'] : '';
        if (!in_array($o, $DICC_ORIGENES, true)) {
            return null;
        }
        $senses = array();
        foreach ($e['s'] as $s) {
            if (!is_array($s) || !isset($s['t']) || !is_array($s['t']) || !count($s['t']) || count($s['t']) > DICC_MAX_TRADUCCIONES) {
                return null;
            }
            $t = array();
            foreach ($s['t'] as $tr) {
                $tr = dicc_texto_limpio($tr, DICC_MAX_TRAD_LEN);
                if ($tr === null) {
                    return null;
                }
                if (!in_array($tr, $t, true)) {
                    $t[] = $tr;
                }
            }
            $sense = array('t' => $t);
            if (isset($s['d']) && $s['d'] !== '') {
                $d = dicc_texto_limpio($s['d'], DICC_MAX_DEF_LEN);
                if ($d === null) {
                    return null;
                }
                $sense['d'] = $d;
            }
            $senses[] = $sense;
        }
        $limpias[] = array('p' => $p, 's' => $senses, 'o' => $o);
    }
    return $limpias;
}

// Guarda una palabra (entradas y/o flexión → lema) en el JSON del par. Devuelve
// 'nuevo' | 'existente' | 'lleno' | 'invalido' | 'error'. Con bloqueo del fichero: leer-modificar-escribir atómico.
function dicc_aprender($pair, $word, $entries, $lemma = null)
{
    if (!dicc_par_valido($pair)) {
        return 'invalido';
    }
    $w = dicc_normalizar_palabra($word);
    if ($w === null) {
        return 'invalido';
    }
    $limpias = $entries === null ? null : dicc_validar_entradas($entries);
    $lema = $lemma === null ? null : dicc_normalizar_palabra($lemma);
    if ($entries !== null && $limpias === null) {
        return 'invalido';
    }
    if ($lemma !== null && ($lema === null || $lema === $w)) {
        return 'invalido';
    }
    if ($limpias === null && $lema === null) {
        return 'invalido';
    }
    if (!is_dir(DICC_DIR) && !@mkdir(DICC_DIR, 0750, true)) {
        return 'error';
    }
    $fh = @fopen(dicc_ruta($pair), 'c+');
    if (!$fh) {
        return 'error';
    }
    try {
        if (!flock($fh, LOCK_EX)) {
            return 'error';
        }
        $raw = stream_get_contents($fh);
        $data = dicc_decodificar($raw === false ? '' : $raw);
        $cambio = false;
        if ($limpias !== null && !isset($data['entries'][$w])) {
            if (count($data['entries']) >= DICC_MAX_PALABRAS) {
                return 'lleno';
            }
            $data['entries'][$w] = $limpias;
            $cambio = true;
        }
        if ($lema !== null && !isset($data['infl'][$w]) && !isset($data['entries'][$w])) {
            if (count($data['infl']) >= DICC_MAX_PALABRAS) {
                return 'lleno';
            }
            $data['infl'][$w] = $lema;
            $cambio = true;
        }
        if (!$cambio) {
            return 'existente';
        }
        $json = dicc_codificar($data);
        rewind($fh);
        if (!ftruncate($fh, 0) || fwrite($fh, $json) !== strlen($json)) {
            return 'error';
        }
        fflush($fh);
        return 'nuevo';
    } finally {
        flock($fh, LOCK_UN);
        fclose($fh);
    }
}
