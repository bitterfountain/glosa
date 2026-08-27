/* Vocabulario guardado (localStorage) y su panel. */
window.Vocab = (function () {
  "use strict";

  const KEY = "pdfr.vocab";
  let items = [];
  let onSelect = null;

  const $ = (id) => document.getElementById(id);

  function load() {
    try { items = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (_) { items = []; }
    if (!Array.isArray(items)) items = [];
  }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (_) { /* ignorar */ }
    render();
  }

  function has(lemma) {
    return items.some((i) => i.lemma === lemma);
  }

  function add(entry) {
    if (has(entry.lemma)) return false;
    items = [Object.assign({ ts: Date.now() }, entry), ...items];
    persist();
    return true;
  }

  function remove(lemma) {
    items = items.filter((i) => i.lemma !== lemma);
    persist();
  }

  function clear() {
    items = [];
    persist();
  }

  function toCsv() {
    const esc = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
    const rows = [["palabra", "lema", "traduccion", "libro", "pagina", "fecha"]];
    items.forEach((i) => rows.push([i.word, i.lemma, i.trans, i.book, i.page, new Date(i.ts).toISOString().slice(0, 10)]));
    return "﻿" + rows.map((r) => r.map(esc).join(";")).join("\r\n");
  }

  function exportCsv() {
    const blob = new Blob([toCsv()], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "vocabulario-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function render() {
    const list = $("vocab-list");
    const badge = $("vocab-count");
    if (!list) return;
    list.replaceChildren();
    $("vocab-empty").hidden = items.length > 0;
    badge.hidden = items.length === 0;
    badge.textContent = String(items.length);

    items.forEach((i) => {
      const li = document.createElement("li");
      li.className = "vocab-item";
      const word = document.createElement("span");
      word.className = "vocab-item__word";
      word.textContent = i.word;
      word.title = I18n.t("vocab.see");
      word.addEventListener("click", () => onSelect && onSelect(i.word));
      const trans = document.createElement("span");
      trans.className = "vocab-item__trans";
      trans.textContent = i.trans || "";
      const meta = document.createElement("span");
      meta.className = "vocab-item__meta";
      const unit = I18n.t(i.unit === "cap." ? "unit.chapter" : "unit.page");
      meta.textContent = [i.book, i.page ? unit + " " + i.page : ""].filter(Boolean).join(" · ");
      const del = document.createElement("button");
      del.className = "btn btn--icon btn--sm vocab-item__del";
      del.title = I18n.t("vocab.remove");
      del.innerHTML = '<svg viewBox="0 0 20 20"><path d="m5 5 10 10M15 5 5 15"/></svg>';
      del.addEventListener("click", () => remove(i.lemma));
      li.append(word, trans, meta, del);
      list.appendChild(li);
    });
  }

  function init(opts) {
    onSelect = opts && opts.onSelect;
    load();
    render();
    $("vocab-export").addEventListener("click", () => { if (items.length) exportCsv(); });
    $("vocab-clear").addEventListener("click", () => {
      if (items.length && confirm(I18n.t("vocab.confirmClear"))) clear();
    });
  }

  return { init, add, remove, has, render, count: () => items.length };
})();
