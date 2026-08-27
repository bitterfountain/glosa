/* Biblioteca: índice de libros abiertos y posición de lectura en localStorage (pdfr.library);
   el fichero de cada libro se guarda aparte en IndexedDB (localStorage solo admite texto y ~5 MB). */
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

  // ---------------------------------------------------------------- índice (localStorage)
  function load() {
    try { items = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (_) { items = []; }
    if (!Array.isArray(items)) items = [];
  }

  // Guarda el índice. Si localStorage está lleno, descarta los libros leídos hace
  // más tiempo (y su fichero en IndexedDB) hasta que quepa.
  function persist() {
    for (let attempt = 0; attempt < 50; attempt++) {
      try {
        localStorage.setItem(KEY, JSON.stringify(items));
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

  function idFor(file) { return file.name + ":" + file.size; }
  function find(id) { return items.find((i) => i.id === id) || null; }
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
  async function add(file, meta) {
    const id = idFor(file);
    let rec = find(id);
    if (!rec) {
      rec = { id, name: file.name, size: file.size, type: meta.docType, title: meta.title || file.name, author: meta.author || "", pages: meta.pages || 0, page: 1, added: Date.now(), cover: null, stored: false };
      items = [rec, ...items];
    }
    rec.title = meta.title || rec.title;
    rec.pages = meta.pages || rec.pages;
    rec.type = meta.docType || rec.type;
    rec.lastOpened = Date.now();
    if (!rec.stored) rec.stored = await saveFile(id, file);
    persist();
    render();
    return rec;
  }

  // Posición de lectura: unidad (página o capítulo) y, dentro de ella, bloque y fracción ({block, offset}).
  function updatePosition(id, page, pos) {
    const rec = find(id);
    if (!rec) return;
    const prev = rec.pos || { block: -1, offset: 0 };
    const next = pos ? { block: pos.block, offset: pos.offset } : prev;
    if (rec.page === page && prev.block === next.block && prev.offset === next.offset) return;
    rec.page = page;
    rec.pos = next;
    rec.lastOpened = Date.now();
    persist();
  }

  function setCover(id, dataUrl) {
    const rec = find(id);
    if (!rec || !dataUrl || rec.cover === dataUrl) return;
    rec.cover = dataUrl;
    persist();
    render();
  }

  async function remove(id) {
    items = items.filter((i) => i.id !== id);
    persist();
    await deleteFile(id);
    render();
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
    badge.textContent = ext + (compact ? "" : " · " + fmtSize(rec.size)) + (rec.stored ? "" : " · " + t("lib.notStored"));
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
    load();
    $("btn-library").addEventListener("click", () => (isOpen() ? closeModal() : showModal()));
    $("btn-continue").addEventListener("click", showModal);
    document.querySelectorAll("[data-close-library]").forEach((el) => el.addEventListener("click", closeModal));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen()) { closeModal(); e.stopPropagation(); } }, true);
    render();
  }

  return { init, add, find, updatePosition, setCover, remove, fileFor, render, idFor, showModal, closeModal };
})();
