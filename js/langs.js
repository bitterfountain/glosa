/* Idiomas: catálogo (nombre, bandera SVG), badge "bandera → bandera" de la barra y popup de selección
   (idioma de lectura / idioma al que traducir). Las banderas van en SVG propio: Windows no dibuja
   las banderas emoji. El destino por defecto sale del idioma del navegador. */
window.Langs = (function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const t = (k, v) => I18n.t(k, v);

  // Banderas simplificadas (viewBox 60×40). El inglés lleva la Union Jack.
  const FLAGS = {
    en: '<svg viewBox="0 0 60 40" aria-hidden="true"><rect width="60" height="40" fill="#012169"/><path d="M0 0 60 40M60 0 0 40" stroke="#fff" stroke-width="8"/><path d="M0 0 60 40M60 0 0 40" stroke="#C8102E" stroke-width="3"/><path d="M30 0v40M0 20h60" stroke="#fff" stroke-width="12"/><path d="M30 0v40M0 20h60" stroke="#C8102E" stroke-width="7"/></svg>',
    es: '<svg viewBox="0 0 60 40" aria-hidden="true"><rect width="60" height="40" fill="#AA151B"/><rect y="10" width="60" height="20" fill="#F1BF00"/></svg>',
    it: '<svg viewBox="0 0 60 40" aria-hidden="true"><rect width="20" height="40" fill="#009246"/><rect x="20" width="20" height="40" fill="#fff"/><rect x="40" width="20" height="40" fill="#CE2B37"/></svg>',
    de: '<svg viewBox="0 0 60 40" aria-hidden="true"><rect width="60" height="13.4" fill="#000"/><rect y="13.3" width="60" height="13.4" fill="#DD0000"/><rect y="26.6" width="60" height="13.4" fill="#FFCE00"/></svg>',
    zh: '<svg viewBox="0 0 60 40" aria-hidden="true"><rect width="60" height="40" fill="#DE2910"/><path d="M12 6l2.2 6.7h7l-5.7 4.1 2.2 6.7-5.7-4.1-5.7 4.1 2.2-6.7-5.7-4.1h7z" fill="#FFDE00"/><g fill="#FFDE00"><circle cx="24" cy="5" r="1.6"/><circle cx="28" cy="9.5" r="1.6"/><circle cx="28" cy="15.5" r="1.6"/><circle cx="24" cy="20" r="1.6"/></g></svg>',
    // Árabe: bandera de Marruecos (el lector para el que se añadió); el diccionario es árabe estándar.
    ar: '<svg viewBox="0 0 60 40" aria-hidden="true"><rect width="60" height="40" fill="#C1272D"/><path d="M30 12.5l2.9 8.9h9.4l-7.6 5.5 2.9 8.9-7.6-5.5-7.6 5.5 2.9-8.9-7.6-5.5h9.4z" fill="none" stroke="#006233" stroke-width="2.2"/></svg>',
  };
  // Nombre en el propio idioma: así cada lector reconoce el suyo sin traducir.
  const NAMES = { en: "English", es: "Español", it: "Italiano", de: "Deutsch", ar: "العربية", zh: "中文" };

  let srcSel = null;   // selección provisional dentro del popup
  let dstSel = null;

  function sources() { return [...new Set(Dictionary.PAIRS.filter((p) => !p.custom).map((p) => p.src))]; }
  function targets() { return [...new Set(Dictionary.PAIRS.filter((p) => !p.custom).map((p) => p.dst))]; }
  function pairFor(src, dst) { return Dictionary.PAIRS.find((p) => !p.custom && p.src === src && p.dst === dst); }
  function currentPair() { return Dictionary.PAIRS.find((p) => p.id === Settings.get("pair")) || Dictionary.PAIRS[0]; }

  function flag(code) {
    const span = document.createElement("span");
    span.className = "flag";
    span.innerHTML = FLAGS[code] || "";
    if (!FLAGS[code]) span.textContent = String(code || "?").toUpperCase();
    return span;
  }

  // Idioma al que traducir según el navegador: el primero de navigator.languages que tengamos como destino.
  function browserTarget() {
    const wanted = (navigator.languages || [navigator.language || ""]).map((l) => String(l).slice(0, 2).toLowerCase());
    const avail = targets();
    return wanted.find((l) => avail.includes(l)) || null;
  }

  // ---------------------------------------------------------------- badge de la barra
  function renderBadge() {
    const btn = $("pair-badge");
    if (!btn) return;
    const p = currentPair();
    btn.replaceChildren();
    const code = (c) => { const s = document.createElement("span"); s.className = "pair-badge__code"; s.textContent = c.toUpperCase(); return s; };
    const arrow = document.createElement("span");
    arrow.className = "pair-badge__arrow";
    arrow.textContent = "→";
    btn.append(flag(p.src), code(p.src), arrow, flag(p.dst), code(p.dst));
    btn.setAttribute("aria-label", t("langs.badge.title") + ": " + p.src.toUpperCase() + " → " + p.dst.toUpperCase());
  }

  // ---------------------------------------------------------------- popup
  function langButton(code, row) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "lang-btn";
    b.dataset.lang = code;
    b.dataset.row = row;
    const txt = document.createElement("span");
    const name = document.createElement("span");
    name.className = "lang-btn__name";
    name.textContent = NAMES[code] || code;
    const iso = document.createElement("span");
    iso.className = "lang-btn__code";
    iso.textContent = code.toUpperCase();
    txt.append(name, iso);
    b.append(flag(code), txt);
    return b;
  }

  function renderPicker() {
    const srcRow = $("langs-source");
    const dstRow = $("langs-target");
    srcRow.replaceChildren(...sources().map((c) => langButton(c, "source")));
    dstRow.replaceChildren(...targets().map((c) => langButton(c, "target")));
    syncPicker();
  }

  function syncPicker() {
    document.querySelectorAll("#langs-source .lang-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.lang === srcSel));
    document.querySelectorAll("#langs-target .lang-btn").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.lang === dstSel);
      b.disabled = b.dataset.lang === srcSel || !pairFor(srcSel, b.dataset.lang); // sin diccionario para ese par
    });
    const preview = $("langs-preview");
    preview.replaceChildren(flag(srcSel), document.createTextNode(" " + srcSel.toUpperCase() + " → "), flag(dstSel), document.createTextNode(" " + dstSel.toUpperCase()));
    $("langs-ok").disabled = !pairFor(srcSel, dstSel);
  }

  function pick(row, code) {
    if (row === "source") {
      srcSel = code;
      if (!pairFor(srcSel, dstSel)) dstSel = targets().find((d) => pairFor(srcSel, d)) || dstSel;
    } else {
      if (code === srcSel) return;
      dstSel = code;
    }
    syncPicker();
  }

  // Abre el popup. Si el lector aún no ha elegido, el destino sale del navegador.
  function show(opts) {
    opts = opts || {};
    const cur = currentPair();
    srcSel = cur.src;
    dstSel = cur.dst;
    const note = $("langs-note");
    note.hidden = true;
    if (opts.firstRun) {
      const fromBrowser = browserTarget();
      if (fromBrowser) {
        dstSel = fromBrowser;
        note.textContent = t("langs.detected", { lang: NAMES[fromBrowser] || fromBrowser });
        note.hidden = false;
      }
      if (srcSel === dstSel) srcSel = sources().find((s) => s !== dstSel) || srcSel;
    }
    renderPicker();
    if (window.Popup) Popup.hide();
    $("langs-modal").hidden = false;
    $("langs-ok").focus();
  }

  function close() { $("langs-modal").hidden = true; }
  function isOpen() { return !$("langs-modal").hidden; }

  function confirm() {
    const p = pairFor(srcSel, dstSel);
    if (!p) return;
    Settings.set("langsChosen", true);
    Settings.set("pair", p.id); // el listener de ajustes carga el diccionario y refresca el badge
    close();
  }

  function init() {
    $("pair-badge").addEventListener("click", () => show());
    $("langs-modal").addEventListener("click", (e) => {
      const b = e.target.closest(".lang-btn");
      if (b && !b.disabled) pick(b.dataset.row, b.dataset.lang);
    });
    $("langs-ok").addEventListener("click", confirm);
    document.querySelectorAll("[data-close-langs]").forEach((el) => el.addEventListener("click", () => {
      Settings.set("langsChosen", true); // cerrar sin elegir = quedarse con lo que hay, sin volver a preguntar
      close();
    }));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen()) { close(); e.stopPropagation(); } }, true);
    renderBadge();
  }

  return { init, show, close, isOpen, renderBadge, flag, browserTarget, NAMES };
})();
