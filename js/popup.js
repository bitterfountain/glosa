/* Popup de traducción: detecta la palabra pulsada, la resalta y muestra el resultado. */
window.Popup = (function () {
  "use strict";

  const WORD_CHAR = /[\p{L}\p{M}\p{N}'’’-]/u;
  const $ = (id) => document.getElementById(id);
  let current = null;        // {word, lemma, trans, page}
  let highlight = null;
  let requestId = 0;
  let openScrollTop = 0;     // scroll del visor al abrir: solo se cierra si el usuario se desplaza de verdad

  // ---------------------------------------------------------------- palabra bajo el puntero
  function caretAt(x, y) {
    if (document.caretPositionFromPoint) {
      const p = document.caretPositionFromPoint(x, y);
      return p ? { node: p.offsetNode, offset: p.offset } : null;
    }
    if (document.caretRangeFromPoint) {
      const r = document.caretRangeFromPoint(x, y);
      return r ? { node: r.startContainer, offset: r.startOffset } : null;
    }
    return null;
  }

  function wordAtPoint(x, y) {
    const c = caretAt(x, y);
    if (!c || !c.node || c.node.nodeType !== Node.TEXT_NODE) return null;
    const text = c.node.data;
    let s = c.offset, e = c.offset;
    while (s > 0 && WORD_CHAR.test(text[s - 1])) s--;
    while (e < text.length && WORD_CHAR.test(text[e])) e++;
    if (s === e) return null;
    // Chino: la "palabra" es el tramo que el diccionario reconoce alrededor del carácter pulsado.
    const seg = Dictionary.segmentAt(text, Math.min(c.offset, text.length - 1));
    if (seg) { s = seg.s; e = seg.e; }
    const range = document.createRange();
    range.setStart(c.node, s);
    range.setEnd(c.node, e);
    // El caret "salta" al texto más cercano: exige que el punto esté sobre la palabra.
    const rect = range.getBoundingClientRect();
    const pad = Math.max(6, rect.height * 0.5);
    if (x < rect.left - pad || x > rect.right + pad || y < rect.top - pad || y > rect.bottom + pad) return null;
    return { word: text.slice(s, e), range, rect };
  }

  function setHighlight(range) {
    if (!("highlights" in CSS) || typeof Highlight === "undefined") return;
    clearHighlight();
    highlight = new Highlight(range);
    CSS.highlights.set("pdfr-word", highlight);
  }
  function clearHighlight() {
    if ("highlights" in CSS) CSS.highlights.delete("pdfr-word");
    highlight = null;
  }

  // ---------------------------------------------------------------- render
  function renderLocal(res) {
    const body = document.createDocumentFragment();
    res.entries.forEach((entry) => {
      entry.s.forEach((sense) => {
        const div = document.createElement("div");
        div.className = "sense";
        if (entry.p) {
          const pos = document.createElement("span");
          pos.className = "sense__pos";
          pos.textContent = posLabel(entry.p) + (entry.lemma ? " · " + entry.lemma : "");
          div.appendChild(pos);
        }
        const tr = document.createElement("div");
        tr.className = "sense__trans";
        sense.t.forEach((t) => { const s = document.createElement("span"); s.textContent = t; tr.appendChild(s); });
        div.appendChild(tr);
        if (sense.d) {
          const d = document.createElement("p");
          d.className = "sense__def";
          d.textContent = sense.d;
          div.appendChild(d);
        }
        body.appendChild(div);
      });
    });
    return body;
  }

  // Códigos de categoría de los diccionarios (WikDict escribe "conjunction", Wiktionary "Conjunction") → clave de i18n,
  // para que la etiqueta salga en el idioma de la interfaz y no en inglés.
  const POS_ALIAS = { conjunction: "conj", preposition: "prep", pronoun: "pron", interjection: "int", determiner: "det", numeral: "num", phraseologicalUnit: "phrase" };
  function posLabel(p) {
    const key = "pos." + (POS_ALIAS[p] || p);
    const label = I18n.t(key);
    return label === key ? p : label;
  }

  // Resultado online: traducciones de Wiktionary por acepción (como las locales), la traducción de MyMemory
  // (siempre en frases; en palabras solo si Wiktionary no dio nada) y las definiciones en inglés. Si no hay
  // traducción de ningún tipo se dice claramente que lo que sigue es una definición en inglés.
  function renderOnline(res, meta, isPhrase) {
    const wrap = document.createElement("div");
    wrap.className = "popup__online";
    const label = (text) => {
      const l = document.createElement("div");
      l.className = "popup__online-label";
      l.textContent = text;
      wrap.appendChild(l);
    };
    const hasTranslation = res.senses.length > 0 || !!res.translation;
    if (res.senses.length) {
      label(I18n.t("popup.online") + " · Wiktionary");
      wrap.appendChild(renderLocal({ entries: res.senses }));
    }
    if (res.translation && (isPhrase || !res.senses.length)) {
      label(I18n.t("popup.online") + " · MyMemory");
      const p = document.createElement("div");
      p.className = "sense__trans popup__phrase";
      p.textContent = res.translation;
      wrap.appendChild(p);
    }
    if (res.defs.length) {
      label(hasTranslation ? "Wiktionary" : I18n.t("popup.defsOnly", { lang: I18n.t("lang." + meta.dst) }));
      res.defs.forEach((block) => {
        const div = document.createElement("div");
        div.className = "sense";
        const pos = document.createElement("span");
        pos.className = "sense__pos";
        pos.textContent = posLabel(block.pos || "");
        div.appendChild(pos);
        block.defs.forEach((d) => { const p = document.createElement("p"); p.className = "sense__def"; p.textContent = d; div.appendChild(p); });
        wrap.appendChild(div);
      });
    }
    return wrap;
  }

  // Lo que pasa al diccionario aprendido: las traducciones de Wiktionary tal cual o, si solo respondió
  // MyMemory, su traducción cuando es una palabra o expresión corta (una frase entera no es una entrada).
  function learnableEntries(res, isPhrase) {
    if (isPhrase) return null;
    if (res.senses.length) return res.senses;
    if (res.translation && res.translation.split(/\s+/).length <= 3) {
      const first = res.defs[0];
      const sense = { t: [res.translation] };
      if (first && first.defs[0]) sense.d = first.defs[0].slice(0, 300);
      return [{ p: first && /^[a-zA-Z]{0,24}$/.test(first.pos) ? first.pos : "", s: [sense], o: "mymemory" }];
    }
    return null;
  }

  function wikiLink(src, lemma) {
    const host = ({ es: "es.wiktionary.org", it: "it.wiktionary.org", de: "de.wiktionary.org" })[src] || "en.wiktionary.org";
    return "https://" + host + "/wiki/" + encodeURIComponent(lemma);
  }

  function originName(o) { return ({ wiktionary: "Wiktionary", mymemory: "MyMemory" })[o] || ""; }

  function firstTranslation(res) {
    for (const e of res.entries) for (const s of e.s) if (s.t.length) return s.t.slice(0, 3).join(", ");
    return "";
  }

  // ---------------------------------------------------------------- mostrar
  async function show(text, anchorRect, opts) {
    opts = opts || {};
    const popup = $("popup");
    const body = $("popup-body");
    const foot = $("popup-foot");
    const meta = Dictionary.meta() || { src: "en", dst: "es" };
    const id = ++requestId;
    const isPhrase = /\s/.test(text.trim());

    $("popup-word").textContent = text;
    $("popup-lemma").hidden = true;
    popup.classList.toggle("popup--rtl", meta.dst === "ar"); // traducciones en árabe: RTL y algo más grandes
    body.replaceChildren();
    foot.replaceChildren();
    popup.hidden = false;
    openScrollTop = $("viewer").scrollTop;
    position(popup, anchorRect);

    const local = isPhrase ? null : Dictionary.lookup(text);
    current = { word: text, lemma: local ? local.lemma : Dictionary.normalize(text), trans: "", page: Viewer.page };
    updateSaveState();

    if (local) {
      if (local.lemma !== local.word) {
        $("popup-lemma").textContent = I18n.t("popup.formOf", { lemma: local.lemma });
        $("popup-lemma").hidden = false;
      }
      body.appendChild(renderLocal(local));
      current.trans = firstTranslation(local);
      const origin = local.learned ? originName(local.entries[0] && local.entries[0].o) : "";
      const source = local.learned ? I18n.t("popup.learnedSource") + (origin ? " · " + origin : "") : (meta.name || I18n.t("popup.localSource"));
      addFoot(foot, source, wikiLink(meta.src, local.lemma));
    }

    if (Settings.get("speak") && !isPhrase && opts.autoSpeak !== false) speak(text);

    const needOnline = !local || isPhrase;
    if (!needOnline) { position(popup, anchorRect); return; }

    if (!Settings.get("online")) {
      const p = document.createElement("p");
      p.className = "popup__none";
      p.textContent = I18n.t(isPhrase ? "popup.phraseOffline" : "popup.noneOffline");
      body.appendChild(p);
      position(popup, anchorRect);
      return;
    }

    const loading = document.createElement("div");
    loading.className = "popup__loading";
    loading.textContent = I18n.t("popup.loading");
    body.appendChild(loading);
    position(popup, anchorRect);

    try {
      const res = await Dictionary.lookupOnline(text, meta.src || "en", meta.dst || "es");
      if (id !== requestId) return;
      loading.remove();
      const viaLemma = !isPhrase && res.formOf ? Dictionary.lookup(res.formOf) : null;
      if (viaLemma) {
        // Flexión o grafía antigua de una palabra que sí está en el diccionario ("houses", "spake"): se enseña
        // esa entrada y se aprende forma → lema para no volver a preguntar online.
        $("popup-lemma").textContent = I18n.t("popup.formOf", { lemma: viaLemma.lemma });
        $("popup-lemma").hidden = false;
        body.appendChild(renderLocal(viaLemma));
        current.lemma = viaLemma.lemma;
        current.trans = firstTranslation(viaLemma);
        updateSaveState();
        addFoot(foot, meta.name || I18n.t("popup.localSource"), wikiLink(meta.src, viaLemma.lemma));
        if (Dictionary.learn(text, null, viaLemma.lemma)) addFoot(foot, I18n.t("popup.learned"), null);
      } else {
        body.appendChild(renderOnline(res, meta, isPhrase));
        if (!current.trans) current.trans = firstTranslation({ entries: res.senses }) || res.translation || (res.defs[0] && res.defs[0].defs[0]) || "";
        addFoot(foot, "MyMemory · Wiktionary", null);
        const entries = learnableEntries(res, isPhrase);
        if (entries && Dictionary.learn(text, entries)) addFoot(foot, I18n.t("popup.learned"), null);
      }
    } catch (err) {
      if (id !== requestId) return;
      loading.remove();
      const p = document.createElement("p");
      p.className = "popup__none";
      p.textContent = I18n.t(navigator.onLine ? "popup.noResults" : "popup.noConnection");
      body.appendChild(p);
    }
    position(popup, anchorRect);
  }

  function addFoot(foot, label, link) {
    const s = document.createElement("span");
    s.textContent = label;
    foot.appendChild(s);
    if (link) {
      const a = document.createElement("a");
      a.className = "popup__link";
      a.href = link; a.target = "_blank"; a.rel = "noopener";
      a.textContent = "Wiktionary ↗";
      foot.appendChild(a);
    }
  }

  function position(popup, rect) {
    const margin = 8;
    const vw = window.innerWidth, vh = window.innerHeight;
    const w = popup.offsetWidth, h = popup.offsetHeight;
    let left = rect.left + rect.width / 2 - 36;
    left = Math.max(margin, Math.min(vw - w - margin, left));
    const below = rect.bottom + 12;
    const above = rect.top - h - 12;
    const useAbove = below + h > vh - margin && above > margin;
    popup.classList.toggle("popup--above", useAbove);
    popup.style.left = left + "px";
    popup.style.top = (useAbove ? above : Math.min(below, vh - h - margin)) + "px";
    const arrow = popup.querySelector(".popup__arrow");
    arrow.style.left = Math.max(14, Math.min(w - 26, rect.left + rect.width / 2 - left - 6)) + "px";
  }

  function hide() {
    const popup = $("popup");
    if (popup.hidden) return;
    popup.hidden = true;
    clearHighlight();
    requestId++;
    if (window.speechSynthesis) speechSynthesis.cancel();
  }

  function isOpen() { return !$("popup").hidden; }

  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    const meta = Dictionary.meta() || {};
    const u = new SpeechSynthesisUtterance(text);
    u.lang = { en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE", it: "it-IT", pt: "pt-PT", ar: "ar-SA", zh: "zh-CN" }[meta.src] || meta.src || "en-US";
    u.rate = 0.95;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }

  function updateSaveState() {
    const btn = $("popup-save");
    const saved = current && Vocab.has(current.lemma);
    btn.classList.toggle("is-saved", !!saved);
    btn.title = I18n.t(saved ? "popup.saved" : "popup.save");
    btn.style.color = saved ? "var(--accent)" : "";
  }

  function saveCurrent() {
    if (!current) return;
    if (Vocab.has(current.lemma)) { App.toast(I18n.t("toast.alreadySaved")); return; }
    Vocab.add({ word: current.word, lemma: current.lemma, trans: current.trans, book: Viewer.name, page: current.page, unit: Viewer.unit });
    updateSaveState();
    App.toast(I18n.t("toast.saved", { word: current.word }));
  }

  // ---------------------------------------------------------------- eventos
  function onViewerClick(e) {
    if (e.button !== 0) return;
    const inText = e.target.closest(".textLayer, .reflow__page");
    if (!inText || e.target.closest(".reflow__marker")) { hide(); return; }
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.toString().trim().length > 1) return; // lo gestiona onMouseUp
    const hit = wordAtPoint(e.clientX, e.clientY);
    if (!hit) { hide(); return; }
    setHighlight(hit.range);
    show(hit.word, hit.rect);
  }

  function onMouseUp() {
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      const text = sel.toString().replace(/\s+/g, " ").trim();
      if (text.length < 2 || text.length > 300 || !/\s/.test(text)) return;
      const range = sel.getRangeAt(0);
      if (!range.commonAncestorContainer.parentElement?.closest(".textLayer, .reflow__page")) return;
      clearHighlight();
      show(text, range.getBoundingClientRect(), { autoSpeak: false });
    }, 0);
  }

  function init() {
    const viewer = $("viewer");
    viewer.addEventListener("click", onViewerClick);
    viewer.addEventListener("mouseup", onMouseUp);
    $("popup-close").addEventListener("click", hide);
    $("popup-save").addEventListener("click", saveCurrent);
    $("popup-speak").addEventListener("click", () => current && speak(current.word));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen()) { hide(); e.stopPropagation(); } }, true);
    viewer.addEventListener("scroll", () => {
      if (isOpen() && Math.abs(viewer.scrollTop - openScrollTop) > 40) hide();
    }, { passive: true });
  }

  return { init, show, hide, isOpen, speak };
})();
