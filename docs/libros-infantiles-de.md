# Libros en alemán para niños y lectores principiantes (catálogo "Infantil / principiantes" DE)

Investigación para el catálogo alemán de Glosa. Fecha: 2026-08-27. Hermano del informe en español (`libros-infantiles-es.md`) y con el mismo método: todo lo que aparece en las tablas se ha comprobado por programa (Gutenberg: descarga del EPUB `pg{id}.epub`, lectura de `dc:title` y `dc:language` del OPF y muestra del texto; Wikisource: `action=parse` con recuento de caracteres y de enlaces). Lo que no se pudo verificar no está.

Niveles: **infantil** (versos y cuentos cortos, vocabulario cotidiano), **principiante** (lecturas graduadas para estudiantes de alemán, relatos cortos con frases simples), **intermedio** (Märchen y relatos del XIX con frases largas) y **juvenil** (novela infantil larga, capítulos de 10 a 20 páginas).

## Resumen rápido

| Fuente | Libros verificados | Licencia | CORS | Integración | Veredicto |
|---|---|---|---|---|---|
| Project Gutenberg | 57 (todos con `pg{id}.epub` 200 y `lang=de`) | Dominio público (EE. UU.) | No, pero ya hay proxy `/gb/` | Solo el ID, como el Top 100 | **Usar** (núcleo del catálogo) |
| Wikisource en alemán | 19 páginas/colecciones comprobadas | Dominio público (ediciones de 1812 a 1900 transcritas de escaneos) | **Sí** (`access-control-allow-origin: *`) | API `parse` como el catálogo árabe | **Usar** para Grimm, Struwwelpeter y Max und Moritz en edición original |
| Projekt Gutenberg-DE (projekt-gutenberg.org) | 0 | Empresa privada; uso solo lectura, sin redistribución | No | Solo HTML dentro de su portal, URLs cambiadas en 2024 | **Descartar** |
| zeno.org | 0 | Copyright de la edición digital | No (HEAD da 405) | | Descartar |

## 1. Project Gutenberg

Integración: la misma que el Top 100 (proxy `/gb/`). Aquí conviene marcar por libro la variante: casi todos los clásicos ilustrados pesan 4 a 14 MB con imágenes (Max und Moritz 11,7 MB, Bechstein 13,8 MB, Grimm 8,1 MB, Thurmuhr 6,6 MB) y 70 a 500 KB sin ellas. En la tabla van los dos tamaños; en el JSON final `noimages: true` señala los que se deben pedir como `pg{id}.epub`.

Avisos generales de Gutenberg en alemán:

- **Audiolibros**: 20050 y 20051 "Märchen der Gebrüder Grimm 1 y 2", 19791 y 19792 "Der Struwwelpeter", 21148 y 21149 "Max und Moritz" y 19636 "Bildergeschichten" son grabaciones de LibriVox sin texto. No incluirlos.
- **Ortografía antigua**: Gutenberg transcribe la edición de papel; los textos anteriores a 1901 llevan "daß", "Thür", "giebt", "Mährchen". Las ediciones más antiguas (Schmid 1818 y 1825, "Die Ostereyer") son las más marcadas. Ningún EPUB de la lista está en Fraktur (se transcribe a Antiqua), pero sí conservan la "ſ" en algún caso puntual.
- **Bilingües**: los lectores graduados americanos (35794, 45189, 49503, 8392) llevan notas y vocabulario en inglés. 49503 (Ährenlese) tiene ejercicios en inglés dentro del texto.
- **Derechos fuera de EE. UU.**: Waldemar Bonsels murió en 1952 (dominio público en la UE desde 2023, sin problema), Agnes Sapper en 1929, Josephine Siebe en 1941, Anna Schieber en 1945, Sibylle von Olfers en 1916, Gerdt von Bassewitz en 1923. Todo dominio público en la UE.

### 1.1 Infantil (versos, libros ilustrados y cuentos cortos)

| ID | Título | Autor | EPUB verificado (sin/con imágenes) | Nivel | Por qué sirve |
|---|---|---|---|---|---|
| 24571 | Der Struwwelpeter: oder lustige Geschichten und drollige Bilder | Heinrich Hoffmann | 161 KB / 4,2 MB | infantil | El libro infantil alemán por antonomasia; 10 historias en verso cortas. Vale la pena la versión con imágenes (4 MB) |
| 32034 | König Nußknacker und der arme Reinhold: Ein Kindermährchen in Bildern | Heinrich Hoffmann | 87 KB / 3,5 MB | infantil | Versos cortos del autor del Struwwelpeter |
| 17161 | Max und Moritz: Eine Bubengeschichte in sieben Streichen | Wilhelm Busch | 73 KB / 11,7 MB | infantil | Siete travesuras en pareados; vocabulario sencillo. Con imágenes pesa 11,7 MB: pedir `pg17161.epub` |
| 2322 | Hans Huckebein | Wilhelm Busch | 73 KB / 73 KB | infantil | "Hans Huckebein, der Unglücksrabe", "Das Pusterohr" y otras historias en verso; sin imágenes |
| 57412 | Etwas von den Wurzelkindern | Sibylle von Olfers | 64 KB / 1,2 MB | infantil | Libro ilustrado de 1906, texto brevísimo. Solo tiene sentido con imágenes (1,2 MB) |
| 70178 | Ri-Ra-Rutsch: Alte und neue Kinderreime | varios | 165 KB / 527 KB | infantil | Rimas y canciones infantiles tradicionales ("Ri-ra-rutsch, wir fahren mit der Kutsch") |
| 56127 | Die Thurmuhr: eine Rechen-Fibel für kleine Kinder | F. G. Normann | 70 KB / 6,6 MB | infantil | Cartilla de números y de la hora (1850). Ortografía antigua; solo con imágenes tiene sentido, y pesa 6,6 MB |
| 19163 | Märchen für Kinder | H. C. Andersen | 223 KB / 4,1 MB | infantil / intermedio | Andersen en alemán (traducción del XIX): Das häßliche Entlein, Die Prinzessin auf der Erbse, etc. |
| 50965 | Märchen (Illustriert von Alfred Kubin) | H. C. Andersen | 109 KB / 1,1 MB | infantil / intermedio | Solo tres cuentos: Die Nachtigall, Die kleine Seejungfrau, Der Reisekamerad. Traducción moderna (1910) |
| 77905 | Deutsche Märchen gesammelt durch die Brüder Grimm | Jacob y Wilhelm Grimm | 541 KB / 8,1 MB | infantil / intermedio | Selección ilustrada de KHM en ortografía de 1900. La única edición de Grimm con texto en Gutenberg |
| 63465 | Ludwig Bechsteins Märchenbuch (176 Holzschnitten von Ludwig Richter) | Ludwig Bechstein | 428 KB / 13,8 MB | infantil / intermedio | 80 cuentos populares; ilustraciones de Richter. Pedir sin imágenes |
| 54586 | Die Ostereyer: Eine Erzählung zum Ostergeschenke für Kinder | Christoph von Schmid | 100 KB / 100 KB | infantil / intermedio | Edición de 1818: ortografía muy antigua ("Ostereyer", "bey") |
| 56520 | Der Weihnachtsabend: Eine Erzählung zum Weihnachtsgeschenke für Kinder | Christoph von Schmid | 119 KB / 148 KB | infantil / intermedio | Edición de 1825, mismo aviso |
| 8917 | Von Kindern und Katzen, und wie sie die Nine begruben | Theodor Storm | 68 KB / 94 KB | infantil | Relato breve para niños |
| 23787 | Märchen-Sammlung | anónimo (ilustrado) | 97 KB / 3,1 MB | infantil | Selección corta de cuentos populares en estilo oral ("Wie hernach die alte Geiß aus dem Walde zurückgekommen ist"); vale la pena con imágenes |
| 42900 | Gänsemütterchens Märchen | Charles Perrault (trad. alemana) | 110 KB / 3 MB | infantil | Perrault en alemán: Rotkäppchen, Der gestiefelte Kater, Aschenbrödel, Dornröschen, Blaubart |
| 22413 | Alaeddin und die Wunderlampe (aus Tausend und eine Nacht) | Curt Moreck (adaptación) | 154 KB / 3,3 MB | infantil / intermedio | Un solo cuento largo, ilustrado |
| 8923 | Die Regentrude | Theodor Storm | 89 KB / 89 KB | intermedio | Märchen clásico de lectura escolar, corto |
| 25722 | Leben und Schicksale des Katers Rosaurus | Amalie Winter | 130 KB / 643 KB | intermedio | Cuento de un gato y una princesita (1839) |
| 43332 | Das Lämmchen (Erzählungen für Kinder, 3. Bändchen) | Christoph von Schmid | 124 KB / 124 KB | infantil / intermedio | Edición de 1826, ortografía antigua |

### 1.2 Principiante (lecturas graduadas y libros de lectura escolar)

| ID | Título | Autor | EPUB verificado | Nivel | Por qué sirve |
|---|---|---|---|---|---|
| 35794 | Märchen und Erzählungen für Anfänger. Erster Teil | H. A. Guerber | 157 KB / 157 KB | principiante | Lector graduado clásico (Heath, 1896): Märchen reescritos con frases muy cortas y vocabulario en inglés |
| 45189 | Märchen und Erzählungen für Anfänger. Zweiter Teil | H. A. Guerber | 165 KB / 165 KB | principiante | Continuación, algo más larga |
| 8392 | Hin und Her: Ein Buch für die Kinder | Henry H. Fick | 113 KB / 522 KB | principiante | Libro de lectura de escuelas alemanas de EE. UU.: poemas y relatos cortos |
| 49503 | Ährenlese: A German Reader with Practical Exercises | varios | 362 KB / 891 KB | principiante | Lector con ejercicios en inglés; textos cortos |
| 9375 | Ausgewählte Fabeln | G. E. Lessing | 82 KB / 94 KB | principiante / intermedio | Fábulas en prosa de tres a diez líneas ("Der Rabe und der Fuchs") |
| 9158 | Fabeln und Erzählungen | G. E. Lessing | 85 KB / 97 KB | intermedio | Fábulas en verso |
| 9335 | Fabeln und Erzählungen | C. F. Gellert | 154 KB / 164 KB | intermedio | Fábulas en verso del XVIII; índice alfabético, no por libro |
| 58989 | Tiere und Pflanzen in Wald und Feld | Arabella B. Buckley | 101 KB / 3,3 MB | principiante / intermedio | Divulgación de naturaleza para niños, capítulos cortos |
| 48541 | Robinson in Australien: Ein Lehr- und Lesebuch für gute Kinder | Amalie Schoppe | 215 KB / 551 KB | intermedio | "Lehr- und Lesebuch" de 1843; ortografía antigua |

### 1.3 Intermedio y juvenil (novela infantil)

| ID | Título | Autor | EPUB verificado | Nivel | Por qué sirve |
|---|---|---|---|---|---|
| 7500 | Heidis Lehr- und Wanderjahre | Johanna Spyri | 195 KB / 195 KB | juvenil | Heidi, primera parte. (7511 es un duplicado del mismo texto) |
| 7512 | Heidi kann brauchen, was es gelernt hat | Johanna Spyri | 160 KB / 170 KB | juvenil | Heidi, segunda parte |
| 9860 | Moni der Geißbub | Johanna Spyri | 93 KB / 93 KB | intermedio | Relato corto (6 capítulos), el más fácil de Spyri |
| 9861 | Was die Großmutter gelehrt hat | Johanna Spyri | 119 KB / 228 KB | intermedio | Relato corto |
| 9859 | Vom This, der doch etwas wird | Johanna Spyri | 120 KB / 243 KB | intermedio | Relato corto |
| 7888 | Wie Wiselis Weg gefunden wird | Johanna Spyri | 170 KB / 293 KB | intermedio | Relato |
| 20780 | Heimatlos (Geschichten für Kinder, 1. Band) | Johanna Spyri | 213 KB / 1,4 MB | juvenil | Dos relatos largos |
| 22570 | Wo Gritlis Kinder hingekommen sind (8. Band) | Johanna Spyri | 167 KB / 2,3 MB | juvenil | Relatos |
| 31114 | Wunderbare Reise des kleinen Nils Holgersson mit den Wildgänsen | Selma Lagerlöf | 609 KB / 2,6 MB | juvenil | Novela larga; traducción de Pauline Klaiber (1907) |
| 6638 | Märchen-Almanach auf das Jahr 1826 | Wilhelm Hauff | 182 KB / 192 KB | intermedio | Die Karawane: Kalif Storch, Das Gespensterschiff, Die abgehauene Hand, Die Errettung Fatmes, Der kleine Muck, Das Märchen vom falschen Prinzen |
| 6639 | Märchen-Almanach auf das Jahr 1827 | Wilhelm Hauff | 157 KB / 165 KB | intermedio | Der Scheik von Alessandria: Der Zwerg Nase, Abner der Jude, Der Affe als Mensch |
| 6640 | Märchen-Almanach auf das Jahr 1828 | Wilhelm Hauff | 213 KB / 220 KB | intermedio | Das Wirtshaus im Spessart: Das kalte Herz, Saids Schicksale |
| 58300 | Das erste Schuljahr: Eine Erzählung für Kinder von 7-12 Jahren | Agnes Sapper | 167 KB / 237 KB | intermedio | Relato escolar, frases sencillas |
| 50277 | Kleinstadtkinder: Buben und Mädelgeschichten | Josephine Siebe | 208 KB / 622 KB | intermedio | Historias cortas de niños (1912) |
| 49738 | Neue Kindergeschichten aus Oberheudorf: Fünfzehn heitere Erzählungen | Josephine Siebe | 190 KB / 2,8 MB | intermedio | Quince relatos humorísticos cortos |
| 75672 | Röschen, Jaköble und andere kleine Leute | Anna Schieber | 450 KB / 4,9 MB | intermedio | Relatos infantiles (1909) |
| 53973 | Max Butziwackel der Ameisenkaiser | Vamba (trad.) | 259 KB / 1,5 MB | juvenil | Novela infantil italiana traducida |
| 21021 | Die Biene Maja und ihre Abenteuer | Waldemar Bonsels | 165 KB / 179 KB | juvenil | Clásico de 1912, capítulos cortos, alemán moderno |
| 31204 | Peterchens Mondfahrt: Ein Märchenspiel | Gerdt von Bassewitz | 131 KB / 141 KB | intermedio | **Aviso**: es la versión teatral (acotaciones y diálogo), no el libro narrativo de 1915 |
| 19778 | Alice's Abenteuer im Wunderland | Lewis Carroll (trad. Antonie Zimmermann, 1869) | 138 KB / 3,5 MB | juvenil | Traducción autorizada con las 42 ilustraciones de Tenniel; ortografía de 1869 |
| 36813 | Kasperle auf Reisen: Eine lustige Geschichte | Josephine Siebe | 177 KB / 921 KB | intermedio | Kasperle, el títere; serie muy popular |
| 47734 | Oberheudorfer Buben- und Mädelgeschichten: Sechszehn heitere Erzählungen | Josephine Siebe | 186 KB / 1,9 MB | intermedio | Dieciséis relatos cortos |
| 31309 | Der Trotzkopf: Eine Pensionsgeschichte für erwachsene Mädchen | Emmy von Rhoden | 275 KB / 2,1 MB | juvenil | Novela de internado, clásico juvenil |
| 48902 | Sidsel Langröckchen | Hans Aanrud (trad.) | 150 KB / 803 KB | juvenil | Novela infantil noruega, edición de 1914 |
| 62943 | Riesele: Geschichte eines kleinen Pferdes | Nikolaus Schwarzkopf | 175 KB / 235 KB | intermedio | Historia de un caballito (1920) |
| 67897 | Der Zweifüßler und andere Geschichten: Naturgeschichtliche Märchen | Carl Ewald (trad.) | 249 KB / 14,2 MB | intermedio | Cuentos de naturaleza; con imágenes pesa 14 MB, pedir sin |
| 4501 | Gockel, Hinkel und Gackeleia | Clemens Brentano | 234 KB / 234 KB | intermedio / avanzado | Märchen romántico largo y juguetón; no para principiantes |
| 37940 | Rübezahl: Neue Sammlung der schönsten Sagen und Märchen | Rosalie Koch | 188 KB / 1,4 MB | intermedio | Leyendas del Riesengebirge |

Otros vistos y descartados: 7511 (duplicado de 7500), 27220 Himmelsvolk (Bonsels, más filosófico), 64541 Amoralische Fabeln (para adultos), 6641 y 6724 Arndt (no verificados), 17362 y 9200 E. T. A. Hoffmann (adultos), 12075 Kriegsbüchlein (propaganda de 1915), 40138 y 39624 Kinderkreuzzug (no infantiles a pesar del título).

## 2. Wikisource en alemán (de.wikisource.org)

Comprobado: `https://de.wikisource.org/w/api.php?action=parse&page=...&prop=text|links&format=json&origin=*` responde con `access-control-allow-origin: *`. Dos avisos operativos:

- La API **bloquea el User-Agent vacío o genérico** (403) y **limita la tasa** (429 al encadenar 20 peticiones seguidas). Desde el navegador el UA es el del usuario, así que el 403 no afecta; pero al montar un libro de 20 subpáginas hay que pedirlas en serie con una pausa corta o de 3 en 3, no en paralelo.
- de.wikisource trabaja casi siempre con transcripción por páginas (namespace `Seite:`) transcluidas: **`action=parse` devuelve el texto completo ya montado**, verificado en Struwwelpeter, Max und Moritz y los Grimm de 1857. Cada página lleva un cuadro `Textdaten` (autor, título, edición, fuente) y un aviso "Für eine seitenweise Ansicht und den Vergleich mit den zugrundegelegten Scans..." que hay que quitar, igual que las flechas «  » de navegación. Los números de página entre corchetes van en `<span class="pagenum">`.

Estructuras que hay:

1. **Obra con subpáginas** (`Der Struwwelpeter/…`, `Max und Moritz/Erster Streich`): la página madre lista las partes en orden en el HTML.
2. **Cuentos sueltos con año** (Grimm): cada cuento es una página `Título (1857)`; la página sin año (`Rotkäppchen`, `Schneewittchen`) es una desambiguación que enumera las siete ediciones (1812 a 1857). La página `Kinder- und Haus-Märchen Band 1 (1857)` es el índice de KHM 1 a 86 con 103 enlaces ns0; `Band 2 (1857)`, KHM 87 a 200 (143 enlaces). Para un libro "Grimm para niños" lo práctico es una lista fija de 15 a 25 cuentos de la edición de 1857 (la última en vida de los Grimm y la ortografía más cercana a la actual).

Ortografía: todas las ediciones son anteriores a la reforma de 1901 ("Rothkäppchen", "Grethel", "daß", "Thür"). Para un lector principiante es asumible en Grimm (pocas palabras afectadas) y molesto en textos del XVIII.

| Página de Wikisource (identificador exacto) | Autor / edición | Estructura | Nivel | Verificación |
|---|---|---|---|---|
| `Der Struwwelpeter` | Heinrich Hoffmann, 400.ª edición | Índice con 14 enlaces ns0; subpáginas `Der Struwwelpeter/Vorspruch`, `/Struwwelpeter`, `/Die Geschichte vom bösen Friederich`, `/Die gar traurige Geschichte mit dem Feuerzeug`… | infantil | Índice y subpágina "Die Geschichte vom bösen Friederich" leídos (1.674 caracteres con navegación) |
| `Max und Moritz` | Wilhelm Busch, edición histórico-crítica (Bohne) | Índice con 8 enlaces: `Max und Moritz/Erster Streich` … `/Siebenter Streich` | infantil | Índice y "Erster Streich" leídos (3.234 caracteres) |
| `Rothkäppchen (1857)` | Grimm, KHM 26 | Texto directo (8.354 caracteres) | infantil | Leído |
| `Hänsel und Grethel (1857)` | Grimm, KHM 15 | Texto directo (16.714) | infantil | Leído |
| `Die Bremer Stadtmusikanten (1857)` | Grimm, KHM 27 | Texto directo (7.858) | infantil | Leído |
| `Der Froschkönig oder der eiserne Heinrich (1857)` | Grimm, KHM 1 | Texto directo (8.696) | infantil | Leído |
| `Sneewittchen (1857)` | Grimm, KHM 53 | Texto directo (18.008) | infantil / intermedio | Leído |
| `Aschenputtel (1857)` | Grimm, KHM 21 | Texto directo (15.298) | infantil | Leído |
| `Dornröschen (1857)` | Grimm, KHM 50 | Texto directo (8.168) | infantil | Leído |
| `Rumpelstilzchen (1857)` | Grimm, KHM 55 | Texto directo (6.758) | infantil | Leído |
| `Kinder- und Haus-Märchen Band 1 (1857)` | Grimm | Índice, 103 enlaces ns0 (KHM 1 a 86 más navegación entre ediciones) | infantil / intermedio | Índice listado |
| `Kinder- und Haus-Märchen Band 2 (1857)` | Grimm | Índice, 143 enlaces ns0 | intermedio | Índice listado |
| `Kinder- und Hausmärchen` | Grimm | Página madre con las 7 ediciones (1.618 enlaces): solo para navegar | | Listado |
| `Fabeln und Erzählungen` | C. F. Gellert, Sämmtliche Schriften | Índice con 151 enlaces a fábulas sueltas (páginas propias sin prefijo) | intermedio | Índice listado |
| `Die Geschichte von Kalif Storch` | Wilhelm Hauff, Märchen-Almanach 1826 | Texto directo (22.469 caracteres), marcado "Fertig" (corregido dos veces). `Kalif Storch` redirige aquí | intermedio | Leído |
| `Der Zwerg Nase` | Wilhelm Hauff, Märchen-Almanach 1827 | Texto directo (63.726 caracteres), "Fertig". `Zwerg Nase` redirige aquí | intermedio | Leído |
| `Die Karawane/1`, `Die Karawane/2`… | Wilhelm Hauff | Marco narrativo del almanaque de 1826 entre los cuentos (la página `Die Karawane` sin número no existe) | intermedio | Enlaces vistos desde Kalif Storch; no leídos |

No existen con ese título (missingtitle): `Die Sterntaler (1857)`, `Der Wolf und die sieben jungen Geißlein (1857)`, `Das kalte Herz`, `Deutsches Märchenbuch (1845)`, `Fabeln (Lessing)`. Para ampliar la lista de Grimm hay que sacar los títulos exactos del índice `Kinder- und Haus-Märchen Band 1 (1857)` y no adivinarlos.
| `Schatzkästlein des rheinischen Hausfreundes` | Johann Peter Hebel, 1803-1811 | Índice con 129 enlaces a piezas sueltas (páginas propias: `Kannitverstan`, `Unverhofftes Wiedersehen`, `Der kluge Richter`…) | principiante / intermedio | Índice listado; `Kannitverstan` leído (6.170 caracteres). Anécdotas de una página, lectura escolar clásica. Mezcla piezas de calendario (astronomía, "Rechnungsexempel") que hay que filtrar |

Autores con página propia y sin obra útil verificada: `Hans Christian Andersen` (solo 1 enlace: no hay traducciones alemanas en de.wikisource), `Wilhelm Hauff` (31 enlaces, la mayoría poemas), `Ludwig Bechstein` (27 enlaces; el "Deutsches Märchenbuch" no está con ese título).

## 3. Fuentes descartadas

- **Projekt Gutenberg-DE** (projekt-gutenberg.org): tiene el mayor corpus alemán (Grimm completo, Bechstein, Hauff, Nesthäkchen, Trotzkopf...) pero es una empresa privada (Hille & Partner): sus condiciones permiten la lectura en el portal y prohíben la redistribución y el uso comercial del HTML; en 2024 cambió toda la estructura de URLs (`/authors/brueder-grimm/books/kinder-und-hausmaerchen/`) y no envía `access-control-allow-origin`. Sin proxy ni licencia no sirve. Muchos EPUB de Gutenberg (9375, 9158, 9335, 7512) proceden de sus ficheros donados antes de 2005, así que ese texto ya está en Gutenberg.
- **zeno.org**: copyright de la edición digital, HEAD devuelve 405 y no hay CORS.
- **Nesthäkchen (Else Ury)**: no está en Gutenberg (búsqueda "Nesthäkchen" y "Ury" sin resultados). Ury murió en Auschwitz en 1943: dominio público en la UE desde 2014, pero las obras posteriores a 1928 no lo son en EE. UU., y Gutenberg no las tiene. Fuera de la lista.
- **Kästner, Lindgren, Preußler, Ende, Janosch**: derechos vigentes. No buscar.
- **Pinocchio en alemán, Till Eulenspiegel, Campe (Robinson der Jüngere), Andersen en de.wikisource**: sin resultados en Gutenberg (`l.de`) ni en Wikisource con esos títulos.

## Recomendación: qué meter en el catálogo y cómo

Un catálogo "Infantil / principiantes DE" de 38 títulos en lista estática (misma mecánica que el español: `source` `gb` o `ws` más identificador, orden dado por nosotros). Gutenberg cubre casi todo; Wikisource aporta lo que a Gutenberg le falta (Grimm en edición original cuento a cuento, Struwwelpeter y Max und Moritz en texto limpio y ligero, Hebel) y sirve de reserva.

Una diferencia con el español que conviene tener en cuenta: en alemán hay muchísimo libro ilustrado (Bilderbuch) donde el texto sin las imágenes pierde sentido (Wurzelkinder, Thurmuhr, Struwwelpeter). Para esos, la variante con imágenes es la buena aunque pese 1 a 4 MB; se reserva `noimages` para los que pasan de 8 MB (Max und Moritz, Bechstein, Grimm 77905, Ewald).

**Bloque A. Infantil (versos, cuentos y fábulas cortos), 16 títulos**

1. Der Struwwelpeter, Heinrich Hoffmann (gb 24571, con imágenes; alternativa ws `Der Struwwelpeter`)
2. Max und Moritz, Wilhelm Busch (gb 17161 con `pg17161.epub`; alternativa ws `Max und Moritz`, 7 Streiche)
3. Hans Huckebein, Wilhelm Busch (gb 2322)
4. König Nußknacker und der arme Reinhold, Hoffmann (gb 32034)
5. Etwas von den Wurzelkindern, Olfers (gb 57412, con imágenes)
6. Ri-Ra-Rutsch: Alte und neue Kinderreime (gb 70178)
7. Grimm, cuentos escogidos de la edición de 1857 (ws, agrupar en un solo libro las ocho páginas verificadas: Froschkönig, Hänsel und Grethel, Rothkäppchen, Bremer Stadtmusikanten, Sneewittchen, Aschenputtel, Dornröschen, Rumpelstilzchen; ampliar con más títulos exactos del índice `Kinder- und Haus-Märchen Band 1 (1857)`)
8. Deutsche Märchen gesammelt durch die Brüder Grimm (gb 77905, `pg77905.epub`)
9. Märchen-Sammlung, anónimo ilustrado (gb 23787)
10. Gänsemütterchens Märchen, Perrault (gb 42900)
11. Märchen für Kinder, Andersen (gb 19163)
12. Märchen (Kubin): Die Nachtigall, Die kleine Seejungfrau, Der Reisekamerad, Andersen (gb 50965)
13. Ludwig Bechsteins Märchenbuch (gb 63465, `pg63465.epub`)
14. Von Kindern und Katzen, Storm (gb 8917)
15. Alaeddin und die Wunderlampe (gb 22413)
16. Die Regentrude, Storm (gb 8923)

**Bloque B. Principiante (lecturas graduadas y textos cortos), 10 títulos**

17. Märchen und Erzählungen für Anfänger, 1. Teil, Guerber (gb 35794)
18. Märchen und Erzählungen für Anfänger, 2. Teil, Guerber (gb 45189)
19. Hin und Her: Ein Buch für die Kinder, Fick (gb 8392)
20. Ährenlese: A German Reader (gb 49503)
21. Ausgewählte Fabeln, Lessing (gb 9375)
22. Fabeln und Erzählungen, Lessing (gb 9158)
23. Schatzkästlein des rheinischen Hausfreundes, Hebel (ws; elegir las anécdotas, como `Kannitverstan`, y saltar las piezas de calendario)
24. Das erste Schuljahr, Sapper (gb 58300)
25. Tiere und Pflanzen in Wald und Feld, Buckley (gb 58989)
26. Moni der Geißbub, Spyri (gb 9860)

**Bloque C. Intermedio y juvenil, 12 títulos**

27. Heidis Lehr- und Wanderjahre, Spyri (gb 7500)
28. Heidi kann brauchen, was es gelernt hat, Spyri (gb 7512)
29. Die Biene Maja und ihre Abenteuer, Bonsels (gb 21021)
30. Märchen-Almanach auf das Jahr 1826 (Kalif Storch, Der kleine Muck), Hauff (gb 6638)
31. Märchen-Almanach auf das Jahr 1827 (Der Zwerg Nase), Hauff (gb 6639)
32. Märchen-Almanach auf das Jahr 1828 (Das kalte Herz), Hauff (gb 6640)
33. Die Geschichte von Kalif Storch, Hauff, suelto (ws `Die Geschichte von Kalif Storch`; y `Der Zwerg Nase` como segundo suelto)
34. Wunderbare Reise des kleinen Nils Holgersson, Lagerlöf (gb 31114)
35. Alice's Abenteuer im Wunderland, Carroll (gb 19778)
36. Kasperle auf Reisen, Siebe (gb 36813)
37. Neue Kindergeschichten aus Oberheudorf, Siebe (gb 49738)
38. Der Trotzkopf, Rhoden (gb 31309)

Reserva (verificados, fuera de la lista por espacio): Spyri 9861, 9859, 7888, 20780, 22570; Siebe 50277, 47734; Schmid 54586, 56520, 43332 (ortografía de 1818-1826); Gellert 9335; Winter 25722; Schieber 75672; Schwarzkopf 62943; Aanrud 48902; Koch 37940; Ewald 67897; Schoppe 48541; Normann 56127; Bassewitz 31204 (versión teatral); Brentano 4501 (difícil); Vamba 53973.

Fuera por formato: los audiolibros de LibriVox (20050, 20051, 19791, 19792, 21148, 21149, 19636). Fuera por derechos o por no existir en fuente libre: Nesthäkchen, Kästner y todo lo posterior a 1929.

**Cómo integrarlo**

- Gutenberg: reutilizar `openBook`, con `noimages` por libro para pedir `pg{id}.epub` en los que pasan de 8 MB.
- Wikisource: reutilizar el flujo del catálogo árabe con dos ajustes. (a) Los libros de Grimm y Hebel son listas fijas de páginas sueltas (no un índice con subpáginas): el catálogo lleva el array de títulos y se pide cada uno con `action=parse&prop=text`. (b) Limpieza: quitar la tabla `Textdaten` (primer `<table>` de la página), el aviso "Für eine seitenweise Ansicht...", los `<span class="pagenum">` y la navegación de principio y final; en Struwwelpeter y Max und Moritz recorrer los enlaces `Der Struwwelpeter/...` y `Max und Moritz/...` en el orden del HTML del índice. Pedir las subpáginas en serie con pausa de 300 a 500 ms: la API devuelve 429 al encadenar 20 seguidas.
- Projekt Gutenberg-DE queda fuera salvo que en el futuro se negocie una licencia; es la única fuente con Nesthäkchen y Bechstein completo en texto moderno.

```json
[
  {"source":"gb","id":24571,"title":"Der Struwwelpeter","author":"Heinrich Hoffmann","level":"infantil"},
  {"source":"gb","id":17161,"title":"Max und Moritz","author":"Wilhelm Busch","level":"infantil","noimages":true},
  {"source":"gb","id":2322,"title":"Hans Huckebein","author":"Wilhelm Busch","level":"infantil"},
  {"source":"gb","id":32034,"title":"König Nußknacker und der arme Reinhold","author":"Heinrich Hoffmann","level":"infantil"},
  {"source":"gb","id":57412,"title":"Etwas von den Wurzelkindern","author":"Sibylle von Olfers","level":"infantil"},
  {"source":"gb","id":70178,"title":"Ri-Ra-Rutsch: Alte und neue Kinderreime","author":"varios","level":"infantil"},
  {"source":"ws","lang":"de","title":"Der Froschkönig oder der eiserne Heinrich (1857)","author":"Brüder Grimm","level":"infantil"},
  {"source":"ws","lang":"de","title":"Hänsel und Grethel (1857)","author":"Brüder Grimm","level":"infantil"},
  {"source":"ws","lang":"de","title":"Rothkäppchen (1857)","author":"Brüder Grimm","level":"infantil"},
  {"source":"ws","lang":"de","title":"Die Bremer Stadtmusikanten (1857)","author":"Brüder Grimm","level":"infantil"},
  {"source":"ws","lang":"de","title":"Sneewittchen (1857)","author":"Brüder Grimm","level":"infantil"},
  {"source":"ws","lang":"de","title":"Aschenputtel (1857)","author":"Brüder Grimm","level":"infantil"},
  {"source":"ws","lang":"de","title":"Dornröschen (1857)","author":"Brüder Grimm","level":"infantil"},
  {"source":"ws","lang":"de","title":"Rumpelstilzchen (1857)","author":"Brüder Grimm","level":"infantil"},
  {"source":"ws","lang":"de","title":"Der Struwwelpeter","author":"Heinrich Hoffmann","level":"infantil"},
  {"source":"ws","lang":"de","title":"Max und Moritz","author":"Wilhelm Busch","level":"infantil"},
  {"source":"gb","id":77905,"title":"Deutsche Märchen gesammelt durch die Brüder Grimm","author":"Brüder Grimm","level":"infantil","noimages":true},
  {"source":"gb","id":23787,"title":"Märchen-Sammlung","author":"anónimo","level":"infantil"},
  {"source":"gb","id":42900,"title":"Gänsemütterchens Märchen","author":"Charles Perrault","level":"infantil"},
  {"source":"gb","id":19163,"title":"Märchen für Kinder","author":"H. C. Andersen","level":"infantil"},
  {"source":"gb","id":50965,"title":"Märchen (Die Nachtigall, Die kleine Seejungfrau, Der Reisekamerad)","author":"H. C. Andersen","level":"infantil"},
  {"source":"gb","id":63465,"title":"Ludwig Bechsteins Märchenbuch","author":"Ludwig Bechstein","level":"infantil","noimages":true},
  {"source":"gb","id":8917,"title":"Von Kindern und Katzen, und wie sie die Nine begruben","author":"Theodor Storm","level":"infantil"},
  {"source":"gb","id":22413,"title":"Alaeddin und die Wunderlampe","author":"Curt Moreck","level":"infantil"},
  {"source":"gb","id":8923,"title":"Die Regentrude","author":"Theodor Storm","level":"infantil"},
  {"source":"gb","id":35794,"title":"Märchen und Erzählungen für Anfänger. Erster Teil","author":"H. A. Guerber","level":"principiante"},
  {"source":"gb","id":45189,"title":"Märchen und Erzählungen für Anfänger. Zweiter Teil","author":"H. A. Guerber","level":"principiante"},
  {"source":"gb","id":8392,"title":"Hin und Her: Ein Buch für die Kinder","author":"Henry H. Fick","level":"principiante"},
  {"source":"gb","id":49503,"title":"Ährenlese: A German Reader with Practical Exercises","author":"varios","level":"principiante"},
  {"source":"gb","id":9375,"title":"Ausgewählte Fabeln","author":"Gotthold Ephraim Lessing","level":"principiante"},
  {"source":"gb","id":9158,"title":"Fabeln und Erzählungen","author":"Gotthold Ephraim Lessing","level":"principiante"},
  {"source":"ws","lang":"de","title":"Schatzkästlein des rheinischen Hausfreundes","author":"Johann Peter Hebel","level":"principiante"},
  {"source":"gb","id":58300,"title":"Das erste Schuljahr","author":"Agnes Sapper","level":"principiante"},
  {"source":"gb","id":58989,"title":"Tiere und Pflanzen in Wald und Feld","author":"Arabella B. Buckley","level":"principiante"},
  {"source":"gb","id":9860,"title":"Moni der Geißbub","author":"Johanna Spyri","level":"principiante"},
  {"source":"gb","id":7500,"title":"Heidis Lehr- und Wanderjahre","author":"Johanna Spyri","level":"intermedio"},
  {"source":"gb","id":7512,"title":"Heidi kann brauchen, was es gelernt hat","author":"Johanna Spyri","level":"intermedio"},
  {"source":"gb","id":21021,"title":"Die Biene Maja und ihre Abenteuer","author":"Waldemar Bonsels","level":"intermedio"},
  {"source":"gb","id":6638,"title":"Märchen-Almanach auf das Jahr 1826 (Die Karawane)","author":"Wilhelm Hauff","level":"intermedio"},
  {"source":"gb","id":6639,"title":"Märchen-Almanach auf das Jahr 1827 (Der Zwerg Nase)","author":"Wilhelm Hauff","level":"intermedio"},
  {"source":"gb","id":6640,"title":"Märchen-Almanach auf das Jahr 1828 (Das kalte Herz)","author":"Wilhelm Hauff","level":"intermedio"},
  {"source":"ws","lang":"de","title":"Die Geschichte von Kalif Storch","author":"Wilhelm Hauff","level":"intermedio"},
  {"source":"ws","lang":"de","title":"Der Zwerg Nase","author":"Wilhelm Hauff","level":"intermedio"},
  {"source":"gb","id":31114,"title":"Wunderbare Reise des kleinen Nils Holgersson mit den Wildgänsen","author":"Selma Lagerlöf","level":"intermedio"},
  {"source":"gb","id":19778,"title":"Alice's Abenteuer im Wunderland","author":"Lewis Carroll","level":"intermedio"},
  {"source":"gb","id":36813,"title":"Kasperle auf Reisen","author":"Josephine Siebe","level":"intermedio"},
  {"source":"gb","id":49738,"title":"Neue Kindergeschichten aus Oberheudorf","author":"Josephine Siebe","level":"intermedio"},
  {"source":"gb","id":31309,"title":"Der Trotzkopf","author":"Emmy von Rhoden","level":"intermedio"}
]
```
