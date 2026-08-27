/* Visor: PDF (canvas + capa de texto, o vista Texto) y libros EPUB/HTML/TXT (capítulos en vista Texto). */
window.Viewer = (function () {
  "use strict";

  pdfjsLib.GlobalWorkerOptions.workerSrc = "vendor/pdf.worker.min.js";

  const RENDER_MARGIN = "900px";   // distancia a la que se empieza a renderizar
  const MAX_LIVE_PAGES = 12;       // páginas PDF renderizadas simultáneamente (memoria)
  const ZOOM_STEPS = [0.5, 0.67, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3];

  let docType = "pdf";             // pdf | book
  let pdf = null;
  let book = null;                 // {type, title, author, chapters:[{title, body}]}
  let fileName = "";
  let mode = "page";               // solo PDF: page | text
  let zoom = "fit";
  let scale = 1;
  let baseWidth = 612;
  let baseHeight = 792;
  let fitWidth = 612;
  let heightsReady = false;
  let pendingTarget = null;
  let pendingPos = null;           // {block, offset} a aplicar cuando la página objetivo tenga altura real
  let pageSlots = [];              // {el, num, rendered, task}
  let observer = null;
  let currentPage = 1;
  let textCache = new Map();
  const listeners = { page: [], ready: [], scroll: [] };
  const READ_LINE = 16;            // px por debajo del borde superior del visor donde "empieza" la lectura

  const $ = (id) => document.getElementById(id);
  const viewerEl = () => $("viewer");
  const pagesEl = () => $("pages");

  function on(evt, fn) { listeners[evt].push(fn); }
  function emit(evt, arg) { listeners[evt].forEach((fn) => fn(arg)); }
  function fileKey(file) { return "pdfr.pos." + file.name + ":" + file.size; }

  // ================================================================ apertura
  async function open(file) {
    const ext = (file.name.match(/\.([a-z0-9]+)$/i) || [, ""])[1].toLowerCase();
    await closeCurrent();
    if (ext === "pdf" || file.type === "application/pdf") await openPdf(file);
    else if (ext === "epub") await openBook(await EpubLoader.load(file), file);
    else await openBook(await TextDoc.load(file), file);
    $("empty-state").hidden = true;
    pagesEl().hidden = false;
    $("nav-controls").hidden = false;
    document.body.dataset.doctype = docType;
    currentPage = 1;
    await layout();
    const info = { name: fileName, pages: count(), key: fileKey(file), unit: unit() };
    emit("ready", info);
    return info;
  }

  // Cierra el libro abierto y vuelve a mostrar la portada.
  async function close() {
    await closeCurrent();
    pageSlots = [];
    pdf = null; book = null; fileName = "";
    currentPage = 1;
    heightsReady = false; pendingTarget = null; pendingPos = null;
    hideMarker();
    $("empty-state").hidden = false;
    pagesEl().hidden = true;
    $("nav-controls").hidden = true;
    delete document.body.dataset.doctype;
  }

  // Miniatura de portada (data URL JPEG) para la biblioteca: portada del EPUB o 1.ª página del PDF.
  async function coverThumb() {
    const W = 92, H = 132;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (docType === "book") {
      if (!book || !book.cover) return null;
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = book.cover; });
      const s = Math.max(W / img.width, H / img.height);
      ctx.drawImage(img, (W - img.width * s) / 2, (H - img.height * s) / 2, img.width * s, img.height * s);
    } else if (pdf) {
      const page = await pdf.getPage(1);
      const vp0 = page.getViewport({ scale: 1 });
      const s = Math.max(W / vp0.width, H / vp0.height);
      const vp = page.getViewport({ scale: s });
      const off = document.createElement("canvas");
      off.width = Math.ceil(vp.width); off.height = Math.ceil(vp.height);
      await page.render({ canvasContext: off.getContext("2d"), viewport: vp }).promise;
      ctx.drawImage(off, (W - off.width) / 2, (H - off.height) / 2);
    } else return null;
    return canvas.toDataURL("image/jpeg", 0.8);
  }

  async function closeCurrent() {
    destroySlots();
    pagesEl().replaceChildren();
    if (pdf) { await pdf.destroy(); pdf = null; }
    if (book) { EpubLoader.dispose(); book = null; }
    textCache = new Map();
  }

  async function openPdf(file) {
    const buffer = await file.arrayBuffer();
    pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    docType = "pdf";
    fileName = file.name.replace(/\.pdf$/i, "");
    const first = await pdf.getPage(1);
    const firstVp = first.getViewport({ scale: 1 });
    // La portada suele tener otro tamaño: la estimación se toma de la 2.ª página si existe.
    const sample = pdf.numPages > 2 ? await pdf.getPage(2) : first;
    const sampleVp = sample.getViewport({ scale: 1 });
    baseWidth = sampleVp.width;
    baseHeight = sampleVp.height;
    fitWidth = Math.max(firstVp.width, sampleVp.width);
    $("page-count").textContent = String(pdf.numPages);
  }

  async function openBook(doc, file) {
    book = doc;
    docType = "book";
    fileName = doc.title || file.name.replace(/\.[a-z0-9]+$/i, "");
    $("page-count").textContent = String(doc.chapters.length);
  }

  function count() { return docType === "pdf" ? (pdf ? pdf.numPages : 0) : (book ? book.chapters.length : 0); }
  function unit() { return docType === "pdf" ? "pág." : "cap."; }

  // Muestra de texto repartida por el libro (para detectar el idioma). Se evita el
  // principio: portadas, avisos legales y prólogos suelen estar en otro idioma.
  async function sampleText(maxChars) {
    const total = count();
    if (!total) return "";
    const picks = [...new Set([0.25, 0.5, 0.75].map((f) => Math.min(total, Math.max(1, Math.round(total * f)))))];
    const per = Math.ceil(maxChars / picks.length);
    let out = "";
    for (const n of picks) {
      let chunk = "";
      if (docType === "book" && book) {
        chunk = pageSlots[n - 1] ? pageSlots[n - 1].el.textContent : ""; // los nodos ya viven en el DOM
      } else if (pdf) {
        for (let p = n; p <= Math.min(pdf.numPages, n + 3) && chunk.length < per; p++) {
          const blocks = await extractBlocks(p);
          chunk += " " + blocks.map((b) => b.text).join(" ");
        }
      }
      out += " " + chunk.slice(0, per);
    }
    return out.slice(0, maxChars);
  }

  // ================================================================ layout
  function computeScale() {
    if (zoom === "fit") {
      const avail = viewerEl().clientWidth - 52;
      return Math.max(0.3, Math.min(3, avail / fitWidth));
    }
    return zoom;
  }

  async function layout() {
    destroySlots();
    hideMarker();
    const container = pagesEl();
    container.replaceChildren();
    container.className = "pages";
    if (docType === "book") return layoutBook();
    if (!pdf) return;
    if (mode === "text") return layoutText();

    scale = computeScale();
    heightsReady = false;
    $("zoom-label").textContent = Math.round(scale * 100) + "%";
    observer = new IntersectionObserver(onIntersect, { root: viewerEl(), rootMargin: RENDER_MARGIN });

    for (let n = 1; n <= pdf.numPages; n++) {
      const el = document.createElement("div");
      el.className = "page";
      el.dataset.page = String(n);
      el.style.width = Math.floor(baseWidth * scale) + "px";
      el.style.height = Math.floor(baseHeight * scale) + "px"; // estimación hasta conocer la real
      const num = document.createElement("span");
      num.className = "page__num";
      num.textContent = String(n);
      el.appendChild(num);
      container.appendChild(el);
      pageSlots.push({ el, num: n, rendered: false, task: null });
      observer.observe(el);
    }
    fixHeights();
  }

  // Sustituye la altura estimada por la real; si la página está por encima de la vista, compensa el scroll.
  async function fixHeights() {
    const doc = pdf;
    const v = viewerEl();
    for (const slot of pageSlots) {
      if (doc !== pdf || mode !== "page") return;
      const page = await doc.getPage(slot.num);
      if (doc !== pdf || !pageSlots.includes(slot)) return;
      const vp = page.getViewport({ scale });
      const newH = Math.floor(vp.height);
      const oldH = slot.el.offsetHeight;
      slot.el.style.width = Math.floor(vp.width) + "px";
      slot.el.style.height = newH + "px";
      if (newH !== oldH && slot.el.offsetTop + oldH < v.scrollTop) v.scrollTop += newH - oldH;
      if (pendingTarget === slot.num) {
        pendingTarget = null;
        v.scrollTop = slot.el.offsetTop - READ_LINE + (pendingPos ? pendingPos.offset * newH : 0);
        pendingPos = null;
      }
    }
    heightsReady = true;
    pendingTarget = null;
    pendingPos = null;
  }

  function destroySlots() {
    if (observer) observer.disconnect();
    observer = null;
    pageSlots.forEach((s) => { if (s.task) s.task.cancel(); });
    pageSlots = [];
  }

  function onIntersect(entries) {
    entries.forEach((e) => {
      const slot = pageSlots[Number(e.target.dataset.page) - 1];
      if (!slot) return;
      if (e.isIntersecting) renderSlot(slot);
      else if (slot.rendered) unrenderSlot(slot);
    });
    trimLivePages();
  }

  function trimLivePages() {
    const live = pageSlots.filter((s) => s.rendered);
    if (live.length <= MAX_LIVE_PAGES) return;
    live.sort((a, b) => Math.abs(a.num - currentPage) - Math.abs(b.num - currentPage));
    live.slice(MAX_LIVE_PAGES).forEach(unrenderSlot);
  }

  // ================================================================ página PDF
  async function renderSlot(slot) {
    if (slot.rendered || slot.task) return;
    slot.el.classList.add("page--loading");
    const doc = pdf;
    try {
      const page = await doc.getPage(slot.num);
      if (doc !== pdf || !pageSlots.includes(slot)) return;
      const viewport = page.getViewport({ scale });
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      const ctx = canvas.getContext("2d", { alpha: false });
      slot.el.style.width = Math.floor(viewport.width) + "px";
      slot.el.style.height = Math.floor(viewport.height) + "px";

      slot.task = page.render({ canvasContext: ctx, viewport, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null });
      await slot.task.promise;
      slot.task = null;
      if (doc !== pdf || !pageSlots.includes(slot)) return;

      const textLayer = document.createElement("div");
      textLayer.className = "textLayer";
      textLayer.style.setProperty("--scale-factor", String(viewport.scale));
      const textContent = await page.getTextContent();
      await pdfjsLib.renderTextLayer({ textContentSource: textContent, container: textLayer, viewport, textDivs: [] }).promise;

      slot.el.prepend(textLayer);
      slot.el.prepend(canvas);
      slot.rendered = true;
    } catch (err) {
      if (!(err && err.name === "RenderingCancelledException")) console.error("Error renderizando página", slot.num, err);
      slot.task = null;
    } finally {
      slot.el.classList.remove("page--loading");
    }
  }

  function unrenderSlot(slot) {
    if (slot.task) { slot.task.cancel(); slot.task = null; }
    slot.el.querySelectorAll("canvas, .textLayer").forEach((n) => n.remove());
    slot.rendered = false;
  }

  // ================================================================ vista Texto (PDF)
  function layoutText() {
    const container = pagesEl();
    container.className = "pages reflow";
    $("zoom-label").textContent = "Texto";
    observer = new IntersectionObserver(onIntersectText, { root: viewerEl(), rootMargin: RENDER_MARGIN });
    for (let n = 1; n <= pdf.numPages; n++) {
      const el = makeSection(n, I18n.t("page.n", { n }));
      el.style.minHeight = "40vh";
      container.appendChild(el);
      pageSlots.push({ el, num: n, rendered: false, task: null });
      observer.observe(el);
    }
  }

  function makeSection(n, label) {
    const el = document.createElement("section");
    el.className = "reflow__page";
    el.dataset.page = String(n);
    const marker = document.createElement("div");
    marker.className = "reflow__marker";
    marker.textContent = label;
    el.appendChild(marker);
    return el;
  }

  function onIntersectText(entries) {
    entries.forEach((e) => {
      const slot = pageSlots[Number(e.target.dataset.page) - 1];
      if (slot && e.isIntersecting && !slot.rendered) renderTextSlot(slot);
    });
  }

  async function renderTextSlot(slot) {
    slot.rendered = true;
    const doc = pdf;
    const blocks = await extractBlocks(slot.num);
    if (doc !== pdf || !pageSlots.includes(slot)) return;
    const v = viewerEl();
    const oldH = slot.el.offsetHeight;
    const wasAbove = slot.el.offsetTop + oldH < v.scrollTop;
    slot.el.style.minHeight = "";
    if (!blocks.length) {
      const p = document.createElement("p");
      p.className = "reflow__empty";
      p.textContent = I18n.t("page.noText");
      slot.el.appendChild(p);
    } else {
      const frag = document.createDocumentFragment();
      blocks.forEach((b) => {
        const el = document.createElement(b.kind === "h" ? "h3" : "p");
        el.textContent = b.text;
        frag.appendChild(el);
      });
      slot.el.appendChild(frag);
    }
    if (wasAbove) v.scrollTop += slot.el.offsetHeight - oldH; // que no se mueva lo que se está leyendo
  }

  // Reconstruye párrafos a partir de los fragmentos posicionados de pdf.js.
  async function extractBlocks(num) {
    if (textCache.has(num)) return textCache.get(num);
    const page = await pdf.getPage(num);
    const tc = await page.getTextContent();
    const lines = [];
    tc.items.forEach((it) => {
      if (typeof it.str !== "string" || !it.str.trim()) return;
      const x = it.transform[4], y = it.transform[5];
      const h = it.height || Math.abs(it.transform[3]) || 10;
      let line = null;
      for (let i = lines.length - 1; i >= 0 && i >= lines.length - 6; i--) {
        if (Math.abs(lines[i].y - y) < Math.max(2, h * 0.45)) { line = lines[i]; break; }
      }
      if (!line) { line = { y, h, items: [] }; lines.push(line); }
      line.h = Math.max(line.h, h);
      line.items.push({ x, end: x + (it.width || 0), str: it.str });
    });
    lines.sort((a, b) => b.y - a.y);

    const built = lines.map((l) => {
      l.items.sort((a, b) => a.x - b.x);
      let text = "";
      let prevEnd = null;
      l.items.forEach((it) => {
        const gap = prevEnd == null ? 0 : it.x - prevEnd;
        if (text && gap > l.h * 0.12 && !text.endsWith(" ") && !it.str.startsWith(" ")) text += " ";
        text += it.str;
        prevEnd = it.end;
      });
      return { y: l.y, h: l.h, x0: l.items[0].x, x1: l.items[l.items.length - 1].end, text: text.replace(/\s+/g, " ").trim() };
    }).filter((l) => l.text);

    const heights = built.map((l) => l.h).sort((a, b) => a - b);
    const medianH = heights[Math.floor(heights.length / 2)] || 10;
    const maxWidth = Math.max(1, ...built.map((l) => l.x1 - l.x0));

    const blocks = [];
    let cur = null;
    built.forEach((line, i) => {
      const prev = built[i - 1];
      const isHeading = line.h > medianH * 1.25 && line.text.length < 90;
      const gap = prev ? prev.y - line.y : 0;
      const indent = prev ? line.x0 - prev.x0 > medianH * 1.2 : false;
      const prevShort = prev ? prev.x1 - prev.x0 < maxWidth * 0.75 && /[.!?:"”)]$/.test(prev.text) : true;
      const breakBefore = !cur || isHeading || (cur && cur.kind === "h") || gap > medianH * 1.9 || indent || (prevShort && gap > medianH * 1.1);
      if (breakBefore) {
        cur = { kind: isHeading ? "h" : "p", text: line.text };
        blocks.push(cur);
        return;
      }
      if (/[A-Za-zÀ-ÿ]-$/.test(cur.text) && /^[a-zà-ÿ]/.test(line.text)) cur.text = cur.text.slice(0, -1) + line.text;
      else cur.text += " " + line.text;
    });
    textCache.set(num, blocks);
    return blocks;
  }

  // ================================================================ libro (EPUB / HTML / TXT)
  function layoutBook() {
    const container = pagesEl();
    container.className = "pages reflow";
    $("zoom-label").textContent = "Texto";
    const frag = document.createDocumentFragment();
    book.chapters.forEach((ch, i) => {
      const el = makeSection(i + 1, ch.title);
      const content = document.createElement("div");
      content.className = "reflow__content";
      content.append(...Array.from(ch.body.childNodes));
      el.appendChild(content);
      frag.appendChild(el);
      pageSlots.push({ el, num: i + 1, rendered: true, task: null });
    });
    container.appendChild(frag);
  }

  function onBookLinkClick(e) {
    const a = e.target.closest("a[data-chapter]");
    if (!a || !book) return;
    e.preventDefault();
    const idx = book.chapters.findIndex((c) => c.path === a.dataset.chapter);
    if (idx >= 0) goTo(idx + 1);
  }

  // ================================================================ navegación
  function trackScroll() {
    if (!pageSlots.length) return;
    const root = viewerEl().getBoundingClientRect();
    const mid = root.top + Math.min(root.height * 0.4, 300);
    let best = currentPage;
    for (const s of pageSlots) {
      const r = s.el.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) { best = s.num; break; }
      if (r.top > mid) { best = Math.max(1, s.num - 1); break; }
    }
    if (best !== currentPage) { currentPage = best; emit("page", currentPage); }
    emit("scroll");
  }

  // Bloques (párrafos, encabezados, imágenes) del capítulo: en libros son el ancla de la posición fina,
  // porque sobreviven a un cambio de ancho de ventana; en PDF no hay bloques y se usa la fracción de página.
  function blocksOf(slot) {
    const content = docType === "book" ? slot.el.querySelector(".reflow__content") : null;
    return content ? Array.from(content.children) : [];
  }

  // Posición de lectura exacta: unidad actual, índice del bloque que cruza la línea de lectura
  // (-1 si no hay bloques) y fracción recorrida de ese bloque. La fracción puede ser algo negativa
  // (la unidad "actual" se decide más abajo, en la línea del 40 %) para que al restaurar no se pierdan líneas.
  function position() {
    const slot = pageSlots[currentPage - 1];
    if (!slot) return { page: currentPage, block: -1, offset: 0 };
    const line = viewerEl().getBoundingClientRect().top + READ_LINE;
    const frac = (r) => Math.max(-1, Math.min(1, Math.round(((line - r.top) / (r.height || 1)) * 1000) / 1000));
    const blocks = blocksOf(slot);
    for (let i = 0; i < blocks.length; i++) {
      const r = blocks[i].getBoundingClientRect();
      if (r.height > 0 && r.bottom >= line) return { page: currentPage, block: i, offset: frac(r) };
    }
    return { page: currentPage, block: -1, offset: frac(slot.el.getBoundingClientRect()) };
  }

  // Aplica fn a todos los nodos de texto del libro en pantalla (solo libros: EPUB/HTML/TXT).
  function transformText(fn) {
    if (docType !== "book") return 0;
    const walker = document.createTreeWalker(pagesEl(), NodeFilter.SHOW_TEXT);
    let n = 0;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const next = fn(node.data);
      if (next !== node.data) { node.data = next; n++; }
    }
    return n;
  }

  // Marcador magenta en la línea de lectura: queda pegado al contenido (se desplaza con él)
  // y señala hasta dónde se había leído. Se oculta al remaquetar, porque las alturas cambian.
  function markPosition() {
    const v = viewerEl();
    let m = $("read-marker");
    if (!m) {
      m = document.createElement("div");
      m.id = "read-marker";
      m.className = "read-marker";
      m.setAttribute("aria-hidden", "true");
      v.appendChild(m);
    }
    if (!pageSlots.length) { m.hidden = true; return; }
    m.style.top = Math.round(v.scrollTop + READ_LINE) + "px";
    m.hidden = false;
  }
  function hideMarker() { const m = $("read-marker"); if (m) m.hidden = true; }

  // Desplaza al principio de la unidad n o, con pos {block, offset}, al punto exacto dentro de ella.
  function goTo(n, pos) {
    n = Math.max(1, Math.min(count(), Math.round(n) || 1));
    const slot = pageSlots[n - 1];
    if (!slot) return;
    const v = viewerEl();
    const anchor = (pos && pos.block >= 0 && blocksOf(slot)[pos.block]) || slot.el;
    const r = anchor.getBoundingClientRect();
    const top = r.top - v.getBoundingClientRect().top + v.scrollTop;
    v.scrollTop = top - READ_LINE + (pos ? (pos.offset || 0) * r.height : 0);
    const waitHeights = docType === "pdf" && mode === "page" && !heightsReady;
    pendingTarget = waitHeights ? n : null;
    pendingPos = waitHeights && pos ? { block: -1, offset: pos.offset || 0 } : null;
    currentPage = n;
    emit("page", n);
  }

  function setZoom(z) {
    if (docType !== "pdf" || mode !== "page") return;
    const keep = position();
    zoom = z;
    Settings.set("zoom", z);
    layout().then(() => goTo(keep.page, keep));
  }

  function zoomIn() {
    const s = zoom === "fit" ? scale : zoom;
    setZoom(ZOOM_STEPS.find((z) => z > s + 0.01) || ZOOM_STEPS[ZOOM_STEPS.length - 1]);
  }
  function zoomOut() {
    const s = zoom === "fit" ? scale : zoom;
    setZoom([...ZOOM_STEPS].reverse().find((z) => z < s - 0.01) || ZOOM_STEPS[0]);
  }

  function syncModeControls() {
    document.querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("is-active", b.dataset.mode === mode));
    const noZoom = mode === "text" || docType !== "pdf";
    $("btn-zoom-in").disabled = $("btn-zoom-out").disabled = $("btn-zoom-fit").disabled = noZoom;
  }

  function setMode(m) {
    if (docType !== "pdf" || m === mode) return;
    const keep = position();
    mode = m;
    Settings.set("mode", m);
    syncModeControls();
    layout().then(() => goTo(keep.page, keep));
  }

  function init() {
    mode = Settings.get("mode") || "page";
    zoom = Settings.get("zoom") || "fit";
    syncModeControls();
    let ticking = false;
    viewerEl().addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { trackScroll(); ticking = false; });
    });
    viewerEl().addEventListener("click", onBookLinkClick);
    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      if (docType !== "pdf" || !pdf || mode !== "page" || zoom !== "fit") return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { const keep = position(); layout().then(() => goTo(keep.page, keep)); }, 150);
    });
  }

  return {
    init, open, close, on, goTo, setZoom, zoomIn, zoomOut, setMode, sampleText, coverThumb, position, markPosition, transformText,
    get page() { return currentPage; },
    get author() { return book ? book.author || "" : ""; },
    get pages() { return count(); },
    get name() { return fileName; },
    get mode() { return docType === "pdf" ? mode : "text"; },
    get docType() { return docType; },
    get unit() { return unit(); },
    get loaded() { return !!pdf || !!book; },
    get heightsReady() { return heightsReady; },
  };
})();
