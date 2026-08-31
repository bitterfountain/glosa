# Glosa — detalles técnicos

Referencia técnica del proyecto. La presentación y el uso están en el
[README](../README.md).

## Funciones, en detalle

- **Formatos**: PDF (vista Página fiel o vista Texto), EPUB (capítulos según
  el índice del libro, imágenes incluidas), HTML (partido por encabezados) y
  TXT (partido por "Chapter"/"Capítulo").
- **Idiomas**: la primera vez se abre un popup con dos filas de banderas,
  "Idioma de lectura" (EN / ES / IT / DE) e "Idioma al que traducir" (los
  mismos cuatro, menos el de lectura); el destino viene preseleccionado del
  idioma del navegador (`navigator.languages`) y se recuerda en Ajustes
  (`langsChosen`). La barra lleva un chivato "bandera EN → bandera ES" que
  reabre el popup. Al abrir un libro se detecta su idioma (por palabras
  funcionales de los cuatro idiomas, muestreando el 25/50/75 % del libro para
  saltarse portadas y avisos legales) y se cambia solo el par, conservando el
  idioma de destino. Desactivable en Ajustes. Las banderas son SVG propios:
  Windows no dibuja las banderas emoji.
- **Interfaz en cuatro idiomas** (es, en, it, de): al entrar, la del navegador si la
  tenemos y, si no (francés, árabe...), **inglés**; una vez elegidos los idiomas sigue al
  de destino cuando tiene interfaz (si el destino es árabe, la del navegador o inglés).
  También se fija a mano en Ajustes.
- **Biblioteca**: cada libro abierto (desde disco o del Top 100) queda
  registrado con título, autor, formato, portada (miniatura JPEG de la portada
  del EPUB o de la 1.ª página del PDF), número de páginas/capítulos, el punto
  exacto por el que ibas y la última lectura. La pantalla de inicio muestra
  "Continuar leyendo" (los 6 más recientes) y el botón "Seguir leyendo"; el
  icono de estantería de la barra abre la biblioteca completa. Al pulsar un
  libro se reabre donde lo dejaste. El índice vive en **localStorage**
  (`pdfr.library`); el fichero en sí, en IndexedDB (base `glosa`, almacén
  `files`), porque localStorage solo admite texto y ~5 MB. Si localStorage se
  llena, se descartan los libros leídos hace más tiempo. Si el fichero no está
  (IndexedDB borrado), la entrada se mantiene y al abrirla pide el fichero.
- **Catálogo Top 100** (pantalla de inicio): los 100 libros más descargados
  de Project Gutenberg en inglés (`/browse/scores/top`, últimos 30 días) y en
  español, italiano y alemán (buscador `l.es` / `l.it` / `l.de` ordenado por
  descargas, 4 páginas de 25), con portada,
  autor y descargas, filtro por título/autor; al pulsar uno se descarga el
  EPUB y se abre en Glosa. Solo funciona servido por el dominio (gutenberg.org
  no envía CORS, así que el servidor lleva un proxy `/gb/`); desde disco avisa. Las listas se cachean 24 h
  en localStorage. **Clásicos en árabe**: Gutenberg no tiene libros en árabe (uno),
  así que la lista es una selección fija de 16 obras de dominio público de
  **Wikisource en árabe** (`WORKS_AR` en `catalog.js`: كليلة ودمنة, ألف ليلة وليلة,
  حي بن يقظان, البخلاء, طوق الحمامة, مقامات الحريري...), ordenada por vistas de 60 días
  (API `prop=pageviews`). Su API admite CORS, así que no necesita proxy y funciona
  hasta desde disco. Al abrir una obra se descarga su página principal y, en orden,
  las subpáginas enlazadas (hasta 60 capítulos, 4 descargas en paralelo), se limpian
  tablas, notas y enlaces, y se monta un HTML que abre `textdoc.js` como cualquier
  libro (y queda en la biblioteca).
- **Móvil** (≤ 980 px): la barra se reduce a logo, título del libro abierto
  con el % leído y su barrita de progreso, y un botón hamburguesa; abrir, par
  de idiomas,
  navegación, zoom, vista, buscador y paneles se pliegan en un desplegable que
  se cierra al elegir una acción o al tocar el texto.
- **Vista Página**: render fiel del PDF (pdf.js) con capa de texto clicable,
  zoom, ajuste al ancho, scroll continuo con render perezoso.
- **Vista Texto**: el texto del PDF reconstruido en párrafos (o los capítulos
  del EPUB/HTML) con la fuente, tamaño, interlineado, ancho de columna y
  alineación que quieras.
- **Popup de traducción**: categoría gramatical, traducciones por acepción,
  definición corta, lema (p. ej. "houses → house"), pronunciación (voz del
  sistema), guardar en vocabulario, enlace a Wiktionary.
- **Frases**: selecciona varias palabras y se traducen con la consulta online.
- **Modo claro / oscuro / sistema**, con inversión opcional del PDF en oscuro.
- **Vocabulario**: lista de palabras guardadas con libro y página, exportable a CSV.
- **Recuerda el punto exacto** por el que ibas en cada libro: unidad (página o
  capítulo), párrafo que cruza la línea de lectura y fracción de ese párrafo
  (`rec.pos = {block, offset}` en la biblioteca). Se guarda 400 ms después de
  parar el scroll y al cerrar u ocultar la pestaña; al reabrir se vuelve a ese
  punto y se reaplica hasta 700 ms por si la página se remaqueta (fuente web
  que carga tarde, imágenes). Un **marcador magenta** pegado al contenido
  señala la línea donde lo ya leído empieza a ocultarse.
- **Buscador** de palabras en la barra superior.
- Atajos: `←` `→` página, `+` `-` zoom, `T` vista, `D` tema, `O` abrir, `Esc` cerrar.

Un PDF escaneado sin capa de texto (OCR) no tiene palabras que pulsar: la
vista Texto avisa de ello por página.

## Cuenta opcional (Google) y Google Drive

Sin cuenta, Glosa funciona como siempre. Con «Iniciar sesión con Google» (icono de la barra):

- La **biblioteca se sincroniza** entre dispositivos: qué libros has abierto, de dónde
  (Gutenberg, Wikisource, Drive o fichero local) y el punto exacto por el que ibas. Los
  libros no se suben nunca: en otro dispositivo, los de Gutenberg/Wikisource/Drive se
  vuelven a descargar al abrirlos; los ficheros locales hay que volver a elegirlos.
  Conflictos: gana la posición más reciente, igual que entre pestañas.
- **Abrir de Google Drive**: selector de Google con permiso `drive.file` (solo los
  ficheros que eliges; Glosa no ve el resto de tu Drive). El fichero se descarga
  directamente de Google al navegador. En pantallas estrechas el selector de Google
  no es usable (no tiene versión móvil), así que ahí se abre el selector de ficheros
  del sistema, que en Android e iOS incluye Google Drive; el libro queda como fichero
  local (la posición se sincroniza; en otro dispositivo hay que volver a elegirlo).

Módulos: `js/auth.js` (sesión), `js/sync.js` (sincronización), `js/drive.js` (Drive).
Servidor: `api.php` (rutas en su cabecera) sobre `usuarios-lib.php`, con su propia SQLite
(`glosa-usuarios.sqlite`) en la carpeta de datos `GLOSA_DATA_DIR`. Tests:
`php tools/test-usuarios.php`.

Configuración (en `glosa.env` de la carpeta de datos, o en un `.env` junto a `index.php`;
`index.php` las inyecta como `<meta>` y sin ellas no aparece el inicio de sesión):

```
GOOGLE_CLIENT_ID=…apps.googleusercontent.com   # cliente OAuth «Aplicación web»
GOOGLE_API_KEY=AIza…                           # clave de API restringida a Google Picker API
GOOGLE_APP_ID=123456789012                     # número del proyecto (para que el selector autorice los ficheros elegidos)
```

En Google Cloud: Drive API y Google Picker API habilitadas; scopes `openid`, `email`,
`profile` y `drive.file` (no sensibles, sin verificación); orígenes JavaScript
autorizados con el dominio de la app (y `http://localhost:8080` para desarrollo).

## Diccionarios

Se cargan bajo demanda (solo el par activo) desde `dict/`:

| Fichero | Lemas | Tamaño | Fuente |
|---|---|---|---|
| `en-es.js` | 55.295 (+46.769 flexiones) | 10,5 MB | WikDict eng-spa + FreeDict eng-spa 0.3.1 |
| `es-en.js` | 108.462 | 14 MB | kaikki.org (Wiktionary inglés, entradas en español) |
| `en-it.js` | 47.921 | 8,2 MB | WikDict eng-ita |
| `en-de.js` | 62.561 | 11,6 MB | WikDict eng-deu |
| `es-it.js` | 10.353 | 1,1 MB | WikDict spa-ita |
| `es-de.js` | 11.185 | 1,3 MB | WikDict spa-deu |
| `it-es.js` | 13.809 | 1,5 MB | WikDict ita-spa + FreeDict ita-spa 2025.11.23 |
| `it-en.js` | 28.266 | 3,5 MB | WikDict ita-eng + FreeDict ita-eng 2025.11.23 |
| `it-de.js` | 8.032 | 1,0 MB | WikDict ita-deu |
| `de-es.js` | 36.076 (+43.246 flexiones) | 6,5 MB | WikDict deu-spa + FreeDict deu-spa 2025.11.23 |
| `de-en.js` | 63.756 (+71.565 flexiones) | 11,6 MB | WikDict deu-eng |
| `de-it.js` | 30.839 (+40.208 flexiones) | 5,6 MB | WikDict deu-ita |
| `es-ar.js` | 80.216 (+198.097 flexiones) | 13,9 MB | Wiktionary español (1.622 directos) + pivote es→en→ar |
| `en-ar.js` | 87.424 | 3,7 MB | FreeDict eng-ara 0.6.3 |
| `ar-en.js` | 41.890 (+240.084 flexiones) | 7,6 MB | kaikki.org (Wiktionary, árabe) + FreeDict ara-eng 0.6.3 |
| `ar-es.js` | 31.099 (+233.570 flexiones) | 8,8 MB | pivote ar→en→es (`tools/build_pivot.py`) |
| `zh-en.js` | 121.185 | 10,5 MB | CC-CEDICT (MDBG), con pinyin y mapa tradicional → simplificado |
| `zh-es.js` | 110.414 | 13,1 MB | pivote zh→en→es (`tools/build_pivot.py`), conserva el pinyin |

- **WikDict** (Wiktionary vía DBnary, CC BY-SA 3.0):
  `https://download.wikdict.com/dictionaries/tei/including_reverse/<src>-<dst>.tei`
  (códigos de tres letras: eng, spa, ita, deu). **FreeDict** (GPL):
  `https://download.freedict.org/dictionaries/<par>/<versión>/freedict-<par>-<versión>.src.tar.xz`.
  Los pares con italiano o español como origen son cortos porque las fuentes
  lo son (a `ita-eng` le falta hasta *parlare*); la consulta online cubre el
  resto. Mejorarlos pasaría por los volcados de kaikki.org del Wiktionary
  inglés para italiano y alemán, como ya se hizo con `es-en.js`.
- **Árabe como destino** (árabe estándar, no dariya): `en-ar.js` viene de FreeDict
  eng-ara tal cual (sin categorías gramaticales). `es-ar.js` lo construye
  `tools/build_es_ar.py` con dos fuentes: las traducciones directas al árabe del
  **Wiktionary español** (volcado `kaikki.org/eswiktionary/Español/`, 105 MB, CC BY-SA;
  solo ~1.700 lemas, pero los más comunes y con la definición en español) y, para el
  resto, un **pivote** español → inglés (glosas de `es-en.js`) → árabe (`en-ar.js`), que
  conserva la glosa inglesa como contexto. El pivote mete algo de ruido (una glosa
  inglesa ambigua puede traer un árabe que no toca); las acepciones directas van
  siempre primero. Las traducciones se pintan de derecha a izquierda (`popup--rtl`,
  `unicode-bidi: plaintext`).
- **Árabe como idioma de lectura**: `ar-en.js` lo construye `tools/build_kaikki_ar.py` con
  el volcado de kaikki.org del Wiktionary inglés para el árabe (77.000 entradas con sus
  **formas flexionadas**: conjugaciones, plurales y casos van a `infl`, 240.000 formas) más
  FreeDict ara-eng; `ar-es.js` sale por pivote ar→en→es con `tools/build_pivot.py`
  (herramienta genérica: primer diccionario con glosas inglesas + diccionario en→X). Las
  claves van **sin vocales** (harakat), sin tatwil y con alif/ya normalizadas
  (`normalizeAr` en `dictionary.js` hace lo mismo con la palabra pulsada, así que
  funciona con texto vocalizado y sin vocalizar). El lematizador (`candidatesAr`) quita
  clíticos delante (و، ف، ب، ك، ل، ال y combinaciones) y detrás (pronombres, ة/ه, plurales
  ات/ون/ين) y prueba el imperfectivo (يكتب → كتب); el artículo se quita antes de probar
  la palabra tal cual (الكتاب → كتاب, no «el Libro»). La detección de idioma reconoce el
  árabe por la escritura. Con origen árabe la vista Texto va en RTL y con la letra un
  15 % mayor (`body[data-src="ar"]`).
- **Chino como idioma de lectura**: `zh-en.js` lo construye `tools/build_cedict.py` desde
  **CC-CEDICT** (125.000 entradas; claves en simplificado, pinyin con marcas de tono como
  definición, y en `meta.t2s` un mapa de 3.678 caracteres tradicional → simplificado sacado
  de las propias entradas); `zh-es.js` sale por pivote con `tools/build_pivot.py`. El chino
  no separa palabras, así que al pulsar un carácter `Dictionary.segmentAt` busca la palabra
  más larga del diccionario (hasta 6 caracteres) que lo contiene y esa es la que se resalta
  y traduce (图书馆 al pulsar 书, 学生, 每天). Los clásicos de Gutenberg vienen en tradicional:
  con «Libros en chino: mostrar en caracteres simplificados» (Ajustes, activado por defecto)
  el libro se convierte en pantalla carácter a carácter (`Viewer.transformText`), y la
  búsqueda convierte igualmente la palabra pulsada, así que funciona con ambos. Detección
  por escritura (más del 30 % de caracteres han). Tipografía CJK y letra un 20 % mayor
  (`body[data-src="zh"]`). Catálogo «Top 100 en chino»: Gutenberg, buscador `l.zh`.
- **`es-en.js`**: `tools/build_kaikki.py` sobre el volcado de **kaikki.org**
  (CC BY-SA 4.0, `https://kaikki.org/dictionary/Spanish/kaikki.org-dictionary-Spanish.jsonl.gz`,
  91 MB). Las glosas son en inglés; las 400.000 conjugaciones regulares no se
  guardan (las deduce el lematizador de `dictionary.js`), solo las irregulares
  y las formas ambiguas que son a la vez palabra propia (era → ser).
- Los TEI alemanes de WikDict traen más de un millón de "flexiones", casi
  todas perífrasis de varias palabras ("werde gemacht werden", "dem Haus"):
  `build_dict.py` descarta las de más de una palabra y, con `--prune-infl de`,
  también las que el lematizador alemán del JS ya deduce (gehst → gehen).
  Sin eso `de-en.js` pesaba 48 MB.

Regenerar (los ficheros fuente viven en `tools/`, que no se sube):

```
python tools/build_dict.py tools/wikdict-eng-spa.tei tools/eng-spa/eng-spa.tei -o dict/en-es.js --src en --dst es
python tools/build_kaikki.py tools/kaikki-spanish.jsonl.gz -o dict/es-en.js
python tools/build_dict.py tools/wikdict-eng-ita.tei -o dict/en-it.js --src en --dst it --name "English → Italiano"
python tools/build_dict.py tools/wikdict-deu-spa.tei tools/deu-spa/deu-spa.tei -o dict/de-es.js --src de --dst es --name "Deutsch → Español" --prune-infl de
python tools/build_dict.py tools/eng-ara/eng-ara.tei -o dict/en-ar.js --src en --dst ar --name "English → العربية"
python tools/build_es_ar.py tools/kaikki-eswiktionary-espanol.jsonl.gz -o dict/es-ar.js
python tools/build_kaikki_ar.py tools/kaikki-arabic.jsonl.gz tools/ara-eng/ara-eng.tei -o dict/ar-en.js
python tools/build_pivot.py dict/ar-en.js dict/en-es.js -o dict/ar-es.js --name "العربية → Español"
python tools/build_cedict.py tools/cedict.txt.gz -o dict/zh-en.js
python tools/build_pivot.py dict/zh-en.js dict/en-es.js -o dict/zh-es.js --name "中文 → Español"
```

(y así con cada par; en Windows, `PYTHONUTF8=1` para que las flechas del
`--name` no se corrompan). Otro par a partir de un TEI de FreeDict/WikDict
(después hay que añadirlo a `PAIRS` en `js/dictionary.js`; las banderas y
nombres nativos viven en `js/langs.js`):

```
python tools/build_dict.py tools/wikdict-fra-spa.tei -o dict/fr-es.js --src fr --dst es --name "Français → Español"
```

Lematización (`js/dictionary.js`, una función `candidatesXx` por idioma de
origen): inglés por reglas de sufijos + tabla de irregulares + flexiones del
diccionario; español por terminaciones verbales (las tres conjugaciones,
enclíticos, cambios ortográficos c/qu, g/gu, z/c), plurales, femeninos,
-mente, -ísimo, diminutivos, más las flexiones irregulares del fichero;
italiano por terminaciones verbales (probando primero la conjugación que
marca la vocal temática: voleva → volere antes que volare), plurales
(-i/-e, -chi/-ghi), enclíticos (dirglielo), -mente, -issimo y diminutivos;
alemán por declinación (-e, -en, -er, -es, -em, -n, -s, con deshacer el
Umlaut: Häuser → Haus), raíz verbal + -en (gehst → gehen, sagte → sagen),
participios ge-...-t/-en con prefijos separables (aufgemacht → aufmachen) y
comparativos/superlativos (größer → groß). En italiano la palabra tras el
apóstrofo se busca aparte (l'amore → amore).

Formato del fichero (también se puede cargar desde Ajustes como `.json` o `.js`;
el `.js` registra `window.PDFR_DICTS["<src>-<dst>"]`):

```
{
  "meta":    {"name": "English → Español", "src": "en", "dst": "es", "license": "...", "entries": 55295},
  "entries": {"house": [{"p": "n", "s": [{"t": ["casa"], "d": "A structure built or serving as an abode..."}]}]},
  "infl":    {"houses": "house"}
}
```

`p` = categoría (`n`, `v`, `adj`, `adv`...), `s` = acepciones, `t` =
traducciones, `d` = definición corta opcional, `infl` = forma flexionada → lema.
Se carga como `<script>` (asigna `window.PDFR_DICT`) porque `fetch()` de un JSON
está bloqueado en `file://`.

### Consulta online (opcional, activada por defecto)

Si la palabra no está en el diccionario local, o al seleccionar una frase, se
consulta **MyMemory** (traducción) y **Wiktionary** (definiciones). Solo se envía
el texto consultado. Se desactiva en Ajustes.

## Estructura

```
index.html            interfaz (textos con data-i18n)
index.php             producción: registra la visita y sirve index.html
visitas-lib.php       log de visitas (SQLite fuera del webroot, país por rangos IP, informes)
.env.example          plantilla de configuración (el .env real no se sube)
css/app.css           estilos (tokens claro/oscuro, contenido de EPUB/HTML)
js/i18n.js            textos de la interfaz en español, inglés, italiano y alemán
js/dictionary.js      pares, carga bajo demanda, lematización EN/ES/IT/DE/AR, consulta local y online, detección de idioma
js/langs.js           idiomas: banderas SVG, chivato de la barra y popup "Idioma de lectura / Idioma al que traducir"
js/epub.js            EPUB: zip (JSZip), OPF, índice, capítulos saneados, imágenes a blob
js/textdoc.js         HTML y TXT sueltos → capítulos
js/viewer.js          PDF (páginas, capa de texto, vista Texto) y libros por capítulos; navegación, zoom
js/popup.js           palabra bajo el cursor, resaltado, popup
js/catalog.js         Top 100 de Gutenberg: listas vía proxy /gb/, modal, descarga y apertura
js/library.js         biblioteca: índice + posición exacta en localStorage, ficheros en IndexedDB, "Continuar leyendo" y modal
js/settings.js        ajustes persistentes (par, idioma de interfaz, tema, fuente, opciones)
js/vocab.js           vocabulario guardado y exportación CSV
js/app.js             arranque, barra, atajos, drag & drop, detección de idioma al abrir
dict/<src>-<dst>.js   los diccionarios (generados; ver tabla de arriba)
tools/build_dict.py   conversor TEI (FreeDict/WikDict) → JS
tools/build_kaikki.py conversor kaikki.org (jsonl.gz) → JS
tools/build_es_ar.py  español → árabe: Wiktionary español + pivote es→en→ar
tools/build_kaikki_ar.py árabe → inglés: kaikki (con formas flexionadas) + FreeDict ara-eng
tools/build_pivot.py  diccionario por pivote genérico (A→en + en→X → A→X)
tools/build_cedict.py chino → inglés desde CC-CEDICT (pinyin + mapa tradicional → simplificado)
tools/geo-import.php  carga la tabla IP → país en la BD de visitas (cron mensual)
vendor/pdf*.js        pdf.js 3.11.174 (build legacy, funciona en file://)
vendor/jszip.min.js   JSZip 3.10.1 (lectura de EPUB)
```

## Contador de visitas

En producción `index.php` registra cada visita antes de servir `index.html`: día, país,
idioma del navegador y procedencia externa. Es anónimo y sin cookies: la IP no se guarda,
el visitante es un hash diario de IP+UA+salt que solo sirve para contar únicos. Los bots
conocidos no cuentan. Todo va a una SQLite fuera del webroot (carpeta indicada por la
variable de entorno `GLOSA_DATA_DIR`; retención 400 días).

- **País**: tabla local de rangos IP → país (`geo-whois-asn-country` del proyecto
  [sapics/ip-location-db](https://github.com/sapics/ip-location-db), dominio público, ~550.000
  rangos IPv4+IPv6), sin llamadas a servicios externos. La carga y refresca
  `tools/geo-import.php` (cron mensual).
- **Configuración**: fichero `glosa.env` en la carpeta de datos (fuera del webroot) o `.env`
  en local (ignorado por git), plantilla en `.env.example`. La librería común es
  `visitas-lib.php`.

## Gotchas

- Desde `file://` pdf.js no puede arrancar su worker ("Setting up fake
  worker" en consola) y renderiza en el hilo principal: funciona, solo es algo
  más lento en PDF pesados. Servido por HTTP usa el worker normal.
- El visor lleva `overflow-anchor: none` y compensa él mismo el scroll cuando
  una página o sección de arriba cambia de altura (alturas estimadas hasta
  conocer las reales, secciones de la vista Texto al rellenarse). Si el
  navegador anclase también, el desplazamiento se duplicaría.
- Las fuentes "Google Fonts" del selector necesitan internet; el resto son las
  del sistema.
- El contenido de un EPUB/HTML se sanea (sin scripts, estilos, formularios ni
  atributos `on*`/`style`) y se muestra con la tipografía de Glosa, no la del
  libro. Las imágenes del EPUB salen como blob URLs que se revocan al abrir
  otro libro.
- Al montar los capítulos en pantalla los nodos se MUEVEN del cargador al DOM:
  cualquier muestreo de texto posterior (detección de idioma) debe leerse de
  las secciones renderizadas, no de `book.chapters[i].body`.
- Los EPUB de Gutenberg empiezan con el aviso legal en inglés: por eso la
  detección de idioma muestrea el 25/50/75 % del libro y no el principio.
- La posición de lectura se ancla al párrafo, no al `scrollTop`: así
  sobrevive a cambios de ancho, de tamaño de letra y de fuente. En PDF (sin
  párrafos) se guarda la fracción de página.
- El grafo de `graphify-out/` se construye con `.graphifyignore` excluyendo
  `vendor/` y `dict/`; sin él, `graphify update .` mete los minificados y los
  datos de diccionario y el grafo pasa de ~240 a ~4.200 nodos.
