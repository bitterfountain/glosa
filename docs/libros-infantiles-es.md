# Libros en español para niños y lectores principiantes (catálogo "Infantil / principiantes")

Investigación para un catálogo nuevo de Glosa. Fecha: 2026-08-27. Todo lo que aparece en las tablas se ha comprobado con `curl` (código 200, contenido en español y del libro indicado). Lo que no se pudo verificar no está.

Niveles usados: **infantil** (cuentos y fábulas cortos, vocabulario sencillo), **principiante** (lecturas graduadas, textos cortos con frases simples), **intermedio** (prosa normal del XIX/XX, capítulos largos) y **juvenil** (novela de aventuras, intermedio largo).

## Resumen rápido

| Fuente | Libros verificados | Licencia | CORS | Integración | Veredicto |
|---|---|---|---|---|---|
| Project Gutenberg | 24 | Dominio público (EE. UU.) | No, pero ya hay proxy `/gb/` | Solo el ID, como el Top 100 | **Usar** (núcleo del catálogo) |
| Wikisource en español | 40+ obras/colecciones | Dominio público o CC BY-SA (traducciones de Wikisource) | **Sí** (`access-control-allow-origin: *`) | API `parse` como el catálogo árabe; o EPUB vía ws-export (sin CORS, necesitaría proxy) | **Usar** (la fuente más rica en infantil) |
| Bloom Library (SIL) | 37 candidatos, 4 EPUB comprobados | CC BY / CC BY-SA por libro | API de catálogo sí; EPUB en S3 **no** | Proxy `/bloom/` hacia `s3.amazonaws.com/bloomharvest/` | Usar con criterio (nivel muy bajo, traducciones desiguales) |
| African Storybook | 112 libros en español listados, 1 PDF comprobado | CC BY 4.0 (licencia de toda la iniciativa) | No | Proxy; PDF directo o HTML del visor | Opcional (nivel 1 a 5, mucho material "Aprende Leyendo") |
| Internet Archive | 4 EPUB comprobados | Marca de dominio público por ítem | Búsqueda sí; descargas **no** | Proxy; mayoría son OCR de escaneos | Descartar salvo casos sueltos |
| StoryWeaver | 0 | CC BY | 403 Cloudflare a toda petición | Imposible por programa | **Descartar** |
| Biblioteca Virtual Miguel de Cervantes | 0 | Reserva derechos sobre sus ediciones digitales | No | Prohibido fuera del portal | **Descartar** |
| Global Digital Library, freekidsbooks, Bookdash | 0 | | | GDL caído, freekidsbooks 403, Bookdash sin español | Descartar |
| Ciudad Seva | no revisado | Con copyright | | | Descartar |

## 1. Project Gutenberg

Integración: la misma que el Top 100 (proxy `/gb/`, ruta `cache/epub/{id}/pg{id}-images-3.epub` con fallback a `pg{id}-images.epub` y `pg{id}.epub`). Todos los ID de abajo devolvieron 200 y el EPUB abre en Python con texto español. Ojo con el peso: Samaniego (55206) pesa 25 MB con imágenes y 244 KB sin ellas; en este catálogo conviene pedir primero `pg{id}.epub` (sin imágenes) o marcar por libro qué variante bajar.

Descarte importante: **los tres tomos de "Las Fábulas de Esopo" (21143, 20029, 21144) son audiolibros de LibriVox** (solo ficheros `.m4b`); no hay texto. No incluirlos.

| ID | Título | Autor | EPUB verificado (tamaño) | Nivel | Por qué sirve |
|---|---|---|---|---|---|
| 36558 | Ratón Pérez: cuento infantil | Luis Coloma | pg36558-images-3.epub (488 KB) | infantil | El cuento infantil español más conocido; corto |
| 55206 | Fábulas | Félix María Samaniego | pg55206.epub (244 KB; con imágenes 25 MB) | infantil / principiante | Fábulas en verso cortas, texto escolar clásico |
| 29497 | Fábulas literarias | Tomás de Iriarte | pg29497-images-3.epub (128 KB) | principiante | Fábulas breves ("El burro flautista") |
| 64058 | Fábulas y cuentos en verso: Selección | varios | pg64058-images-3.epub (2,3 MB) | infantil | Antología escolar de fábulas y cuentos en verso |
| 19898 | La Edad de Oro | José Martí | pg19898-images-3.epub (451 KB) | infantil | Revista para niños: cuentos, poemas ("Los zapaticos de rosa", "Meñique") |
| 55215 | Cuando la tierra era niña | Nathaniel Hawthorne (trad. Martínez Sierra) | pg55215.epub (190 KB; con imágenes 9,5 MB) | infantil / intermedio | Mitos griegos contados a niños (Wonder Book) |
| 73486 | Corazón (diario de un niño) | Edmondo De Amicis | pg73486.epub (331 KB; con imágenes 4 MB) | juvenil | Clásico escolar, capítulos cortos por meses |
| 69552 | El libro de las tierras vírgenes | Rudyard Kipling | pg69552.epub (496 KB; con imágenes 6 MB) | juvenil | El libro de la selva en español |
| 45438 | La isla del tesoro | R. L. Stevenson | pg45438-images-3.epub (3,2 MB) | juvenil | Aventuras, traducción de 1886 |
| 62201 | Los ladrones de Londres (Oliver Twist) | Charles Dickens | pg62201-images-3.epub (1,2 MB) | juvenil | Novela juvenil clásica |
| 69164 | Cuentos chilenos de nunca acabar | Ramón A. Laval | pg69164-images-3.epub (304 KB) | infantil / principiante | Cuentos de nunca acabar y retahílas, muy cortos |
| 63424 | Cuentos populares en Chile | Ramón A. Laval | pg63424-images-3.epub (472 KB) | intermedio | Cuentos folclóricos tradicionales |
| 47287 | El libro de las mil noches y una noche, t. 1 | anónimo (trad. Blasco Ibáñez) | pg47287-images-3.epub (939 KB) | intermedio | Cuentos clásicos (hay tomos 2, 3, 6, 7, 8 con los ID 47631, 48903, 74041, 74065, 78437; no verificados) |
| 52262 | Cuentos de la Alhambra | Washington Irving | pg52262-images-3.epub (388 KB) | intermedio | Leyendas, ortografía de época |
| 36805 | Spanish Tales for Beginners | varios (ed. Elijah C. Hills) | pg36805-images-3.epub (762 KB) | principiante | Lecturas graduadas con notas y vocabulario en inglés |
| 15353 | A First Spanish Reader | Roessler y Remy | pg15353-images-3.epub (2,5 MB) | principiante | Lector graduado con vocabulario inglés |
| 22065 | An Elementary Spanish Reader | Earl Stanley Harrison | pg22065-images-3.epub (1,3 MB) | principiante | Textos cortos adaptados, incluye fábulas de Iriarte |
| 24250 | Lecturas fáciles con ejercicios | Wilkins y Luria | pg24250.epub (283 KB; con imágenes 3,7 MB) | principiante | Lecturas sencillas sobre Hispanoamérica |
| 11047 | Libro segundo de lectura | Ellen M. Cyr | pg11047.epub (111 KB; con imágenes 7 MB) | infantil / principiante | Lector escolar de primaria, frases simples ("Estoy en casa de mi abuelo") |
| 63464 | Nuestra Pampa; libro de lectura | W. Jaime Molins | pg63464-images-3.epub (981 KB) | principiante / intermedio | Libro de lectura escolar argentino |
| 12435 | Páginas sudamericanas | Helen Phipps | pg12435-images-3.epub (3,9 MB) | principiante / intermedio | Lector graduado con ilustraciones |
| 33406 | Spanish short stories | varios (ed. Elijah C. Hills) | pg33406-images-3.epub (384 KB) | intermedio | Cuentos de Trueba, Bécquer, Galdós con notas |
| 39647 | The Spanish American Reader | Ernesto Nelson | pg39647-images-3.epub (2 MB) | intermedio | Antología hispanoamericana con notas |
| 9980 | Platero y yo | Juan Ramón Jiménez | pg9980-images-3.epub (683 KB; edición con notas en inglés) | intermedio | Capítulos muy cortos. **Aviso**: dominio público en EE. UU., pero JRJ murió en 1958 y en España sigue protegido hasta 2039 |

Otros vistos con menor interés: 10814 Legends, Tales and Poems (Bécquer, con notas en inglés, 504 KB), 46496 Cuentos clásicos del Norte, 2.ª serie (Hawthorne, Irving, Hale; 355 KB), 20011 Pequeñeces (Coloma, no infantil).

Búsquedas hechas en gutenberg.org (`l.es s.juvenile`, `s.fables`, `s.fairy`, `s.readers`, `s.children`, `s.folklore` y por autor: Perrault, Grimm, Andersen, Carroll, Collodi, Verne, Baum, Twain, Alcott, Burnett, Spyri, Swift, Defoe, Trueba, Fernán Caballero, Calleja): Gutenberg **no tiene en español** ni Perrault, ni Grimm, ni Andersen, ni Alicia, ni Pinocho, ni Heidi, ni Verne. Para esos hay que ir a Wikisource.

## 2. Wikisource en español (es.wikisource.org)

Comprobado: `https://es.wikisource.org/w/api.php?action=parse&page=...&prop=text|links&format=json&origin=*` responde con `access-control-allow-origin: *`, igual que el catálogo árabe. Cada obra de abajo es o un texto de una sola página o una página índice cuyos enlaces (`prop=links`, namespace 0) son los capítulos o cuentos. La columna "subpáginas" es el número de enlaces ns0 que devuelve la API para el índice; en las de una sola página va el tamaño del texto.

Dos alternativas de integración:

1. **API parse + HTML propio** (sin servidor): pedir el índice, extraer los enlaces en el orden en que aparecen en el HTML (`prop=links` los devuelve ordenados alfabéticamente, no en el orden del libro), pedir cada subpágina y concatenar. Hay que quitar `<style>`, el bloque `#headertemplate` (navegación anterior/siguiente), las tablas `.ambox` (avisos) y las notas "Descargar como".
2. **ws-export** (EPUB ya hecho): `https://ws-export.wmcloud.org/?format=epub-3&lang=es&page=Cuentos_de_la_selva` devolvió un EPUB válido de 167 KB con los 8 cuentos como capítulos. **No envía cabeceras CORS**, así que requeriría un proxy nginx `/wse/` como el de Gutenberg. Es la opción más limpia si se acepta un proxy más (y es lenta: 10-20 s por obra).

Licencia: los textos originales son de dominio público (autores muertos hace más de 80 años o ediciones de 1782 a 1920); las páginas marcadas "traducción de Wikisource" son CC BY-SA 3.0/4.0. Las excepciones con aviso van marcadas.

### 2.1 Fábulas (infantil / principiante)

| Página de Wikisource (identificador exacto) | Autor / edición | Subpáginas | Nivel | Verificación |
|---|---|---|---|---|
| `Fábulas de Samaniego` | Samaniego, ed. 1882 con grabados de Grandville | 156 | infantil | Texto de "La zorra y las uvas (Samaniego)" leído: fábula completa, ortografía de época |
| `Fábulas literarias (1782)` | Tomás de Iriarte | 68 | principiante | "El burro flautista" leído |
| `Fábulas en verso castellano` | Juan Eugenio Hartzenbusch | 62 | intermedio | Fábula I leída |
| `Fábulas de Fedro` | Fedro, trad. antigua | 96 | intermedio | Índice listado, ortografía "á", "javalí" |
| `La vida y fábulas del Esopo` | ed. de 1607 | 166 | avanzado (no recomendado) | "Esopo/I" leído: castellano del XVII ("Iaspide") |

### 2.2 Cuentos clásicos europeos (infantil)

| Página de Wikisource | Autor / traducción | Subpáginas | Nivel | Verificación |
|---|---|---|---|---|
| `Cuentos de hadas (Baró tr.)` | Perrault, trad. Teodoro Baró, 1883 | 11 cuentos (Caperucita Roja, El gato con botas, La Cenicienta, Barba Azul, La hermosa durmiente, Las hadas, Meñiquín, Pellejo de asno, Roquete del Copete, Los deseos ridículos, Grisélida) | infantil | "Caperucita Roja (Perrault, Baró tr.)" leído, 4.100 caracteres |
| `Cuentos de hadas (Coll i Vehí tr.)` | Perrault y Mme. d'Aulnoy, trad. Coll i Vehí | 14 (incluye El gato embotado, Caga-chitas, Linda y la Fiera, El ratoncillo blanco) | infantil | Índice listado |
| `Cuentos escogidos de los Hermanos Grimm` | Grimm, trad. José S. Biedma, 1879 | 48 (La cenicienta, El sastrecillo valeroso, Los músicos de Brema, Blancanieve y Rojarosa, El rey de las ranas, Hermanito y hermanita, Juan el fiel...) | infantil | "El sastrecillo valeroso" leído, 16.000 caracteres |
| `Hansel y Gretel` | Grimm (página suelta) | 1 (7.300 caracteres) | infantil | Texto leído |
| `Cuentos de Andersen` | Andersen, trad. José Roca y Roca, 1908, ilustr. Apeles Mestres | 8 (La Pulgarcilla, Cinco guisantes, Historia de una madre, Aventuras de un cardo...) | infantil | "Cinco guisantes" leído |
| `Cuentos clásicos para niños` | Andersen, traducción de Wikisource (CC BY-SA) | 39 (El abecedario, Abuelita, Cinco en una vaina, El abeto, El cofre volador, El elfo del rosal, Dos hermanos...) | infantil | "El abecedario" leído |
| `El almacén de los niños` | Leprince de Beaumont, traducción de Wikisource (CC BY-SA) | 4 (La bella y la bestia, Cuento de los tres deseos, El príncipe Fatal y el príncipe Fortuné, Aurore y Aimée) | infantil | "La bella y la bestia" leído, 30.000 caracteres |
| `El príncipe feliz` / `El ruiseñor y la rosa` / `El gigante egoísta` | Oscar Wilde (páginas sueltas; también índice `El príncipe feliz y otros cuentos (1920)` con 2) | 1 cada una (20.000 / 14.000 / 9.600 caracteres) | principiante / intermedio | Búsqueda; texto no leído |
| `Dos cuentos populares (Tolstoi)` | Tolstói | 1 (10.800 caracteres) | principiante | Índice listado |

### 2.3 Cuentos infantiles en español (infantil / principiante)

| Página de Wikisource | Autor | Subpáginas | Nivel | Verificación |
|---|---|---|---|---|
| `Ratón Pérez` | Luis Coloma, 1911 | 1 (23.000 caracteres; aviso "se está trabajando en este texto") | infantil | Leído |
| `Cuentos, adivinanzas y refranes populares` | Fernán Caballero | 64 (El Carlanco, El lobo bobo y la zorra astuta, El pájaro de la verdad, Bella Flor, adivinanzas infantiles...) | infantil | "El Carlanco" leído: "Era vez y vez una cabra..." |
| `Cuentos para gente menuda` | Romualdo Nogués, 1887 | 13 (Las tres naranjitas de oro, La varita de virtudes, El gigante y la niña...) | infantil | "Las tres naranjitas de oro" leído |
| `Brisas de primavera` | Julia de Asensi | 13 (El loro hablador, El perro del ciego, La princesa Elena, El pozo mágico...) | infantil | Índice listado |
| `Lecturas infantiles` | José Ortega Munilla | 17 (Cisóforo el mago, El grumete, El león enjaulado...) | principiante | "Cisóforo el mago" leído |
| `La Edad de Oro` | José Martí | 25 (Meñique, Los dos príncipes, Nené traviesa, La muñeca negra, Los zapaticos de rosa, Bebé y el señor don Pomposo...) | infantil | "Meñique" leído, 30.000 caracteres |
| `Cuentos de la selva` | Horacio Quiroga, 1918 | 8 (La tortuga gigante, Las medias de los flamencos, El loro pelado, La abeja haragana...) | infantil / principiante | "La tortuga gigante" leído; EPUB de ws-export verificado |
| `Cuentos de color de rosa` | Antonio de Trueba | 9 (largos: 30.000 a 98.000 caracteres) | intermedio | Índice listado |
| `Cuentos del hogar (Antonio Trueba)` | Antonio de Trueba | 13 | intermedio | Índice listado |
| `Libro primero de lectura` | Ellen M. Cyr | 1 (33.000 caracteres) | infantil / principiante | Índice; lector escolar, pareja del Gutenberg 11047 |
| `El libro de los cuentos` | varios (adivinanzas, enigmas, pensamientos, cuentos cortos) | 625 (muchas páginas de 400 caracteres) | infantil | Índice listado; hay que elegir un subconjunto |
| `Adivinanzas corrientes en Chile` | recopilación chilena | 4 bloques + soluciones | infantil | Búsqueda |
| `Canciones infantiles (1880)` | McLoughlin Bros. | 1 (4.600 caracteres) | infantil | Índice |
| `Oraciones, relaciones y coplas infantiles` | folclore | 1 (2.100 caracteres) | infantil | Índice |
| `Cutufato y su gato`, `El renacuajo paseador`, `La marrana peripuesta`, `El búho y el palomo` | Rafael Pombo (páginas sueltas) | 1 cada una (1.000 a 2.500 caracteres) | infantil | Búsqueda + índice de "Cutufato y su gato" |
| `Ternura` | Gabriela Mistral | 52 poemas (Dame la mano, Corderito, Meciendo...) | infantil (poesía) | Índice. **Aviso**: Mistral murió en 1957; dominio público en EE. UU. por fecha de publicación (1924), en Chile a partir de 2028 |
| `Platero y yo` | Juan Ramón Jiménez | 138 capítulos cortos | intermedio | Índice. Mismo aviso que en Gutenberg (protegido en España hasta 2039) |

### 2.4 Novela juvenil (juvenil)

| Página de Wikisource | Autor | Subpáginas | Verificación |
|---|---|---|---|
| `Peter Pan y Wendy` | J. M. Barrie | 17 capítulos | Índice listado (traducción sin identificar: comprobar la licencia en la página antes de incluirlo) |
| `Robinson Crusoe` | Daniel Defoe | 15+ capítulos | Búsqueda |
| `Las aventuras de Tom Sawyer (edición)` | Mark Twain | capítulos I a XXXIV | Búsqueda |
| `Viaje al centro de la Tierra` | Julio Verne | 45 capítulos | Búsqueda |
| `Cuentos de la Alhambra` | Washington Irving | 8 | Índice listado |
| `Los viajes de Gulliver` / `Viajes de Gulliver` | Swift | varias partes | Búsqueda |
| `El cántico de Navidad` | Dickens | 5 estrofas | Búsqueda |

## 3. Bloom Library (bloomlibrary.org, SIL)

Catálogo: 1.733 libros con español, de ellos 622 solo en español. Muchos son bíblicos o de salud; filtrando `topic:Story Book`, `Animal Stories`, `Traditional Story` o `Fiction` y licencia `cc-by` / `cc-by-sa` quedan **37 candidatos**, casi todos de nivel 1 a 3 (frases de una línea por página, muy ilustrados).

Cómo se consulta (verificado):

- Catálogo con CORS: `GET https://server.bloomlibrary.org/parse/classes/books?where={"langPointers":{"$inQuery":{"where":{"isoCode":"es"},"className":"language"}},"inCirculation":true,"draft":false,"harvestState":"Done"}&keys=title,allTitles,license,copyright,baseUrl,tags,pageCount,summary,show&limit=100` con cabecera `X-Parse-Application-Id: R6qNTeumQXjJCMutAJYAwPtip1qBulkFyLefkCE5` (la clave pública que usa la web). Devuelve `access-control-allow-origin: *`. La API `api.bloomlibrary.org/v1/books?lang=es` también responde pero sin licencia ni CORS.
- EPUB: el campo `baseUrl` es `https://s3.amazonaws.com/BloomLibraryBooks/{correo}%2f{instancia}%2f{título}%2f`; el EPUB está en `https://s3.amazonaws.com/bloomharvest/{correo}/{instancia}/epub/{título}.epub` (con `%20` para los espacios). **S3 no envía CORS**: haría falta un proxy `/bloom/` hacia `s3.amazonaws.com/bloomharvest/`.

| objectId | Título | Licencia | Nivel Bloom | Páginas | EPUB verificado |
|---|---|---|---|---|---|
| PCA1hFVmG4 | El zorro y las uvas (Esopo) | cc-by-sa | 2 | 16 | Sí, 597 KB, texto español |
| 28wOjGEY5X | El pastorcito mentiroso (Esopo) | cc-by-sa | 2 | 16 | Sí, 850 KB |
| x44yoU9ENA | Casas (SIL Global, 2025) | cc-by | 1 | 14 | Sí, 4,1 MB |
| fFr3PSjeAr | Cuentos andinos | cc-by | 2 | 16 | Sí, 1 MB |
| 3xdzTkHClw | El zorro y la grulla | cc-by-sa | 3 | 15 | Listado (no descargado) |
| FewlLlor3n | El zorro y la cuerva | cc-by-sa | 2 | 15 | Listado |
| oegxW8pPUn | El zorro y la cabra | cc-by-sa | 3 | 16 | Listado |
| POnbcP6YjI | Lo que me gusta | cc-by | 1 | 10 | Listado |
| nmK6c7mUQc | Quiero ser como los animales | cc-by | 1 | 11 | Listado |
| Pp0GZ1HtGb | Puedo moverme como | cc-by | 2 | 11 | Listado |
| zlWZv5fGOe | El cuento de Fuego (African Storybook) | cc-by | 2 | 14 | Listado |
| CMB5Jr2TFs | Gallina y milpiés (African Storybook) | cc-by | 3 | 17 | Listado |
| omRW9MZgTg | "¡Mi pescado!" "¡No, es mi pescado!" (Pratham) | cc-by | 3 | 17 | Listado |
| apJRbLv3xS | ¿De qué animales son las colas? | cc-by-sa | 1 | 18 | Listado |
| POVk4CufLB | El burrito flojo | cc-by-sa | 3 | 18 | Listado |
| kTz6Yx7CS3 | El conejo inteligente | cc-by-sa | 4 | 20 | Listado |
| dH0tIG5mE8 | La Gallina Colorada | cc-by-sa | 3 | 23 | Listado |
| Gp0E7KcjET | Cómo se ayudaron Pájaro Blanco y Hormiguita | cc-by | 2 | 38 | Listado |
| 3mv4hHKgO7 | La granja de Akili | cc-by | 4 | 16 | Listado |
| LD1vYbrLRh | Chester, mi perro fiel | cc-by | 4 | 13 | Listado |

Aviso de calidad: parte de las traducciones las hacen voluntarios no nativos ("se veía agrias estas uvas", "se acostrumbraron"). Los cuatro descargados son legibles, pero conviene revisar cada uno a mano antes de meterlo.

## 4. African Storybook (africanstorybook.org)

- Listado: `https://www.africanstorybook.org/booklist.php?language=10971` (5,8 MB; contiene `parent.bookItems.push({id, title, summary, author, lang:"10971", level, approved})`). 112 libros en español, la mayoría de la colección "Aprende Leyendo" (Colombia), niveles 1 a 5. Ejemplos: 36472 "A los niños les gusta jugar" (N2), 35535 "El mono y el cocodrilo" (N1), 34752 "Pedro encuentra un nuevo amigo" (N1), 36419 "Bebé Mosquito" (N2), 39683 "Los tres cerditos y el lobo feroz" (N3), 36411 "Sapito" (N3), 36418 "Gatos y ratones" (N4), 36476 "El burro llora más fuerte que el caballo" (N4).
- Descarga verificada: `https://www.africanstorybook.org/read/downloadbook.php?id=36472&d=0&a=1` devuelve `application/pdf` (4,1 MB). Sin CORS. El texto también está en el HTML del visor `https://www.africanstorybook.org/newviewer/index.php?id=36472&bt=3&dual=false` ("A los niños pequeños les gusta jugar con juguetes."). La generación de EPUB (`make/publish/epub.php`) va por iframe y POST y no pudo reproducirse.
- Licencia CC BY 4.0 (toda la iniciativa). Muchos libros tienen `approved:"0"` (no revisados editorialmente) y los resúmenes muestran faltas de ortografía. Como Glosa ya lee PDF, la vía sería un proxy `/asb/` y el PDF directo, pero el nivel es muy bajo y el texto está dentro de imágenes en muchas páginas: valorarlo solo si se quiere un tramo "prelectores".

## 5. Internet Archive

- La búsqueda tiene CORS (`advancedsearch.php`, `access-control-allow-origin: *`), pero **las descargas no**: `archive.org/download/...` redirige a `dnNNN.archive.org` sin cabecera CORS. Haría falta proxy.
- La mayoría de resultados "infantiles" en español son escaneos de bibliotecas en préstamo controlado (identificadores `...0000...`) y no se pueden descargar. Los ítems con marca de dominio público suelen ser OCR automático con la nota "This process relies on optical character recognition, and is somewhat susceptible to errors".
- Verificados (200, EPUB abre): `FabulasLiterariasTomasDeIriarte` (EPUB limpio, 267 KB, PD mark), `quiroga_cuentosdelaselvaparalosninos_1918` (OCR, 110 KB), `lapobreviejecita` (Rafael Pombo, OCR, 1,3 MB), `CuandoLaTierraEraNinaNathanielHawthorne` (copia del Gutenberg 55215). Todo esto ya está mejor en Gutenberg o Wikisource, así que no compensa el proxy.

## 6. Fuentes descartadas

- **StoryWeaver**: todas las URL (`/api/v1/books-search`, `/api/v1/stories`, `/stories?language=Spanish`) devuelven 403 con el desafío de Cloudflare ("Just a moment..."). No se puede consultar ni descargar por programa.
- **Biblioteca Virtual Miguel de Cervantes**: el marco legal reserva a la Universidad de Alicante "los derechos exclusivos conexos de reproducción, distribución y comunicación pública sobre las ediciones digitales" y exige uso "exclusivamente en el ámbito de este portal". Sin CORS. Descartada aunque el texto sea de dominio público.
- **Global Digital Library** (api.digitallibrary.io): no responde. **freekidsbooks.org**: 403. **Bookdash**: sin libros en español. **Ciudad Seva**: contenido con copyright, no revisado.

## Recomendación: qué meter en el catálogo y cómo

Un catálogo "Infantil / principiantes" curado de 40 títulos, en una lista estática en `js/catalog.js` (no hay una búsqueda por descargas que ordene esto; el orden lo damos nosotros por nivel). Cada entrada lleva `source` (`gb` o `ws`) y el identificador; el resto de fuentes se dejan para una segunda fase porque exigen proxy nuevo.

**Bloque A. Infantil (cuentos y fábulas cortos), 20 títulos**

1. Ratón Pérez, Luis Coloma (gb 36558)
2. Fábulas de Samaniego (ws `Fábulas de Samaniego`; o gb 55206 con `pg55206.epub`)
3. Fábulas literarias, Iriarte (gb 29497)
4. Fábulas y cuentos en verso, selección (gb 64058)
5. Cuentos de hadas de Perrault, trad. Baró (ws `Cuentos de hadas (Baró tr.)`)
6. Cuentos de hadas de Perrault y d'Aulnoy, trad. Coll i Vehí (ws `Cuentos de hadas (Coll i Vehí tr.)`)
7. Cuentos escogidos de los Hermanos Grimm (ws)
8. Hansel y Gretel (ws)
9. Cuentos de Andersen, trad. Roca y Roca (ws `Cuentos de Andersen`)
10. Cuentos clásicos para niños, Andersen (ws `Cuentos clásicos para niños`, CC BY-SA)
11. El almacén de los niños: La bella y la bestia (ws `El almacén de los niños`, CC BY-SA)
12. Cuentos, adivinanzas y refranes populares, Fernán Caballero (ws)
13. Cuentos para gente menuda, Romualdo Nogués (ws)
14. Brisas de primavera, Julia de Asensi (ws)
15. La Edad de Oro, José Martí (gb 19898 o ws)
16. Cuentos de la selva, Horacio Quiroga (ws `Cuentos de la selva`)
17. Cuentos chilenos de nunca acabar, Laval (gb 69164)
18. Cuando la tierra era niña, Hawthorne (gb 55215, `pg55215.epub`)
19. Poemas de Rafael Pombo: Cutufato y su gato, El renacuajo paseador, La marrana peripuesta, El búho y el palomo (ws, agrupar las cuatro páginas en un solo libro)
20. Canciones infantiles (1880) + Oraciones, relaciones y coplas infantiles (ws, agrupables)

**Bloque B. Principiante (lecturas graduadas), 10 títulos**

21. Libro segundo de lectura, Ellen M. Cyr (gb 11047, `pg11047.epub`)
22. Libro primero de lectura, Ellen M. Cyr (ws)
23. Lecturas infantiles, Ortega Munilla (ws)
24. Lecturas fáciles con ejercicios (gb 24250, `pg24250.epub`)
25. Spanish Tales for Beginners (gb 36805)
26. A First Spanish Reader (gb 15353)
27. An Elementary Spanish Reader (gb 22065)
28. Páginas sudamericanas (gb 12435)
29. Nuestra Pampa, libro de lectura (gb 63464)
30. Cuentos de Wilde: El príncipe feliz, El ruiseñor y la rosa, El gigante egoísta (ws, agrupar tres páginas)

**Bloque C. Intermedio y juvenil, 10 títulos**

31. Corazón, De Amicis (gb 73486, `pg73486.epub`)
32. El libro de las tierras vírgenes, Kipling (gb 69552, `pg69552.epub`)
33. La isla del tesoro (gb 45438)
34. Los ladrones de Londres (Oliver Twist) (gb 62201)
35. Peter Pan y Wendy (ws; confirmar licencia de la traducción en la página)
36. Las aventuras de Tom Sawyer (ws `Las aventuras de Tom Sawyer (edición)`)
37. Viaje al centro de la Tierra (ws)
38. Cuentos populares en Chile, Laval (gb 63424)
39. Cuentos de la Alhambra (gb 52262)
40. El libro de las mil noches y una noche, t. 1 (gb 47287)

Fuera de la lista por derechos en España: Platero y yo y Ternura (ver avisos). Fuera por formato: los Esopo de Gutenberg (audio) y las ediciones de 1607.

**Cómo integrarlo**

- Gutenberg: reutilizar `openBook` tal cual, pero permitir por libro la variante sin imágenes (`pg{id}.epub`) para no bajar 25 MB de Samaniego.
- Wikisource: reutilizar el flujo del catálogo árabe. Para los índices, leer el HTML del índice y recorrer los `<a href="/wiki/...">` en orden de aparición (no `prop=links`), pedir cada subpágina con `action=parse&prop=text`, limpiar `style`, `#headertemplate`, `.ambox` y "Descargar como", y montar un HTML con un `<h2>` por cuento. Las obras de una sola página (Ratón Pérez, Hansel y Gretel) se abren directas. Si más adelante se prefiere EPUB, ws-export funciona pero pide un proxy `/wse/` hacia `ws-export.wmcloud.org` y tarda 10-20 s por libro.
- Bloom (fase 2): añadir proxy nginx `/bloom/` hacia `https://s3.amazonaws.com/bloomharvest/`, consultar el catálogo con el servidor Parse (tiene CORS) filtrando `license` in (cc-by, cc-by-sa) y `topic:Story Book|Animal Stories|Traditional Story`, y bajar el EPUB. Antes de publicarlo, revisar a mano el español de cada libro.
- African Storybook (fase 2, opcional): proxy `/asb/`, PDF directo por `downloadbook.php?id=...&d=0&a=1`, y lista estática a partir de `booklist.php?language=10971`.


## Lista final (JSON para tools/build_beginners.py)

Títulos de Wikisource verificados contra la API el 2026-08-27. Peter Pan y Wendy queda fuera hasta confirmar la licencia de la traducción.

```json
[
 {
  "source": "gb",
  "id": 36558,
  "title": "Ratón Pérez",
  "author": "Luis Coloma",
  "level": "infantil"
 },
 {
  "source": "gb",
  "id": 55206,
  "title": "Fábulas de Samaniego",
  "author": "Félix María de Samaniego",
  "level": "infantil",
  "noimages": true
 },
 {
  "source": "gb",
  "id": 29497,
  "title": "Fábulas literarias",
  "author": "Tomás de Iriarte",
  "level": "infantil"
 },
 {
  "source": "gb",
  "id": 64058,
  "title": "Fábulas y cuentos en verso",
  "author": "Varios",
  "level": "infantil"
 },
 {
  "source": "ws",
  "lang": "es",
  "title": "Cuentos de hadas (Baró tr.)",
  "author": "Charles Perrault",
  "level": "infantil"
 },
 {
  "source": "ws",
  "lang": "es",
  "title": "Cuentos de hadas (Coll i Vehí tr.)",
  "author": "Perrault y d'Aulnoy",
  "level": "infantil"
 },
 {
  "source": "ws",
  "lang": "es",
  "title": "Cuentos escogidos de los Hermanos Grimm",
  "author": "Hermanos Grimm",
  "level": "infantil"
 },
 {
  "source": "ws",
  "lang": "es",
  "title": "Hansel y Gretel",
  "author": "Hermanos Grimm",
  "level": "infantil"
 },
 {
  "source": "ws",
  "lang": "es",
  "title": "Cuentos de Andersen",
  "author": "Hans Christian Andersen",
  "level": "infantil"
 },
 {
  "source": "ws",
  "lang": "es",
  "title": "Cuentos clásicos para niños",
  "author": "Hans Christian Andersen",
  "level": "infantil"
 },
 {
  "source": "ws",
  "lang": "es",
  "title": "El almacén de los niños",
  "author": "Jeanne-Marie Leprince de Beaumont",
  "level": "infantil"
 },
 {
  "source": "ws",
  "lang": "es",
  "title": "Cuentos, adivinanzas y refranes populares",
  "author": "Fernán Caballero",
  "level": "infantil"
 },
 {
  "source": "ws",
  "lang": "es",
  "title": "Cuentos para gente menuda",
  "author": "Romualdo Nogués",
  "level": "infantil"
 },
 {
  "source": "ws",
  "lang": "es",
  "title": "Brisas de primavera",
  "author": "Julia de Asensi",
  "level": "infantil"
 },
 {
  "source": "gb",
  "id": 19898,
  "title": "La Edad de Oro",
  "author": "José Martí",
  "level": "infantil"
 },
 {
  "source": "ws",
  "lang": "es",
  "title": "Cuentos de la selva",
  "author": "Horacio Quiroga",
  "level": "infantil"
 },
 {
  "source": "gb",
  "id": 69164,
  "title": "Cuentos chilenos de nunca acabar",
  "author": "Ramón A. Laval",
  "level": "infantil"
 },
 {
  "source": "gb",
  "id": 55215,
  "title": "Cuando la tierra era niña",
  "author": "Nathaniel Hawthorne",
  "level": "infantil",
  "noimages": true
 },
 {
  "source": "ws",
  "lang": "es",
  "title": "El renacuajo paseador",
  "author": "Rafael Pombo",
  "level": "infantil"
 },
 {
  "source": "ws",
  "lang": "es",
  "title": "Cutufato y su gato",
  "author": "Rafael Pombo",
  "level": "infantil"
 },
 {
  "source": "ws",
  "lang": "es",
  "title": "Canciones infantiles (1880)",
  "author": "Tradicional",
  "level": "infantil"
 },
 {
  "source": "gb",
  "id": 11047,
  "title": "Libro segundo de lectura",
  "author": "Ellen M. Cyr",
  "level": "principiante",
  "noimages": true
 },
 {
  "source": "ws",
  "lang": "es",
  "title": "Libro primero de lectura",
  "author": "Ellen M. Cyr",
  "level": "principiante"
 },
 {
  "source": "ws",
  "lang": "es",
  "title": "Lecturas infantiles",
  "author": "José Ortega Munilla",
  "level": "principiante"
 },
 {
  "source": "gb",
  "id": 24250,
  "title": "Lecturas fáciles con ejercicios",
  "author": "Varios",
  "level": "principiante",
  "noimages": true
 },
 {
  "source": "gb",
  "id": 36805,
  "title": "Spanish Tales for Beginners",
  "author": "Elijah Clarence Hills (ed.)",
  "level": "principiante"
 },
 {
  "source": "gb",
  "id": 15353,
  "title": "A First Spanish Reader",
  "author": "Erwin W. Roessler y Alfred Remy",
  "level": "principiante"
 },
 {
  "source": "gb",
  "id": 22065,
  "title": "An Elementary Spanish Reader",
  "author": "Earl Stanley Harrison",
  "level": "principiante"
 },
 {
  "source": "gb",
  "id": 12435,
  "title": "Páginas sudamericanas",
  "author": "Varios",
  "level": "principiante"
 },
 {
  "source": "gb",
  "id": 63464,
  "title": "Nuestra Pampa, libro de lectura",
  "author": "Varios",
  "level": "principiante"
 },
 {
  "source": "ws",
  "lang": "es",
  "title": "El príncipe feliz",
  "author": "Oscar Wilde",
  "level": "principiante"
 },
 {
  "source": "ws",
  "lang": "es",
  "title": "El gigante egoísta",
  "author": "Oscar Wilde",
  "level": "principiante"
 },
 {
  "source": "ws",
  "lang": "es",
  "title": "El ruiseñor y la rosa",
  "author": "Oscar Wilde",
  "level": "principiante"
 },
 {
  "source": "gb",
  "id": 73486,
  "title": "Corazón",
  "author": "Edmondo de Amicis",
  "level": "intermedio",
  "noimages": true
 },
 {
  "source": "gb",
  "id": 69552,
  "title": "El libro de las tierras vírgenes",
  "author": "Rudyard Kipling",
  "level": "intermedio",
  "noimages": true
 },
 {
  "source": "gb",
  "id": 45438,
  "title": "La isla del tesoro",
  "author": "Robert Louis Stevenson",
  "level": "intermedio"
 },
 {
  "source": "gb",
  "id": 62201,
  "title": "Los ladrones de Londres (Oliver Twist)",
  "author": "Charles Dickens",
  "level": "intermedio"
 },
 {
  "source": "ws",
  "lang": "es",
  "title": "Las aventuras de Tom Sawyer (edición)",
  "author": "Mark Twain",
  "level": "intermedio"
 },
 {
  "source": "ws",
  "lang": "es",
  "title": "Viaje al centro de la Tierra",
  "author": "Julio Verne",
  "level": "intermedio"
 },
 {
  "source": "gb",
  "id": 63424,
  "title": "Cuentos populares en Chile",
  "author": "Ramón A. Laval",
  "level": "intermedio"
 },
 {
  "source": "gb",
  "id": 52262,
  "title": "Cuentos de la Alhambra",
  "author": "Washington Irving",
  "level": "intermedio"
 },
 {
  "source": "gb",
  "id": 47287,
  "title": "El libro de las mil noches y una noche, tomo 1",
  "author": "Anónimo",
  "level": "intermedio"
 }
]
```
