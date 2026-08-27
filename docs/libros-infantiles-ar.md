# Libros en árabe para niños y lectores principiantes (catálogo "Infantil / principiantes", árabe)

Investigación para Glosa, hermana de `libros-infantiles-es.md`. Fecha: 2026-08-27. Todo lo de las tablas se ha comprobado por programa (`curl` / API): código 200, contenido en árabe y del texto indicado. Lo que no se pudo verificar está marcado como tal o no está. Tiempo de investigación limitado a 12 minutos, así que la lista es más corta que la española y hay huecos señalados al final.

Niveles: **infantil** (cuentos y poemas cortos, vocabulario sencillo), **principiante** (cuento o fábula de una página con frases simples, árabe estándar moderno), **intermedio** (prosa literaria del siglo XX o épica popular, capítulos largos).

Los 16 clásicos que ya están en el catálogo árabe (كليلة ودمنة, ألف ليلة وليلة, حي بن يقظان, etc.) no se repiten aquí.

## Resumen rápido

| Fuente | Verificados | Licencia | CORS | Integración | Veredicto |
|---|---|---|---|---|---|
| Wikisource en árabe | 22 páginas u obras | Dominio público o CC BY-SA (traducciones de Wikisource) | **Sí** (`access-control-allow-origin: *`) | El mismo flujo `action=parse` del catálogo árabe actual | **Usar** (única fuente real hoy) |
| Bloom Library (SIL) | 1 libro en árabe con CC BY | CC BY por libro | Catálogo Parse sí; EPUB en S3 **no** | Proxy `/bloom/` hacia `s3.amazonaws.com/bloomharvest/` | Casi vacío en árabe: 1 libro |
| African Storybook | 57 títulos en árabe listados, 0 descargables | CC BY 4.0 (toda la iniciativa) | No | Proxy; PDF por `downloadbook.php` | **Descartar por ahora**: todas las traducciones árabes están sin aprobar (`approved:"0"`) y la descarga devuelve 500 |
| Project Gutenberg | 0 útiles | Dominio público | Proxy `/gb/` ya existe | | **Descartar**: solo hay un libro en árabe (43007, un homenaje a Michael Hart) |
| Hindawi Kids, 3asafeer, Kalimat | no probados | Con derechos (Hindawi es CC BY-NC-ND y bloquea con 403; 3asafeer y Kalimat son comerciales) | | | **Descartar** |

## 1. Wikisource en árabe (ar.wikisource.org)

Integración: la misma API que ya usa el catálogo árabe (`action=parse&page=...&prop=text&format=json&origin=*`). Para las páginas sueltas se abre directo; para los índices (حاجي بابا, الزير سالم, حكاية الشتاء) hay que leer los enlaces en orden y montar un HTML con un `<h2>` por capítulo, igual que se propone en el informe español.

Aviso de infraestructura: **la API de ar.wikisource devuelve 429 con facilidad** si se encadenan búsquedas (`list=search`, `list=categorymembers`). Durante esta investigación bastaron 8 peticiones seguidas para bloquear un minuto. Al abrir un libro de índice, pedir los capítulos con un pequeño retardo o en lotes con `titles=A|B|C` (una sola petición devuelve hasta 50 páginas con `prop=revisions&rvprop=content`).

Verificación: cada fila se comprobó con `action=query&prop=revisions|categories&rvprop=content|size`. "Tamaño" es el de la página en bytes; "enlaces" es el número de enlaces internos (si es 0 o 1, el texto está en la propia página).

### Cuentos y poesía para niños (infantil)

| Página exacta | Autor / traductor | Tamaño | Tipo | Nivel | Notas |
|---|---|---|---|---|---|
| رابونزيل | Hermanos Grimm (trad. Wikisource) | 9,4 KB | texto directo | infantil | Rapunzel. Traducción propia de Wikisource desde el inglés (CC BY-SA); árabe estándar sencillo |
| سندريلا | Hermanos Grimm (trad. Wikisource) | 19 KB | texto directo | infantil | Cenicienta (versión Grimm) |
| طفلة مريم | Hermanos Grimm (trad. Wikisource) | 11,8 KB | texto directo | infantil | "Our Lady's Child". Tiene fondo religioso cristiano (la Virgen); avisar |
| مجلة الرسالة/العدد 532/من شعر الأطفال | Al-Risala, "الطيار الصغير" | 1,6 KB | texto directo | infantil | Poemas infantiles rimados, muy cortos ("أنا طيّارٌ صغيرُ") |
| مجلة الرسالة/العدد 590/من شعر الأطفال | علي متولي صلاح | 1,5 KB | texto directo | infantil | "العام الجديد", poema escolar |
| مجلة الرسالة/العدد 594/من شعر الأطفال: | علي متولي صلاح | 0,9 KB | texto directo | infantil | "القلم يقول عن نفسه". Ojo: el título lleva dos puntos al final |
| مدينتي | anónimo (sin ficha de autor) | 1,5 KB | texto directo | infantil / principiante | Poema corto con vocalización parcial. Sin autor en la página: licencia no verificable, usar con cautela |
| حكاية الكلب مع الحمامه | أحمد شوقي | 1,3 KB | texto directo | principiante | Fábula en verso de Shawqi (dominio público, murió en 1932). Es una sola fábula; en Wikisource no está la colección completa de fábulas de Shawqi como índice |

Las tres páginas de "من شعر الأطفال" de Al-Risala se pueden agrupar en un solo libro "شعر الأطفال (مجلة الرسالة)", como se hizo con los poemas de Pombo en el catálogo español.

### Cuentos de una página (principiante)

| Página exacta | Autor / traductor | Tamaño | Tipo | Nivel | Notas |
|---|---|---|---|---|---|
| مجلة الرسالة/العدد 49/المارد الأناني | Oscar Wilde, trad. عبد القادر صالح (1934) | 12,8 KB | texto directo | principiante | El gigante egoísta. Empieza con un párrafo de presentación del traductor; el cuento va después |
| حكاية الشتاء (لام) | Charles y Mary Lamb, trad. دريني خشبة (1938) | índice, 3 partes | índice → مجلة الرسالة/العدد 248, 249, 250/القصص | principiante / intermedio | Cuento de invierno de Shakespeare contado para niños (Tales from Shakespeare). Las tres subpáginas no se abrieron una a una por el límite de peticiones |
| قصة ساعة | Kate Chopin (trad. Wikisource) | 7,4 KB | texto directo | intermedio corto | "The Story of an Hour". Traducción algo rígida; texto corto |
| ندم | Kate Chopin (trad. Wikisource) | 11,8 KB | texto directo | intermedio corto | "Regret" |

### Prosa literaria y épica popular (intermedio)

| Página exacta | Autor | Tamaño | Tipo | Nivel | Notas |
|---|---|---|---|---|---|
| الطفولتان | مصطفى صادق الرافعي | 24 KB | texto directo | intermedio | Relato sobre dos infancias, de "وحي القلم". Prosa vocalizada, vocabulario rico |
| اليمامتان | مصطفى صادق الرافعي | 29 KB | texto directo | intermedio | Relato histórico-literario |
| في الربيع الأزرق | مصطفى صادق الرافعي | 9 KB | texto directo | intermedio | Prosa poética corta |
| أيها البحر | مصطفى صادق الرافعي | 8,4 KB | texto directo | intermedio | Prosa poética corta |
| ضحاك | Firdusi, trad. al-Bundari (s. XIII), Shahnameh | 32 KB | texto directo | intermedio | Árabe clásico simplificado por el propio traductor medieval |
| الشاهنامة/أفريدون | Firdusi, trad. al-Bundari | 34 KB | texto directo | intermedio | Idem |
| سهراب | Firdusi, trad. al-Bundari | 58 KB | texto directo | intermedio | Rostam y Sohrab. Los encabezados llevan el título persa junto al árabe; limpiar o dejar |
| مغامرات حاجي بابا الإصفهاني | James Morier, trad. árabe (índice) | 40 capítulos de 7 a 20 KB | índice (87 enlaces, capítulos `/01` a `/40` más `/النص الكامل`) | intermedio | Novela picaresca; la nota de la página dice "ترجمة بتصرف". Hay una página `/النص الكامل` (1,8 KB, solo transclusiones) que se puede usar como texto único si el parse la expande |
| الزير سالم | épica popular anónima (índice) | 286 KB en la página raíz, 5 partes | índice (5 enlaces) | intermedio | Sira popular; árabe clásico narrativo con verso intercalado. La página raíz ya contiene el texto entero |
| مجلة الرسالة/العدد 824/القصص | Maupassant, trad. مصطفى جميل مرسي | 18,7 KB | texto directo | intermedio | "El extraño"; no infantil, sirve como lectura corta de nivel medio |

### Trampas detectadas en Wikisource (no incluir)

- **تحفة الأطفال** (99 KB): aparece en toda búsqueda por "أطفال", pero es el poema didáctico de tajwid de al-Jamzuri. Texto religioso técnico, no lectura infantil.
- **الأطفال الخمسة وعفريت الرمال** (Five Children and It, Nesbit): la portada existe con licencia CC, pero los capítulos están vacíos (الفصل الأول 411 bytes, الفصل الثالث 97 bytes). Proyecto abandonado.
- **الأمير السعيد**: es una redirección a `مجلة الرسالة/العدد 48/القصص`. Puede ser "El príncipe feliz" de Wilde, pero no se llegó a abrir la página destino; comprobar antes de listar.
- **لعب العرب (الطبعة الأولى)** y **الأمثال العامية (الطبعة الثانية)** de Ahmad Taymur: son índices a páginas de PDF escaneado, casi vacías (700 bytes por letra). No hay texto transcrito.
- **مجلة الرسالة/العدد 352/أيها الأطفال!** y **العدد 709/اكتبوا للأطفال**: ensayos de adultos sobre los niños, no lecturas infantiles.
- Los resultados de búsqueda por "حكايات" y "أطفال" están dominados por مجموع الفتاوى, كتاب الأم, البداية والنهاية y الرحلة de Ibn Battuta: nada infantil.
- **No existen** en ar.wikisource (comprobado con `titles=`): بياض الثلج, ذات الرداء الأحمر, هانسل وغريتل, روبنسون كروزو, رحلات جلفر, أليس في بلاد العجائب, نوادر جحا, ديوان الأطفال. No hay Andersen, Perrault ni Esopo en árabe; de Grimm solo las tres páginas de arriba. Las categorías "أدب الأطفال", "خرافات إيسوب" y "الأخوان غريم" están vacías o no existen.

## 2. Bloom Library (bloomlibrary.org)

Comprobado el catálogo Parse de producción (`https://server.bloomlibrary.org/parse/classes/books`, cabecera `X-Parse-Application-Id`), que responde con `access-control-allow-origin: *`. **El árabe está casi vacío**: el objeto de idioma `ar` tiene `usageCount: 2`, `ar-SA` tiene 2 y `arb` 0. Los cientos de libros con título en alfabeto árabe que devuelve un filtro por regex son dari, pastún, urdu y hazaragi (SIL LEAD Afganistán), no árabe.

| ID | Título | Editor | Licencia | Páginas | EPUB | Nivel |
|---|---|---|---|---|---|---|
| jsGrv9V0Av | من سرق ابتسامة أخي؟ | Pratham Books (topic: Story Book, computedLevel 4) | CC BY | 28 | `https://s3.amazonaws.com/bloomharvest/jsGrv9V0Av/1784134830814/epub/%D9%85%D9%86%20%D8%B3%D8%B1%D9%82%20%D8%A7%D8%A8%D8%AA%D8%B3%D8%A7%D9%85%D8%A9%20%D8%A3%D8%AE%D9%8A%D8%9F.epub` (200, 9,3 MB, 27 xhtml, sin cabecera CORS) | infantil |

Los otros libros marcados `ar` son "الطريق القديم" (dos copias, CC BY-NC-SA, no apto) y un libro tailandés mal etiquetado. Conclusión: Bloom no justifica montar un proxy solo para el árabe; si se monta para el español, este libro se puede añadir de paso. La ruta del EPUB se obtiene listando el bucket (`https://s3.amazonaws.com/bloomharvest?prefix={objectId}%2F{timestamp}%2Fepub`), no se puede deducir del `baseUrl`.

## 3. African Storybook (africanstorybook.org)

El id de idioma para árabe es `8737` (`booklist.php?language=8737`). La lista se sirve como un array JS (`parent.bookItems.push({...})`), con 57 títulos en árabe, niveles 1 a 5, muchos de ellos traducciones de cuentos africanos conocidos (الدجاجة والنسر, أنانسي و الحكمة, نوزيبال والشعرات الثلاث, الماعز و الكلب و البقرة, صغير الحمار, سمبقواير, موز جدتي, ما قالته أخت فوسي, التمساح الجائع, أين قطتي؟).

**Trampa**: las 57 tienen `approved:"0"` (traducciones de usuario sin revisar) y la descarga `downloadbook.php?id=21823&d=0&a=1` devuelve **500** (probado con 21823 y 21848). El visor `reader.php` no incluye el texto en el HTML (lo carga por JS). Además hay entradas que no son cuentos ni árabe (شعر y دعا طلب حاجات مهم son persa; ادع لسبيل ربك es religioso; varios "aportes" de usuarios con resúmenes sin sentido). Por ahora, descartar; si ASB aprueba las traducciones, la lista de arriba es la base.

## 4. Otras fuentes

- **Project Gutenberg**: la búsqueda `l.ar` devuelve un único libro (43007, "Tribute to Michael Hart (Arabic)"). Nada que catalogar.
- **Hindawi (hindawi.org, kids.hindawi.org)**: no se ha probado en esta pasada; según el brief, responde 403 a peticiones automáticas y su licencia es CC BY-NC-ND 4.0 (no permite redistribuir en otro lector). Descartar.
- **3asafeer, Kalimat, Nahla wa Nahil**: plataformas comerciales con derechos; no se han probado. Descartar.
- **Wikisource: ألف ليلة وليلة (مؤسسة هنداوي، 2022)**: existe una edición Hindawi transcrita por noches (páginas de 500 bytes, cada noche por separado). Ya hay ألف ليلة en el catálogo, así que no se ha evaluado.

## Recomendación: qué meter en el catálogo y cómo

Con lo verificado hoy salen **22 entradas** (18 páginas sueltas y 4 obras de índice), todas de Wikisource salvo una de Bloom, con este reparto. Es menos de lo previsto: el árabe infantil de dominio público en línea es escaso, y lo que hay con licencia libre (ASB, Bloom) o no se puede descargar o no es árabe.

**Bloque A. Infantil (8)**

1. رابونزيل (ws)
2. سندريلا (ws)
3. طفلة مريم (ws; avisar del fondo religioso)
4. شعر الأطفال, مجلة الرسالة: agrupar `العدد 532`, `العدد 590` y `العدد 594` en un solo libro (ws)
5. مدينتي (ws; sin autor en la página)
6. حكاية الكلب مع الحمامه, أحمد شوقي (ws)
7. من سرق ابتسامة أخي؟ (bloom jsGrv9V0Av; solo si se monta el proxy `/bloom/`)

**Bloque B. Principiante (4)**

8. المارد الأناني, Wilde (ws `مجلة الرسالة/العدد 49/المارد الأناني`)
9. حكاية الشتاء, Lamb (ws índice `حكاية الشتاء (لام)`, 3 partes)
10. قصة ساعة, Chopin (ws)
11. ندم, Chopin (ws)

**Bloque C. Intermedio (11)**

12. الطفولتان, الرافعي (ws)
13. اليمامتان, الرافعي (ws)
14. في الربيع الأزرق, الرافعي (ws)
15. أيها البحر, الرافعي (ws)
16. ضحاك, الشاهنامة (ws)
17. الشاهنامة/أفريدون (ws)
18. سهراب, الشاهنامة (ws)
19. مغامرات حاجي بابا الإصفهاني (ws índice, 40 capítulos)
20. الزير سالم (ws, la página raíz ya trae el texto)
21. الغريب, Maupassant (ws `مجلة الرسالة/العدد 824/القصص`)

**Cómo integrarlo**

- Wikisource: reutilizar el flujo actual. Para los títulos con `/` (Al-Risala) hay que pasar el título completo tal cual a `page=`. Para los índices, seguir los enlaces en orden de aparición en el HTML. Para no disparar el 429, no prefetchar todo el catálogo al cargar.
- Bloom: solo tiene sentido si se monta el proxy para el catálogo español; añadir entonces este único libro.
- African Storybook: revisar dentro de unos meses si las traducciones árabes pasan a `approved:"1"`; entonces valdrían unos 30 títulos de nivel 1 a 3.

**Huecos que quedan por cubrir** (no dio tiempo): abrir las tres subpáginas de حكاية الشتاء, comprobar `مجلة الرسالة/العدد 48/القصص` (posible "Príncipe feliz"), recorrer la sección `القصص` de Al-Risala en busca de más Wilde, Andersen o Grimm traducidos en los años 30 y 40 (hay más de 100 entradas y muchas son traducciones de cuento corto ya en dominio público en Egipto), y buscar en ar.wikisource las fábulas completas de Shawqi (ديوان الشوقيات) por si están transcritas.

## Lista para el catálogo (JSON)

```json
[
  {"source":"ws","lang":"ar","title":"رابونزيل","author":"الأخوان غريم","level":"infantil"},
  {"source":"ws","lang":"ar","title":"سندريلا","author":"الأخوان غريم","level":"infantil"},
  {"source":"ws","lang":"ar","title":"طفلة مريم","author":"الأخوان غريم","level":"infantil"},
  {"source":"ws","lang":"ar","title":"مجلة الرسالة/العدد 532/من شعر الأطفال","author":"مجلة الرسالة","level":"infantil"},
  {"source":"ws","lang":"ar","title":"مجلة الرسالة/العدد 590/من شعر الأطفال","author":"علي متولي صلاح","level":"infantil"},
  {"source":"ws","lang":"ar","title":"مجلة الرسالة/العدد 594/من شعر الأطفال:","author":"علي متولي صلاح","level":"infantil"},
  {"source":"ws","lang":"ar","title":"مدينتي","author":"مجهول","level":"infantil"},
  {"source":"ws","lang":"ar","title":"حكاية الكلب مع الحمامه","author":"أحمد شوقي","level":"infantil"},
  {"source":"bloom","id":"jsGrv9V0Av","title":"من سرق ابتسامة أخي؟","author":"Pratham Books","level":"infantil","url":"https://s3.amazonaws.com/bloomharvest/jsGrv9V0Av/1784134830814/epub/%D9%85%D9%86%20%D8%B3%D8%B1%D9%82%20%D8%A7%D8%A8%D8%AA%D8%B3%D8%A7%D9%85%D8%A9%20%D8%A3%D8%AE%D9%8A%D8%9F.epub"},
  {"source":"ws","lang":"ar","title":"مجلة الرسالة/العدد 49/المارد الأناني","author":"أوسكار وايلد","level":"principiante"},
  {"source":"ws","lang":"ar","title":"حكاية الشتاء (لام)","author":"تشارلز ومريم لام","level":"principiante"},
  {"source":"ws","lang":"ar","title":"قصة ساعة","author":"كيت شوبان","level":"principiante"},
  {"source":"ws","lang":"ar","title":"ندم","author":"كيت شوبان","level":"principiante"},
  {"source":"ws","lang":"ar","title":"الطفولتان","author":"مصطفى صادق الرافعي","level":"intermedio"},
  {"source":"ws","lang":"ar","title":"اليمامتان","author":"مصطفى صادق الرافعي","level":"intermedio"},
  {"source":"ws","lang":"ar","title":"في الربيع الأزرق","author":"مصطفى صادق الرافعي","level":"intermedio"},
  {"source":"ws","lang":"ar","title":"أيها البحر","author":"مصطفى صادق الرافعي","level":"intermedio"},
  {"source":"ws","lang":"ar","title":"ضحاك","author":"الفردوسي (ترجمة البنداري)","level":"intermedio"},
  {"source":"ws","lang":"ar","title":"الشاهنامة/أفريدون","author":"الفردوسي (ترجمة البنداري)","level":"intermedio"},
  {"source":"ws","lang":"ar","title":"سهراب","author":"الفردوسي (ترجمة البنداري)","level":"intermedio"},
  {"source":"ws","lang":"ar","title":"مغامرات حاجي بابا الإصفهاني","author":"جيمس موريير","level":"intermedio"},
  {"source":"ws","lang":"ar","title":"الزير سالم","author":"مجهول","level":"intermedio"},
  {"source":"ws","lang":"ar","title":"مجلة الرسالة/العدد 824/القصص","author":"غي دي موباسان","level":"intermedio"}
]
```
