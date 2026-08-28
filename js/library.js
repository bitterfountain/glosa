/* Biblioteca: índice de libros abiertos y posición de lectura en localStorage (pdfr.library);
   el fichero de cada libro se guarda aparte en IndexedDB (localStorage solo admite texto y ~5 MB).
   Cada libro lleva una CLAVE por origen (rec.key), estable entre dispositivos, que es la identidad que
   viaja al servidor cuando hay sesión: gb:<id> (Gutenberg), ws:<idioma>:<título> (Wikisource),
   drive:<fileId> (Google Drive) o local:<nombre>:<tamaño>. rec.id es la identidad local (clave del
   fichero en IndexedDB): coincide con rec.key en los libros nuevos; los antiguos conservan "nombre:tamaño". */
window.Library = (function () {
  "use strict";

  const KEY = "pdfr.library";
  const DB_NAME = "glosa";
  const STORE = "files";
  const RECENT_MAX = 6;
  const $ = (id) => document.getElementById(id);
  const t = (k, v) => I18n.t(k, v);
  let items = [];
  let dbPromise = null;
  let onOpen = null;
  let onChange = null;  // (evento, registro): "add" | "position" | "remove"; lo escucha js/sync.js

  // ---------------------------------------------------------------- índice (localStorage)
  // Varias pestañas comparten el índice: antes de escribir se RELEE de localStorage y se cambia solo el
  // registro afectado, para que una pestaña vieja no pise lo que las demás han guardado.
  let lastRaw = null;
  // Devuelve true si el índice guardado cambió desde la última lectura.
  function load() {
    let raw = "[]";
    try { raw = localStorage.getItem(KEY) || "[]"; } catch (_) { /* sin almacenamiento */ }
    const changed = raw !== lastRaw;
    lastRaw = raw;
    try { items = JSON.parse(raw); } catch (_) { items = []; }
    if (!Array.isArray(items)) items = [];
    return changed;
  }

  // Guarda el índice. Si localStorage está lleno, descarta los libros leídos hace
  // más tiempo (y su fichero en IndexedDB) hasta que quepa.
  function persist() {
    for (let attempt = 0; attempt < 50; attempt++) {
      try {
        lastRaw = JSON.stringify(items);
        localStorage.setItem(KEY, lastRaw);
        return;
      } catch (err) {
        if (items.length <= 1) { console.warn("Biblioteca: no se pudo guardar el índice", err); return; }
        const oldest = sorted()[items.length - 1];
        items = items.filter((i) => i.id !== oldest.id);
        deleteFile(oldest.id);
        console.warn("Biblioteca llena: se descarta «" + oldest.title + "»");
      }
    }
  }

  // Origen de un libro: { kind: "local" | "gutenberg" | "wikisource" | "drive", ref }.
  const LOCAL = { kind: "local", ref: "" };
  function keyFor(file, source) {
    const src = source || LOCAL;
    switch (src.kind) {
      case "gutenberg": return "gb:" + src.ref;
      case "wikisource": return "ws:" + src.ref;
      case "drive": return "drive:" + src.ref;
      default: return "local:" + file.name + ":" + file.size;
    }
  }
  // Identidad local del libro que se abriría con este fichero y origen: la del registro que ya exista
  // (por clave, o por el id antiguo "nombre:tamaño" de un fichero local) o, si es nuevo, su clave.
  function idFor(file, source) {
    const key = keyFor(file, source);
    const isLocal = !source || source.kind === "local";
    const rec = items.find((i) => i.key === key) || (isLocal ? items.find((i) => i.id === file.name + ":" + file.size) : null);
    return rec ? rec.id : key;
  }
  function find(id) { return items.find((i) => i.id === id) || null; }
  function findByKey(key) { return items.find((i) => i.key === key) || null; }
  // Registros de antes de las claves por origen: eran todos ficheros locales.
  function migrate() {
    if (!items.some((i) => !i.key)) return;
    items = items.map((i) => (i.key ? i : Object.assign({}, i, { key: "local:" + i.name + ":" + i.size, source: LOCAL })));
    persist();
  }
  function sorted() { return items.slice().sort((a, b) => (b.lastOpened || 0) - (a.lastOpened || 0)); }

  // ---------------------------------------------------------------- ficheros (IndexedDB)
  function db() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) { reject(new Error("IndexedDB no disponible")); return; }
      const req = indexedDB.open(DB_NAME, 2);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  function fileTx(mode, fn) {
    return db().then((d) => new Promise((resolve, reject) => {
      const transaction = d.transaction(STORE, mode);
      const req = fn(transaction.objectStore(STORE));
      transaction.oncomplete = () => resolve(req ? req.result : undefined);
      transaction.onerror = () => reject(transaction.error);
    }));
  }

  async function saveFile(id, file) {
    try { await fileTx("readwrite", (s) => s.put(file, id)); return true; } catch (err) { console.warn("Biblioteca: no se pudo guardar el fichero", err); return false; }
  }

  async function fileFor(rec) {
    try {
      const blob = await fileTx("readonly", (s) => s.get(rec.id));
      if (!blob) return null;
      return blob instanceof File ? blob : new File([blob], rec.name, { type: blob.type || "" });
    } catch (_) { return null; }
  }

  async function deleteFile(id) {
    try { await fileTx("readwrite", (s) => s.delete(id)); } catch (_) { /* ignorar */ }
  }

  // ---------------------------------------------------------------- API
  // Registra (o actualiza) un libro recién abierto. El fichero se guarda la primera vez.
  // meta.source: origen del libro (por defecto, fichero local).
  async function add(file, meta) {
    load();
    const source = meta.source || LOCAL;
    const id = idFor(file, source);
    let rec = find(id);
    if (!rec) {
      rec = { id, key: keyFor(file, source), source, name: file.name, size: file.size, type: meta.docType, title: meta.title || file.name, author: meta.author || "", pages: meta.pages || 0, page: 1, added: Date.now(), cover: null, stored: false };
      items = [rec, ...items];
    }
    rec.key = rec.key || keyFor(file, source);
    rec.source = rec.source || source;
    rec.name = file.name;
    rec.size = file.size;
    rec.title = meta.title || rec.title;
    rec.pages = meta.pages || rec.pages;
    rec.type = meta.docType || rec.type;
    rec.lastOpened = Date.now();
    if (!rec.stored) rec.stored = await saveFile(id, file);
    persist();
    render();
    if (onChange) onChange("add", rec);
    return rec;
  }

  // Posición de lectura: unidad (página o capítulo) y, dentro de ella, bloque y fracción ({block, offset}).
  // Devuelve la marca de tiempo del guardado (posAt) si cambió algo, o 0 si ya estaba igual.
  function updatePosition(id, page, pos) {
    load();
    const rec = find(id);
    if (!rec) return 0;
    const prev = rec.pos || { block: -1, offset: 0 };
    const next = pos ? { block: pos.block, offset: pos.offset } : prev;
    if (rec.page === page && prev.block === next.block && prev.offset === next.offset) return 0;
    rec.page = page;
    rec.pos = next;
    rec.lastOpened = rec.posAt = Date.now();
    persist();
    if (onChange) onChange("position", rec);
    return rec.posAt;
  }

  // Aplica un registro llegado del servidor (js/sync.js). Crea el libro si no estaba (sin fichero ni
  // portada: se descargará de su origen al abrirlo) y, si estaba, adopta la posición cuando es más
  // nueva que la local. Devuelve true si cambió algo. No dispara onChange: lo que viene del servidor
  // no se vuelve a enviar.
  function applyRemote(remote) {
    load();
    if (!remote || !remote.key) return false;
    let rec = findByKey(remote.key);
    if (!rec) {
      rec = { id: remote.key, key: remote.key, source: remote.source || LOCAL, name: remote.name || "", size: remote.size || 0, type: remote.type || "epub", title: remote.title || remote.name || "?", author: remote.author || "", pages: remote.pages || 0, page: remote.page || 1, pos: remote.pos || null, added: remote.added || Date.now(), lastOpened: remote.lastOpened || 0, posAt: remote.posAt || 0, cover: null, stored: false };
      items = [rec, ...items];
      persist();
      render();
      return true;
    }
    const newer = (remote.posAt || 0) > (rec.posAt || 0);
    const laterOpen = (remote.lastOpened || 0) > (rec.lastOpened || 0);
    if (!newer && !laterOpen) return false;
    if (newer) { rec.page = remote.page || rec.page; rec.pos = remote.pos || rec.pos; rec.posAt = remote.posAt; }
    if (laterOpen) {
      // la misma regla que el servidor: los metadatos los pone quien lo abrió más tarde
      rec.lastOpened = remote.lastOpened;
      ["name", "size", "type", "title", "author", "pages"].forEach((f) => { if (remote[f]) rec[f] = remote[f]; });
    }
    if (!rec.pages && remote.pages) rec.pages = remote.pages;
    persist();
    render();
    return true;
  }

  // Quita un libro que otro dispositivo borró (sin avisar al servidor).
  async function removeLocal(key) {
    load();
    const rec = findByKey(key);
    if (!rec) return;
    items = items.filter((i) => i.id !== rec.id);
    persist();
    await deleteFile(rec.id);
    render();
  }

  // Todos los registros, listos para enviar al servidor (sin portada ni datos solo locales).
  function exportAll() {
    load();
    return items.map(toRemote);
  }
  function toRemote(r) {
    return { key: r.key, source: r.source || LOCAL, name: r.name, size: r.size || 0, type: r.type, title: r.title, author: r.author || "", pages: r.pages || 0, page: r.page || 1, pos: r.pos || null, added: r.added || 0, lastOpened: r.lastOpened || 0, posAt: r.posAt || 0 };
  }

  // Relee el índice de localStorage (otra pestaña puede haberlo cambiado) y repinta la estantería.
  function reload() {
    if (load()) render();
  }

  function setCover(id, dataUrl) {
    load();
    const rec = find(id);
    if (!rec || !dataUrl || rec.cover === dataUrl) return;
    rec.cover = dataUrl;
    persist();
    render();
  }

  async function remove(id) {
    load();
    const rec = find(id);
    items = items.filter((i) => i.id !== id);
    persist();
    await deleteFile(id);
    render();
    if (rec && onChange) onChange("remove", rec);
  }

  // ---------------------------------------------------------------- interfaz
  function fmtDate(ts) {
    if (!ts) return "";
    const diff = Date.now() - ts;
    if (diff < 60 * 60000) return t("lib.minutesAgo", { n: Math.max(1, Math.round(diff / 60000)) });
    if (diff < 24 * 3600000) return t("lib.hoursAgo", { n: Math.round(diff / 3600000) });
    return new Date(ts).toLocaleDateString(I18n.locale, { day: "numeric", month: "short", year: diff > 300 * 86400000 ? "numeric" : undefined });
  }

  function fmtSize(bytes) {
    return bytes > 1e6 ? (bytes / 1e6).toFixed(1) + " MB" : Math.round(bytes / 1e3) + " KB";
  }

  function card(rec, compact) {
    const el = document.createElement("div");
    el.className = "shelf-item" + (compact ? " shelf-item--compact" : "");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "shelf-item__main";
    btn.title = t("lib.openHint");
    if (rec.cover) {
      const img = document.createElement("img");
      img.className = "shelf-item__cover";
      img.src = rec.cover;
      img.alt = "";
      btn.appendChild(img);
    } else {
      const ph = document.createElement("span");
      ph.className = "shelf-item__cover shelf-item__cover--empty";
      ph.textContent = (rec.title || "?").slice(0, 1).toUpperCase();
      btn.appendChild(ph);
    }
    const meta = document.createElement("span");
    meta.className = "shelf-item__meta";
    const title = document.createElement("span");
    title.className = "shelf-item__title";
    title.textContent = rec.title;
    const sub = document.createElement("span");
    sub.className = "shelf-item__sub";
    const unit = t(rec.type === "pdf" ? "unit.page" : "unit.chapter");
    const pct = rec.pages ? Math.min(100, Math.round(((rec.page || 1) / rec.pages) * 100)) : 0;
    sub.textContent = [rec.author, rec.pages ? unit + " " + (rec.page || 1) + " / " + rec.pages : "", fmtDate(rec.lastOpened)].filter(Boolean).join(" · ");
    const bar = document.createElement("span");
    bar.className = "shelf-item__bar";
    const fill = document.createElement("span");
    fill.style.width = pct + "%";
    bar.appendChild(fill);
    const badge = document.createElement("span");
    badge.className = "shelf-item__type";
    const ext = (rec.name.match(/\.(pdf|epub|html?|xhtml|txt)$/i) || ["", rec.type === "pdf" ? "pdf" : "epub"])[1].toUpperCase();
    const kind = (rec.source && rec.source.kind) || "local";
    const origin = kind === "local" ? "" : " · " + t("source." + kind);
    // Sin fichero en este navegador: los de un origen remoto se vuelven a descargar al abrirlos; los locales no.
    const missing = rec.stored ? "" : " · " + t(kind === "local" ? "lib.notStored" : "lib.redownload");
    badge.textContent = ext + (compact || !rec.size ? "" : " · " + fmtSize(rec.size)) + origin + missing;
    meta.append(title, sub, bar, badge);
    btn.appendChild(meta);
    btn.addEventListener("click", () => onOpen && onOpen(rec));
    el.appendChild(btn);
    const del = document.createElement("button");
    del.type = "button";
    del.className = "btn btn--icon btn--sm shelf-item__del";
    del.title = t("lib.remove");
    del.innerHTML = '<svg viewBox="0 0 20 20"><path d="m5 5 10 10M15 5 5 15"/></svg>';
    del.addEventListener("click", (e) => { e.stopPropagation(); if (confirm(t("lib.confirmRemove", { title: rec.title }))) remove(rec.id); });
    el.appendChild(del);
    return el;
  }

  function render() {
    const list = sorted();
    $("recent-list").replaceChildren(...list.slice(0, RECENT_MAX).map((r) => card(r, true)));
    $("recent").hidden = list.length === 0;
    $("btn-continue").hidden = list.length === 0;
    $("library-list").replaceChildren(...list.map((r) => card(r, false)));
    $("library-empty").hidden = list.length > 0;
    $("library-usage").textContent = list.length ? t("lib.count", { n: list.length }) + " · " + fmtSize(list.reduce((n, r) => n + (r.size || 0), 0)) : "";
    const badge = $("library-count");
    badge.hidden = list.length === 0;
    badge.textContent = String(list.length);
  }

  function showModal() { render(); $("library-modal").hidden = false; }
  function closeModal() { $("library-modal").hidden = true; }
  function isOpen() { return !$("library-modal").hidden; }

  function init(opts) {
    onOpen = opts && opts.onOpen;
    onChange = opts && opts.onChange;
    load();
    migrate();
    // Cambios hechos desde otra pestaña: la estantería se pone al día sola.
    window.addEventListener("storage", (e) => { if (e.key === KEY) reload(); });
    $("btn-library").addEventListener("click", () => (isOpen() ? closeModal() : showModal()));
    $("btn-continue").addEventListener("click", showModal);
    document.querySelectorAll("[data-close-library]").forEach((el) => el.addEventListener("click", closeModal));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen()) { closeModal(); e.stopPropagation(); } }, true);
    render();
  }

  return { init, add, find, findByKey, updatePosition, reload, setCover, remove, removeLocal, applyRemote, exportAll, toRemote, fileFor, render, idFor, keyFor, showModal, closeModal };
})();
