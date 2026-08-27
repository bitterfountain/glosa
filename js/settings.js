/* Ajustes persistentes: par de idiomas, idioma de la interfaz, tema, fuente de lectura, opciones. */
window.Settings = (function () {
  "use strict";

  const KEY = "pdfr.settings";

  const FONTS = [
    { id: "georgia", label: "Georgia", css: 'Georgia, "Times New Roman", serif' },
    { id: "times", label: "Times New Roman", css: '"Times New Roman", Times, serif' },
    { id: "cambria", label: "Cambria", css: "Cambria, Georgia, serif" },
    { id: "palatino", label: "Palatino", css: '"Palatino Linotype", "Book Antiqua", Palatino, serif' },
    { id: "garamond", label: "Garamond", css: 'Garamond, "EB Garamond", "Times New Roman", serif' },
    { id: "system", label: "System (sans)", css: 'system-ui, "Segoe UI", Roboto, sans-serif' },
    { id: "segoe", label: "Segoe UI", css: '"Segoe UI", Tahoma, sans-serif' },
    { id: "arial", label: "Arial", css: "Arial, Helvetica, sans-serif" },
    { id: "calibri", label: "Calibri", css: "Calibri, Carlito, sans-serif" },
    { id: "verdana", label: "Verdana", css: "Verdana, Geneva, sans-serif" },
    { id: "consolas", label: "Consolas (mono)", css: 'Consolas, "Courier New", monospace' },
    { id: "literata", label: "Literata · Google Fonts", css: "Literata, Georgia, serif", google: "Literata:ital,opsz,wght@0,7..72,400;0,7..72,700;1,7..72,400" },
    { id: "merriweather", label: "Merriweather · Google Fonts", css: "Merriweather, Georgia, serif", google: "Merriweather:ital,wght@0,400;0,700;1,400" },
    { id: "lora", label: "Lora · Google Fonts", css: "Lora, Georgia, serif", google: "Lora:ital,wght@0,400;0,700;1,400" },
    { id: "atkinson", label: "Atkinson Hyperlegible · Google Fonts", css: '"Atkinson Hyperlegible", Arial, sans-serif', google: "Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400" },
  ];

  const DEFAULTS = {
    pair: "en-es",          // par de diccionario activo
    langsChosen: false,     // el lector ya pasó por el popup de idiomas (si no, se le enseña al arrancar)
    zhSimplified: true,     // libros en chino: mostrar en caracteres simplificados
    autoDetect: true,       // detectar idioma del libro y cambiar de par
    uiLang: "auto",         // auto (idioma del lector = destino del par) | es | en
    theme: "dark",
    invertPdf: true,
    font: "georgia",
    fontSize: 18,
    lineHeight: 1.6,
    measure: 70,
    align: "left",
    online: true,
    speak: false,
    mode: "page",
    zoom: "fit",
  };

  let state = Object.assign({}, DEFAULTS);
  const listeners = [];
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const $ = (id) => document.getElementById(id);

  function loadState() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) state = Object.assign({}, DEFAULTS, JSON.parse(raw));
    } catch (_) { /* sin almacenamiento: estado por defecto */ }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) { /* ignorar */ }
  }

  function get(key) { return state[key]; }

  function set(key, value) {
    if (state[key] === value) return;
    state = Object.assign({}, state, { [key]: value });
    save();
    apply();
    listeners.forEach((fn) => fn(key, value, state));
  }

  function onChange(fn) { listeners.push(fn); }

  function effectiveTheme() {
    return state.theme === "auto" ? (media.matches ? "dark" : "light") : state.theme;
  }

  // Idioma de la interfaz según el navegador: el primero de navigator.languages que tengamos
  // traducido; si ninguno (francés, árabe...), inglés. Solo el navegador en español ve español sin elegirlo.
  function browserUiLang() {
    const wanted = (navigator.languages || [navigator.language || ""]).map((l) => String(l).slice(0, 2).toLowerCase());
    return wanted.find((l) => I18n.languages.includes(l)) || "en";
  }

  // Idioma de la interfaz: el del lector (destino del par, una vez elegido) salvo que lo fije a
  // mano; si el destino no tiene interfaz (árabe) o aún no ha elegido, el del navegador.
  function effectiveUiLang() {
    if (state.uiLang !== "auto") return state.uiLang;
    const pair = Dictionary.PAIRS.find((p) => p.id === state.pair);
    if (state.langsChosen && pair && I18n.languages.includes(pair.dst)) return pair.dst;
    return browserUiLang();
  }

  function ensureGoogleFont(font) {
    if (!font.google) return;
    const id = "gf-" + font.id;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=" + font.google + "&display=swap";
    document.head.appendChild(link);
  }

  function apply() {
    const root = document.documentElement;
    root.dataset.theme = effectiveTheme();
    root.dataset.invertPdf = state.invertPdf ? "1" : "0";
    const font = FONTS.find((f) => f.id === state.font) || FONTS[0];
    ensureGoogleFont(font);
    root.style.setProperty("--font-read", font.css);
    root.style.setProperty("--read-size", state.fontSize + "px");
    root.style.setProperty("--read-lh", String(state.lineHeight));
    root.style.setProperty("--read-measure", state.measure + "ch");
    root.style.setProperty("--read-align", state.align);
    if (I18n.lang !== effectiveUiLang()) I18n.setLang(effectiveUiLang());
    syncControls();
  }

  function fillPairSelects() {
    ["opt-pair"].forEach((id) => {
      const sel = $(id);
      if (!sel) return;
      sel.replaceChildren();
      Dictionary.PAIRS.forEach((p) => {
        const o = document.createElement("option");
        o.value = p.id;
        o.textContent = p.name;
        sel.appendChild(o);
      });
      sel.value = state.pair;
    });
  }

  function syncControls() {
    document.querySelectorAll("#theme-seg .segmented__btn").forEach((b) => b.classList.toggle("is-active", b.dataset.theme === state.theme));
    document.querySelectorAll("#align-seg .segmented__btn").forEach((b) => b.classList.toggle("is-active", b.dataset.align === state.align));
    const setVal = (id, v) => { const el = $(id); if (el) el.value = v; };
    const setChk = (id, v) => { const el = $(id); if (el) el.checked = v; };
    setChk("opt-invert", state.invertPdf);
    setChk("opt-online", state.online);
    setChk("opt-speak", state.speak);
    setChk("opt-autodetect", state.autoDetect);
    setChk("opt-zh-simplified", state.zhSimplified);
    setVal("opt-font", state.font);
    setVal("opt-uilang", state.uiLang);
    setVal("opt-pair", state.pair);
    setVal("opt-font-size", state.fontSize);
    setVal("opt-line-height", state.lineHeight);
    setVal("opt-measure", state.measure);
    if ($("font-size-label")) $("font-size-label").textContent = state.fontSize + " px";
    if ($("line-height-label")) $("line-height-label").textContent = Number(state.lineHeight).toFixed(1);
    if ($("measure-label")) $("measure-label").textContent = state.measure + " " + I18n.t("settings.measure.unit");
  }

  function bindControls() {
    const sel = $("opt-font");
    FONTS.forEach((f) => {
      const o = document.createElement("option");
      o.value = f.id; o.textContent = f.label; o.style.fontFamily = f.css;
      sel.appendChild(o);
    });
    fillPairSelects();
    sel.addEventListener("change", () => set("font", sel.value));
    $("opt-font-size").addEventListener("input", (e) => set("fontSize", Number(e.target.value)));
    $("opt-line-height").addEventListener("input", (e) => set("lineHeight", Number(e.target.value)));
    $("opt-measure").addEventListener("input", (e) => set("measure", Number(e.target.value)));
    $("opt-invert").addEventListener("change", (e) => set("invertPdf", e.target.checked));
    $("opt-online").addEventListener("change", (e) => set("online", e.target.checked));
    $("opt-speak").addEventListener("change", (e) => set("speak", e.target.checked));
    $("opt-autodetect").addEventListener("change", (e) => set("autoDetect", e.target.checked));
    $("opt-zh-simplified").addEventListener("change", (e) => set("zhSimplified", e.target.checked));
    $("opt-uilang").addEventListener("change", (e) => set("uiLang", e.target.value));
    $("opt-pair").addEventListener("change", (e) => set("pair", e.target.value));
    $("theme-seg").addEventListener("click", (e) => {
      const b = e.target.closest("[data-theme]");
      if (b) set("theme", b.dataset.theme);
    });
    $("align-seg").addEventListener("click", (e) => {
      const b = e.target.closest("[data-align]");
      if (b) set("align", b.dataset.align);
    });
    media.addEventListener("change", () => { if (state.theme === "auto") apply(); });
  }

  function toggleTheme() {
    set("theme", effectiveTheme() === "dark" ? "light" : "dark");
  }

  function init() {
    loadState();
    if (!Dictionary.PAIRS.some((p) => p.id === state.pair)) state.pair = DEFAULTS.pair;
    bindControls();
    apply();
  }

  return { init, get, set, onChange, toggleTheme, effectiveTheme, effectiveUiLang, fillPairSelects, FONTS };
})();
