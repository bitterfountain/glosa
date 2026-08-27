/* Cargador de HTML y TXT sueltos: devuelve capítulos con la misma forma que EpubLoader. */
window.TextDoc = (function () {
  "use strict";

  const MIN_CHAPTERS_TO_SPLIT = 3;
  const TXT_CHUNK = 250; // párrafos por sección cuando un .txt no tiene capítulos

  function clean(s) { return (s || "").replace(/\s+/g, " ").trim(); }

  async function loadHtml(file) {
    const text = await file.text();
    const doc = new DOMParser().parseFromString(text, "text/html");
    const body = doc.body || doc.documentElement;
    await EpubLoader.sanitize(body, { resolveImage: async () => null, resolveLink: () => null });
    const title = clean(doc.title) || file.name.replace(/\.(x?html?|xhtml)$/i, "");
    return { type: "html", title, author: "", chapters: splitByHeadings(body, title) };
  }

  // Divide el cuerpo en capítulos por h1/h2 (Gutenberg, exportaciones de Word, etc.).
  function splitByHeadings(body, title) {
    let heads = Array.from(body.querySelectorAll("h2"));
    if (heads.length < MIN_CHAPTERS_TO_SPLIT) heads = Array.from(body.querySelectorAll("h1, h2"));
    if (heads.length < MIN_CHAPTERS_TO_SPLIT) return [{ title, body }];

    const chapters = [];
    const pre = document.createRange();
    pre.setStart(body, 0);
    pre.setEndBefore(heads[0]);
    const preFrag = pre.cloneContents();
    if (clean(preFrag.textContent).length > 40) chapters.push({ title: I18n.t("chapter.start"), body: wrap(preFrag) });

    heads.forEach((h, i) => {
      const r = document.createRange();
      r.setStartBefore(h);
      if (heads[i + 1]) r.setEndBefore(heads[i + 1]); else r.setEnd(body, body.childNodes.length);
      const frag = r.cloneContents();
      const t = clean(h.textContent) || I18n.t("chapter.n", { n: chapters.length + 1 });
      chapters.push({ title: t, body: wrap(frag) });
    });
    return chapters;
  }

  function wrap(frag) {
    const div = document.createElement("div");
    div.appendChild(frag);
    return div;
  }

  async function loadTxt(file) {
    const text = (await file.text()).replace(/\r\n?/g, "\n");
    const title = file.name.replace(/\.txt$/i, "");
    const paras = text.split(/\n\s*\n+/).map((p) => p.replace(/\n/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
    const isHeading = (p) => p.length < 80 && /^(chapter|cap[ií]tulo|part|parte|book|libro|prologue|pr[oó]logo|epilogue|ep[ií]logo|[IVXLC]+\.?)\b/i.test(p);
    const chapters = [];
    let cur = null;
    const push = (t) => { cur = { title: t, body: document.createElement("div") }; chapters.push(cur); };
    paras.forEach((p) => {
      if (isHeading(p) && (chapters.length === 0 || cur.body.childElementCount > 2)) { push(p); const h = document.createElement("h2"); h.textContent = p; cur.body.appendChild(h); return; }
      if (!cur) push(title);
      if (cur.body.childElementCount >= TXT_CHUNK && chapters.every((c) => !/^(chapter|cap)/i.test(c.title))) push(I18n.t("chapter.n", { n: chapters.length + 1 }));
      const el = document.createElement("p");
      el.textContent = p;
      cur.body.appendChild(el);
    });
    if (!chapters.length) push(title);
    return { type: "txt", title, author: "", chapters };
  }

  async function load(file) {
    return /\.txt$/i.test(file.name) ? loadTxt(file) : loadHtml(file);
  }

  return { load };
})();
