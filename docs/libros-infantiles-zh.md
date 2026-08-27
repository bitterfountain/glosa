# Textos en chino para niños y lectores principiantes (catálogo "Infantil / principiantes" zh)

Investigación para un catálogo nuevo de Glosa, hermano del informe en español (`libros-infantiles-es.md`). Fecha: 2026-08-27. Todo lo que aparece en las tablas se ha comprobado con `curl` o `urllib` (código 200, contenido en chino y del libro indicado; para Wikisource, cabecera CORS y si la página es texto directo o índice con subpáginas; para Bloom, licencia y cabeceras del EPUB en S3). Lo que no se pudo verificar no está. Búsqueda limitada a 12 minutos: es una base sólida, no un censo exhaustivo.

Niveles usados: **infantil** (cuentos cortos en chino vernáculo, vocabulario cotidiano, frases de una o dos líneas), **principiante** (lecturas escolares o primers en chino vernáculo, o textos de iniciación clásicos de frases de 3 o 4 caracteres con vocabulario básico), **intermedio** (prosa vernácula de los años 20 y 30, poesía clásica breve, refraneros) y **avanzado** (chino clásico con alusiones; se mencionan solo para descartarlos o advertir).

Aviso general sobre el chino: casi todo lo que hay en dominio público es chino **tradicional**; Glosa lo convierte a simplificado en pantalla, así que no es problema. Lo que sí es problema es confundir "corto" con "fácil": el 千字文 tiene 1.000 caracteres distintos y muchos rarísimos, el 幼學瓊林 y el 龍文鞭影 son listas de alusiones históricas, y el 伊索寓言 de 林紓 está en chino clásico. Se marcan abajo.

## Resumen rápido

| Fuente | Textos verificados | Licencia | CORS | Integración | Veredicto |
|---|---|---|---|---|---|
| Project Gutenberg | 12 EPUB (8 útiles) | Dominio público (EE. UU.) | No, pero ya hay proxy `/gb/` | Solo el ID, como el Top 100 | **Usar** (primers clásicos y un lector escolar vernáculo) |
| Wikisource en chino | 28 obras/colecciones | Dominio público (autores muertos antes de 1956 en la UE; antes de 1976 en China) | **Sí** (`access-control-allow-origin: *`) | API `parse` como el catálogo árabe | **Usar** (la fuente más rica: primers, poesía escolar, Perrault en vernáculo, 魯迅) |
| Bloom Library (SIL) | 47 libros en zh-CN, 2 EPUB comprobados | Casi todo **cc-by-nc-sa** (no comercial); 1 cc-by; biblias con licencia "custom" | Catálogo sí; EPUB en S3 **no** | Proxy `/bloom/` hacia `s3.amazonaws.com/bloomharvest/` | Opcional, fase 2: nivel infantil real, pero licencia NC y EPUB bilingües dai/chino |
| gutendex.com | 0 | | Devuelve 301 a todo | | No sirve como API de búsqueda |

## 1. Project Gutenberg

Integración: la misma que el Top 100 (proxy `/gb/`, ruta `cache/epub/{id}/pg{id}.epub`). Todos los ID de abajo devolvieron 200 con `pg{id}.epub` y el EPUB abre en Python con texto chino (columna "cjk" = caracteres han contados). Son ficheros pequeños (60 a 190 KB), sin imágenes.

Cómo se buscó: la búsqueda de gutenberg.org **ignora las consultas en caracteres chinos** (devuelve el listado por defecto: Pride and Prejudice, Moby Dick...). Hay que usar `?query=l.zh` y paginar con `start_index` (444 libros en chino en total), o `l.zh s.readers`. Del listado completo se filtraron a mano los títulos de iniciación. Gutenberg **no tiene "Chinese readers"** al estilo de los "Spanish readers" con notas en inglés; lo más parecido es el lector escolar 67976. Tampoco tiene 增廣賢文, 聲律啟蒙, 千家詩 ni 唐詩三百首 en EPUB (20968 "Three Hundred Tang Poems" responde 404 en `pg20968.epub`).

| ID | Título | Autor | EPUB verificado | Nivel | Por qué sirve / avisos |
|---|---|---|---|---|---|
| 12479 | 三字經 | anónimo (atribuido a 王應麟) | 60 KB, 1.140 cjk | principiante | El primer libro de todos los niños chinos durante siglos: frases de 3 caracteres, empieza con 人之初，性本善. Vocabulario clásico pero básico y muy memorizable. Hay duplicado en 25160 (63 KB, mismo texto) |
| 25196 | 百家姓 | anónimo | 62 KB, 586 cjk | principiante | Lista rimada de apellidos en grupos de 4. Sirve para reconocer caracteres, no para "leer" (no hay frases); útil como mini-libro |
| 24184 | 千字文 | 周興嗣 | 67 KB, 1.014 cjk | intermedio | Los 1.000 caracteres sin repetir: cortísimo pero con muchísimos caracteres raros. No es principiante. Duplicados en 23912 y 24075 |
| 23823 | 弟子規 | 李毓秀 | 75 KB, 1.121 cjk | principiante | Normas de conducta para niños en frases de 3 caracteres (父母呼，應勿緩). Más fácil que el 三字經 |
| 23816 | 朱子治家格言 | 朱用純 (朱柏廬) | 75 KB, 555 cjk | intermedio | Máximas domésticas (黎明即起，灑掃庭除); corto, clásico pero muy citado |
| 24232 | 孝經 | anónimo | 61 KB, 1.905 cjk | intermedio | Clásico confuciano corto en prosa clásica; texto escolar tradicional |
| 52269 | 幼學瓊林 | 程允升 (程登吉) | 109 KB, 17.846 cjk | intermedio / avanzado | Enciclopedia infantil de la dinastía Ming en frases paralelas; llena de alusiones (雲師系是豐隆，雪神乃是滕六). Se llamaba "infantil" en el siglo XVII, hoy es texto duro |
| 67976 | 故事新讀本: 第一冊 | anónimo (上海大東書局, "初級小學 課外讀物") | 101 KB, 6.681 cjk | principiante | **El hallazgo de Gutenberg**: lector escolar de primaria de los años 20 o 30 en chino vernáculo, 20 cuentos cortos de niños listos de la historia (司馬光破缸救人, 曹冲知象輕重, 孔融...). "文法力求淺顯，便于兒童自由閲讀". Solo está el tomo 1 de los 4 |

Descartados tras verlos: **23913 莊子的故事** no es "cuentos de Zhuangzi" sino el 莊子 entero (北冥有魚... chino clásico filosófico, 65.000 caracteres); **24047 世說新語** (62.000 caracteres, anécdotas en clásico, intermedio-avanzado); el resto del listado `l.zh` son novelas clásicas largas (西遊記, 紅樓夢, 三國志演義...) o historia dinástica.

## 2. Wikisource en chino (zh.wikisource.org)

Comprobado: `https://zh.wikisource.org/w/api.php?action=parse&page=...&prop=text|links&format=json&origin=*` responde con `access-control-allow-origin: *`. La búsqueda (`action=query&list=search&srsearch=...`) también funciona, pero devuelve muchísimo ruido: Wikisource zh aloja miles de sentencias judiciales chinas y textos del 四庫全書, así que "安徒生" o "格林童話" devuelven pleitos de empresas llamadas así, no cuentos. Dos gotchas de red: sin cabecera `User-Agent` propia la API devuelve **429** enseguida, y en Git Bash de Windows `curl --data-urlencode` con caracteres chinos manda bytes mal codificados (0 resultados): las comprobaciones se hicieron con `urllib` en Python.

Columnas: "cjk" es el número de caracteres han que devuelve `parse` para esa página; "subpáginas" cuenta los enlaces ns0 que cuelgan de `Título/...` (los capítulos). Cuando una obra tiene versión en Gutenberg y en Wikisource se indica.

### 2.1 Primers y textos de iniciación clásicos (principiante / intermedio)

| Página | Autor | Tipo | cjk / subpáginas | Nivel | Avisos |
|---|---|---|---|---|---|
| `弟子規` | 李毓秀 | texto directo | 1.209 | principiante | Con variantes editoriales entre paréntesis (一作「悌」) que habría que limpiar |
| `百家姓` | anónimo | texto directo | 654 | principiante | Igual que gb 25196 |
| `千字文` | 周興嗣 | texto directo | 1.319 | intermedio | Lleva notas de variantes inline (一作「元」); mejor el EPUB de gb 24184 si no se limpian |
| `重訂三字經` | 王應麟, revisión de 章太炎 (1928) | texto directo | 6.442 | principiante | **La página `三字經` de Wikisource es una desambiguación** (14 versiones: 太平天國, 麥都思, 醫學三字經, 臺灣三字經...), no hay texto base; usar gb 12479 o esta revisión de 章太炎 (muerto en 1936, dominio público), que lleva prólogo en clásico y el texto ampliado hasta la República |
| `增廣昔時賢文` | anónimo | texto directo | 8.694 | intermedio | El 增廣賢文 (refranero: 知己知彼，將心比心; 讀書須用意，一字值千金). Frases de 5 a 7 caracteres, vocabulario corriente; en Gutenberg no está |
| `朱子家訓` | 朱用純 | texto directo | 635 | intermedio | Igual que gb 23816 |
| `名賢集` | anónimo | texto directo | 2.086 | intermedio | Refranero en frases de 4 caracteres (但行好事，莫問前程) |
| `神童詩` | 汪洙 | texto directo | 975 | principiante / intermedio | Cuartetas de 5 caracteres para niños (天子重英豪，文章教爾曹) |
| `訓蒙幼學詩` | anónimo | texto directo | 680 | principiante / intermedio | Variante popular del anterior, mismo tipo de cuartetas |
| `小學韻語` | anónimo (Qing) | texto directo | 2.944 | intermedio | Versión rimada del 小學 de 朱熹, 4 caracteres por verso |
| `聲律啓蒙` | 車萬育 | texto directo | 7.152 | intermedio | Pares de rima (雲對雨，雪對風); precioso para vocabulario de pares, pero denso en alusiones. Ojo con el título: es 啓 y no 啟 |
| `龍文鞭影` | 蕭良有 | texto directo | 4.395 | avanzado | 4 caracteres por verso pero cada uno es una alusión histórica; no meterlo como principiante |
| `幼學瓊林` | 程登吉 | índice, 4 subpáginas (`幼學瓊林/卷一` a `卷四`) | 156 | intermedio / avanzado | Igual que gb 52269 |
| `今文孝經` | anónimo | texto directo | 2.151 | intermedio | `孝經` a secas es página de versiones; el texto está en `今文孝經` |

### 2.2 Poesía escolar (principiante / intermedio)

| Página | Autor | Tipo | cjk / subpáginas | Nivel | Avisos |
|---|---|---|---|---|---|
| `千家詩` | 劉克莊, 謝枋得, 王相 (comp.) | índice, 4 subpáginas (`千家詩/卷一` a `卷四`) | 90 en el índice; 卷一 tiene 1.177 | principiante (卷一 y 卷三, cuartetas) / intermedio (卷二 y 卷四, octavas) | El primer libro de poesía de los niños chinos: 春曉, 登鸛雀樓, 獨坐敬亭山. 卷一 lleva enlaces a la página de cada poema (42) pero el texto completo ya está en la subpágina |
| `唐詩三百首` | 孫洙 (comp.) | **índice con 321 enlaces a páginas sueltas** (no subpáginas): 下江陵, 九月九日憶山東兄弟, 春曉... | 2.641 (solo prólogo y lista) | intermedio | Integrarlo obliga a recorrer 321 páginas independientes: dejar para más adelante o coger solo la sección 五言絕句 |

### 2.3 Cuentos y fábulas en chino vernáculo (infantil / intermedio)

| Página | Autor / traductor | Tipo | cjk / subpáginas | Nivel | Avisos |
|---|---|---|---|---|---|
| `鵝媽媽的故事 (戴望舒譯)` | Charles Perrault, trad. 戴望舒 (1928, 開明書店) | índice, 8 subpáginas: 林中睡美人, 小紅帽, 藍鬚, 穿靴的貓, 仙女, 灰姑娘, 生角的呂蓋, 小姆指 | 2.393 en el índice; 灰姑娘 tiene 3.348 | infantil / principiante alto | **El mejor texto infantil en vernáculo encontrado.** 戴望舒 murió en 1950: dominio público en China (desde 2001) y en la UE (desde 2021). Prosa de los años 20 (從前有一位紳士，他娶了一個繼室...), frases más largas que un cuento actual pero vocabulario cotidiano |
| `愛的教育` | Edmondo De Amicis, trad. 夏丏尊 (1924) | índice, 23 subpáginas (始業日, 我們的先生, 同窗朋友, 少年愛國者...) | 1.433 en el índice; 同窗朋友 tiene 936 | intermedio | Corazón (Cuore) en chino, lectura escolar clásica. 夏丏尊 murió en 1946: dominio público. **Aviso**: la página dice "此文档未完成": solo hay 23 capítulos de los 100 del original |
| `俄羅斯的童話` | Maksim Gorki, trad. 魯迅 (1935) | índice, 17 subpáginas (小引, 一 a 十六) | 1.073 en el índice; 一 tiene 1.061 | intermedio | A pesar del título ("cuentos") son sátiras para adultos; capítulos cortos y vernáculo de 魯迅. No es infantil |
| `伊娑菩喻言` | Esopo, trad. Robert Thom (1840) | texto directo | 10.313 | intermedio / avanzado | Fábulas de Esopo en chino clásico sencillo, escrito precisamente para extranjeros que aprendían chino; con prólogo. Chino clásico, no vernáculo |
| `伊索寓言 (林紓)` | Esopo, trad. 林紓 (1902) | texto directo | 30.989 | avanzado | Chino clásico literario de 林紓; corto por fábula pero difícil. `伊索寓言` a secas es página de versiones (lista también `伊索寓言演義` de 孫毓修 y `伊索寓言 (周作人)`, pero **ambas páginas no existen**: missingtitle) |
| `笑林廣記` | 游戲主人 (Qing) | índice, 12 subpáginas (古艷部, 腐流部, 術業部...) | 209 en el índice; 古艷部 tiene 4.593 | intermedio | Chistes clásicos cortos. **Aviso de contenido**: 古艷部 y 閨風部 son humor sexual explícito; no es un libro para niños aunque sea corto |

### 2.4 Relatos cortos de 魯迅 (intermedio)

魯迅 murió en 1936: dominio público en todas partes. Son los textos vernáculos cortos más "de manual" para un intermedio, y en Wikisource están limpios y de una página. Todos verificados con `parse` (texto directo, CORS `*`):

| Página | Colección | cjk | Comentario |
|---|---|---|---|
| `一件小事` | 吶喊 | 1.078 | El más corto y el más usado en clase |
| `兔和貓` | 吶喊 | 2.628 | Conejos y gato en un patio; vocabulario de animales y casa |
| `鴨的喜劇` | 吶喊 | 1.483 | Patitos y el poeta ciego Eroshenko |
| `風箏` | 野草 | 1.303 | La cometa; infancia |
| `好的故事` | 野草 | 872 | Poema en prosa; contiene un carácter fuera de Unicode (marcado en la página) |
| `頭髮的故事` | 吶喊 | 2.418 | Diálogo, frases cortas |
| `故鄉` | 吶喊 | 4.671 | 閏土; el relato escolar por excelencia |
| `社戲` | 吶喊 | 5.307 | Ópera de pueblo, niños en barca |

### 2.5 Búsquedas sin resultado útil

Se buscó también: 安徒生 / 安徒生童話 / 賣火柴 / 醜小鴨 / 皇帝的新衣 (nada: las traducciones clásicas de Andersen son de 周作人, muerto en 1967, y 葉君健, muerto en 1999, **ambas protegidas**), 格林童話 / 灰姑娘 (solo la de Perrault de arriba), 阿麗思 (Alicia de 趙元任, muerto en 1982, **protegida**), 木偶奇遇記, 孫毓修 y sus 童話 de 商務印書館 (no están), 童謠 / 兒歌 (solo baladas históricas del 樂府), 民間故事, 讀本 / 國語教科書 / 小學教科書 (solo ensayos sobre educación, ningún manual escolar transcrito), 稻草人 de 葉聖陶 (muerto en 1988, **protegido**). Tampoco hay nada de 冰心 (muerta en 1999) ni de 老舍 (muerto en 1966: libre en China desde 2017, protegido en la UE hasta 2037).

## 3. Bloom Library (bloomlibrary.org, SIL)

Cómo se consulta (verificado): el servidor Parse `https://server.bloomlibrary.org/parse/classes/books` con `X-Parse-Application-Id: R6qNTeumQXjJCMutAJYAwPtip1qBulkFyLefkCE5` responde 200 con `access-control-allow-origin: *`, **pero Cloudflare bloquea (403, error 1010) las peticiones sin User-Agent de navegador**; con un UA de Chrome va. El código de idioma que usa Bloom para el chino es **`zh-CN`** (47 libros); `cmn`, `zh` y `yue` devuelven 0.

Qué hay en los 47: unos 33 cuentos bilingües dai/chino de SIL East Asia (Yunnan, 2016: 猴子, 老虎吃糖果, 小黑鸡做客, 青蛙和蛇, 泼水节的故事, 两兄弟种花...), 3 diccionarios dai-chino-inglés, 7 libros bíblicos con licencia "custom" (Global Recordings), 1 sobre covid y 1 catecismo. **Todos los cuentos son cc-by-nc-sa** (no comercial); el único cc-by (`qtMQxwUZ9S`) tiene el título roto ("的承诺。") y no se ha comprobado.

EPUB: se deriva del `baseUrl` igual que en español: `https://s3.amazonaws.com/bloomharvest/{correo}/{instancia}/epub/{título}.epub`. Comprobados dos:

| objectId | Título | Licencia | Páginas | EPUB verificado |
|---|---|---|---|---|
| CSy4rnXzSG | 猴子 | cc-by-nc-sa | 13 | 200, 1,3 MB, `Content-Type: application/octet-stream`, **sin cabecera CORS**; texto chino (542 cjk) mezclado con dai (`lang="khb"`) |
| efLB1kHvaQ | 老虎吃糖果 | cc-by-nc-sa | 14 | 200, 883 KB, sin CORS; 429 cjk, bilingüe |

Veredicto: es el único material de nivel realmente infantil (una o dos frases por página, ilustrado), pero (a) la licencia NC hay que valorarla según cómo se explote Glosa, (b) los EPUB traen el dai en la misma página (Glosa mostraría un alfabeto que no conoce; habría que filtrar por `lang` al renderizar) y (c) hace falta proxy. Fase 2.

## 4. Trampas de derechos y de nivel

- **Traductores y autores del siglo XX**: en China rigen 50 años tras la muerte (libre si murió antes de 1976); en la UE, 70 (libre si murió antes de 1956). Libres en ambas: 魯迅 (1936), 章太炎 (1936), 夏丏尊 (1946), 戴望舒 (1950), 林紓 (1924). Protegidos en la UE aunque Wikisource los tenga: 周作人 (1967), 老舍 (1966). Protegidos en todas partes: 葉聖陶 (1988), 冰心 (1999), 趙元任 (1982), 葉君健 (1999).
- **Wikisource zh no es Gutenberg**: sube textos con licencia de Taiwán o China y los marca; antes de meter cualquier título que no esté en esta lista, leer la caja de licencia al pie de la página (`Public domain` / `PD-old`).
- **Corto no es fácil**: 千字文, 幼學瓊林, 龍文鞭影, 聲律啓蒙 y el Esopo de 林紓 son textos densos en caracteres raros o alusiones. Los únicos textos de iniciación clásicos que un principiante puede leer con diccionario son 三字經, 弟子規, 百家姓 (solo caracteres), 神童詩 / 訓蒙幼學詩 y el 千家詩 卷一.
- **Audiolibros**: no se ha encontrado ninguno en chino en Gutenberg (los LibriVox chinos no aparecen en el listado `l.zh`); no aplica la trampa del catálogo español.
- **笑林廣記** tiene secciones obscenas; no ponerlo bajo "infantil".
- **Variantes inline en Wikisource** (一作「元」): en 千字文, 弟子規 y 千家詩 hay notas de variante en `<span>` que conviene eliminar al limpiar el HTML (mirar las clases del `parse` antes de publicar).

## Recomendación: qué meter en el catálogo y cómo

Un catálogo "Chino: infantil y principiantes" de 38 entradas en lista estática en `js/catalog.js`, con `source` (`gb`, `ws` o `bloom`) e identificador, ordenado por nivel. Se prioriza Wikisource porque envía CORS y porque los textos de Gutenberg y Wikisource son los mismos en los primers; Gutenberg se usa donde el EPUB ya viene limpio (三字經, 幼學瓊林, 孝經, 故事新讀本) o donde Wikisource no tiene texto base (三字經).

**Bloque A. Infantil y principiante, 12 títulos**

1. 鵝媽媽的故事 (戴望舒譯), Perrault (ws, índice de 8 cuentos: montar un solo libro con un `<h2>` por cuento)
2. 故事新讀本: 第一冊 (gb 67976)
3. 三字經 (gb 12479)
4. 弟子規 (ws `弟子規`, o gb 23823)
5. 百家姓 (ws `百家姓`, o gb 25196)
6. 神童詩 (ws)
7. 訓蒙幼學詩 (ws)
8. 千家詩, 卷一 y 卷三 (ws `千家詩`, índice de 4 subpáginas; se puede publicar entero y avisar de que 卷二 y 卷四 son más largos)
9. 重訂三字經, 章太炎 (ws; alternativa ampliada del 三字經)
10. 猴子 (bloom CSy4rnXzSG, fase 2, NC)
11. 老虎吃糖果 (bloom efLB1kHvaQ, fase 2, NC)
12. 一件小事, 魯迅 (ws; el puente hacia el intermedio: 1.078 caracteres)

**Bloque B. Intermedio, 19 títulos**

13. 增廣昔時賢文 (ws)
14. 名賢集 (ws)
15. 朱子家訓 (ws `朱子家訓`, o gb 23816)
16. 小學韻語 (ws)
17. 今文孝經 (ws, o gb 24232)
18. 千字文 (ws `千字文`, o gb 24184; avisar de la dificultad)
19. 聲律啓蒙 (ws)
20. 愛的教育, 夏丏尊 (ws, índice de 23 capítulos; avisar de que está incompleto)
21. 兔和貓, 魯迅 (ws)
22. 鴨的喜劇, 魯迅 (ws)
23. 風箏, 魯迅 (ws)
24. 好的故事, 魯迅 (ws)
25. 頭髮的故事, 魯迅 (ws)
26. 故鄉, 魯迅 (ws)
27. 社戲, 魯迅 (ws)
28. 俄羅斯的童話, Gorki / 魯迅 (ws, índice de 17)
29. 伊娑菩喻言, Esopo / Robert Thom (ws)
30. 唐詩三百首 (ws, índice de 321 páginas sueltas: solo si se implementa el recorrido de enlaces ns0 en orden)
31. 笑林廣記 (ws, índice de 12; excluir 古艷部 y 閨風部, o marcarlo "adultos")

**Bloque C. Avanzado (meter solo con aviso), 4 títulos**

32. 幼學瓊林 (gb 52269, o ws índice de 4)
33. 龍文鞭影 (ws)
34. 伊索寓言 (林紓) (ws)
35. 世說新語 (gb 24047; visto pero no recomendado como principiante)

Fuera de la lista: 莊子的故事 (gb 23913, es el 莊子 entero), 三字經 (麥都思) (catecismo cristiano de 1857 con forma de 三字經), todo Andersen, Grimm y Alicia (sin traducción libre en vernáculo), Bloom cc-by-nc-sa salvo los dos de muestra hasta decidir la licencia.

**Cómo integrarlo**

- Gutenberg: reutilizar `openBook` con `pg{id}.epub` (todos pesan menos de 200 KB; no hay variante con imágenes que importe).
- Wikisource: reutilizar el flujo del catálogo árabe. Páginas de texto directo: `action=parse&prop=text` y limpiar `style`, `#headertemplate`, `.ambox`, la caja de licencia y las notas de variante. Índices con subpáginas (`鵝媽媽的故事 (戴望舒譯)`, `千家詩`, `愛的教育`, `俄羅斯的童話`, `笑林廣記`, `幼學瓊林`): leer el HTML del índice y recorrer los `<a href="/wiki/Título/...">` en orden de aparición, pedir cada subpágina y montar un HTML con un `<h2>` por capítulo. `唐詩三百首` es el único cuyos enlaces no son subpáginas: aplazarlo. Mandar siempre un `User-Agent` propio desde el proxy si algún día se pasa por servidor; desde el navegador el `origin=*` ya vale.
- Conversión tradicional a simplificado: todo lo de arriba está en tradicional (salvo los Bloom, que ya vienen en simplificado); la conversión en pantalla de Glosa cubre el resto.
- Bloom (fase 2): proxy nginx `/bloom/` hacia `https://s3.amazonaws.com/bloomharvest/`, consultar el catálogo con `isoCode: "zh-CN"` y un `User-Agent` de navegador, filtrar `license` y, al renderizar, quitar los nodos con `lang="khb"` para que no salga el alfabeto dai. Decidir antes si la licencia NC es aceptable para Glosa.

```json
[
  {"source":"ws","lang":"zh","title":"鵝媽媽的故事 (戴望舒譯)","author":"Charles Perrault, trad. 戴望舒","level":"infantil"},
  {"source":"gb","id":67976,"title":"故事新讀本: 第一冊","author":"anónimo (上海大東書局)","level":"principiante"},
  {"source":"gb","id":12479,"title":"三字經","author":"anónimo (atrib. 王應麟)","level":"principiante"},
  {"source":"ws","lang":"zh","title":"弟子規","author":"李毓秀","level":"principiante"},
  {"source":"ws","lang":"zh","title":"百家姓","author":"anónimo","level":"principiante"},
  {"source":"ws","lang":"zh","title":"神童詩","author":"汪洙","level":"principiante"},
  {"source":"ws","lang":"zh","title":"訓蒙幼學詩","author":"anónimo","level":"principiante"},
  {"source":"ws","lang":"zh","title":"千家詩","author":"劉克莊, 謝枋得, 王相 (comp.)","level":"principiante"},
  {"source":"ws","lang":"zh","title":"重訂三字經","author":"王應麟, rev. 章太炎","level":"principiante"},
  {"source":"bloom","id":"CSy4rnXzSG","title":"猴子","author":"SIL East Asia","level":"infantil","url":"https://s3.amazonaws.com/bloomharvest/academic_affairs_east%40sil.org/27e9bf98-8ea8-4627-a54f-9c3c72bd32a0/epub/%E7%8C%B4%E5%AD%90.epub"},
  {"source":"bloom","id":"efLB1kHvaQ","title":"老虎吃糖果","author":"SIL East Asia","level":"infantil","url":"https://s3.amazonaws.com/bloomharvest/academic_affairs_east%40sil.org/56e4eb91-0c1b-4107-8883-da5dc0a17c81/epub/%E8%80%81%E8%99%8E%E5%90%83%E7%B3%96%E6%9E%9C.epub"},
  {"source":"ws","lang":"zh","title":"一件小事","author":"魯迅","level":"principiante"},
  {"source":"ws","lang":"zh","title":"增廣昔時賢文","author":"anónimo","level":"intermedio"},
  {"source":"ws","lang":"zh","title":"名賢集","author":"anónimo","level":"intermedio"},
  {"source":"ws","lang":"zh","title":"朱子家訓","author":"朱用純","level":"intermedio"},
  {"source":"ws","lang":"zh","title":"小學韻語","author":"anónimo","level":"intermedio"},
  {"source":"ws","lang":"zh","title":"今文孝經","author":"anónimo","level":"intermedio"},
  {"source":"ws","lang":"zh","title":"千字文","author":"周興嗣","level":"intermedio"},
  {"source":"ws","lang":"zh","title":"聲律啓蒙","author":"車萬育","level":"intermedio"},
  {"source":"ws","lang":"zh","title":"愛的教育","author":"Edmondo De Amicis, trad. 夏丏尊","level":"intermedio"},
  {"source":"ws","lang":"zh","title":"兔和貓","author":"魯迅","level":"intermedio"},
  {"source":"ws","lang":"zh","title":"鴨的喜劇","author":"魯迅","level":"intermedio"},
  {"source":"ws","lang":"zh","title":"風箏","author":"魯迅","level":"intermedio"},
  {"source":"ws","lang":"zh","title":"好的故事","author":"魯迅","level":"intermedio"},
  {"source":"ws","lang":"zh","title":"頭髮的故事","author":"魯迅","level":"intermedio"},
  {"source":"ws","lang":"zh","title":"故鄉","author":"魯迅","level":"intermedio"},
  {"source":"ws","lang":"zh","title":"社戲","author":"魯迅","level":"intermedio"},
  {"source":"ws","lang":"zh","title":"俄羅斯的童話","author":"Maksim Gorki, trad. 魯迅","level":"intermedio"},
  {"source":"ws","lang":"zh","title":"伊娑菩喻言","author":"Esopo, trad. Robert Thom","level":"intermedio"},
  {"source":"ws","lang":"zh","title":"唐詩三百首","author":"孫洙 (comp.)","level":"intermedio"},
  {"source":"ws","lang":"zh","title":"笑林廣記","author":"游戲主人","level":"intermedio"},
  {"source":"gb","id":23823,"title":"弟子規","author":"李毓秀","level":"principiante"},
  {"source":"gb","id":25196,"title":"百家姓","author":"anónimo","level":"principiante"},
  {"source":"gb","id":24184,"title":"千字文","author":"周興嗣","level":"intermedio"},
  {"source":"gb","id":23816,"title":"朱子治家格言","author":"朱用純","level":"intermedio"},
  {"source":"gb","id":24232,"title":"孝經","author":"anónimo","level":"intermedio"},
  {"source":"gb","id":52269,"title":"幼學瓊林","author":"程允升","level":"intermedio"},
  {"source":"ws","lang":"zh","title":"龍文鞭影","author":"蕭良有","level":"intermedio"},
  {"source":"ws","lang":"zh","title":"伊索寓言 (林紓)","author":"Esopo, trad. 林紓","level":"intermedio"}
]
```
