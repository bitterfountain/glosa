/* Arranque y cableado de la interfaz. */
window.App = (function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const t = (k, v) => I18n.t(k, v);
  const SUPPORTED = /\.(pdf|epub|html?|xhtml|txt)$/i;
  let toastTimer = 0;
  let positionKey = null;

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
  async function openFile(file) {
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
      $("page-input").value = "1";
      $("page-input").max = String(info.pages);
      setMenu(false);
      updateTitleBar();
      onBookReady(info, file);
      applyChineseSimplified();
      detectAndSwitch();
    } catch (err) {
      console.error(err);
      toast(t("toast.openError", { error: err.message || err }), 5000);
    }
  }

  // Al abrir un libro: se registra en la biblioteca y se vuelve al punto exacto donde se dejó
  // (unidad + bloque + fracción; los libros guardados antes solo traen la unidad).
  async function onBookReady(info, file) {
    positionKey = Library.idFor(file);
    const rec = await Library.add(file, { title: info.name, author: Viewer.author, docType: Viewer.docType, pages: info.pages });
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
    if (!positionKey) return;
    clearTimeout(positionTimer);
    positionTimer = setTimeout(flushPosition, POSITION_SAVE_DELAY);
  }
  function flushPosition() {
    clearTimeout(positionTimer);
    positionTimer = 0;
    if (!positionKey || !Viewer.loaded) return;
    const pos = Viewer.position();
    Library.updatePosition(positionKey, pos.page, { block: pos.block, offset: pos.offset });
    Viewer.markPosition();
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

  // Reabrir un libro de la biblioteca (el fichero vive en IndexedDB).
  async function openFromLibrary(rec) {
    Library.closeModal();
    const file = await Library.fileFor(rec);
    if (!file) {
      toast(t("lib.reselect", { title: rec.title }), 5000);
      $("file-input").click();
      return;
    }
    await openFile(file);
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
    $("book-title-pages").textContent = Viewer.page + " / " + Viewer.pages;
    el.hidden = false;
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
    $("page-input").addEventListener("change", (e) => Viewer.goTo(Number(e.target.value)));
    $("page-input").addEventListener("keydown", (e) => { if (e.key === "Enter") { Viewer.goTo(Number(e.target.value)); e.target.blur(); } });
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

    Viewer.on("page", (n) => { $("page-input").value = String(n); updateTitleBar(); });
    Dictionary.onChange(() => applyChineseSimplified());
    Viewer.on("scroll", schedulePositionSave);
    window.addEventListener("pagehide", flushPosition);
    document.addEventListener("visibilitychange", () => { if (document.hidden) flushPosition(); });

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
    Library.init({ onOpen: openFromLibrary });
    Langs.init();
    bind();
    { const p = Dictionary.PAIRS.find((x) => x.id === Settings.get("pair")); document.body.dataset.dst = p ? p.dst : ""; document.body.dataset.src = p ? p.src : ""; }
    await usePair(Settings.get("pair"));
    if (!Settings.get("langsChosen")) Langs.show({ firstRun: true });
  }

  document.addEventListener("DOMContentLoaded", init);
  return { toast, openFile };
})();
