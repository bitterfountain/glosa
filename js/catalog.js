/* Catálogo Top 100 de Project Gutenberg (inglés, español, italiano y alemán): modal, descarga y apertura en Glosa.
   Las páginas de Gutenberg no envían CORS: se leen a través del proxy /gb/ del servidor de Glosa
   (nginx, con caché). Abriendo index.html desde disco no hay proxy y el catálogo avisa. */
window.Catalog = (function () {
  "use strict";

  const PROXY = "/gb/";
  const CACHE_TTL = 24 * 3600 * 1000;
  // Por idioma: buscador de Gutenberg ordenado por descargas, 4 páginas de 25 (l.es, l.it, l.de...).
  const search = (l) => ({
    pages: [1, 26, 51, 76].map((i) => "ebooks/search/?query=l." + l + "&sort_order=downloads&start_index=" + i),
    parse: parseSearchPage,
    credit: "https://www.gutenberg.org/ebooks/search/?query=l." + l + "&sort_order=downloads",
  });
  const SOURCES = {
    en: { label: "English", url: "browse/scores/top", parse: parseTopPage, credit: "https://www.gutenberg.org/browse/scores/top" },
    es: Object.assign({ label: "Español" }, search("es")),
    it: Object.assign({ label: "Italiano" }, search("it")),
    de: Object.assign({ label: "Deutsch" }, search("de")),
    // Árabe: Gutenberg no tiene libros en árabe. Clásicos de dominio público de Wikisource, cuya
    // API admite CORS (no hace falta el proxy, funciona incluso desde disco). Ordenados por vistas.
    ar: { label: "العربية", wikisource: true, credit: "https://ar.wikisource.org/" },
    zh: Object.assign({ label: "中文" }, search("zh")),
  };
  const wsApiUrl = (l) => "https://" + l + ".wikisource.org/w/api.php";
  const WS_MAX_CHAPTERS = 60;
  const WS_MAX_HTML = 1500000;    // caracteres de HTML: por encima, el DOM deja el navegador clavado
  const WS_INDEX_MAX_TEXT = 8000; // por debajo de este texto (o de 600 caracteres por enlace) la página es un índice
  const WORKS_AR = [
    ["كليلة ودمنة", "ابن المقفع"], ["ألف ليلة وليلة", ""], ["حي بن يقظان", "ابن طفيل"], ["البخلاء", "الجاحظ"],
    ["طوق الحمامة", "ابن حزم"], ["مقامات الحريري", "الحريري"], ["رسالة الغفران", "أبو العلاء المعري"],
    ["رحلة ابن جبير", "ابن جبير"], ["العقد الفريد", "ابن عبد ربه"], ["أخبار الحمقى والمغفلين", "ابن الجوزي"],
    ["تهافت الفلاسفة", "الغزالي"], ["قصص الأنبياء لابن كثير", "ابن كثير"], ["الفهرست", "ابن النديم"],
    ["لامية العرب", "الشنفرى"],
  ]; // fuera البيان والتبيين (800.000 caracteres en una página) y تاريخ الطبري (11 tomos): dejan el navegador clavado

  const $ = (id) => document.getElementById(id);
  const t = (k, v) => I18n.t(k, v);
  let lang = "en";
  let books = [];
  let filter = "";
  let levelOnly = false;   // filtro "Infantil y principiantes"
  let opening = null;

  function available(l) { return (SOURCES[l] && SOURCES[l].wikisource) || /^https?:$/.test(location.protocol); }
  function proxyUrl(path) { return PROXY + path.replace(/^\//, ""); }
  function cover(id) { return proxyUrl("cache/epub/" + id + "/pg" + id + ".cover.small.jpg"); }

  // ---------------------------------------------------------------- parsers
  function parseTopPage(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const h2 = doc.getElementById("books-last30") || doc.getElementById("books-last7") || doc.getElementById("books-last1");
    let list = h2 && h2.nextElementSibling;
    while (list && list.tagName !== "OL" && list.tagName !== "UL") list = list.nextElementSibling;
    if (!list) return [];
    return Array.from(list.querySelectorAll("li > a[href^='/ebooks/']")).map((a) => {
      const id = Number((a.getAttribute("href").match(/\/ebooks\/(\d+)/) || [])[1]);
      const text = a.textContent.replace(/\s+/g, " ").trim();
      const m = text.match(/^(.*?)(?: by (.*?))? \((\d+)\)$/);
      return { id, title: m ? m[1] : text, author: m && m[2] ? m[2] : "", downloads: m ? Number(m[3]) : 0 };
    }).filter((b) => b.id);
  }

  function parseSearchPage(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return Array.from(doc.querySelectorAll("li.booklink")).map((li) => {
      const a = li.querySelector("a.link");
      const id = Number(((a && a.getAttribute("href")) || "").match(/\/ebooks\/(\d+)/)?.[1]);
      const title = (li.querySelector(".title")?.textContent || "").replace(/\s*\((Spanish|Español|Italian|Italiano|German|Deutsch|English|Chinese)\)\s*$/i, "").trim();
      const author = (li.querySelector(".subtitle")?.textContent || "").trim();
      const downloads = Number(((li.querySelector(".extra")?.textContent || "").match(/(\d+)/) || [])[1] || 0);
      return { id, title, author, downloads };
    }).filter((b) => b.id && b.title);
  }

  // ---------------------------------------------------------------- carga de listas
  async function fetchText(path) {
    const r = await fetch(proxyUrl(path), { headers: { Accept: "text/html" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.text();
  }

  // ---------------------------------------------------------------- Wikisource (árabe)
  async function wsApi(l, params) {
    const q = new URLSearchParams(Object.assign({ format: "json", origin: "*" }, params));
    const r = await fetch(wsApiUrl(l) + "?" + q.toString());
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  }

  // Lista de clásicos ordenada por vistas de los últimos 60 días (una sola llamada a la API).
  async function wsList() {
    const views = {};
    try {
      const d = await wsApi("ar", { action: "query", prop: "pageviews", pvipdays: 60, titles: WORKS_AR.map((w) => w[0]).join("|") });
      Object.values((d.query && d.query.pages) || {}).forEach((p) => {
        views[p.title] = Object.values(p.pageviews || {}).reduce((a, n) => a + (n || 0), 0);
      });
    } catch (_) { /* sin vistas: orden de la lista */ }
    return WORKS_AR.map(([title, author]) => ({ id: "ws:ar:" + title, ws: true, wsLang: "ar", title, author, downloads: views[title] || 0 }))
      .sort((a, b) => b.downloads - a.downloads);
  }

  // Una página de Wikisource (cuerpo HTML). La API devuelve 429 si se le piden muchas seguidas:
  // se reintenta con pausa y las descargas van de dos en dos.
  async function wsPageHtml(l, title, attempt) {
    let d;
    try {
      d = await wsApi(l, { action: "parse", page: title, prop: "text", disableeditsection: 1 });
    } catch (err) {
      if ((attempt || 0) < 2) { await new Promise((r) => setTimeout(r, 1200 * ((attempt || 0) + 1))); return wsPageHtml(l, title, (attempt || 0) + 1); }
      throw err;
    }
    if (!d.parse) throw new Error("Wikisource: " + title);
    const doc = new DOMParser().parseFromString(d.parse.text["*"], "text/html");
    doc.querySelectorAll("style, script, .mw-editsection, .printfooter").forEach((el) => el.remove());
    return doc.body;
  }

  // Limpieza para mostrar: fuera cabeceras, tablas de navegación, índices y notas (los enlaces del índice
  // se recogen ANTES, porque muchos índices de Wikisource van dentro de una tabla).
  function wsClean(body) {
    body.querySelectorAll("table, #toc, .toc, .noprint, .navbox, .mw-empty-elt, sup.reference, .mw-references-wrap, .ws-noexport, #headertemplate, .headertemplate, .ambox, .ws-summary, .mw-authority-control").forEach((el) => el.remove());
    return body;
  }

  // Los enlaces de Wikisource sacarían de la app: se dejan como texto (los capítulos ya van en el índice).
  function wsUnlink(body) {
    wsClean(body);
    body.querySelectorAll("a").forEach((a) => a.removeAttribute("href"));
    return body.innerHTML;
  }

  // Enlaces internos de una página, en orden de aparición: subpáginas ("Obra/Capítulo") y, si la página
  // es un índice corto, también las páginas sueltas que enlaza (colecciones de cuentos).
  function wsLinks(body, root) {
    const prefix = "/wiki/" + root + "/";
    const textLen = body.textContent.replace(/\s+/g, " ").trim().length;
    const subs = [], loose = [];
    body.querySelectorAll("a[href]").forEach((a) => {
      let href = a.getAttribute("href") || "";
      if (!href.startsWith("/wiki/") || a.classList.contains("new")) return;
      try { href = decodeURIComponent(href); } catch (_) { /* tal cual */ }
      href = href.replace(/_/g, " ").replace(/[#?].*$/, "");
      const page = href.slice(6);
      if (!page || page === root || subs.some((c) => c.page === page) || loose.some((c) => c.page === page)) return;
      if (href.startsWith(prefix)) subs.push({ page, title: page.slice(root.length + 1) });
      else if (!/[:：]/.test(page)) loose.push({ page, title: a.textContent.trim() || page });
    });
    const isIndex = loose.length >= 3 && textLen < Math.max(WS_INDEX_MAX_TEXT, loose.length * 600);
    return { chapters: subs.concat(isIndex ? loose : []), textLen };
  }

  // Construye un fichero HTML con la obra: página principal + capítulos enlazados, en orden. Si un capítulo
  // es a su vez un índice (colecciones de dos niveles: obra → cuento → capítulos), se bajan también sus subpáginas.
  async function wsBook(book) {
    const l = book.wsLang || "ar";
    const root = book.title;
    const main = await wsPageHtml(l, root);
    const level1 = wsLinks(main, root).chapters.slice(0, WS_MAX_CHAPTERS);
    let budget = WS_MAX_CHAPTERS + 20; // páginas totales, contando segundo nivel
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const parts = new Array(level1.length).fill("");
    let next = 0;
    let size = main.innerHTML.length;
    const worker = async () => {
      while (next < level1.length) {
        if (size > WS_MAX_HTML) break; // ya hay lectura de sobra; el resto quedaría fuera del tope
        const i = next++;
        const ch = level1[i];
        try {
          const body = await wsPageHtml(l, ch.page);
          budget--;
          const inner = wsLinks(body, ch.page);
          let html = "<h2>" + esc(ch.title) + "</h2>" + wsUnlink(body);
          const subs = inner.chapters.filter((c) => c.page.startsWith(ch.page + "/"));
          if (subs.length >= 2 && inner.textLen < 3000) {
            for (const sub of subs) {
              if (budget-- <= 0) break;
              try { html += "<h3>" + esc(sub.title) + "</h3>" + wsUnlink(await wsPageHtml(l, sub.page)); } catch (_) { /* capítulo perdido */ }
            }
          }
          parts[i] = html;
          size += html.length;
        } catch (_) { parts[i] = ""; }
      }
    };
    await Promise.all([worker(), worker()]);
    const html = "<h1>" + esc(root) + "</h1>" + wsUnlink(main) + parts.join("");
    const name = (book.author ? book.author + " - " : "") + root;
    const dir = l === "ar" ? " dir=\"rtl\"" : "";
    return new File(["<!DOCTYPE html><html" + dir + " lang=\"" + l + "\"><body>" + html + "</body></html>"], name.replace(/[\\/:*?"<>|]+/g, " ").slice(0, 120) + ".html", { type: "text/html" });
  }

  // Libros infantiles y para principiantes del idioma (js/beginners.js), en el formato del catálogo.
  function beginnerBooks(l) {
    return ((window.BEGINNERS && window.BEGINNERS[l]) || []).map((b) => b.gb
      ? { id: b.gb, title: b.title, author: b.author, downloads: 0, level: b.level, noimages: !!b.noimages }
      : { id: "ws:" + b.ws + ":" + b.title, ws: true, wsLang: b.ws, title: b.title, author: b.author, downloads: 0, level: b.level });
  }

  // Mezcla el Top con los libros de nivel: si uno ya estaba en el Top, solo se le pone el distintivo.
  function withBeginners(list, l) {
    const out = list.map((b) => Object.assign({}, b));
    const byId = new Map(out.map((b) => [String(b.id), b]));
    beginnerBooks(l).forEach((b) => {
      const hit = byId.get(String(b.id));
      if (hit) { hit.level = b.level; hit.noimages = b.noimages; } else out.push(b);
    });
    return out;
  }

  async function loadList(l) {
    const key = "pdfr.catalog." + l;
    try {
      const cached = JSON.parse(localStorage.getItem(key) || "null");
      if (cached && Date.now() - cached.ts < CACHE_TTL && cached.books.length) return cached.books;
    } catch (_) { /* sin caché */ }
    const src = SOURCES[l];
    if (src.wikisource) {
      const list = await wsList();
      try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), books: list })); } catch (_) { /* ignorar */ }
      return list;
    }
    const pages = src.pages || [src.url];
    const htmls = await Promise.all(pages.map(fetchText));
    const seen = new Set();
    const list = htmls.flatMap(src.parse).filter((b) => !seen.has(b.id) && seen.add(b.id)).slice(0, 100);
    if (!list.length) throw new Error("empty");
    try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), books: list })); } catch (_) { /* ignorar */ }
    return list;
  }

  // ---------------------------------------------------------------- abrir un libro
  const EPUB_PATHS = (id, noimages) => {
    const paths = ["cache/epub/" + id + "/pg" + id + "-images-3.epub", "cache/epub/" + id + "/pg" + id + "-images.epub", "cache/epub/" + id + "/pg" + id + ".epub"];
    return noimages ? paths.reverse() : paths; // algunas ediciones ilustradas pesan 25 MB; sin imágenes, 200 KB
  };

  // Origen de un libro del catálogo, tal como lo guarda la biblioteca (ver js/library.js).
  function sourceOf(book) {
    return book.ws ? { kind: "wikisource", ref: book.wsLang + ":" + book.title } : { kind: "gutenberg", ref: String(book.id) };
  }

  // Descarga el fichero de un libro de Gutenberg o Wikisource. Lo usa el catálogo al pulsar un libro y
  // la biblioteca cuando el fichero ya no está en este navegador (rec: registro de la biblioteca, para el
  // nombre y el autor).
  async function fetchBook(source, rec) {
    if (source.kind === "wikisource") {
      const i = source.ref.indexOf(":");
      const l = source.ref.slice(0, i);
      const title = source.ref.slice(i + 1);
      return wsBook({ wsLang: l, title, author: rec && rec.author ? rec.author : "" });
    }
    if (source.kind !== "gutenberg") throw new Error("origen desconocido: " + source.kind);
    if (!/^https?:$/.test(location.protocol)) throw new Error(t("catalog.needsServer"));
    const noimages = !!(rec && rec.noimages);
    let blob = null;
    for (const p of EPUB_PATHS(source.ref, noimages)) {
      const r = await fetch(proxyUrl(p));
      if (r.ok) { blob = await r.blob(); break; }
    }
    if (!blob) throw new Error("EPUB no disponible");
    const name = rec && rec.name && !rec.name.startsWith("pg") ? rec.name.replace(/\.epub$/i, "") : ((rec && rec.author ? rec.author + " - " : "") + (rec && rec.title ? rec.title : "pg" + source.ref));
    return new File([blob], name.replace(/[\\/:*?"<>|]+/g, " ").slice(0, 120) + ".epub", { type: "application/epub+zip" });
  }

  async function openBook(book, card) {
    if (opening) return;
    opening = book.id;
    if (card) card.classList.add("is-loading");
    App.toast(t("catalog.downloading", { title: book.title }), 6000);
    try {
      const source = sourceOf(book);
      const file = await fetchBook(source, { title: book.title, author: book.author, noimages: book.noimages });
      close();
      await App.openFile(file, source);
    } catch (err) {
      console.error(err);
      App.toast(t("catalog.openError", { title: book.title }), 4000);
    } finally {
      opening = null;
      if (card) card.classList.remove("is-loading");
    }
  }

  // ---------------------------------------------------------------- modal
  function render() {
    const grid = $("catalog-grid");
    grid.replaceChildren();
    const q = filter.toLowerCase();
    const pool = levelOnly ? books.filter((b) => b.level) : books;
    const shown = pool.filter((b) => !q || (b.title + " " + b.author).toLowerCase().includes(q));
    $("catalog-count").textContent = t("catalog.count", { n: shown.length, total: pool.length });
    shown.forEach((b, i) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "book";
      card.title = t("catalog.openHint");
      const rank = document.createElement("span");
      rank.className = "book__rank";
      rank.textContent = String(books.indexOf(b) + 1);
      let img;
      if (b.ws) {
        img = placeholderCover(b);
      } else {
        img = document.createElement("img");
        img.className = "book__cover";
        img.loading = "lazy";
        img.alt = "";
        img.src = cover(b.id);
        img.addEventListener("error", () => { img.replaceWith(placeholderCover(b)); });
      }
      const meta = document.createElement("span");
      meta.className = "book__meta";
      const title = document.createElement("span");
      title.className = "book__title";
      title.textContent = b.title;
      const author = document.createElement("span");
      author.className = "book__author";
      author.textContent = b.author || "—";
      const dl = document.createElement("span");
      dl.className = "book__downloads";
      dl.textContent = b.downloads ? b.downloads.toLocaleString(I18n.locale) + (b.ws ? " 👁" : " ↓") : "";
      meta.append(title, author, dl);
      if (b.level) {
        const lv = document.createElement("span");
        lv.className = "book__level book__level--" + b.level;
        lv.textContent = t("level." + b.level);
        meta.appendChild(lv);
      }
      card.append(rank, img, meta);
      card.addEventListener("click", () => openBook(b, card));
      grid.appendChild(card);
    });
  }

  function placeholderCover(b) {
    const ph = document.createElement("span");
    ph.className = "book__cover book__cover--empty";
    ph.textContent = (b.title || "?").slice(0, 1).toUpperCase();
    return ph;
  }

  function syncHeader() {
    document.querySelectorAll("#catalog-lang .segmented__btn").forEach((b) => b.classList.toggle("is-active", b.dataset.lang === lang));
    document.querySelectorAll("#catalog-level .segmented__btn").forEach((b) => b.classList.toggle("is-active", (b.dataset.level === "beg") === levelOnly));
    $("catalog-level").hidden = beginnerBooks(lang).length === 0;
    $("catalog-title").textContent = levelOnly ? t("catalog.title.beg", { lang: Langs.NAMES[lang] || lang }) : t("catalog.title." + lang);
    $("catalog-source").href = SOURCES[lang].credit;
    const hasWs = SOURCES[lang].wikisource || beginnerBooks(lang).some((b) => b.ws);
    $("catalog-credit").textContent = t(SOURCES[lang].wikisource ? "catalog.credit.ws" : hasWs ? "catalog.credit.mixed" : "catalog.credit");
    $("catalog-grid").classList.toggle("books--rtl", lang === "ar");
  }

  // opts.beginners: abrir con el filtro "Infantil y principiantes" puesto.
  async function show(l, opts) {
    lang = l || lang;
    levelOnly = !!(opts && opts.beginners);
    if (window.Popup) Popup.hide();
    const modal = $("catalog-modal");
    modal.hidden = false;
    syncHeader();
    $("catalog-grid").replaceChildren();
    $("catalog-count").textContent = "";
    const status = $("catalog-status");
    status.hidden = false;
    if (!available(lang)) {
      // Desde disco no hay proxy a Gutenberg, pero los libros de Wikisource sí se pueden abrir.
      const offline = beginnerBooks(lang).filter((b) => b.ws);
      if (!offline.length) { status.textContent = t("catalog.needsServer"); return; }
      books = offline;
      levelOnly = true;
      syncHeader();
      status.hidden = true;
      render();
      return;
    }
    status.textContent = t("catalog.loading");
    try {
      books = withBeginners(await loadList(lang), lang);
      status.hidden = true;
      render();
      // Solo con teclado físico: en el móvil el foco abriría el teclado en pantalla y taparía la lista.
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) $("catalog-filter").focus();
    } catch (err) {
      console.error(err);
      status.textContent = t("catalog.error");
    }
  }

  function close() {
    $("catalog-modal").hidden = true;
  }

  function isOpen() { return !$("catalog-modal").hidden; }

  function renderBeginnersRow() {
    const row = $("beginners-row");
    if (!row) return;
    row.replaceChildren();
    // En el mismo orden que los botones del Top 100 (el de SOURCES), para que las dos filas coincidan.
    Object.keys(SOURCES).forEach((l) => {
      if (!window.BEGINNERS || !window.BEGINNERS[l] || !window.BEGINNERS[l].length) return;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn--catalog btn--beg";
      b.dataset.catalogBeg = l;
      const name = document.createElement("span");
      name.textContent = Langs.NAMES[l] || l.toUpperCase();
      b.append(Langs.flag(l), name);
      b.addEventListener("click", () => show(l, { beginners: true }));
      row.appendChild(b);
    });
    row.parentElement.hidden = row.childElementCount === 0;
  }

  // Menú móvil: una bandera por idioma con catálogo (abre su Top 100; el modal permite cambiar de idioma).
  function renderToolbarRow() {
    const row = $("toolbar-catalogs-row");
    if (!row) return;
    row.replaceChildren();
    Object.keys(SOURCES).forEach((l) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn--icon btn--flag";
      b.title = t("catalog.title." + l);
      b.setAttribute("aria-label", t("catalog.title." + l));
      b.append(Langs.flag(l));
      b.addEventListener("click", () => show(l));
      row.appendChild(b);
    });
  }

  // Pestañas de idioma del modal: solo banderas (el nombre va en el tooltip), que ocupan menos.
  function renderLangTabs() {
    const seg = $("catalog-lang");
    seg.replaceChildren();
    Object.keys(SOURCES).forEach((l) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "segmented__btn segmented__btn--flag";
      b.dataset.lang = l;
      b.setAttribute("role", "tab");
      b.title = Langs.NAMES[l] || l;
      b.setAttribute("aria-label", Langs.NAMES[l] || l);
      b.append(Langs.flag(l));
      seg.appendChild(b);
    });
  }

  function init() {
    renderBeginnersRow();
    renderToolbarRow();
    renderLangTabs();
    $("catalog-level").addEventListener("click", (e) => {
      const b = e.target.closest("[data-level]");
      if (!b) return;
      levelOnly = b.dataset.level === "beg";
      syncHeader();
      render();
    });
    document.querySelectorAll("[data-catalog-lang]").forEach((b) => {
      // La misma bandera que la fila infantil, para que las dos filas se lean igual.
      const icon = b.querySelector("svg");
      if (icon) icon.replaceWith(Langs.flag(b.dataset.catalogLang));
      b.addEventListener("click", () => show(b.dataset.catalogLang));
    });
    document.querySelectorAll("[data-close-catalog]").forEach((el) => el.addEventListener("click", close));
    $("catalog-lang").addEventListener("click", (e) => {
      const b = e.target.closest("[data-lang]");
      if (b) show(b.dataset.lang);
    });
    $("catalog-filter").addEventListener("input", (e) => { filter = e.target.value.trim(); render(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen()) { close(); e.stopPropagation(); } }, true);
  }

  return { init, show, close, isOpen, fetchBook };
})();
