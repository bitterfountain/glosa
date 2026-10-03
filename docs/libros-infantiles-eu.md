# Libros en euskera para niños y lectores principiantes (catálogo "Infantil / principiantes", euskera)

Investigación para Glosa, hermana de `libros-infantiles-es.md`. Fecha: 2026-10-03. Cada EPUB de la lista se
ha descargado y abierto por programa (código 200, zip válido, texto en euskera; el número de palabras va en
la tabla).

Niveles: **infantil** (fábulas y cuentos cortos), **principiante** (cuentos breves en prosa sencilla),
**intermedio** (novela de aventuras o costumbrista, capítulos largos).

Aviso de lectura: los clásicos vascos anteriores a 1968 están escritos en su dialecto (vizcaíno, guipuzcoano,
labortano) y con la grafía de antes de la unificación (*ipui*, *bear*, *zan*). Glosa prueba la grafía actual
cuando una palabra no sale (`euOldSpellings` en `js/dictionary.js`), pero para un principiante las
traducciones de Literatura Unibertsala (Andersen, Saki, Defoe, Swift, Verne, Twain), en euskera batua,
son más fáciles que las fábulas del XIX. Palabras en minúscula que el diccionario resuelve (2026-10-03): las
traducciones, 92-96 %; los clásicos del XIX y XX, 76-88 %; Goietxe y Kirikiño, 70 y 68 %.

## Fuentes consultadas

| Fuente | Qué hay | Licencia | Acceso desde Glosa | Veredicto |
|---|---|---|---|---|
| [Armiarma, liburu-e](https://armiarma.eus/liburu-e/) | 318 clásicos vascos (XVI-XX) y 58 traducciones de Literatura Unibertsala en EPUB y PDF | Sin licencia explícita; difusión gratuita de Armiarma ("nork bere gailu edo ordenadorera deskargatu eta irakurri eta partekatu ahal ditzan") | Sin CORS: `api.php?r=book/armiarma` con caché en el servidor | **Usar**: catálogo vasco completo (`js/armiarma.js`) y la lista de abajo |
| Wikisource en euskera | ~15 obras con capítulos | Dominio público | API con CORS | Usar lo que Armiarma no tiene |
| [StoryWeaver](https://storyweaver.org.in/) | 9 cuentos infantiles ilustrados en euskera, niveles 1-3 (CC BY 4.0) | CC BY 4.0 | Desde 2026 la lectura y la descarga exigen cuenta (`/api/v1/stories/<slug>/read` → 401) | **Descartado** mientras pida sesión |
| [Bloom Library](https://bloomlibrary.org/) | 7 libros en euskera, varios religiosos | Sin licencia en la API | S3 sin CORS | Descartado por ahora |
| Booktegi.eus | Autores actuales que regalan sus libros | Cesión del autor, sin licencia abierta | — | No redistribuible |
| UPV/EHU (ADDI), Deusto | Repositorios académicos | Varias | — | No son libros de lectura |
| Liburuklik, Azkue (Euskaltzaindia), Internet Archive | Fondos antiguos digitalizados | Dominio público | — | Escaneos sin capa de texto: no se pueden traducir palabra a palabra |
| Project Gutenberg | 0 libros en euskera | — | — | Nada |

## Selección

| Libro | Autor | Año | Palabras | Nivel |
|---|---|---|---|---|
| Ipui onak | Bizenta Mogel | 1804 | 16.166 | infantil (fábulas de Esopo en prosa) |
| Alegiak | Juan Mateo Zabala | s. XIX | 7.005 | infantil (fábulas en verso) |
| Fableak edo Alegiak | Martin Goietxe | 1852 | 35.479 | intermedio (fábulas en verso, labortano antiguo: 70 % de palabras resueltas) |
| Ipuinak | Agustin Paskual Iturriaga | 1842 | 19.527 | infantil (fábulas en verso) |
| Hemeretzi ipuin | Hans Christian Andersen | 1833 | 57.222 | infantil |
| Euskal ipuinak | Wentworth Webster | 1877 | 63.856 | infantil (leyendas populares) |
| Ur-zale baten ipuiak | Pedro Migel Urruzuno | 1885 | 14.505 | infantil |
| Ipuin laburrak | Bitor Garitaonandia | 1922 | 4.477 | principiante |
| Ixtorio eta ipuinak | Zerbitzari | s. XX | 9.822 | principiante |
| Ipuiak | Jautarkol | 1953 | 10.979 | principiante |
| Gabon zar bat eta beste ipui asko | Alfonso Maria Zabala | 1880 | 9.311 | principiante |
| Abarrak | Kirikiño | 1918 | 19.000 | intermedio (vizcaíno coloquial: 68 %) |
| Ipui hautatuak | Saki | 1902 | 9.783 | principiante |
| Robinson Crusoe | Daniel Defoe | 1719 | 90.689 | intermedio |
| Gulliver-en bidaiak | Jonathan Swift | 1726 | 78.135 | intermedio |
| Michel Strogoff | Jules Verne | 1876 | 88.796 | intermedio |
| Huckleberry Finn-en abenturak | Mark Twain | 1884 | 93.331 | intermedio |
| Kresala | Domingo Agirre | 1906 | 36.793 | intermedio |

```json
[
  {"source": "am", "ref": "kla:Bizenta Mogel, Ipui onak", "title": "Ipui onak", "author": "Bizenta Mogel", "level": "infantil"},
  {"source": "am", "ref": "kla:Juan Mateo Zabala, Alegiak", "title": "Alegiak", "author": "Juan Mateo Zabala", "level": "infantil"},
  {"source": "am", "ref": "kla:Goietxe, Alegiak", "title": "Fableak edo Alegiak", "author": "Martin Goietxe", "level": "intermedio"},
  {"source": "am", "ref": "kla:Agustin Paskual Iturriaga, Ipuinak", "title": "Ipuinak", "author": "Agustin Paskual Iturriaga", "level": "infantil"},
  {"source": "am", "ref": "itz:Hans Christian Andersen, Hemeretzi ipuin", "title": "Hemeretzi ipuin", "author": "Hans Christian Andersen", "level": "infantil"},
  {"source": "am", "ref": "kla:Wendworth Webster, Euskal ipuinak", "title": "Euskal ipuinak", "author": "Wentworth Webster", "level": "infantil"},
  {"source": "am", "ref": "kla:Pedro Miguel Urruzuno, Ur-zale baten ipuiak", "title": "Ur-zale baten ipuiak", "author": "Pedro Migel Urruzuno", "level": "infantil"},
  {"source": "am", "ref": "kla:Bittor Garitaonandia, Ipuin laburrak", "title": "Ipuin laburrak", "author": "Bitor Garitaonandia", "level": "principiante"},
  {"source": "am", "ref": "kla:Zerbitzari, Ixtorio eta ipuinak", "title": "Ixtorio eta ipuinak", "author": "Zerbitzari", "level": "principiante"},
  {"source": "am", "ref": "kla:Jautarkol, Ipuiak", "title": "Ipuiak", "author": "Jautarkol", "level": "principiante"},
  {"source": "am", "ref": "kla:Alfonso Maria Zabala, Gabon gau bat", "title": "Gabon zar bat eta beste ipui asko", "author": "Alfonso Maria Zabala", "level": "principiante"},
  {"source": "am", "ref": "kla:Kirikiño, Abarrak", "title": "Abarrak", "author": "Kirikiño", "level": "intermedio"},
  {"source": "am", "ref": "itz:Saki, Ipui hautatuak", "title": "Ipui hautatuak", "author": "Saki", "level": "principiante"},
  {"source": "am", "ref": "itz:Daniel Defoe, Robinson Crusoe", "title": "Robinson Crusoe", "author": "Daniel Defoe", "level": "intermedio"},
  {"source": "am", "ref": "itz:Jonathan Swift, Gulliver-en bidaiak", "title": "Gulliver-en bidaiak", "author": "Jonathan Swift", "level": "intermedio"},
  {"source": "am", "ref": "itz:Jules Verne, Michel Strogoff", "title": "Michel Strogoff", "author": "Jules Verne", "level": "intermedio"},
  {"source": "am", "ref": "itz:Mark Twain, Huckleberry Finn-en abenturak", "title": "Huckleberry Finn-en abenturak", "author": "Mark Twain", "level": "intermedio"},
  {"source": "am", "ref": "kla:Domingo Agirre, Kresala", "title": "Kresala", "author": "Domingo Agirre", "level": "intermedio"}
]
```
