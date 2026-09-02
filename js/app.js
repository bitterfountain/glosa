/* Arranque y cableado de la interfaz. */
window.App = (function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const t = (k, v) => I18n.t(k, v);
  const SUPPORTED = /\.(pdf|epub|html?|xhtml|txt)$/i;
  let toastTimer = 0;
  let positionKey = null;
  let lastSavedAt = 0;   // posAt del último guardado hecho desde ESTA pestaña (o cargado al abrir)
  let lastScrollAt = 0;  // para no saltar mientras el lector se está desplazando aquí
  const TAB_SYNC_MS = 3000;

  function toast(msg, ms) {
    const el = $("toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, ms || 2200);
  }

  function describeDict() {
    const m = Dictionary.meta();
    if (!m) return t("dict.none");
    return (m.name || "—") + " · " + Number(m.entries || 0).toLocaleString(I18n.locale) + " " + t("dict.entries");
  }

  function refreshDictMeta() {
    $("dict-meta").textContent = describeDict();
    $("settings-dict-meta").textContent = describeDict();
  }

  // ---------------------------------------------------------------- diccionarios
  async function usePair(id, opts) {
    opts = opts || {};
    const pair = Dictionary.PAIRS.find((p) => p.id === id);
    try {
      await Dictionary.use(id);
    } catch (err) {
      console.error(err);
      toast(t("toast.dictError", { name: pair ? pair.name : id }), 4000);
      return false;
    }
    refreshDictMeta();
    if (opts.announce) toast(opts.announce, 3500);
    return true;
  }

  async function loadDictionaryFile(file) {
    const text = await file.text();
    let obj = null;
    try {
      obj = JSON.parse(text);
    } catch (_) {
      const m = text.match(/=\s*(\{[\s\S]*\})\s*;?\s*$/); // formato .js: window.PDFR_DICTS["x-y"] = {...};
      if (m) obj = JSON.parse(m[1]);
    }
    if (!obj) throw new Error("JSON");
    const meta = Dictionary.useCustom(obj);
    Settings.fillPairSelects();
    Settings.set("pair", Dictionary.currentId());
    refreshDictMeta();
    toast(t("toast.dictLoaded", { name: meta.name || Dictionary.currentId() }));
  }

  // Chino: si el lector lo quiere en simplificado, se convierte el libro en pantalla (los clásicos de
  // Gutenberg vienen en tradicional). Se aplica al cargar el diccionario chino y al abrir el libro.
  function applyChineseSimplified() {
    const m = Dictionary.meta();
    if (!m || m.src !== "zh" || !Settings.get("zhSimplified") || !Viewer.loaded) return;
    Viewer.transformText(Dictionary.toSimplified);
  }

  // Detecta el idioma del libro y, si procede, cambia el par de diccionario.
  async function detectAndSwitch() {
    if (!Settings.get("autoDetect")) return;
    const text = await Viewer.sampleText(6000);
    const lang = Dictionary.detectLanguage(text);
    if (!lang) return;
    const current = Dictionary.PAIRS.find((p) => p.id === Settings.get("pair"));
    if (current && current.src === lang) return;
    // Del idioma detectado, el par que traduce al mismo idioma que ya usaba el lector.
    const target = Dictionary.PAIRS.find((p) => p.src === lang && !p.custom && current && p.dst === current.dst)
      || Dictionary.PAIRS.find((p) => p.src === lang && !p.custom);
    if (!target) return;
    Settings.set("pair", target.id); // el listener de ajustes carga el diccionario
    toast(t("toast.detected", { lang: t("lang." + lang), pair: target.src.toUpperCase() + " → " + target.dst.toUpperCase() }), 4000);
  }

  // ---------------------------------------------------------------- abrir libro
  // source: origen del libro ({ kind, ref }, ver js/library.js); sin él, fichero local.
  async function openFile(file, source) {
    if (!file) return;
    if (!SUPPORTED.test(file.name) && file.type !== "application/pdf") { toast(t("toast.unsupported")); return; }
    Popup.hide();
    closeDrawers();
    toast(t("toast.opening", { name: file.name }), 4000);
    flushPosition();      // la del libro que se cierra, antes de que el visor cambie
    positionKey = null;   // hasta que el nuevo esté registrado no se guarda nada
    try {
      const info = await Viewer.open(file);
      document.title = Viewer.name + " · Glosa";
      setMenu(false);
      updateTitleBar();
      onBookReady(info, file, source);
      applyChineseSimplified();
      detectAndSwitch();
    } catch (err) {
      console.error(err);
      toast(t("toast.openError", { error: err.message || err }), 5000);
    }
  }

  // Al abrir un libro: se registra en la biblioteca y se vuelve al punto exacto donde se dejó
  // (unidad + bloque + fracción; los libros guardados antes solo traen la unidad).
  async function onBookReady(info, file, source) {
    const rec = await Library.add(file, { title: info.name, author: Viewer.author, docType: Viewer.docType, pages: info.pages, source });
    positionKey = rec.id;
    lastSavedAt = rec.posAt || 0;
    const pos = rec.pos || null;
    const hasProgress = rec.page > 1 || (pos && (pos.block > 0 || pos.offset > 0));
    if (hasProgress && rec.page <= info.pages) {
      const key = info.unit === "cap." ? "toast.resumeChapter" : "toast.resumePage";
      setTimeout(() => { resumeAt(rec.page, pos); toast(t(key, { n: rec.page })); }, 250);
    }
    if (!rec.cover) Viewer.coverThumb().then((dataUrl) => { if (dataUrl) Library.setCover(rec.id, dataUrl); }).catch(() => {});
  }

  // Vuelve al punto guardado y lo reafirma cuando la página termina de asentarse (fuente web que
  // carga tarde, imágenes de un EPUB): si el contenido se remaqueta después del primer salto, el
  // scroll se quedaría en otro sitio. Se deja de insistir en cuanto el usuario toca algo.
  const RESUME_RECHECK_MS = 700;
  function resumeAt(page, pos) {
    const key = positionKey;
    let touched = false;
    const TOUCH_EVENTS = ["wheel", "touchstart", "keydown", "pointerdown"];
    const touch = () => { touched = true; };
    TOUCH_EVENTS.forEach((ev) => window.addEventListener(ev, touch, { passive: true }));
    const apply = () => {
      if (touched || positionKey !== key || !Viewer.loaded) return;
      Viewer.goTo(page, pos);
      Viewer.markPosition();
    };
    apply();
    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    fontsReady.then(() => requestAnimationFrame(apply)).catch(() => {});
    setTimeout(() => { apply(); TOUCH_EVENTS.forEach((ev) => window.removeEventListener(ev, touch)); }, RESUME_RECHECK_MS);
  }

  // La posición se guarda con retardo (el scroll dispara decenas de eventos por segundo)
  // y se vuelca sin esperar al cerrar o esconder la pestaña.
  const POSITION_SAVE_DELAY = 400;
  let positionTimer = 0;
  function schedulePositionSave() {
    lastScrollAt = Date.now();
    if (!positionKey) return;
    clearTimeout(positionTimer);
    positionTimer = setTimeout(flushPosition, POSITION_SAVE_DELAY);
  }
  function flushPosition() {
    clearTimeout(positionTimer);
    positionTimer = 0;
    if (!positionKey || !Viewer.loaded) return;
    const pos = Viewer.position();
    const at = Library.updatePosition(positionKey, pos.page, { block: pos.block, offset: pos.offset }, Viewer.progress);
    if (at) lastSavedAt = at;
    Viewer.markPosition();
  }

  // Al volver a esta pestaña: si otra guardó el libro más adelante (o más atrás), se salta a ese punto.
  // Solo si el guardado es posterior al último de esta pestaña; así una pestaña vieja no se lleva a la nueva.
  function syncFromOtherTabs() {
    if (!positionKey || !Viewer.loaded) return;
    Library.reload();
    const rec = Library.find(positionKey);
    if (!rec || !rec.posAt || rec.posAt <= lastSavedAt) return;
    lastSavedAt = rec.posAt;
    const cur = Viewer.position();
    const pos = rec.pos || null;
    const same = cur.page === rec.page && pos && cur.block === pos.block && Math.abs(cur.offset - pos.offset) < 0.02;
    if (same) return;
    resumeAt(rec.page, pos);
    toast(t("toast.syncedTab", { n: rec.page }), 3500);
  }

  // Volver a la portada: guarda la posición, cierra el libro y enseña la pantalla de inicio.
  async function goHome() {
    if (!Viewer.loaded) { setMenu(false); return; }
    flushPosition();
    positionKey = null;
    Popup.hide();
    closeDrawers();
    setMenu(false);
    await Viewer.close();
    document.title = t("app.title");
    updateTitleBar();
    Library.render();
  }

  // Reabrir un libro de la biblioteca: el fichero vive en IndexedDB; si no está (otro dispositivo,
  // datos borrados), los de un origen remoto se vuelven a descargar y los locales se piden al lector.
  async function openFromLibrary(rec) {
    Library.closeModal();
    let file = await Library.fileFor(rec);
    const source = rec.source || { kind: "local", ref: "" };
    if (!file && source.kind !== "local") {
      toast(t("catalog.downloading", { title: rec.title }), 6000);
      try {
        file = await fetchFromSource(source, rec);
      } catch (err) {
        console.error(err);
        toast(t("catalog.openError", { title: rec.title }), 4000);
        return;
      }
    }
    if (!file) {
      // Sin confirm, el selector del sistema aparece "de la nada" (el toast queda tapado debajo).
      if (confirm(t("lib.reselect", { title: rec.title }))) $("file-input").click();
      return;
    }
    await openFile(file, source);
  }

  // Descarga un libro de su origen remoto (Gutenberg/Wikisource vía el catálogo, Drive vía js/drive.js).
  function fetchFromSource(source, rec) {
    if (source.kind === "drive") {
      if (!window.Drive) throw new Error("Drive no disponible");
      return Drive.fetchFile(source.ref, rec.name);
    }
    return Catalog.fetchBook(source, rec);
  }

  // ---------------------------------------------------------------- menú móvil y título
  function setMenu(open) {
    if (open) Popup.hide();
    document.body.classList.toggle("menu-open", open);
    $("btn-menu").setAttribute("aria-expanded", open ? "true" : "false");
  }

  function updateTitleBar() {
    const el = $("book-title");
    if (!Viewer.loaded) { el.hidden = true; return; }
    $("book-title-text").textContent = Viewer.name;
    el.hidden = false;
    updateProgress();
  }

  // Barra de progreso del toolbar (y % del titulillo móvil): fracción leída según el scroll real,
  // no la página/capítulo, que apenas cambia mientras se lee.
  function updateProgress() {
    if (!Viewer.loaded) return;
    const pct = Math.round(Viewer.progress * 100);
    $("read-progress-fill").style.width = pct + "%";
    $("read-progress-pct").textContent = pct + "%";
    const bar = $("read-progress");
    bar.setAttribute("aria-valuenow", String(pct));
    bar.setAttribute("aria-label", t("progress.title"));
    bar.title = t("progress.title") + " · " + Viewer.page + " / " + Viewer.pages + " " + t(Viewer.unit === "cap." ? "unit.chapter" : "unit.page");
    $("book-title-pages").textContent = pct + "%";
    $("title-progress-fill").style.width = pct + "%";
  }

  // ---------------------------------------------------------------- paneles
  function toggleDrawer(id) {
    const el = $(id);
    const open = el.hidden;
    Popup.hide();
    document.querySelectorAll(".drawer").forEach((d) => { d.hidden = true; });
    el.hidden = !open;
    window.dispatchEvent(new Event("resize"));
  }

  function closeDrawers() {
    document.querySelectorAll(".drawer").forEach((d) => { d.hidden = true; });
    window.dispatchEvent(new Event("resize"));
  }

  // ---------------------------------------------------------------- eventos
  function bind() {
    const fileInput = $("file-input");
    $("btn-open").addEventListener("click", () => fileInput.click());
    $("btn-home").addEventListener("click", goHome);
    $("brand-home").addEventListener("click", goHome);
    $("btn-catalog").addEventListener("click", () => {
      const p = Dictionary.PAIRS.find((x) => x.id === Settings.get("pair"));
      closeDrawers();
      setMenu(false);
      Catalog.show(p ? p.src : "en");
    });
    $("btn-open-empty").addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => { openFile(fileInput.files[0]); fileInput.value = ""; });

    $("btn-prev").addEventListener("click", () => Viewer.goTo(Viewer.page - 1));
    $("btn-next").addEventListener("click", () => Viewer.goTo(Viewer.page + 1));
    $("read-progress").addEventListener("click", (e) => {
      if (e.target.closest(".read-progress__pct")) return; // el número no es zona de salto
      const r = $("read-progress").querySelector(".read-progress__track").getBoundingClientRect();
      Viewer.seek((e.clientX - r.left) / r.width);
    });
    $("btn-zoom-in").addEventListener("click", Viewer.zoomIn);
    $("btn-zoom-out").addEventListener("click", Viewer.zoomOut);
    $("btn-zoom-fit").addEventListener("click", () => Viewer.setZoom("fit"));
    document.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => Viewer.setMode(b.dataset.mode)));

    $("btn-theme").addEventListener("click", Settings.toggleTheme);
    $("btn-vocab").addEventListener("click", () => toggleDrawer("vocab-drawer"));
    $("btn-settings").addEventListener("click", () => toggleDrawer("settings-drawer"));
    document.querySelectorAll("[data-close-drawer]").forEach((b) => b.addEventListener("click", () => { $(b.dataset.closeDrawer).hidden = true; window.dispatchEvent(new Event("resize")); }));

    $("btn-load-dict").addEventListener("click", () => $("dict-input").click());
    $("dict-input").addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (f) loadDictionaryFile(f).catch((err) => toast(t("toast.dictInvalid", { error: err.message })));
      e.target.value = "";
    });

    $("search-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const q = $("search-input").value.trim();
      if (!q) return;
      Popup.show(q, $("search-form").getBoundingClientRect(), { autoSpeak: false });
    });

    Settings.onChange((key, value) => {
      if (key === "pair" && !String(value).startsWith("custom:")) usePair(value);
      if (key === "pair" || key === "uiLang") { refreshDictMeta(); Vocab.render(); Langs.renderBadge(); }
      if (key === "zhSimplified" && value) applyChineseSimplified();
      if (key === "pair") { const p = Dictionary.PAIRS.find((x) => x.id === value); document.body.dataset.dst = p ? p.dst : ""; document.body.dataset.src = p ? p.src : ""; }
    });

    Viewer.on("page", updateTitleBar);
    Dictionary.onChange(() => applyChineseSimplified());
    Viewer.on("scroll", () => { schedulePositionSave(); updateProgress(); });
    window.addEventListener("pagehide", flushPosition);
    document.addEventListener("visibilitychange", () => { if (document.hidden) flushPosition(); else syncFromOtherTabs(); });
    window.addEventListener("focus", syncFromOtherTabs);
    // Red extra (dos ventanas a la vez, navegadores que no avisan al cambiar de pestaña): cada pocos
    // segundos, si esta pestaña está visible y quieta, se mira si otra guardó una posición más nueva.
    setInterval(() => { if (!document.hidden && Date.now() - lastScrollAt > TAB_SYNC_MS) syncFromOtherTabs(); }, TAB_SYNC_MS);

    // Menú hamburguesa (móvil): se cierra al elegir una acción o al tocar fuera.
    $("btn-menu").addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
    $("toolbar-groups").addEventListener("click", (e) => {
      if (e.target.closest("button") && !e.target.closest("#btn-prev, #btn-next, #btn-zoom-in, #btn-zoom-out, #btn-zoom-fit")) setMenu(false);
    });
    $("viewer").addEventListener("pointerdown", () => setMenu(false), { passive: true });

    let dragDepth = 0;
    window.addEventListener("dragenter", (e) => { if (hasFiles(e)) { dragDepth++; $("dropzone").hidden = false; } });
    window.addEventListener("dragleave", () => { if (--dragDepth <= 0) { dragDepth = 0; $("dropzone").hidden = true; } });
    window.addEventListener("dragover", (e) => { if (hasFiles(e)) e.preventDefault(); });
    window.addEventListener("drop", (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth = 0;
      $("dropzone").hidden = true;
      openFile(e.dataTransfer.files[0]);
    });

    document.addEventListener("keydown", (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "select" || tag === "textarea" || e.ctrlKey || e.metaKey || e.altKey) return;
      switch (e.key) {
        case "ArrowLeft": case "PageUp": if (Viewer.loaded) { Viewer.goTo(Viewer.page - 1); e.preventDefault(); } break;
        case "ArrowRight": case "PageDown": if (Viewer.loaded) { Viewer.goTo(Viewer.page + 1); e.preventDefault(); } break;
        case "+": case "=": if (Viewer.loaded) Viewer.zoomIn(); break;
        case "-": if (Viewer.loaded) Viewer.zoomOut(); break;
        case "t": case "T": if (Viewer.loaded && Viewer.docType === "pdf") Viewer.setMode(Viewer.mode === "page" ? "text" : "page"); break;
        case "d": case "D": Settings.toggleTheme(); break;
        case "o": case "O": fileInput.click(); break;
        case "Escape": closeDrawers(); setMenu(false); break;
        default: return;
      }
    });
  }

  function hasFiles(e) {
    return e.dataTransfer && Array.from(e.dataTransfer.types || []).includes("Files");
  }

  async function init() {
    Settings.init();
    I18n.apply();
    Vocab.init({ onSelect: (word) => Popup.show(word, $("vocab-drawer").getBoundingClientRect(), { autoSpeak: false }) });
    Viewer.init();
    Popup.init();
    Catalog.init();
    Library.init({ onOpen: openFromLibrary, onChange: (ev, rec) => { if (window.Sync) Sync.onLibraryChange(ev, rec); } });
    Langs.init();
    bind();
    // Después de bind(): así, al cerrar la pestaña, la posición se guarda antes de que Sync la envíe.
    Sync.init();
    Drive.init();
    Auth.init();
    { const p = Dictionary.PAIRS.find((x) => x.id === Settings.get("pair")); document.body.dataset.dst = p ? p.dst : ""; document.body.dataset.src = p ? p.src : ""; }
    await usePair(Settings.get("pair"));
    if (!Settings.get("langsChosen")) Langs.show({ firstRun: true });
  }

  document.addEventListener("DOMContentLoaded", init);
  return { toast, openFile, syncPosition: syncFromOtherTabs };
})();
