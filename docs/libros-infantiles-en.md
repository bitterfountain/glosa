# Libros en inglés para niños y lectores principiantes (catálogo "Infantil / principiantes EN")

Investigación para un catálogo nuevo de Glosa, hermano del de español (`libros-infantiles-es.md`). Fecha: 2026-08-27. Todo lo que aparece en las tablas se ha comprobado por programa: en Gutenberg se descargó `cache/epub/{id}/pg{id}.epub` y `pg{id}-images.epub`, se abrió el ZIP y se leyó `dc:title`, `dc:creator` y `dc:language` del OPF; en Wikisource se llamó a `action=parse` y se miró si devuelve texto directo, un índice con subpáginas o una página de "versiones". Lo que no se pudo verificar no está.

Niveles usados: **infantil** (cuentos y fábulas muy cortos, álbumes ilustrados, vocabulario básico), **principiante** (lecturas graduadas "primer" / "first reader", frases simples y repetitivas), **intermedio** (cuentos clásicos con prosa normal, capítulos cortos) y **juvenil** (novela infantil completa).

## Resumen rápido

| Fuente | Libros verificados | Licencia | CORS | Integración | Veredicto |
|---|---|---|---|---|---|
| Project Gutenberg | 60+ (título e idioma leídos del OPF) | Dominio público (EE. UU.) | No, pero ya hay proxy `/gb/` | Solo el ID, como el Top 100 | **Usar** (núcleo del catálogo; el inglés es la lengua con más fondo infantil de Gutenberg) |
| Wikisource en inglés | 15 obras comprobadas | Dominio público | **Sí** (`access-control-allow-origin: *` verificado) | API `parse` como el catálogo árabe | Usar como complemento (aporta poco que no esté en Gutenberg; útil para cuentos sueltos) |
| Otras (Bloom, African Storybook, StoryWeaver, Internet Archive) | no revisadas en esta pasada | CC BY / PD | Bloom catálogo sí, descargas no | Proxy nuevo | Fase 2 (ver informe de español: mismas conclusiones, en inglés tienen aún más fondo) |

## 1. Project Gutenberg

Integración: la misma que el Top 100 (proxy `/gb/`, ruta `cache/epub/{id}/pg{id}-images-3.epub` con fallback a `pg{id}-images.epub` y `pg{id}.epub`). Todos los ID de abajo devolvieron 200 en las dos variantes y el OPF dice `en`. La columna de tamaño muestra "sin imágenes / con imágenes": en los álbumes ilustrados (Potter, Brooke, Aesop de Milo Winter) la diferencia es de 30x a 60x, así que en este catálogo conviene marcar por libro `noimages` cuando la versión con imágenes pase de unos 3 MB. En los cuentos de Potter las ilustraciones son parte del libro; se deja anotado el peso y se decide.

Trampas detectadas:

- **8809 "Aesop's Fables"** devuelve 404 en las dos variantes de EPUB: es un audiolibro (no hay texto). Igual que la serie 19616 a 19624 "Aesop's Fables - Volume 01..09", que son LibriVox. No incluir.
- **236 The Jungle Book** con imágenes pesa 10,9 MB; **120 Treasure Island** con imágenes 48 MB; **74 Tom Sawyer** 16 MB. Pedir siempre `pg{id}.epub`.
- **14916** no es un McGuffey (era una suposición): es "Fairy Tales Every Child Should Know" (ed. Hamilton Wright Mabie), que también sirve. El McGuffey que falta es el Primer, 14642.
- **4357** no es Heidi sino "American Fairy Tales" de Baum. Heidi no se ha verificado en esta pasada.

### 1.1 Infantil (cuentos muy cortos, álbumes)

| ID | Título | Autor | EPUB (sin img / con img) | Nivel | Por qué sirve |
|---|---|---|---|---|---|
| 14838 | The Tale of Peter Rabbit | Beatrix Potter | 70 KB / 1,4 MB | infantil | El álbum infantil inglés por excelencia; 900 palabras |
| 14407 | The Tale of Benjamin Bunny | Beatrix Potter | 79 KB / 5,8 MB | infantil | Secuela de Peter Rabbit |
| 14814 | The Tale of Jemima Puddle-Duck | Beatrix Potter | 78 KB / 4,4 MB | infantil | Cuento corto |
| 14872 | The Tale of Squirrel Nutkin | Beatrix Potter | 75 KB / 4,2 MB | infantil | Cuento corto con adivinanzas |
| 14837 | The Tale of Tom Kitten | Beatrix Potter | 69 KB / 1,1 MB | infantil | Muy corto |
| 15137 | The Tale of Mrs. Tiggy-Winkle | Beatrix Potter | 35 KB / 3,5 MB | infantil | Muy corto |
| 14220 | The Tale of the Flopsy Bunnies | Beatrix Potter | 76 KB / 5,1 MB | infantil | Corto |
| 15077 | The Tale of Mr. Jeremy Fisher | Beatrix Potter | 76 KB / 3,8 MB | infantil | Corto |
| 45264 | The Tale of Two Bad Mice | Beatrix Potter | 74 KB / 1,9 MB | infantil | Corto |
| 17089 | The Tale of Mrs. Tittlemouse | Beatrix Potter | 79 KB / 2,7 MB | infantil | Corto |
| 14848 | The Story of Miss Moppet | Beatrix Potter | 56 KB / 327 KB | infantil | El más corto de Potter, frases de una línea |
| 15284 | The Tale of Johnny Town-Mouse | Beatrix Potter | 62 KB / 1,4 MB | infantil | Corto |
| 15234 | The Tale of the Pie and the Patty-Pan | Beatrix Potter | 78 KB / 1,8 MB | infantil | Algo más largo |
| 14868 | The Tailor of Gloucester | Beatrix Potter | 40 KB / 3,5 MB | infantil / intermedio | Vocabulario algo más rico |
| 18155 | The Story of the Three Little Pigs | L. Leslie Brooke | 83 KB / 704 KB | infantil | Cuento tradicional ilustrado, muy corto |
| 15661 | The Golden Goose Book | L. Leslie Brooke | 77 KB / 4,9 MB | infantil | Cuatro cuentos tradicionales (The Golden Goose, The Three Bears, The Three Little Pigs, Tom Thumb) |
| 23322 | The Three Bears | anónimo | 72 KB / 727 KB | infantil | Ricitos de oro, edición ilustrada |
| 18735 | The Little Red Hen: An Old English Folk Tale | Florence White Williams | 71 KB / 2,1 MB | infantil | Cuento acumulativo, frases repetidas |
| 29980 | The Cock, the Mouse, and the Little Red Hen | Félicité Lefèvre | 76 KB / 2,3 MB | infantil | Versión larga del mismo cuento |
| 32504 | All About the Three Little Pigs | anónimo | 66 KB / 2,2 MB | infantil | Álbum Cupples & Leon |
| 25650 | All About the Little Small Red Hen | anónimo | 65 KB / 2,8 MB | infantil | Álbum Cupples & Leon |
| 19994 | The Aesop for Children (ilustr. Milo Winter) | Esopo | 152 KB / 9,8 MB | infantil | Fábulas de 5 a 10 líneas, la edición escolar clásica; `noimages` obligatorio |
| 11339 | Aesop's Fables: A New Translation (V. S. Vernon Jones, ilustr. Rackham) | Esopo | 180 KB / 4,8 MB | infantil / principiante | Fábulas cortas, prosa moderna |
| 28 | The Fables of Aesop (Joseph Jacobs) | Esopo | 166 KB / 304 KB | infantil / principiante | 82 fábulas cortas |
| 21 | Three Hundred Aesop's Fables (Townsend) | Esopo | 401 KB / 596 KB | principiante | La colección larga; lenguaje algo victoriano |
| 17208 | The Tales of Mother Goose (Perrault, trad. Welsh) | Charles Perrault | 87 KB / 2 MB | infantil | Caperucita, Cenicienta, Gato con botas, Bella durmiente... |
| 29021 | The Fairy Tales of Charles Perrault (ilustr. Harry Clarke) | Charles Perrault | 147 KB / 2,7 MB | infantil / intermedio | Otra traducción, incluye Piel de asno |
| 7439 | English Fairy Tales (Joseph Jacobs) | Joseph Jacobs | 192 KB / 192 KB | infantil / intermedio | Jack and the Beanstalk, Three Little Pigs, Tom Tit Tot, 43 cuentos |
| 902 | The Happy Prince, and Other Tales | Oscar Wilde | 88 KB / 4,3 MB | intermedio | Cinco cuentos (El príncipe feliz, El gigante egoísta...) |
| 10469 | Johnny Crow's Garden | L. Leslie Brooke | 67 KB / 1,7 MB | infantil | Rimas de una línea por página; `noimages` pierde la gracia, mantener imágenes |
| 15809 | A Apple Pie | Kate Greenaway | 44 KB / 981 KB | infantil | Abecedario ilustrado, una frase por letra |
| 10607 | The Real Mother Goose | ilustr. Blanche Fisher Wright | 105 KB / 15,3 MB | infantil (poesía) | Rimas infantiles tradicionales; `noimages` obligatorio |
| 25609 | A Child's Garden of Verses | R. L. Stevenson | 93 KB / 7,3 MB | infantil (poesía) | Poemas cortos; `noimages` |
| 11757 | The Velveteen Rabbit | Margery Williams | 83 KB / 524 KB | infantil / intermedio | Cuento de 8.000 palabras, prosa sencilla (también en Wikisource) |
| 18190 | Raggedy Ann Stories | Johnny Gruelle | 111 KB / 6,7 MB | infantil | Cuentos cortos de la muñeca; `noimages` |
| 43336 | The Pig Brother, and Other Fables and Stories | Laura E. Richards | 127 KB / 533 KB | infantil / principiante | Fábulas cortas, "a supplementary reader" |
| 72063 | Once Upon a Time Animal Stories | Carolyn Sherwin Bailey | 194 KB / 2 MB | infantil | Cuentos de animales para contar |

### 1.2 Principiante (lecturas graduadas)

| ID | Título | Autor | EPUB (sin img / con img) | Nivel | Por qué sirve |
|---|---|---|---|---|---|
| 14642 | McGuffey's Eclectic Primer, Revised Edition | W. H. McGuffey | 75 KB / 95 KB | principiante | Lecciones de 3 a 10 frases, vocabulario controlado; el arranque natural del catálogo |
| 14640 | McGuffey's First Eclectic Reader, Revised Edition | W. H. McGuffey | 94 KB / 109 KB | principiante | Lecciones cortas con lista de palabras nuevas |
| 1489 | The New McGuffey First Reader | W. H. McGuffey | 82 KB / 104 KB | principiante | Edición de 1901, más moderna |
| 14668 | McGuffey's Second Eclectic Reader | W. H. McGuffey | 135 KB / 8,9 MB | principiante | Cuentos de una página; `noimages` |
| 14766 | McGuffey's Third Eclectic Reader | W. H. McGuffey | 138 KB / 148 KB | principiante / intermedio | Cuentos y poemas cortos |
| 14880 | McGuffey's Fourth Eclectic Reader | W. H. McGuffey | 233 KB / 246 KB | intermedio | Lecturas más largas con definiciones |
| 15040 | McGuffey's Fifth Eclectic Reader | W. H. McGuffey | 334 KB / 344 KB | intermedio / juvenil | Antología literaria |
| 16751 | McGuffey's Sixth Eclectic Reader | W. H. McGuffey | 431 KB / 455 KB | juvenil | Antología literaria, el más avanzado |
| 61852 | Kittens and Cats: A First Reader | Eulalie Osgood Grover | 71 KB / 3,2 MB | principiante | Frases muy simples con fotos de gatos; `noimages` |
| 65323 | A First Reader | Spaulding y Bryce | 132 KB / 10,5 MB | principiante | Lector de primer curso (1907); `noimages` |
| 13853 | New National First Reader | Barnes, Proctor y Bishop | 98 KB / 2,9 MB | principiante | Lector de 1883 con lecciones graduadas |
| 41243 | Brooks's Readers: First Year | Stratton D. Brooks | 100 KB / 1,9 MB | principiante | Lector de primer curso (1906) |
| 40415 | Tower's Little Primer | Anna E. Tower | 57 KB / 2,2 MB | principiante | Primer para "la clase más pequeña"; muy corto |
| 68453 | The Summers Readers: Primer | Maud Summers | 167 KB / 3,1 MB | principiante | Primer con cuentos acumulativos; `noimages` |
| 69072 | The Haliburton Primer | M. W. Haliburton | 165 KB / 2,9 MB | principiante | Primer (1901) |
| 19551 | Alice in Wonderland, Retold in Words of One Syllable | Carroll / Mrs. J. C. Gorham | 116 KB / 16,5 MB | principiante | Alicia en monosílabos, hecha para lectores nuevos; `noimages` obligatorio |
| 18442 | Fifty Famous Stories Retold | James Baldwin | 143 KB / 1,6 MB | principiante / intermedio | Historias de 1 a 2 páginas (Guillermo Tell, el rey Alfredo...), lector escolar clásico |
| 474 | How to Tell Stories to Children, and Some Stories to Tell | Sara Cone Bryant | 207 KB / 345 KB | principiante / intermedio | La segunda mitad son cuentos cortos para contar (The Little Red Hen, The Gingerbread Man...) |

### 1.3 Intermedio y juvenil (clásicos completos)

| ID | Título | Autor | EPUB (sin img / con img) | Nivel | Por qué sirve |
|---|---|---|---|---|---|
| 2781 | Just So Stories | Rudyard Kipling | 132 KB / 132 KB | intermedio | Doce cuentos de origen, para leer en voz alta |
| 2591 | Grimms' Fairy Tales | Grimm | 321 KB / 330 KB | intermedio | 62 cuentos, traducción clásica |
| 11027 | Grimm's Fairy Stories | Grimm | 174 KB / 2 MB | intermedio | Selección más corta e ilustrada |
| 1597 | Andersen's Fairy Tales | H. C. Andersen | 212 KB / 385 KB | intermedio | 18 cuentos (El traje nuevo del emperador, El patito feo...) |
| 27200 | Fairy Tales of Hans Christian Andersen | H. C. Andersen | 873 KB / 885 KB | intermedio | Colección completa (larga) |
| 14916 | Fairy Tales Every Child Should Know | ed. H. W. Mabie | 298 KB / 598 KB | intermedio | Antología de cuentos clásicos |
| 503 | The Blue Fairy Book | Andrew Lang | 358 KB / 541 KB | intermedio | 37 cuentos clásicos |
| 540 | The Red Fairy Book | Andrew Lang | 350 KB / 518 KB | intermedio | Segunda antología de Lang |
| 4357 | American Fairy Tales | L. Frank Baum | 150 KB / 150 KB | intermedio | Cuentos cortos |
| 55 | The Wonderful Wizard of Oz | L. Frank Baum | 177 KB / 341 KB | juvenil | Novela infantil, capítulos cortos |
| 11 | Alice's Adventures in Wonderland | Lewis Carroll | 133 KB / 183 KB | juvenil | Clásico; juegos de palabras difíciles para principiantes |
| 12 | Through the Looking-Glass | Lewis Carroll | 140 KB / 506 KB | juvenil | Secuela |
| 500 | The Adventures of Pinocchio | Carlo Collodi | 163 KB / 163 KB | juvenil | Capítulos cortos |
| 16 | Peter Pan (Peter and Wendy) | J. M. Barrie | 381 KB / 381 KB | juvenil | Prosa más elaborada |
| 236 | The Jungle Book | Rudyard Kipling | 178 KB / 10,9 MB | juvenil | `noimages` |
| 113 | The Secret Garden | F. H. Burnett | 265 KB / 265 KB | juvenil | Novela infantil |
| 146 | A Little Princess | F. H. Burnett | 217 KB / 217 KB | juvenil | Novela infantil |
| 271 | Black Beauty | Anna Sewell | 409 KB / 409 KB | juvenil | Novela infantil |
| 120 | Treasure Island | R. L. Stevenson | 267 KB / 48 MB | juvenil | `noimages` obligatorio |
| 74 | The Adventures of Tom Sawyer | Mark Twain | 281 KB / 16 MB | juvenil | `noimages`; dialecto |
| 289 | The Wind in the Willows | Kenneth Grahame | 237 KB / 360 KB | juvenil | Prosa rica, no para principiantes |
| 46 | A Christmas Carol | Charles Dickens | 144 KB / 626 KB | juvenil | Corto pero léxico victoriano |
| 1448 | Heidi | Johanna Spyri | 252 KB / 252 KB | juvenil | Traducción inglesa (Elisabeth Stork) |
| 501 | The Story of Doctor Dolittle | Hugh Lofting | 168 KB / 2 MB | juvenil | Capítulos cortos, prosa sencilla; buen puente desde intermedio |
| 21286 | Mother West Wind "How" Stories | Thornton W. Burgess | 140 KB / 626 KB | intermedio | Cuentos de animales cortos, muy usados en escuelas |
| 4980 | Old Granny Fox | Thornton W. Burgess | 147 KB / 331 KB | intermedio | Serie Bedtime Story-Books, capítulos de 2 páginas |
| 2306 | Uncle Remus, His Songs and His Sayings | Joel Chandler Harris | 190 KB / 205 KB | no recomendado | Dialecto denso; inútil para aprender inglés |
| 32242 | A Wonder Book for Girls and Boys | Nathaniel Hawthorne | 270 KB / 4,5 MB | intermedio / juvenil | Mitos griegos para niños (pareja del 55215 español) |
| 976 | Tanglewood Tales | Nathaniel Hawthorne | 219 KB / 219 KB | juvenil | Continuación |
| 19993 | Childhood's Favorites and Fairy Stories (Young Folks Treasury, vol. 1) | varios | 469 KB / 5,5 MB | infantil / intermedio | Antología: rimas, fábulas y cuentos; `noimages` |
| 67098 | Winnie-the-Pooh | A. A. Milne | 120 KB / 4,9 MB | intermedio | **Aviso de derechos**: libre en EE. UU. desde 2022, en la UE hasta 2027 |

Trampas más: **21167** (segundo "The Golden Goose Book") devuelve 404 en EPUB, usar 15661. **18376** no es "Old Mother West Wind" sino "A Lecture on the Preservation of Health"; el ID estaba mal en la suposición inicial y no se ha localizado el correcto. **2895** es "Following the Equator" de Twain (descartado).

Otros vistos en las búsquedas pero no verificados (los ID salen del buscador de gutenberg.org, no del EPUB): 39784 "Mother Goose's Nursery Rhymes", 21150 "Mother Goose in Prose" (Baum), 20037 "Five Little Peppers", 28942 "The Junior Classics, Vol. 1", 22096 "Stories the Iroquois Tell Their Children", 22373 "Russian Fairy Tales", 708 "The Princess and the Goblin", 26197 "The Nursery Rhyme Book", 24271 "Children's Rhymes, Children's Games...", 27467 "Stories to Read or Tell from Fairy Tales and Folklore", 5061 "The Children's Book of Christmas Stories", 49001 "Mother's Nursery Tales" (Katharine Pyle), 63383 "The Wonder Clock" (Howard Pyle), 8653 "East o' the Sun and West o' the Moon" (Thorne-Thomsen).

Búsquedas hechas en gutenberg.org: `mcguffey`, `primer reader`, `first reader`, `beatrix potter`, `aesop fables`, `nursery rhymes`, `fairy tales children`, `three little pigs`, `little red hen`, `stories to tell children`. El bookshelf 17 ("Children's Literature") de gutenberg.org está dominado por series juveniles de los años 1900-1920 (Tom Swift, Rover Boys, Ruth Fielding...) y no sirve para filtrar; es mejor buscar por título o autor.

## 2. Wikisource en inglés (en.wikisource.org)

Comprobado: `https://en.wikisource.org/w/api.php?action=parse&page=...&prop=text|links&format=json&origin=*` responde `HTTP/2 200` con `access-control-allow-origin: *`. **Ojo**: sin cabecera `User-Agent` descriptiva la API devolvió `429`; desde el navegador va el UA del propio navegador y no hay problema, pero cualquier script debe mandar uno.

Diferencia importante con es.wikisource: en inglés muchas obras conocidas tienen una **página de "versiones"** (Peter Rabbit, Three Little Pigs, Winnie-the-Pooh, The Story of the Three Bears, Little Black Sambo) que solo lista ediciones y no trae texto; hay que apuntar a la edición concreta (por ejemplo `The Tale of Peter Rabbit (1902)` o el subcapítulo de `English Fairy_Tales`). La mayoría de las ediciones modernas están transcluidas desde escaneos (`Page:` namespace), así que el HTML de `parse` trae el texto completo pero con marcadores de página, `<span>` vacíos y bloques `wst-header` (título/autor/anterior/siguiente) que hay que limpiar, además de `<style>`, `.ambox` y `#headertemplate` como en español.

| Página de Wikisource (identificador exacto) | Autor | Tipo | Subpáginas / tamaño | Nivel | Verificación |
|---|---|---|---|---|---|
| `The Little Red Hen` | Florence White Williams, 1918 | texto directo | 7.759 caracteres | infantil | Texto leído ("THE LITTLE RED HEN An Old English Folk Tale...") |
| `The Velveteen Rabbit` | Margery Williams, 1922 | texto directo | 43.141 caracteres | intermedio | Texto leído |
| `The Tale of Benjamin Bunny` | Beatrix Potter | texto directo (transcluido) | HTML 73 KB | infantil | `parse` devuelve el texto completo |
| `The Tale of Jemima Puddle-Duck` | Beatrix Potter | texto directo (transcluido) | HTML 68 KB | infantil | Igual |
| `The Tale of Tom Kitten` | Beatrix Potter | texto directo (transcluido) | HTML 72 KB | infantil | Igual |
| `Just So Stories` | Rudyard Kipling | índice | 12 subpáginas (`Just So Stories/How the Whale Got His Throat`...) | intermedio | Subpágina leída, 7.721 caracteres |
| `English Fairy Tales` | Joseph Jacobs | índice | 44 subpáginas (`English Fairy Tales/Jack and the Beanstalk`, `.../The Story of the Three Little Pigs`...) | infantil / intermedio | Subpágina leída, 12.558 caracteres |
| `Grimm's Household Tales (Edwardes)` | Grimm, trad. Marian Edwardes | índice | 49 subpáginas | intermedio | Índice listado |
| `A Child's Garden of Verses` | R. L. Stevenson | índice | 66 poemas | infantil (poesía) | Índice listado |
| `The Real Mother Goose` | ilustr. Blanche Fisher Wright | índice | 68 subpáginas (rimas) | infantil (poesía) | Índice listado |
| `The Wonderful Wizard of Oz` | L. Frank Baum | índice | 24 capítulos | juvenil | Índice listado (lleva un `.ambox`) |
| `Alice's Adventures in Wonderland (1866)` | Lewis Carroll | índice | 12 capítulos | juvenil | Índice listado |
| `McGuffey's Eclectic Primer Revised Edition` | McGuffey | existe (por búsqueda) | no comprobado | principiante | Encontrado con `list=search`; no se ha abierto |
| `The Fables of Æsop (Jacobs)` | Esopo, ed. Jacobs | existe (por búsqueda) | no comprobado | infantil | Encontrado con `list=search`; título con "Æ" |
| `Three Hundred Æsop's Fables` | Esopo, trad. Townsend | índice (subpáginas por fábula) | no contado | principiante | Subpágina `.../The Wolf and the Fox` sale en búsqueda |

Páginas que son solo "versiones" (no usar el título raíz): `The Tale of Peter Rabbit` (438 caracteres, lista las ediciones de 1901 y 1902), `The Three Little Pigs` (remite a Jacobs y a Lang), `Winnie-the-Pooh` (remite a la edición de 1926, "scan needed", y a la de 1961), `The Story of the Three Bears`, `The Story of Little Black Sambo`. Páginas que no existen con ese título: `Aesop's Fables (Jacobs)`, `The Aesop for Children`, `McGuffey's First Eclectic Reader`, `Old Mother West Wind`, `Uncle Wiggily's Adventures`, `Fifty Famous Stories Retold`, `The Book of Nature Myths`, `Johnny Crow's Garden`, `The Baby's Own Aesop`.

Conclusión: para inglés, Wikisource aporta menos que para español porque casi todo lo infantil ya está en Gutenberg con EPUB limpio. Se recomienda usarla solo para lo que allí quede mejor (cuentos sueltos como `The Little Red Hen` o `The Velveteen Rabbit`, o índices por cuento como `English Fairy Tales` si se quiere presentar cada cuento como un libro corto).

## 3. Avisos de derechos

- Todo lo de arriba es dominio público en EE. UU. (Gutenberg lo garantiza). En la UE rige vida + 70: **Winnie-the-Pooh** (Milne murió en 1956) queda protegido hasta 2027 en Europa aunque Gutenberg lo tenga (67098); **The Velveteen Rabbit** (Margery Williams murió en 1944) está libre desde 2015; **Beatrix Potter** (1943) libre desde 2014; **Kipling** (1936), **Barrie** (1937), **Baum** (1919), **Burnett** (1924), **Jacobs** (1916), **Lang** (1912) libres. Las lecturas graduadas (McGuffey, Grover, Spaulding, Barnes, Brooks) son de 1880 a 1910: libres.
- **The Story of Little Black Sambo** (Bannerman) es dominio público pero hoy se considera ofensivo; no incluirlo.
- Audiolibros LibriVox en Gutenberg que parecen texto: 8809 y 19616 a 19624 (Aesop). Solo tienen `.m4b`/`.mp3`.

## Recomendación: qué meter en el catálogo y cómo

Un catálogo "Infantil / principiantes (EN)" curado de 40 títulos, lista estática en `js/catalog.js` con el mismo formato que el de español. Casi todo va por Gutenberg (proxy existente); Wikisource se usa para tres cuentos sueltos y para ofrecer los cuentos de Jacobs de uno en uno.

**Bloque A. Infantil (álbumes y cuentos muy cortos), 18 títulos**

1. The Tale of Peter Rabbit, Beatrix Potter (gb 14838)
2. The Story of Miss Moppet, Beatrix Potter (gb 14848)
3. The Tale of Tom Kitten, Beatrix Potter (gb 14837)
4. The Tale of Benjamin Bunny, Beatrix Potter (gb 14407, `noimages`)
5. The Tale of Jemima Puddle-Duck, Beatrix Potter (gb 14814, `noimages`)
6. The Tale of Squirrel Nutkin, Beatrix Potter (gb 14872, `noimages`)
7. The Tale of Two Bad Mice, Beatrix Potter (gb 45264)
8. Johnny Crow's Garden, L. Leslie Brooke (gb 10469, con imágenes)
9. A Apple Pie, Kate Greenaway (gb 15809, con imágenes)
10. The Story of the Three Little Pigs, L. Leslie Brooke (gb 18155)
11. The Three Bears (gb 23322)
12. The Golden Goose Book, L. Leslie Brooke (gb 15661, `noimages`)
13. The Little Red Hen, Florence White Williams (ws `The Little Red Hen`; o gb 18735)
14. The Aesop for Children, ilustr. Milo Winter (gb 19994, `noimages`)
15. The Fables of Aesop, Joseph Jacobs (gb 28)
16. Aesop's Fables: A New Translation, Vernon Jones (gb 11339, `noimages`)
17. The Tales of Mother Goose, Perrault (gb 17208)
18. English Fairy Tales, Joseph Jacobs (gb 7439; o ws `English Fairy Tales` por cuento)

**Bloque B. Principiante (lecturas graduadas), 10 títulos**

19. McGuffey's Eclectic Primer (gb 14642)
20. McGuffey's First Eclectic Reader (gb 14640)
21. The New McGuffey First Reader (gb 1489)
22. McGuffey's Second Eclectic Reader (gb 14668, `noimages`)
23. McGuffey's Third Eclectic Reader (gb 14766)
24. Kittens and Cats: A First Reader (gb 61852, `noimages`)
25. A First Reader, Spaulding y Bryce (gb 65323, `noimages`)
26. Alice in Wonderland, Retold in Words of One Syllable (gb 19551, `noimages`)
27. Fifty Famous Stories Retold, Baldwin (gb 18442)
28. Three Hundred Aesop's Fables, Townsend (gb 21)

**Bloque C. Intermedio y juvenil, 12 títulos**

29. Just So Stories, Kipling (gb 2781)
30. Grimms' Fairy Tales (gb 2591)
31. Andersen's Fairy Tales (gb 1597)
32. The Happy Prince, and Other Tales, Wilde (gb 902, `noimages`)
33. The Velveteen Rabbit, Margery Williams (ws `The Velveteen Rabbit`; o gb 11757)
34. Mother West Wind "How" Stories, Burgess (gb 21286)
35. The Blue Fairy Book, Lang (gb 503)
36. The Wonderful Wizard of Oz (gb 55)
37. The Adventures of Pinocchio (gb 500)
38. The Story of Doctor Dolittle (gb 501)
39. Alice's Adventures in Wonderland (gb 11)
40. The Jungle Book (gb 236, `noimages`)

Reserva verificada para ampliar sin volver a comprobar nada: el resto de Potter (15137, 14220, 15077, 17089, 15284, 15234, 14868), 29980, 32504, 25650, 10607, 25609, 18190, 43336, 72063, 13853, 41243, 40415, 68453, 69072, 474, 11027, 27200, 14916, 540, 4357, 29021, 4980, 32242, 976, 19993, 12, 16, 113, 146, 271, 120, 74, 289, 46, 1448.

Fuera de la lista: Winnie-the-Pooh (derechos en la UE hasta 2027), Little Black Sambo (contenido), Uncle Remus (dialecto), los Aesop en audio (8809, 19616-19624), 21167 (404), y McGuffey Fourth a Sixth (sirven como intermedio pero son antologías escolares más que lectura de placer).

**Cómo integrarlo**

- Gutenberg: reutilizar `openBook` con la opción por libro `noimages: true` para pedir `pg{id}.epub` directamente y no bajar 5 a 48 MB.
- Wikisource: reutilizar el flujo del catálogo árabe. Mandar `User-Agent` si se hace desde servidor. Para los títulos raíz que son "versiones" apuntar a la edición o subpágina concreta. Limpiar `<style>`, `.wst-header`, `#headertemplate`, `.ambox` y los `<span>` de número de página que deja la transclusión.

```json
[
  {"source":"gb","id":14838,"title":"The Tale of Peter Rabbit","author":"Beatrix Potter","level":"infantil"},
  {"source":"gb","id":14848,"title":"The Story of Miss Moppet","author":"Beatrix Potter","level":"infantil"},
  {"source":"gb","id":14837,"title":"The Tale of Tom Kitten","author":"Beatrix Potter","level":"infantil"},
  {"source":"gb","id":14407,"title":"The Tale of Benjamin Bunny","author":"Beatrix Potter","level":"infantil","noimages":true},
  {"source":"gb","id":14814,"title":"The Tale of Jemima Puddle-Duck","author":"Beatrix Potter","level":"infantil","noimages":true},
  {"source":"gb","id":14872,"title":"The Tale of Squirrel Nutkin","author":"Beatrix Potter","level":"infantil","noimages":true},
  {"source":"gb","id":45264,"title":"The Tale of Two Bad Mice","author":"Beatrix Potter","level":"infantil"},
  {"source":"gb","id":10469,"title":"Johnny Crow's Garden","author":"L. Leslie Brooke","level":"infantil"},
  {"source":"gb","id":15809,"title":"A Apple Pie","author":"Kate Greenaway","level":"infantil"},
  {"source":"gb","id":18155,"title":"The Story of the Three Little Pigs","author":"L. Leslie Brooke","level":"infantil"},
  {"source":"gb","id":23322,"title":"The Three Bears","author":"Anonymous","level":"infantil"},
  {"source":"gb","id":15661,"title":"The Golden Goose Book","author":"L. Leslie Brooke","level":"infantil","noimages":true},
  {"source":"ws","lang":"en","title":"The Little Red Hen","author":"Florence White Williams","level":"infantil"},
  {"source":"gb","id":19994,"title":"The Aesop for Children","author":"Aesop","level":"infantil","noimages":true},
  {"source":"gb","id":28,"title":"The Fables of Aesop","author":"Aesop (Joseph Jacobs)","level":"infantil"},
  {"source":"gb","id":11339,"title":"Aesop's Fables: A New Translation","author":"Aesop (V. S. Vernon Jones)","level":"infantil","noimages":true},
  {"source":"gb","id":17208,"title":"The Tales of Mother Goose","author":"Charles Perrault","level":"infantil"},
  {"source":"gb","id":7439,"title":"English Fairy Tales","author":"Joseph Jacobs","level":"infantil"},
  {"source":"gb","id":14642,"title":"McGuffey's Eclectic Primer, Revised Edition","author":"William Holmes McGuffey","level":"principiante"},
  {"source":"gb","id":14640,"title":"McGuffey's First Eclectic Reader, Revised Edition","author":"William Holmes McGuffey","level":"principiante"},
  {"source":"gb","id":1489,"title":"The New McGuffey First Reader","author":"William Holmes McGuffey","level":"principiante"},
  {"source":"gb","id":14668,"title":"McGuffey's Second Eclectic Reader","author":"William Holmes McGuffey","level":"principiante","noimages":true},
  {"source":"gb","id":14766,"title":"McGuffey's Third Eclectic Reader","author":"William Holmes McGuffey","level":"principiante"},
  {"source":"gb","id":61852,"title":"Kittens and Cats: A First Reader","author":"Eulalie Osgood Grover","level":"principiante","noimages":true},
  {"source":"gb","id":65323,"title":"A First Reader","author":"Frank E. Spaulding and Catherine T. Bryce","level":"principiante","noimages":true},
  {"source":"gb","id":19551,"title":"Alice in Wonderland, Retold in Words of One Syllable","author":"Lewis Carroll (Mrs. J. C. Gorham)","level":"principiante","noimages":true},
  {"source":"gb","id":18442,"title":"Fifty Famous Stories Retold","author":"James Baldwin","level":"principiante"},
  {"source":"gb","id":21,"title":"Three Hundred Aesop's Fables","author":"Aesop (George Fyler Townsend)","level":"principiante"},
  {"source":"gb","id":2781,"title":"Just So Stories","author":"Rudyard Kipling","level":"intermedio"},
  {"source":"gb","id":2591,"title":"Grimms' Fairy Tales","author":"Jacob and Wilhelm Grimm","level":"intermedio"},
  {"source":"gb","id":1597,"title":"Andersen's Fairy Tales","author":"H. C. Andersen","level":"intermedio"},
  {"source":"gb","id":902,"title":"The Happy Prince, and Other Tales","author":"Oscar Wilde","level":"intermedio","noimages":true},
  {"source":"ws","lang":"en","title":"The Velveteen Rabbit","author":"Margery Williams","level":"intermedio"},
  {"source":"gb","id":21286,"title":"Mother West Wind \"How\" Stories","author":"Thornton W. Burgess","level":"intermedio"},
  {"source":"gb","id":503,"title":"The Blue Fairy Book","author":"Andrew Lang","level":"intermedio"},
  {"source":"gb","id":55,"title":"The Wonderful Wizard of Oz","author":"L. Frank Baum","level":"juvenil"},
  {"source":"gb","id":500,"title":"The Adventures of Pinocchio","author":"Carlo Collodi","level":"juvenil"},
  {"source":"gb","id":501,"title":"The Story of Doctor Dolittle","author":"Hugh Lofting","level":"juvenil"},
  {"source":"gb","id":11,"title":"Alice's Adventures in Wonderland","author":"Lewis Carroll","level":"juvenil"},
  {"source":"gb","id":236,"title":"The Jungle Book","author":"Rudyard Kipling","level":"juvenil","noimages":true}
]
```
