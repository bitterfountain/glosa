# Libros en italiano para niños y lectores principiantes (catálogo "Infantil / principiantes" IT)

Investigación para el catálogo infantil en italiano de Glosa, hermana del informe en español (`libros-infantiles-es.md`). Fecha: 2026-08-27. Todo lo que aparece en las tablas se ha comprobado con `curl` en esta sesión (código 200, título e idioma del libro indicado; en Wikisource, que `action=parse` devuelve la página y cuántas subpáginas cuelgan de ella). Lo que no se pudo verificar no está.

Niveles: **infantil** (fábulas y cuentos cortos, vocabulario sencillo), **principiante** (lecturas graduadas, capítulos cortos con frases simples), **intermedio** (prosa normal del XIX/XX) y **juvenil** (novela de aventuras, intermedio largo).

## Resumen rápido

| Fuente | Libros verificados | Licencia | CORS | Integración | Veredicto |
|---|---|---|---|---|---|
| Project Gutenberg | 19 | Dominio público (EE. UU.) | No, pero ya hay proxy `/gb/` | Solo el ID, como el Top 100 | **Usar** (Pinocchio, Alice, lectores graduados, Salgari) |
| Wikisource en italiano | 27 obras | Dominio público; transcripción CC BY-SA 3.0 | **Sí** (`access-control-allow-origin: *` comprobado) | API `parse`, igual que el catálogo árabe y el español | **Usar** (la fuente más rica: Capuana, Gozzano, Cuore, Esopo, Fedro, Perrault, Andersen) |
| LiberLiber | 0 descargables | Sus ediciones llevan CC BY-NC-SA 4.0 | No comprobable (sin URL de EPUB) | Haría falta proxy y aceptar la licencia NC | **Descartar** por ahora (ver §3) |
| Otras (StoryWeaver, Bloom, African Storybook) | no revisadas para italiano | | | | Fuera de tiempo; en el informe en español ya se vio que exigen proxy nuevo |

## 1. Project Gutenberg

Integración: la misma que el Top 100 (proxy `/gb/`, `cache/epub/{id}/pg{id}-images.epub` con fallback a `pg{id}.epub`). Todos los ID de abajo devolvieron 200 en `pg{id}.epub`; el tamaño con y sin imágenes va en la tabla. Donde la variante con imágenes se dispara (Gulliver 9 MB, Pinocchio 3 MB, Baccini 2,2 MB) conviene `noimages`.

Trampas encontradas:

- **19517 "Le avventure di Pinocchio" es un audiolibro de LibriVox** (solo m4b/mp3/ogg; el `pg19517.epub` pesa 10 KB y no tiene texto). El Pinocchio con texto es **52484**.
- **77385 y 77386 (Pentamerone de Basile)** están en napolitano del XVII: no sirven para principiantes.
- **62477 "XII conti pomiglianesi"** (Imbriani) es dialecto de Pomigliano con traducción: fuera.
- Búsquedas hechas (`l.it` + `s.juvenile`, `s.fables`, `s.fairy`, `s.readers`, `s.children`, `fiabe`, `favole`, `bambini`, `ragazzi`, `leggende`, `Cuore` y por autor: Collodi, Capuana, De Amicis, Salgari, Baccini, Gozzano, Verne, Andersen, Grimm, Perrault, Esopo, Fedro, Vamba, Yambo, Perodi, Nerucci, Pitrè, Imbriani, Straparola, Twain, Stevenson, Kipling, Spyri, Swift, Defoe, Dickens, Alcott, Burnett, Carroll). Gutenberg **no tiene en italiano** ni Cuore, ni Capuana, ni Gozzano, ni Andersen, ni Grimm, ni Perrault, ni Esopo, ni Fedro, ni Gian Burrasca. Para todo eso hay que ir a Wikisource.

| ID | Título | Autor | EPUB verificado (sin imágenes / con imágenes) | Nivel | Por qué sirve |
|---|---|---|---|---|---|
| 52484 | Le avventure di Pinocchio: Storia di un burattino | Carlo Collodi | 219 KB / 3,0 MB | principiante | El clásico infantil italiano; 36 capítulos cortos |
| 17805 | Lezioni e Racconti per i bambini | Ida Baccini | 145 KB / 2,2 MB | infantil | Lecturas escolares de primaria (1882), textos de 1 a 2 páginas |
| 22503 | Piccoli eroi: Libro per i ragazzi | Virginia Treves ("Cordelia") | 212 KB (idénticos) | principiante | Cuentos cortos para niños de escuela |
| 69422 | Le gaie farandole | Antonio Beltramelli | 194 KB / 1,6 MB | infantil / principiante | Fábulas y cuentos para niños (autor muerto en 1930, dominio público) |
| 24072 | First Italian Readings | varios (ed. con notas en inglés) | 213 KB / 228 KB | principiante | Lector graduado con vocabulario en inglés |
| 49463 | Racconti per giovinetti | Pietro Thouar | 322 KB / 748 KB | principiante / intermedio | Cuentos morales para jóvenes, clásico escolar del XIX |
| 28371 | Le avventure d'Alice nel paese delle meraviglie | Lewis Carroll (trad. Pietrocola Rossetti, 1872) | 143 KB / 1,6 MB | intermedio | Alicia en italiano con ilustraciones de Tenniel |
| 73094 | I ragazzi d'una volta e i ragazzi d'adesso | marchesa Colombi | 212 KB / 342 KB | intermedio | Relatos sobre infancia, capítulos cortos |
| 61885 | Ricordi d'infanzia e di scuola | Edmondo De Amicis | 377 KB / 427 KB | intermedio | El autor de Cuore contando su infancia |
| 58341 | Novelle | Edmondo De Amicis | 276 KB / 904 KB | intermedio | Relatos breves |
| 42416 | Piccole anime | Matilde Serao | 123 KB / 230 KB | intermedio | Relatos sobre niños (no escritos para niños) |
| 41342 | Piccole storie del mondo grande | Alfredo Panzini | 216 KB | intermedio | Historias cortas; Panzini murió en 1939, dominio público en la UE desde 2010 |
| 34519 | Mastr'Impicca | Vittorio Imbriani | 143 KB (idénticos) | intermedio | Fiaba larga en toscano literario |
| 46898 | La novellaja fiorentina | Vittorio Imbriani | 625 KB / 627 KB | intermedio (aviso) | Cuentos populares recogidos de viva voz en Florencia; habla popular toscana, no para principiantes |
| 65736 | Il giro del mondo in ottanta giorni | Jules Verne | 306 KB / 456 KB | juvenil | Aventuras, capítulos cortos |
| 61209 | I Robinson italiani | Emilio Salgari | 302 KB / 1,5 MB | juvenil | Salgari de náufragos, el más "Robinson" de sus libros |
| 61179 | Viaggi di Gulliver nelle lontane regioni | Jonathan Swift | 353 KB / 9,3 MB | juvenil | Gulliver ilustrado; pedir sin imágenes |
| 54787 | Il lampionaio | Maria S. Cummins | 596 KB / 680 KB | juvenil | Novela juvenil del XIX (The Lamplighter) |
| 19886 | Fiore di leggende | sin autor en la ficha | 293 KB | sin clasificar | Solo comprobado el 200; contenido no revisado, no incluir sin leerlo |

Otros de Salgari verificados en la búsqueda (todos juvenil, no descargados): 25180 La favorita del Mahdi, 58415 Una sfida al Polo, 70993 L'Uomo di Fuoco, 64062 Le Aquile della Steppa, 73796 I pescatori di trepang, 74341 Al polo australe in velocipede. También 61921 (otra traducción antigua de Gulliver, 357 KB).

## 2. Wikisource en italiano (it.wikisource.org)

Comprobado: `https://it.wikisource.org/w/api.php?action=parse&page=...&prop=text|links&format=json&origin=*` responde `access-control-allow-origin: *`. Cada obra de abajo es una página índice cuyas subpáginas (enlaces ns0 que empiezan por `Título/`) son los capítulos o cuentos, salvo `Cappuccetto Rosso`, que es texto directo. La columna "subpáginas" es lo que devolvió la API en esta sesión. Las páginas de Wikisource italiano llevan metadatos `dc:` con la fuente (edición escaneada) y la licencia de la transcripción (CC BY-SA 3.0 / GFDL); los textos originales son dominio público por fecha o por autor.

Aviso de estructura: en muchas obras hay **dos niveles** (cuento → capítulos: `La danza degli gnomi e altre fiabe/Piumadoro e Piombofino/I`; `Cuore (1889)/Ottobre/Il primo giorno di scuola`; `Favole (Fedro)/Libro primo/I - Il Lupo e l'Agnello`). El importador tiene que recorrer los enlaces del índice en orden de aparición y, si una subpágina es a su vez índice, bajar un nivel más. Hay que limpiar `<style>`, el bloque `#headertemplate` (barra anterior/siguiente, clase `barraCapitolo`), las tablas `.ambox` y los metadatos `dc:` que van al principio del HTML.

Ojo con las peticiones: a partir de unas 10 llamadas seguidas sin `User-Agent` identificado, la API empezó a devolver respuestas vacías. Con un UA propio y 0,5 s entre llamadas no hubo problema.

### 2.1 Fábulas (infantil / principiante)

| Página de Wikisource (identificador exacto) | Autor / edición | Subpáginas | Nivel | Verificación |
|---|---|---|---|---|
| `Favole di Esopo` | Esopo, ed. Landi 1805 | 377 (una fábula por página, 1.300 caracteres) | infantil / principiante (aviso: ortografía de 1805, "Ucelli", "Camello") | "Della Volpe, ed il Leopardo" leída |
| `Favole (Fedro)` | Fedro, trad. en verso (ed. "Lucrezio e Fedro") | 113 (5 libros + apéndice; dos niveles) | principiante | "Libro primo/I - Il Lupo e l'Agnello" leída, 1.700 caracteres |
| `Favole (La Fontaine)` | La Fontaine, trad. en verso | 252 (12 libros; dos niveles) | principiante | "Libro primo/I - La Cicala e la Formica." leída, 1.500 caracteres |

### 2.2 Cuentos y fábulas de autor italianos (infantil)

| Página de Wikisource | Autor | Subpáginas | Nivel | Verificación |
|---|---|---|---|---|
| `C'era una volta... Fiabe` | Luigi Capuana, 1882 (ed. 1902) | 21 (Spera di sole, Le arance d'oro, Ranocchino, Senza-orecchie, Serpentina, Il lupo mannaro, Cecina, I tre anelli...) | infantil | "Spera di sole" leída, 13.500 caracteres, texto "riletto e controllato" |
| `Il raccontafiabe` | Luigi Capuana | 17 (Piuma d'oro, Grillino, La mammadraga, Re Tuono, Fata Fiore, Trottolina, Il gattino di gesso...) | infantil | Índice listado |
| `Chi vuol fiabe, chi vuole?` | Luigi Capuana | 13 (La figlia del giardiniere, Il tesoro nascosto, Cingallegra, Comare Formica, Il principe Pettirosso...) | infantil | Índice listado |
| `La danza degli gnomi e altre fiabe` | Guido Gozzano (m. 1916) | 28 (fiabas en capítulos cortos: Piumadoro e Piombofino, Il Reuccio gamberino, Il Re Porcaro...) | infantil | "Piumadoro e Piombofino/I" leída, 2.300 caracteres |
| `Storie allegre` | Carlo Collodi, 1887 | 43 (L'omino anticipato, Una mascherata di carnevale, Chi non ha coraggio non vada alla guerra, Pipì o lo scimmiottino color di rosa; dos niveles) | principiante | "L'omino anticipato/I" leída, 3.100 caracteres |
| `Memorie di un pulcino (1918)` | Ida Baccini, 1875 | 13 (Il galletto della Lena, I consigli della Mamma, Disobbedienza, Gastigo, Povero galletto!...) | infantil | "Il galletto della Lena" leída, 12.200 caracteres |
| `Lezioni e racconti per i bambini` | Ida Baccini, 1882 | 39 (Una donnina, Il bove, Un regalo, I sassi...) | infantil | "Il bove" leída, 7.200 caracteres; pareja del Gutenberg 17805 |
| `Le novelle della nonna` | Emma Perodi, 1893 | 46 (La calza della Befana, Il lupo mannaro, Il velo della Madonna...) | intermedio (cuentos de 12.000 a 28.000 caracteres) | "La calza della Befana" leída |
| `Piccole anime` | Matilde Serao | 11 | intermedio | Índice listado; pareja del Gutenberg 42416 |

### 2.3 Cuentos clásicos europeos traducidos (infantil)

| Página de Wikisource | Autor / traducción | Subpáginas | Nivel | Verificación |
|---|---|---|---|---|
| `Il libro delle fate` | Perrault, ed. Longanesi 1891 | 10 (Berrettina rossa, Barbazzurra, La bella al bosco in sonno, Le fate, Il gatto calzato, Cenerentola...) | infantil | "Berrettina rossa" leída, 5.800 caracteres |
| `Cappuccetto Rosso` | Perrault (página suelta, sin edición fuente) | texto directo, 5.000 caracteres | infantil | Leída |
| `Quaranta novelle` | Andersen, trad. Maria Pezzè Pascolato (Hoepli 1908; traductora muerta en 1933, dominio público) | 43 (Il brutto anitroccolo, I vestiti nuovi dell'imperatore, La principessina sul pisello, Storia di una mamma...) | infantil | "Il brutto anitroccolo" leída, 21.800 caracteres ("completo, ma ancora da rileggere") |
| `Le Mille ed una Notti` | anónimo, trad. antigua | 157 | intermedio | Índice listado |

### 2.4 Novela infantil y juvenil

| Página de Wikisource | Autor | Subpáginas | Nivel | Verificación |
|---|---|---|---|---|
| `Le avventure di Pinocchio` | Collodi | 36 capítulos | principiante | "Capitolo 1" leída, 4.900 caracteres (hay otra edición `Le avventure di Pinocchio (1892)`) |
| `Cuore (1889)` | Edmondo De Amicis | 111 (meses → relatos; dos niveles) | intermedio | "Ottobre/Il primo giorno di scuola" leída, 4.100 caracteres |
| `Il giornalino di Gian Burrasca` | Vamba (m. 1920) | 109 (meses → días; dos niveles) | intermedio | "20 settembre" leída, 5.600 caracteres |
| `Ciuffettino` | Yambo (Enrico Novelli, m. 1943; dominio público en Italia desde 2014) | 30 capítulos | principiante | Índice listado |
| `Alice nel Paese delle meraviglie` | Lewis Carroll (traducción sin edición fuente en la página) | 12 capítulos | intermedio | "I" leída, 11.800 caracteres. Comprobar la traducción antes de publicar; alternativa segura: Gutenberg 28371 |
| `L'isola del tesoro` | Stevenson (traducción sin edición fuente) | 45 (6 partes con capítulos + aparato crítico) | juvenil | Índice listado; misma cautela con la traducción |
| `Avventure di Robinson Crusoe` | Defoe, trad. antigua con nota del traductor | 112 | juvenil | Índice listado |
| `Le tigri di Mompracem` | Emilio Salgari | 32 capítulos | juvenil | Índice listado (también `Le due tigri`, `La riconquista di Mompracem`) |
| `Novellino` | anónimo, siglo XIII | 101 novelle de 5.000 caracteres | intermedio (aviso: italiano medieval) | "I" leída |
| `Sessanta novelle popolari montalesi` | Gherardo Nerucci, 1880 | 60 | intermedio (aviso: marcado "incompleto", habla popular toscana) | "I" leída, 19.800 caracteres |

Trampas en Wikisource:

- **`Il mago di Oz`**: solo 2 capítulos transcritos ("incompleto") y la fuente es una edición de **1950** (traducción con derechos vigentes). No incluir.
- **`I racconti delle fate`** (Perrault traducido por Collodi): solo existe la Introducción. No incluir hasta que se complete; los cuentos de Perrault están en `Il libro delle fate`.
- **`Le avventure di Pinocchio (1892)`** es una segunda edición con índice separado (`.../Indice`); usar la principal.
- `Fiabe e leggende` (5 subpáginas) no tiene autor claro en la búsqueda y no se revisó.
- `Lo cunto de li cunti` y `Le piacevoli notti`: napolitano del XVII y italiano del XVI, no para principiantes.

## 3. LiberLiber (liberliber.it)

- El dominio antiguo `www.liberliber.it/online/...` redirige a `liberliber.it/autori/...`; la ficha de Pinocchio está en `https://liberliber.it/autori/autori-c/carlo-collodi-alias-carlo-lorenzini/pinocchio/` (200) y hay otra de "Pinocchio audiolibro" (audio, no texto).
- En el HTML de la ficha **no aparece ningún enlace directo `.epub`/`.zip`/`.pdf`** (la descarga va por botones generados en el navegador); la ruta clásica de la mediateca (`/mediateca/libri/l/lorenzini/le_avventure_di_pinocchio/epub/lorenzini_le_avventure_di_pinocchio.epub`) devuelve 404 en el dominio nuevo. No se pudo comprobar el CORS de la descarga porque no se encontró la URL del fichero.
- La ficha declara la edición bajo **Creative Commons Attribuzione - Non commerciale - Condividi allo stesso modo 4.0** (CC BY-NC-SA): aunque el texto sea de dominio público, LiberLiber reserva el uso no comercial de su edición. Para Glosa, que es un servicio propio, mejor no depender de ella.
- Veredicto: descartar. Todo lo que ofrece LiberLiber para niños (Collodi, Capuana, Baccini, Salgari, De Amicis) está ya en Wikisource o Gutenberg con licencia limpia.

## Recomendación: qué meter en el catálogo y cómo

Un catálogo "Infantil / principiantes (italiano)" de 38 títulos, en lista estática en `js/catalog.js` como el español. Cada entrada lleva `source` (`gb` o `ws`) y el identificador. Prioridad a Wikisource porque tiene CORS y porque ahí están los autores infantiles italianos de verdad (Capuana, Gozzano, Baccini, Perodi, Vamba); Gutenberg queda para Pinocchio, los lectores graduados con notas y las novelas de aventuras.

**Bloque A. Infantil (fábulas y cuentos cortos), 15 títulos**

1. Favole di Esopo (ws `Favole di Esopo`; aviso ortografía de 1805)
2. Il libro delle fate, Perrault (ws `Il libro delle fate`)
3. Cappuccetto Rosso, Perrault (ws `Cappuccetto Rosso`, página suelta)
4. Quaranta novelle, Andersen (ws `Quaranta novelle`)
5. C'era una volta... Fiabe, Capuana (ws)
6. Il raccontafiabe, Capuana (ws)
7. Chi vuol fiabe, chi vuole?, Capuana (ws)
8. La danza degli gnomi e altre fiabe, Gozzano (ws)
9. Memorie di un pulcino, Baccini (ws `Memorie di un pulcino (1918)`)
10. Lezioni e racconti per i bambini, Baccini (gb 17805 con `noimages`, o ws)
11. Le gaie farandole, Beltramelli (gb 69422, `noimages`)
12. Piccoli eroi, Virginia Treves (gb 22503)
13. Favole (Fedro) (ws `Favole (Fedro)`)
14. Favole (La Fontaine) (ws `Favole (La Fontaine)`)
15. Storie allegre, Collodi (ws)

**Bloque B. Principiante (lecturas graduadas y primeras novelas), 8 títulos**

16. Le avventure di Pinocchio, Collodi (gb 52484 con `noimages`; o ws `Le avventure di Pinocchio`)
17. First Italian Readings (gb 24072)
18. Racconti per giovinetti, Thouar (gb 49463)
19. Ciuffettino, Yambo (ws)
20. Le avventure d'Alice nel paese delle meraviglie (gb 28371, `noimages`)
21. Cuore, De Amicis (ws `Cuore (1889)`)
22. Il giornalino di Gian Burrasca, Vamba (ws)
23. Le novelle della nonna, Perodi (ws)

**Bloque C. Intermedio y juvenil, 15 títulos**

24. I ragazzi d'una volta e i ragazzi d'adesso, marchesa Colombi (gb 73094)
25. Ricordi d'infanzia e di scuola, De Amicis (gb 61885)
26. Novelle, De Amicis (gb 58341)
27. Piccole anime, Serao (gb 42416)
28. Piccole storie del mondo grande, Panzini (gb 41342)
29. Mastr'Impicca, Imbriani (gb 34519)
30. Il giro del mondo in ottanta giorni, Verne (gb 65736)
31. I Robinson italiani, Salgari (gb 61209, `noimages`)
32. Le tigri di Mompracem, Salgari (ws)
33. Viaggi di Gulliver nelle lontane regioni, Swift (gb 61179, `noimages`)
34. Il lampionaio, Cummins (gb 54787)
35. L'isola del tesoro (ws; confirmar traducción)
36. Avventure di Robinson Crusoe (ws)
37. Le Mille ed una Notti (ws)
38. Novellino (ws; aviso italiano del XIII, solo para curiosos)

Fuera de la lista: 19517 (audio), Pentamerone y conti pomiglianesi (dialecto), `Il mago di Oz` (incompleto y edición de 1950), `I racconti delle fate` (solo introducción), `La novellaja fiorentina` y `Sessanta novelle popolari montalesi` (habla popular, uno incompleto), LiberLiber (licencia NC y sin URL de descarga).

**Cómo integrarlo**

- Gutenberg: reutilizar `openBook` con la variante `noimages` por libro (Pinocchio, Gulliver, Baccini, Beltramelli, Salgari, Alice) para no bajar entre 1,5 y 9 MB de láminas.
- Wikisource: el mismo flujo que el catálogo español, con una diferencia: el importador debe admitir **índices de dos niveles** (obra → cuento → capítulos), porque Gozzano, Collodi, Cuore, Gian Burrasca, Fedro y La Fontaine están así. Recorrer los `<a href="/wiki/Título/...">` del índice en orden de aparición; si la subpágina tiene a su vez enlaces `Título/Sub/...`, bajar un nivel. Limpiar `<style>`, `.barraCapitolo`/`#headertemplate`, `.ambox` y el bloque de metadatos `dc:` del principio. Enviar un `User-Agent` propio y espaciar las llamadas.
- Los dos libros que aparecen en ambas fuentes (Lezioni e racconti, Piccole anime) se pueden dejar en Gutenberg (EPUB ya hecho) y usar Wikisource solo para lo que Gutenberg no tiene.

```json
[
  {"source":"ws","lang":"it","title":"Favole di Esopo","author":"Esopo","level":"infantil"},
  {"source":"ws","lang":"it","title":"Il libro delle fate","author":"Charles Perrault","level":"infantil"},
  {"source":"ws","lang":"it","title":"Cappuccetto Rosso","author":"Charles Perrault","level":"infantil"},
  {"source":"ws","lang":"it","title":"Quaranta novelle","author":"Hans Christian Andersen","level":"infantil"},
  {"source":"ws","lang":"it","title":"C'era una volta... Fiabe","author":"Luigi Capuana","level":"infantil"},
  {"source":"ws","lang":"it","title":"Il raccontafiabe","author":"Luigi Capuana","level":"infantil"},
  {"source":"ws","lang":"it","title":"Chi vuol fiabe, chi vuole?","author":"Luigi Capuana","level":"infantil"},
  {"source":"ws","lang":"it","title":"La danza degli gnomi e altre fiabe","author":"Guido Gozzano","level":"infantil"},
  {"source":"ws","lang":"it","title":"Memorie di un pulcino (1918)","author":"Ida Baccini","level":"infantil"},
  {"source":"gb","id":17805,"title":"Lezioni e Racconti per i bambini","author":"Ida Baccini","level":"infantil","noimages":true},
  {"source":"gb","id":69422,"title":"Le gaie farandole","author":"Antonio Beltramelli","level":"infantil","noimages":true},
  {"source":"gb","id":22503,"title":"Piccoli eroi: Libro per i ragazzi","author":"Virginia Treves","level":"infantil"},
  {"source":"ws","lang":"it","title":"Favole (Fedro)","author":"Fedro","level":"infantil"},
  {"source":"ws","lang":"it","title":"Favole (La Fontaine)","author":"Jean de La Fontaine","level":"infantil"},
  {"source":"ws","lang":"it","title":"Storie allegre","author":"Carlo Collodi","level":"infantil"},
  {"source":"gb","id":52484,"title":"Le avventure di Pinocchio: Storia di un burattino","author":"Carlo Collodi","level":"principiante","noimages":true},
  {"source":"gb","id":24072,"title":"First Italian Readings","author":"Various","level":"principiante"},
  {"source":"gb","id":49463,"title":"Racconti per giovinetti","author":"Pietro Thouar","level":"principiante"},
  {"source":"ws","lang":"it","title":"Ciuffettino","author":"Yambo","level":"principiante"},
  {"source":"gb","id":28371,"title":"Le avventure d'Alice nel paese delle meraviglie","author":"Lewis Carroll","level":"principiante","noimages":true},
  {"source":"ws","lang":"it","title":"Cuore (1889)","author":"Edmondo De Amicis","level":"principiante"},
  {"source":"ws","lang":"it","title":"Il giornalino di Gian Burrasca","author":"Vamba","level":"principiante"},
  {"source":"ws","lang":"it","title":"Le novelle della nonna","author":"Emma Perodi","level":"principiante"},
  {"source":"gb","id":73094,"title":"I ragazzi d'una volta e i ragazzi d'adesso","author":"marchesa Colombi","level":"intermedio"},
  {"source":"gb","id":61885,"title":"Ricordi d'infanzia e di scuola","author":"Edmondo De Amicis","level":"intermedio"},
  {"source":"gb","id":58341,"title":"Novelle","author":"Edmondo De Amicis","level":"intermedio"},
  {"source":"gb","id":42416,"title":"Piccole anime","author":"Matilde Serao","level":"intermedio"},
  {"source":"gb","id":41342,"title":"Piccole storie del mondo grande","author":"Alfredo Panzini","level":"intermedio"},
  {"source":"gb","id":34519,"title":"Mastr'Impicca","author":"Vittorio Imbriani","level":"intermedio"},
  {"source":"gb","id":65736,"title":"Il giro del mondo in ottanta giorni","author":"Jules Verne","level":"intermedio"},
  {"source":"gb","id":61209,"title":"I Robinson italiani","author":"Emilio Salgari","level":"intermedio","noimages":true},
  {"source":"ws","lang":"it","title":"Le tigri di Mompracem","author":"Emilio Salgari","level":"intermedio"},
  {"source":"gb","id":61179,"title":"Viaggi di Gulliver nelle lontane regioni","author":"Jonathan Swift","level":"intermedio","noimages":true},
  {"source":"gb","id":54787,"title":"Il lampionaio","author":"Maria S. Cummins","level":"intermedio"},
  {"source":"ws","lang":"it","title":"L'isola del tesoro","author":"Robert Louis Stevenson","level":"intermedio"},
  {"source":"ws","lang":"it","title":"Avventure di Robinson Crusoe","author":"Daniel Defoe","level":"intermedio"},
  {"source":"ws","lang":"it","title":"Le Mille ed una Notti","author":"anónimo","level":"intermedio"},
  {"source":"ws","lang":"it","title":"Novellino","author":"anónimo","level":"intermedio"}
]
```
