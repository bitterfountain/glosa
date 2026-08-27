/* Cargador de EPUB: lee el zip con JSZip, sigue el OPF y devuelve los capítulos como HTML saneado. */
window.EpubLoader = (function () {
  "use strict";

  const blobUrls = [];

  function dispose() {
    blobUrls.splice(0).forEach((u) => URL.revokeObjectURL(u));
  }

  function dirname(path) {
    const i = path.lastIndexOf("/");
    return i === -1 ? "" : path.slice(0, i + 1);
  }

  // Resuelve una ruta relativa dentro del zip (maneja ./ ../ y %20).
  function resolvePath(base, rel) {
    rel = decodeURIComponent(rel.split("#")[0].split("?")[0]);
    if (!rel) return base;
    const parts = (dirname(base) + rel).split("/");
    const out = [];
    parts.forEach((p) => {
      if (p === "..") out.pop();
      else if (p !== "." && p !== "") out.push(p);
    });
    return out.join("/");
  }

  function parseXml(text) {
    const doc = new DOMParser().parseFromString(text, "application/xml");
    if (doc.querySelector("parsererror")) throw new Error("XML no válido en el EPUB");
    return doc;
  }

  function firstNs(doc, tag) {
    const el = doc.getElementsByTagNameNS("http://purl.org/dc/elements/1.1/", tag)[0];
    return el ? el.textContent.trim() : "";
  }

  async function readToc(zip, manifest, opfDir, opfDoc) {
    const titles = new Map();
    const navItem = manifest.find((m) => (m.properties || "").split(/\s+/).includes("nav"));
    const ncxId = opfDoc.querySelector("spine") && opfDoc.querySelector("spine").getAttribute("toc");
    const ncxItem = ncxId ? manifest.find((m) => m.id === ncxId) : manifest.find((m) => m.type === "application/x-dtbncx+xml");
    try {
      if (navItem && zip.file(navItem.path)) {
        const html = new DOMParser().parseFromString(await zip.file(navItem.path).async("text"), "text/html");
        html.querySelectorAll("nav a[href]").forEach((a) => {
          const p = resolvePath(navItem.path, a.getAttribute("href"));
          if (!titles.has(p)) titles.set(p, a.textContent.replace(/\s+/g, " ").trim());
        });
      } else if (ncxItem && zip.file(ncxItem.path)) {
        const ncx = parseXml(await zip.file(ncxItem.path).async("text"));
        ncx.querySelectorAll("navPoint").forEach((np) => {
          const label = np.querySelector("navLabel > text");
          const content = np.querySelector("content");
          if (!label || !content) return;
          const p = resolvePath(ncxItem.path, content.getAttribute("src") || "");
          if (!titles.has(p)) titles.set(p, label.textContent.replace(/\s+/g, " ").trim());
        });
      }
    } catch (_) { /* sin índice: se usan los encabezados de cada capítulo */ }
    return titles;
  }

  async function blobUrlFor(zip, path, type) {
    const f = zip.file(path);
    if (!f) return null;
    const blob = await f.async("blob");
    const typed = type ? new Blob([blob], { type }) : blob;
    const url = URL.createObjectURL(typed);
    blobUrls.push(url);
    return url;
  }

  async function load(file) {
    if (typeof JSZip === "undefined") throw new Error("Falta JSZip (vendor/jszip.min.js)");
    dispose();
    const zip = await JSZip.loadAsync(file);
    const containerFile = zip.file("META-INF/container.xml");
    if (!containerFile) throw new Error("No es un EPUB válido (falta META-INF/container.xml)");
    const container = parseXml(await containerFile.async("text"));
    const rootfile = container.querySelector("rootfile");
    const opfPath = rootfile && rootfile.getAttribute("full-path");
    if (!opfPath || !zip.file(opfPath)) throw new Error("EPUB sin fichero OPF");
    const opfDoc = parseXml(await zip.file(opfPath).async("text"));
    const opfDir = dirname(opfPath);

    const manifest = Array.from(opfDoc.querySelectorAll("manifest > item")).map((it) => ({
      id: it.getAttribute("id"),
      href: it.getAttribute("href") || "",
      path: resolvePath(opfPath, it.getAttribute("href") || ""),
      type: it.getAttribute("media-type") || "",
      properties: it.getAttribute("properties") || "",
    }));
    const byId = new Map(manifest.map((m) => [m.id, m]));
    const byPath = new Map(manifest.map((m) => [m.path, m]));
    const spine = Array.from(opfDoc.querySelectorAll("spine > itemref"))
      .map((ref) => byId.get(ref.getAttribute("idref")))
      .filter((m) => m && /html|xml/.test(m.type) && zip.file(m.path));
    if (!spine.length) throw new Error("El EPUB no tiene capítulos legibles");

    const tocTitles = await readToc(zip, manifest, opfDir, opfDoc);
    const chapterPaths = new Set(spine.map((m) => m.path));
    const imageCache = new Map();

    const chapters = [];
    for (const item of spine) {
      const raw = await zip.file(item.path).async("text");
      const doc = new DOMParser().parseFromString(raw, "text/html");
      const body = doc.body || doc.documentElement;
      await sanitize(body, {
        resolveImage: async (src) => {
          const p = resolvePath(item.path, src);
          if (!imageCache.has(p)) {
            const m = byPath.get(p);
            imageCache.set(p, await blobUrlFor(zip, p, m ? m.type : ""));
          }
          return imageCache.get(p);
        },
        resolveLink: (href) => {
          const p = resolvePath(item.path, href);
          return chapterPaths.has(p) ? p : null;
        },
      });
      const heading = body.querySelector("h1, h2, h3");
      const text = body.textContent.replace(/\s+/g, " ").trim();
      if (!text && !body.querySelector("img, svg")) continue; // capítulo vacío
      chapters.push({
        path: item.path,
        title: tocTitles.get(item.path) || (heading && heading.textContent.replace(/\s+/g, " ").trim()) || "",
        body,
      });
    }
    chapters.forEach((c, i) => { if (!c.title) c.title = I18n.t("chapter.n", { n: i + 1 }); });

    // Portada: item con properties="cover-image" (EPUB 3) o <meta name="cover" content="id"> (EPUB 2).
    let coverItem = manifest.find((m) => (m.properties || "").split(/\s+/).includes("cover-image"));
    if (!coverItem) {
      const metaCover = Array.from(opfDoc.querySelectorAll("metadata > meta")).find((m) => m.getAttribute("name") === "cover");
      if (metaCover) coverItem = byId.get(metaCover.getAttribute("content"));
    }
    if (!coverItem) coverItem = manifest.find((m) => /^image\//.test(m.type) && /cover/i.test(m.href));
    const cover = coverItem && zip.file(coverItem.path) ? await blobUrlFor(zip, coverItem.path, coverItem.type) : null;

    return {
      type: "epub",
      title: firstNs(opfDoc, "title") || file.name.replace(/\.epub$/i, ""),
      author: firstNs(opfDoc, "creator"),
      chapters,
      cover,
    };
  }

  // Limpia el HTML de un capítulo: sin scripts/estilos/formularios, imágenes a blob, enlaces internos marcados.
  async function sanitize(root, opts) {
    root.querySelectorAll("script, style, link, meta, title, iframe, object, embed, form, input, button, textarea, select, video, audio, noscript").forEach((n) => n.remove());
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    const imgs = [];
    const links = [];
    let el;
    while ((el = walker.nextNode())) {
      Array.from(el.attributes).forEach((a) => {
        const n = a.name.toLowerCase();
        if (n.startsWith("on") || n === "style" || (n === "href" && /^\s*javascript:/i.test(a.value))) el.removeAttribute(a.name);
      });
      const tag = el.tagName.toLowerCase();
      if (tag === "img" && el.getAttribute("src")) imgs.push(el);
      else if (tag === "image") imgs.push(el);
      else if (tag === "a" && el.getAttribute("href")) links.push(el);
    }
    for (const img of imgs) {
      const src = img.getAttribute("src") || img.getAttribute("xlink:href") || img.getAttribute("href") || "";
      if (!src || /^(data:|https?:)/i.test(src)) continue;
      const url = opts.resolveImage ? await opts.resolveImage(src) : null;
      if (url) {
        if (img.tagName.toLowerCase() === "img") { img.setAttribute("src", url); img.setAttribute("loading", "lazy"); }
        else { img.setAttribute("href", url); img.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", url); }
      } else img.remove();
    }
    links.forEach((a) => {
      const href = a.getAttribute("href");
      if (/^(https?:|mailto:)/i.test(href)) { a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener"); return; }
      const target = opts.resolveLink ? opts.resolveLink(href) : null;
      a.removeAttribute("href");
      if (target) { a.dataset.chapter = target; a.setAttribute("href", "#"); }
    });
  }

  return { load, dispose, sanitize };
})();
