/* Diccionarios: pares de idiomas, carga bajo demanda, lematización (inglés y español) y consulta local/online. */
window.Dictionary = (function () {
  "use strict";

  // Súbelo al regenerar un diccionario: los ficheros de dict/ se sirven con caché larga.
  const DICT_VERSION = "2026-08-27.2";

  const PAIRS = [
    { id: "en-es", name: "English → Español", src: "en", dst: "es", file: "dict/en-es.js" },
    { id: "es-en", name: "Español → English", src: "es", dst: "en", file: "dict/es-en.js" },
    { id: "it-es", name: "Italiano → Español", src: "it", dst: "es", file: "dict/it-es.js" },
    { id: "de-es", name: "Deutsch → Español", src: "de", dst: "es", file: "dict/de-es.js" },
    { id: "it-en", name: "Italiano → English", src: "it", dst: "en", file: "dict/it-en.js" },
    { id: "de-en", name: "Deutsch → English", src: "de", dst: "en", file: "dict/de-en.js" },
    { id: "en-it", name: "English → Italiano", src: "en", dst: "it", file: "dict/en-it.js" },
    { id: "es-it", name: "Español → Italiano", src: "es", dst: "it", file: "dict/es-it.js" },
    { id: "de-it", name: "Deutsch → Italiano", src: "de", dst: "it", file: "dict/de-it.js" },
    { id: "en-de", name: "English → Deutsch", src: "en", dst: "de", file: "dict/en-de.js" },
    { id: "es-de", name: "Español → Deutsch", src: "es", dst: "de", file: "dict/es-de.js" },
    { id: "it-de", name: "Italiano → Deutsch", src: "it", dst: "de", file: "dict/it-de.js" },
    { id: "es-ar", name: "Español → العربية", src: "es", dst: "ar", file: "dict/es-ar.js" },
    { id: "en-ar", name: "English → العربية", src: "en", dst: "ar", file: "dict/en-ar.js" },
    { id: "ar-es", name: "العربية → Español", src: "ar", dst: "es", file: "dict/ar-es.js" },
    { id: "ar-en", name: "العربية → English", src: "ar", dst: "en", file: "dict/ar-en.js" },
    { id: "zh-es", name: "中文 → Español", src: "zh", dst: "es", file: "dict/zh-es.js" },
    { id: "zh-en", name: "中文 → English", src: "zh", dst: "en", file: "dict/zh-en.js" },
  ];

  // Verbos irregulares ingleses frecuentes que Wiktionary no lista como flexión.
  const IRREGULAR_EN = {
    was: "be", were: "be", been: "be", am: "be", is: "be", are: "be", being: "be",
    had: "have", has: "have", having: "have", did: "do", does: "do", done: "do",
    went: "go", gone: "go", goes: "go", ran: "run", came: "come", saw: "see", seen: "see",
    took: "take", taken: "take", gave: "give", given: "give", made: "make", said: "say",
    got: "get", gotten: "get", knew: "know", known: "know", thought: "think", told: "tell",
    found: "find", felt: "feel", left: "leave", kept: "keep", brought: "bring", bought: "buy",
    built: "build", caught: "catch", chose: "choose", chosen: "choose", began: "begin", begun: "begin",
    broke: "break", broken: "break", drank: "drink", drunk: "drink", drove: "drive", driven: "drive",
    ate: "eat", eaten: "eat", fell: "fall", fallen: "fall", flew: "fly", flown: "fly",
    forgot: "forget", forgotten: "forget", grew: "grow", grown: "grow", heard: "hear", held: "hold",
    hid: "hide", hidden: "hide", lay: "lie", lain: "lie", laid: "lay", led: "lead", lost: "lose",
    met: "meet", paid: "pay", rode: "ride", ridden: "ride", rose: "rise", risen: "rise",
    sang: "sing", sung: "sing", sat: "sit", slept: "sleep", spoke: "speak", spoken: "speak",
    spent: "spend", stood: "stand", stole: "steal", stolen: "steal", struck: "strike", swam: "swim",
    swum: "swim", taught: "teach", threw: "throw", thrown: "throw", understood: "understand",
    woke: "wake", woken: "wake", wore: "wear", worn: "wear", won: "win", wrote: "write", written: "write",
    sent: "send", sold: "sell", shook: "shake", shaken: "shake", showed: "show", shown: "show",
    sought: "seek", fought: "fight", meant: "mean", lent: "lend", bent: "bend", bound: "bind",
    dealt: "deal", dug: "dig", fed: "feed", fled: "flee", froze: "freeze", frozen: "freeze",
    hung: "hang", lit: "light", shot: "shoot", sprang: "spring", sprung: "spring", stuck: "stick",
    stung: "sting", swept: "sweep", swore: "swear", sworn: "swear", tore: "tear", torn: "tear",
    wept: "weep", wound: "wind", withdrew: "withdraw", withdrawn: "withdraw", arose: "arise",
    arisen: "arise", became: "become", befell: "befall", beheld: "behold", bore: "bear", borne: "bear",
    born: "bear", beaten: "beat", bled: "bleed", blew: "blow", blown: "blow", bred: "breed",
    burnt: "burn", clung: "cling", crept: "creep", drew: "draw", drawn: "draw", dreamt: "dream",
    dwelt: "dwell", forbade: "forbid", forbidden: "forbid", foresaw: "foresee", foreseen: "foresee",
    forgave: "forgive", forgiven: "forgive", forsook: "forsake", ground: "grind", knelt: "kneel",
    leapt: "leap", learnt: "learn", mistook: "mistake", mistaken: "mistake", overcame: "overcome",
    oversaw: "oversee", overtook: "overtake", rang: "ring", rung: "ring", sank: "sink", sunk: "sink",
    slid: "slide", slew: "slay", slain: "slay", smelt: "smell", sped: "speed", spelt: "spell",
    spilt: "spill", spun: "spin", spat: "spit", spoilt: "spoil", strove: "strive", striven: "strive",
    strung: "string", swung: "swing", trod: "tread", trodden: "tread", undertook: "undertake",
    undertaken: "undertake", withheld: "withhold", withstood: "withstand", wrung: "wring",
    men: "man", women: "woman", children: "child", people: "person", feet: "foot", teeth: "tooth",
    mice: "mouse", geese: "goose", oxen: "ox", lives: "life", wives: "wife", knives: "knife",
    leaves: "leaf", halves: "half", selves: "self", better: "good", best: "good", worse: "bad",
    worst: "bad", more: "much", most: "much", less: "little", least: "little", further: "far",
    farther: "far", furthest: "far", farthest: "far",
  };
  const IRREGULAR_EN_NON_VERB = new Set([
    "men", "women", "children", "people", "feet", "teeth", "mice", "geese", "oxen", "lives", "wives",
    "knives", "leaves", "halves", "selves", "better", "best", "worse", "worst", "more", "most", "less",
    "least", "further", "farther", "furthest", "farthest",
  ]);

  // Terminaciones verbales del español (de más larga a más corta, para probar primero las específicas).
  const VERB_ENDINGS_ES = [
    "ándose", "iéndose", "ando", "iendo", "ado", "ados", "ada", "adas", "ido", "idos", "ida", "idas",
    "aría", "arías", "aríamos", "aríais", "arían", "ería", "erías", "eríamos", "eríais", "erían",
    "iría", "irías", "iríamos", "iríais", "irían", "aré", "arás", "ará", "aremos", "aréis", "arán",
    "eré", "erás", "erá", "eremos", "eréis", "erán", "iré", "irás", "irá", "iremos", "iréis", "irán",
    "aba", "abas", "ábamos", "abais", "aban", "ía", "ías", "íamos", "íais", "ían",
    "é", "aste", "ó", "amos", "asteis", "aron", "í", "iste", "ió", "imos", "isteis", "ieron",
    "ara", "aras", "áramos", "arais", "aran", "ase", "ases", "ásemos", "aseis", "asen",
    "iera", "ieras", "iéramos", "ierais", "ieran", "iese", "ieses", "iésemos", "ieseis", "iesen",
    "o", "as", "a", "áis", "an", "es", "e", "éis", "en", "imos", "ís",
    "emos", "ad", "ed", "id",
  ];

  const registry = new Map(); // id -> data {meta, entries, infl}
  let active = null;
  let activeId = null;
  const listeners = [];

  function onChange(fn) { listeners.push(fn); }
  function pairs() { return PAIRS.slice(); }
  function meta() { return active ? active.meta : null; }
  function currentId() { return activeId; }

  function register(id, obj) {
    if (!obj || !obj.entries) throw new Error("Diccionario sin campo 'entries'");
    registry.set(id, { meta: obj.meta || {}, entries: obj.entries, infl: obj.infl || {} });
  }

  function injectScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("No se pudo cargar " + src));
      document.head.appendChild(s);
    });
  }

  // Activa un par; descarga su fichero la primera vez.
  async function use(id) {
    if (activeId === id && active) return active.meta;
    if (!registry.has(id)) {
      const pair = PAIRS.find((p) => p.id === id);
      if (!pair) throw new Error("Par de idiomas desconocido: " + id);
      if (!(window.PDFR_DICTS && window.PDFR_DICTS[id])) await injectScript(pair.file + "?v=" + DICT_VERSION);
      const obj = (window.PDFR_DICTS && window.PDFR_DICTS[id]) || (id === "en-es" ? window.PDFR_DICT : null); // PDFR_DICT: formato antiguo cacheado
      if (!obj) throw new Error("El fichero " + pair.file + " no registró el diccionario " + id);
      register(id, obj);
    }
    active = registry.get(id);
    activeId = id;
    listeners.forEach((fn) => fn(active.meta, id));
    return active.meta;
  }

  // Diccionario cargado por el usuario (.json o .js con el mismo formato).
  function useCustom(obj) {
    const m = obj.meta || {};
    const id = "custom:" + (m.src || "xx") + "-" + (m.dst || "xx");
    register(id, obj);
    if (!PAIRS.some((p) => p.id === id)) PAIRS.push({ id, name: m.name || id, src: m.src || "en", dst: m.dst || "es", custom: true });
    active = registry.get(id);
    activeId = id;
    listeners.forEach((fn) => fn(active.meta, id));
    return active.meta;
  }

  function normalize(word) {
    return String(word || "")
      .replace(/[‘’ʼ]/g, "'")
      .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")
      .toLowerCase();
  }

  // ---------------------------------------------------------------- lematización inglés
  function candidatesEn(w) {
    const out = [];
    const seen = new Set();
    const push = (c, kind) => { if (c && c.length > 1 && !seen.has(c)) { seen.add(c); out.push({ c, kind: kind || "" }); } };
    push(w, "");
    if (active.infl[w]) push(active.infl[w], "");
    if (IRREGULAR_EN[w]) push(IRREGULAR_EN[w], IRREGULAR_EN_NON_VERB.has(w) ? "" : "v");
    if (w.endsWith("'s")) push(w.slice(0, -2), "n");
    if (w.endsWith("n't")) push(w.slice(0, -3), "v");
    if (w.endsWith("ies")) push(w.slice(0, -3) + "y", "");
    if (w.endsWith("ied")) push(w.slice(0, -3) + "y", "v");
    if (w.endsWith("es")) { push(w.slice(0, -2), ""); push(w.slice(0, -1), ""); }
    if (w.endsWith("s") && !w.endsWith("ss")) push(w.slice(0, -1), "");
    if (w.endsWith("ed")) { push(w.slice(0, -2), "v"); push(w.slice(0, -1), "v"); push(w.slice(0, -3), "v"); }
    if (w.endsWith("ing")) { push(w.slice(0, -3), "v"); push(w.slice(0, -3) + "e", "v"); push(w.slice(0, -4), "v"); }
    if (w.endsWith("er")) { push(w.slice(0, -2), ""); push(w.slice(0, -1), ""); push(w.slice(0, -3), ""); }
    if (w.endsWith("est")) { push(w.slice(0, -3), "adj"); push(w.slice(0, -2), "adj"); push(w.slice(0, -4), "adj"); }
    if (w.endsWith("ly")) { push(w.slice(0, -2), "adj"); push(w.slice(0, -3) + "e", "adj"); }
    if (w.endsWith("ness")) push(w.slice(0, -4), "adj");
    if (w.endsWith("ment")) push(w.slice(0, -4), "v");
    if (w.endsWith("ful")) push(w.slice(0, -3), "n");
    if (w.endsWith("less")) push(w.slice(0, -4), "n");
    out.slice(1).forEach(({ c, kind }) => {
      if (IRREGULAR_EN[c]) push(IRREGULAR_EN[c], kind || (IRREGULAR_EN_NON_VERB.has(c) ? "" : "v"));
      if (active.infl[c]) push(active.infl[c], kind);
    });
    return out;
  }

  // ---------------------------------------------------------------- lematización español
  function candidatesEs(w) {
    const out = [];
    const seen = new Set();
    const push = (c, kind) => { if (c && c.length > 1 && !seen.has(c)) { seen.add(c); out.push({ c, kind: kind || "" }); } };
    push(w, "");
    if (active.infl[w]) push(active.infl[w], "");
    const stems = [w];
    const m = w.match(/^(.+?)(me|te|se|nos|os|lo|la|los|las|le|les)+$/);
    if (m && m[1].length > 2) stems.push(m[1]); // pronombres enclíticos: dárselo → dar
    stems.forEach((s) => {
      if (s.endsWith("es")) { push(s.slice(0, -2), "n"); push(s.slice(0, -1), "n"); if (s.endsWith("ces")) push(s.slice(0, -3) + "z", "n"); }
      if (s.endsWith("s")) push(s.slice(0, -1), "n");
      if (s.endsWith("a")) push(s.slice(0, -1) + "o", "adj");
      if (s.endsWith("as")) push(s.slice(0, -2) + "o", "adj");
      if (s.endsWith("mente")) { push(s.slice(0, -5), "adj"); push(s.slice(0, -6) + "o", "adj"); }
      ["ísimo", "ísima", "ísimos", "ísimas", "ito", "ita", "itos", "itas", "cito", "cita"].forEach((suf) => {
        if (s.endsWith(suf)) { const r = s.slice(0, -suf.length); push(r, ""); push(r + "o", ""); push(r + "a", ""); }
      });
      VERB_ENDINGS_ES.forEach((end) => {
        if (!s.endsWith(end) || s.length - end.length < 2) return;
        const root = s.slice(0, -end.length);
        push(root + "ar", "v"); push(root + "er", "v"); push(root + "ir", "v");
        if (root.endsWith("qu")) push(root.slice(0, -2) + "car", "v");
        if (root.endsWith("gu")) push(root.slice(0, -2) + "gar", "v");
        if (root.endsWith("c")) push(root.slice(0, -1) + "zar", "v");
        if (root.endsWith("y")) { push(root.slice(0, -1) + "er", "v"); push(root.slice(0, -1) + "ir", "v"); }
      });
    });
    // Sin tildes (OCR o teclado): probar la forma con diacríticos quitados y viceversa.
    const bare = w.normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (bare !== w) push(bare, "");
    out.slice(1).forEach(({ c, kind }) => { if (active.infl[c]) push(active.infl[c], kind); });
    return out;
  }

  // ---------------------------------------------------------------- lematización italiano
  const VERB_ENDINGS_IT = [
    "erebbero", "irebbero", "eremmo", "iremmo", "ereste", "ireste", "eresti", "iresti", "erebbe", "irebbe", "erei", "irei",
    "eranno", "iranno", "eremo", "iremo", "erete", "irete", "erai", "irai", "erò", "irò", "erà", "irà",
    "assero", "essero", "issero", "assimo", "essimo", "issimo", "aste", "este", "iste", "assi", "essi", "issi", "asse", "esse", "isse",
    "arono", "erono", "irono", "ammo", "emmo", "immo", "asti", "esti", "isti", "ai", "ei", "ii", "ò", "é", "ì",
    "avamo", "evamo", "ivamo", "avate", "evate", "ivate", "avano", "evano", "ivano", "avo", "evo", "ivo", "avi", "evi", "ivi", "ava", "eva", "iva",
    "iscono", "isco", "isci", "isce", "iamo", "ate", "ete", "ite", "ano", "ono", "ando", "endo",
    "ato", "ata", "ati", "uto", "uta", "uti", "ute", "ito", "ita", "iti",
    "o", "i", "a", "e",
  ];
  function candidatesIt(w) {
    const out = [];
    const seen = new Set();
    const push = (c, kind) => { if (c && c.length > 1 && !seen.has(c)) { seen.add(c); out.push({ c, kind: kind || "" }); } };
    push(w, "");
    if (active.infl[w]) push(active.infl[w], "");
    const stems = [w];
    const m = w.match(/^(.+?)(glielo|gliela|glieli|gliele|gliene|melo|mela|telo|tela|selo|sela|celo|cela|velo|vela|mi|ti|si|ci|vi|lo|la|li|le|ne|gli)$/);
    if (m && m[1].length > 2) stems.push(m[1]); // enclíticos: dirglielo → dir(e)
    stems.forEach((s) => {
      if (s.endsWith("chi")) push(s.slice(0, -3) + "co", "n");
      if (s.endsWith("ghi")) push(s.slice(0, -3) + "go", "n");
      if (s.endsWith("che")) push(s.slice(0, -3) + "ca", "n");
      if (s.endsWith("ghe")) push(s.slice(0, -3) + "ga", "n");
      if (s.endsWith("i")) { push(s.slice(0, -1) + "o", "n"); push(s.slice(0, -1) + "e", "n"); push(s.slice(0, -1) + "a", "adj"); }
      if (s.endsWith("e")) { push(s.slice(0, -1) + "a", "n"); push(s.slice(0, -1) + "o", "adj"); }
      if (s.endsWith("a")) push(s.slice(0, -1) + "o", "adj");
      if (s.endsWith("mente")) { push(s.slice(0, -5) + "e", "adj"); push(s.slice(0, -5) + "o", "adj"); }
      ["issimo", "issima", "issimi", "issime", "ino", "ina", "ini", "ine", "etto", "etta", "etti", "ette", "one", "oni"].forEach((suf) => {
        if (s.endsWith(suf) && s.length - suf.length > 2) { const r = s.slice(0, -suf.length); push(r + "o", ""); push(r + "a", ""); push(r + "e", ""); }
      });
      VERB_ENDINGS_IT.forEach((end) => {
        if (!s.endsWith(end) || s.length - end.length < 2) return;
        const root = s.slice(0, -end.length);
        // La vocal temática de la desinencia dice la conjugación más probable: voleva → volere antes que volare.
        const conj = end[0] === "e" ? ["ere", "are", "ire"] : end[0] === "i" ? ["ire", "ere", "are"] : ["are", "ere", "ire"];
        conj.forEach((inf) => push(root + inf, "v"));
        if (root.endsWith("c") || root.endsWith("g")) push(root + "iare", "v");     // mangi → mangiare, lasci → lasciare
        if (root.endsWith("ch") || root.endsWith("gh")) push(root.slice(0, -1) + "are", "v"); // cerchi → cercare, paghi → pagare
      });
    });
    const bare = w.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (bare !== w) push(bare, "");
    out.slice(1).forEach(({ c, kind }) => { if (active.infl[c]) push(active.infl[c], kind); });
    return out;
  }

  // ---------------------------------------------------------------- lematización alemán
  const SEP_PREFIXES_DE = "ab|an|auf|aus|bei|ein|mit|nach|vor|zu|zurück|weg|her|hin|los|fort|weiter|um|durch|über|unter|wieder";
  function candidatesDe(w) {
    const out = [];
    const seen = new Set();
    const push = (c, kind) => { if (c && c.length > 1 && !seen.has(c)) { seen.add(c); out.push({ c, kind: kind || "" }); } };
    const deUmlaut = (s) => s.replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u");
    push(w, "");
    if (active.infl[w]) push(active.infl[w], "");
    // sustantivos y adjetivos: plural y declinación (Häuser → Haus, kleinen → klein, des Buches → Buch)
    ["ern", "en", "er", "es", "em", "e", "n", "s"].forEach((suf) => {
      if (!w.endsWith(suf) || w.length - suf.length < 3) return;
      const r = w.slice(0, -suf.length);
      push(r, "n");
      if (deUmlaut(r) !== r) push(deUmlaut(r), "n");
    });
    // verbos: raíz + en (gehst → gehen, sagte → sagen, gesagt → sagen, fährt → fahren)
    let stem = w;
    if (/^ge.{3,}(t|en)$/.test(w)) stem = w.slice(2); // participio: gemacht → macht → mach
    stem = stem.replace(/(test|tet|ten|est|st|et|te|en|t|e|n)$/, "");
    if (stem.length > 1) {
      push(stem + "en", "v");
      push(stem + "n", "v");
      if (deUmlaut(stem) !== stem) push(deUmlaut(stem) + "en", "v");
    }
    // prefijo separable + participio: aufgemacht → aufmachen
    const sep = w.match(new RegExp("^(" + SEP_PREFIXES_DE + ")ge(.{2,}?)(t|en)$"));
    if (sep) push(sep[1] + sep[2] + "en", "v");
    // comparativo y superlativo: größer → groß, schnellsten → schnell
    if (w.endsWith("sten")) push(deUmlaut(w.slice(0, -4)), "adj");
    if (w.endsWith("ste")) push(deUmlaut(w.slice(0, -3)), "adj");
    if (w.endsWith("er")) push(deUmlaut(w.slice(0, -2)), "adj");
    out.slice(1).forEach(({ c, kind }) => { if (active.infl[c]) push(active.infl[c], kind); });
    return out;
  }

  // ---------------------------------------------------------------- árabe
  // Los libros vienen sin vocales: las claves del diccionario también (build_kaikki_ar.py aplica
  // esta misma normalización). Se quitan harakat y tatwil, y se unifican alif (أإآ → ا) y ya final (ى → ي).
  const AR_DIACRITICS = /[\u064B-\u065F\u0670\u0640\u06D6-\u06ED]/g;
  function normalizeAr(w) {
    return String(w || "").replace(AR_DIACRITICS, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي");
  }
  // Clíticos: conjunciones, preposiciones y artículo pegados delante; pronombres y desinencias detrás.
  const AR_PREFIXES = ["وبال", "فبال", "وال", "فال", "بال", "كال", "ولل", "فلل", "لل", "ال", "وب", "ول", "وس", "فب", "فل", "فس", "و", "ف", "ب", "ك", "ل", "س"];
  const AR_SUFFIXES = ["كما", "هما", "تين", "تان", "ات", "ان", "ون", "ين", "ها", "هم", "هن", "كم", "كن", "نا", "ني", "وا", "ة", "ه", "ك", "ي", "ت", "ا", "ن"];
  function candidatesAr(w) {
    const out = [];
    const seen = new Set();
    const push = (c, kind) => { if (c && c.length > 1 && !seen.has(c)) { seen.add(c); out.push({ c, kind: kind || "" }); } };
    w = normalizeAr(w);
    // Con artículo pegado, primero la palabra sin él: "الكتاب" existe como entrada suelta ("el Libro")
    // pero casi siempre es "كتاب"; salvo las pocas palabras que empiezan por ال sin ser artículo.
    const AR_NOT_ARTICLE = new Set(["الله", "الي", "الان", "الا", "التي", "الذي", "الذين", "اللاتي", "اللواتي"]);
    if (w.startsWith("ال") && w.length >= 5 && !AR_NOT_ARTICLE.has(w)) { push(w.slice(2), ""); if (active.infl[w.slice(2)]) push(active.infl[w.slice(2)], ""); }
    push(w, "");
    if (active.infl[w]) push(active.infl[w], "");
    const stems = [w];
    AR_PREFIXES.forEach((p) => { if (w.startsWith(p) && w.length - p.length >= 3) stems.push(w.slice(p.length)); });
    stems.forEach((s) => {
      push(s, "");
      AR_SUFFIXES.forEach((suf) => {
        if (!s.endsWith(suf) || s.length - suf.length < 2) return;
        const r = s.slice(0, -suf.length);
        push(r, "");
        if (suf !== "ة") push(r + "ة", "n"); // كتابها → كتابة, مدرستنا → مدرسة (ت de unión → ة)
        if (r.endsWith("ت")) push(r.slice(0, -1) + "ة", "n");
      });
      // Imperfectivo: يكتب / تكتب / نكتب / أكتب → كتب
      if (/^[يتنا]/.test(s) && s.length >= 4) push(s.slice(1), "v");
    });
    out.slice(1).forEach(({ c, kind }) => { if (active.infl[c]) push(active.infl[c], kind); });
    return out;
  }

  // ---------------------------------------------------------------- chino
  // Las claves del diccionario van en simplificado; los textos clásicos (Gutenberg) suelen venir en
  // tradicional: `meta.t2s` (de CC-CEDICT) convierte carácter a carácter.
  const HAN = /\p{Script=Han}/u;
  function toSimplified(text) {
    const map = active && active.meta.t2s;
    if (!map) return text;
    let out = "";
    for (const ch of String(text || "")) out += map[ch] || ch;
    return out;
  }
  function candidatesZh(w) {
    const out = [];
    const seen = new Set();
    const push = (c) => { if (c && !seen.has(c)) { seen.add(c); out.push({ c, kind: "" }); } };
    push(w);
    push(toSimplified(w));
    return out;
  }
  // El chino no separa palabras: dado el texto y la posición del carácter pulsado, devuelve el tramo
  // [s, e) de la palabra más larga del diccionario que lo contiene (hasta 6 caracteres). Si ninguna,
  // el carácter solo.
  const ZH_MAX_WORD = 6;
  function segmentAt(text, i) {
    if (!active || !HAN.test(text[i] || "")) return null;
    let best = { s: i, e: i + 1, len: 1 };
    for (let start = Math.max(0, i - ZH_MAX_WORD + 1); start <= i; start++) {
      for (let len = ZH_MAX_WORD; len >= 2; len--) {
        const end = start + len;
        if (end <= i || end > text.length || len <= best.len) continue;
        const piece = text.slice(start, end);
        if (!/^\p{Script=Han}+$/u.test(piece)) continue;
        if (active.entries[piece] || active.entries[toSimplified(piece)]) { best = { s: start, e: end, len }; break; }
      }
    }
    return { s: best.s, e: best.e };
  }

  function candidates(w) {
    const src = active.meta.src || "en";
    if (src === "zh") return candidatesZh(w);
    const fn = { es: candidatesEs, it: candidatesIt, de: candidatesDe, ar: candidatesAr }[src] || candidatesEn;
    const out = fn(w);
    // "l'amore", "dell'uomo", "d'un": la palabra de verdad va tras el apóstrofo.
    const ap = w.lastIndexOf("'");
    if (ap > 0 && ap < w.length - 1) fn(w.slice(ap + 1)).forEach((c) => { if (!out.some((o) => o.c === c.c)) out.push(c); });
    return out;
  }

  function sortSenses(senses) {
    const tagged = (s) => (s.d && /^\((?:[A-Z][a-z]+|[A-Z]{2,})[^)]*\)/.test(s.d) ? 1 : 0);
    return senses.slice().sort((a, b) => tagged(a) - tagged(b));
  }

  function lookup(word) {
    if (!active) return null;
    const norm = normalize(word);
    if (!norm) return null;
    const cands = candidates(norm);
    for (let i = 0; i < cands.length; i++) {
      const { c: cand, kind } = cands[i];
      const raw = active.entries[cand];
      if (!raw) continue;
      let entries = raw.map((e) => ({ p: e.p || "", s: sortSenses(e.s) }));
      if (kind) entries = entries.filter((e) => e.p === kind).concat(entries.filter((e) => e.p !== kind));
      // "running" (adv, n) o "era" (n) son entradas propias, pero en un texto suelen ser
      // formas de un verbo ("run", "ser"): si la entrada no trae verbo y una flexión
      // conocida lleva a uno, se añaden sus acepciones a continuación.
      if (i === 0 && !entries.some((e) => e.p === "v")) {
        const verbForm = active.meta.src === "en" ? /(?:ing|ed)$/.test(norm) : true;
        const verb = verbForm && cands.slice(1).find((k) => (k.kind === "v" || active.infl[norm] === k.c) && (active.entries[k.c] || []).some((e) => e.p === "v"));
        if (verb) active.entries[verb.c].filter((e) => e.p === "v").forEach((e) => entries.push({ p: "v", s: sortSenses(e.s), lemma: verb.c }));
      }
      return { word: norm, lemma: cand, entries, source: "local" };
    }
    return null;
  }

  // ---------------------------------------------------------------- online (opcional)
  async function lookupOnline(text, src, dst) {
    const q = String(text).trim().slice(0, 300);
    const result = { translation: null, defs: [] };
    const jobs = [];

    jobs.push(
      fetch("https://api.mymemory.translated.net/get?q=" + encodeURIComponent(q) + "&langpair=" + src + "|" + dst)
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          const t = j && j.responseData && j.responseData.translatedText;
          if (t && t.trim().toLowerCase() !== q.toLowerCase() && !/^(?:QUERY LENGTH|MYMEMORY WARNING|PLEASE SELECT)/i.test(t)) result.translation = t;
        })
        .catch(() => {})
    );

    if (src === "en" && !/\s/.test(q)) {
      jobs.push(
        fetch("https://en.wiktionary.org/api/rest_v1/page/definition/" + encodeURIComponent(q.toLowerCase()) + "?redirect=true")
          .then((r) => (r.ok ? r.json() : null))
          .then((j) => {
            const list = (j && j.en) || [];
            list.slice(0, 3).forEach((block) => {
              const defs = (block.definitions || []).map((d) => stripHtml(d.definition)).filter(Boolean).slice(0, 3);
              if (defs.length) result.defs.push({ pos: block.partOfSpeech, defs });
            });
          })
          .catch(() => {})
      );
    }

    await Promise.all(jobs);
    if (!result.translation && !result.defs.length) throw new Error("Sin resultados online");
    return result;
  }

  function stripHtml(html) {
    const div = document.createElement("div");
    div.innerHTML = html || "";
    return div.textContent.replace(/\s+/g, " ").trim();
  }

  // Detección sencilla del idioma de un texto por palabras funcionales.
  const STOP = {
    en: ["the", "and", "of", "to", "in", "is", "was", "that", "with", "for", "he", "she", "it", "his", "her", "not", "but", "you", "on", "as"],
    es: ["de", "la", "que", "el", "en", "y", "los", "del", "se", "las", "por", "un", "una", "con", "no", "para", "es", "su", "al", "lo"],
    it: ["di", "che", "il", "non", "per", "una", "del", "della", "gli", "nel", "sono", "anche", "come", "più", "era", "ma", "lo", "io", "aveva", "suo"],
    de: ["der", "die", "und", "den", "von", "das", "mit", "sich", "des", "auf", "für", "ist", "im", "dem", "nicht", "ein", "eine", "als", "auch", "es"],
    ar: ["في", "من", "على", "ان", "الى", "عن", "هذا", "كان", "التي", "الذي", "ما", "لا", "مع", "هو", "هي", "كل", "قد", "ذلك", "بعد", "او"],
  };
  function detectLanguage(text) {
    const letters = (String(text || "").match(/\p{L}/gu) || []).length;
    const han = (String(text || "").match(/\p{Script=Han}/gu) || []).length;
    if (letters >= 40 && han > letters * 0.3) return "zh"; // sin espacios: se mira por caracteres
    const words = (String(text || "").toLowerCase().match(/[\p{L}\p{M}']+/gu) || []).map(normalizeAr);
    if (words.length < 40) return null;
    // Escrituras propias: si más de la mitad de las palabras van en alfabeto árabe, es árabe.
    if (words.filter((w) => /^[؀-ۿ]+$/.test(w)).length > words.length / 2) return "ar";
    const counts = {};
    words.forEach((w) => { counts[w] = (counts[w] || 0) + 1; });
    const score = (lang) => STOP[lang].reduce((n, w) => n + (counts[w] || 0), 0) / words.length;
    const ranked = Object.keys(STOP).map((lang) => [lang, score(lang)]).sort((a, b) => b[1] - a[1]);
    const [best, second] = ranked;
    if (best[1] < 0.04) return null;
    return best[1] > second[1] * 1.3 ? best[0] : null;
  }

  return { PAIRS, pairs, use, useCustom, currentId, meta, onChange, normalize, normalizeAr, toSimplified, segmentAt, lookup, lookupOnline, detectLanguage };
})();
