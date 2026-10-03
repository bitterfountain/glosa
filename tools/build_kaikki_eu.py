"""Construye dict/eu-en.js (euskera → inglés) a partir de:

  1. Las traducciones directas de Apertium eu-en (tools/build_apertium.py, GPL), que van primero.
  2. El volcado de kaikki.org del Wiktionary inglés para el euskera
     (https://kaikki.org/dictionary/Basque/kaikki.org-dictionary-Basque.jsonl.gz, CC BY-SA):
     glosas inglesas de ~6.000 lemas, las tablas de declinación de nombres y adjetivos y, sobre
     todo, las ~9.800 formas sintéticas de los verbos (du, zen, dira, doa, zetorren...). Esas
     formas no traen glosa, solo "of izan", "of joan"...: van a `infl` hacia su verbo; las del
     auxiliar transitivo (du, zuen, dute) van a "ukan" (tener / have) y no a "izan" (ser).

Como en build_kaikki.py, `infl` solo guarda lo que el lematizador vasco del JS no deduce:
eu_candidates es su réplica en Python (candidatesEu de js/dictionary.js); si cambia allí,
cambiar aquí.

Uso:
    python tools/build_apertium.py tools/apertium-eu-en.eu-en.dix --left eu --right en -o tools/eu-en-apertium.js --reverse tools/en-eu-apertium.js
    python tools/build_kaikki_eu.py tools/kaikki-basque.jsonl.gz --merge tools/eu-en-apertium.js -o dict/eu-en.js
"""
import argparse
import gzip
import json
import re
import sys
from pathlib import Path

POS_MAP = {
    "noun": "n", "verb": "v", "adj": "adj", "adv": "adv", "name": "pn", "postp": "postp", "conj": "conj",
    "pron": "pron", "num": "num", "intj": "int", "det": "det", "particle": "particle", "phrase": "phrase",
    "suffix": "suffix", "prefix": "prefix",
}
MAX_SENSES = 8
MIN_DIRECT_SENSES = 3
MAX_GLOSS = 100
SKIP_TAGS = {"obsolete", "archaic", "misspelling", "rare", "nonstandard"}
FORM_SKIP_TAGS = {"table-tags", "inflection-template", "class", "canonical", "romanization"}

# ---- Réplica en Python de candidatesEu de js/dictionary.js ----
# Declinación (de más larga a más corta): caso + número, con la -e- de apoyo tras consonante.
NOUN_SUFFIXES_EU = sorted(set("""
arengandik engandik rengandik arengana engana rengana arengan engan rengan arengatik engatik rengatik agatik
arentzat entzat rentzat etaraino etarantz etatik etara etako etaz etan arekin ekin rekin
koarekin koaren koari koak koan koa koen koei koek tako dako iko ezko zko eko ko go
aren ren en ari ei ri ak ek ok oi on ean an tan era ra etik tik eraino raino erantz rantz
tzat az ez z ago agoa agoak egi egia ena enak txo tto ki ta da rik ik a k n i
""".split()), key=lambda s: (-len(s), s))
# Imperfectivo y nombre verbal sobre el radical: hartzen → har(tu), ikusten → ikus(i), egiten → egi(n).
VERB_SUFFIXES_EU = sorted(set("""
tzeagatik teagatik tzearen tearen tzeari teari tzerik terik tzeko teko tzera tera tzean tean tzeak teak tzea tea
tzen ten tze te
""".split()), key=lambda s: (-len(s), s))
VERB_TAILS_EU = ["tu", "du", "i", "n", "ri", "u", ""]  # el radical solo, al final: eratzen → eratu antes que era
# Subordinadas sobre el verbo conjugado: dela → da, zuela → zuen, direnean → dira, dudala → dut.
SUBORD_EU = sorted(set("elarik enean enetik elako enik enez eneko ela en larik nean netik lako nik nez neko la n".split()), key=lambda s: (-len(s), s))


def eu_old_spellings(w):
    """Grafía de los clásicos (Garoa, Peru Abarka) → la actual: baño → baino, ziran → ziren, zuan → zuen,
    nere → nire, det → dut, eztu → du, etzuan → zuan, y la h que no escribían (andi → handi, bear → behar).
    Solo se prueban si la palabra tal cual no da nada (van al final de los candidatos)."""
    out = []
    v = w.replace("iñ", "in").replace("ñ", "in")
    v = re.sub(r"([zndgt])uan", r"\1uen", v)
    v = re.sub(r"iran", "iren", v)
    v = re.sub(r"^([zd])an", r"\1en", v)
    v = re.sub(r"^ner([ei])", r"nir\1", v)
    v = re.sub(r"^de(t|zu|gu)", r"du\1", v)  # det, dezu, degu (guipuzcoano) → dut, duzu, dugu
    v = re.sub(r"^len", "lehen", v)            # lenago → lehenago
    v = re.sub(r"^zar", "zahar", v)            # zarrak → zaharrak
    v = re.sub(r"andu$", "an", v)              # izandu → izan
    if v != w:
        out.append(v)
    for x in [w] + out[:1]:
        if x.startswith("ezt") and len(x) > 4:
            out.append("d" + x[3:])
        if x.startswith("etz") and len(x) > 4:
            out.append("z" + x[3:])
    for x in [w] + out[:1]:
        if x[:1] in ("a", "e", "i", "o", "u"):
            out.append("h" + x)
        m = re.search(r"([aeiou])([aeiou])", x)
        if m:
            out.append(x[: m.start(2)] + "h" + x[m.start(2):])
    return out


def eu_candidates(w, infl=None, variants=True):
    """Candidatos en el orden de candidatesEu; con `infl`, también forma → lema como hace el JS."""
    infl = infl or {}
    out = []

    def push(c):
        if c and len(c) > 1 and c not in out:
            out.append(c)

    push(w)
    if w in infl:
        push(infl[w])
    # Primero el verbo: hartzen es hartu (coger), no hartz (oso) + -en.
    for suf in VERB_SUFFIXES_EU:
        if w.endswith(suf) and len(w) - len(suf) >= 2:
            r = w[: -len(suf)]
            for tail in VERB_TAILS_EU:
                push(r + tail)
    for suf in NOUN_SUFFIXES_EU:
        if w.endswith(suf) and len(w) - len(suf) >= 2:
            r = w[: -len(suf)]
            push(r)
            if suf[0] == "a" and not r.endswith("a"):
                push(r + "a")  # neskaren → neska: la -a del lema se funde con la del artículo
            if r.endswith("rr"):
                push(r[:-1])  # lurrean → lur
    stems = [w]
    for pre in ("bait", "ba"):
        if w.startswith(pre) and len(w) - len(pre) >= 2:
            rest = w[len(pre):]
            stems += [rest, "d" + rest]  # baitzen → zen, baitu → du, baita → da
    for s in stems:
        push(s)
        for suf in SUBORD_EU:
            if s.endswith(suf) and len(s) - len(suf) >= 1:
                r = s[: -len(suf)]
                for c in (r, r + "a", r + "en", r + "n", r + "e"):
                    push(c)
                if r.endswith("d"):
                    push(r[:-1] + "t")
    if not variants:
        return out
    for v in eu_old_spellings(w):
        for c in eu_candidates(v, infl, False):
            push(c)
    for c in out[1:]:
        if c in infl:
            push(infl[c])
    return out


# Auxiliares vizcaínos (Peru Abarka, Kresala, Ipui onak): eban = zuen, dau = du, dot = dut, dabe = dute...
OLD_AUX = {
    "dot": "ukan", "dozu": "ukan", "dau": "ukan", "dogu": "ukan", "dozue": "ukan", "dabe": "ukan",
    "neban": "ukan", "eban": "ukan", "genduan": "ukan", "zenduan": "ukan", "eben": "ukan", "eurean": "ukan",
    "deutsat": "ukan", "deutso": "ukan", "deutsa": "ukan", "eutsan": "ukan", "eutsen": "ukan",
    "zan": "izan", "ziran": "izan", "dan": "izan", "nintzan": "izan", "ginean": "izan", "giñan": "izan",
    "zinean": "izan", "jatan": "izan", "jaku": "izan", "jako": "izan", "jakon": "izan", "yaku": "izan",
}


def subordinate_forms(f):
    """Formas con subordinante de un verbo conjugado: da → den, dena, dela, denean, delako, baita, bada;
    dut → dudan, dudala; zuen → zuena, zuela. Son las palabras más frecuentes de un texto y las reglas
    genéricas las confunden con otras (dela → den "todo", baitzen → bai "sí")."""
    if f.endswith("n"):
        rel = f
    elif f.endswith("t"):
        rel = f[:-1] + "dan"
    elif f.endswith("a"):
        rel = f[:-1] + "en"
    else:
        rel = f + "en"
    out = [rel, rel + "a", rel + "ak", rel + "ean", rel + "ik", rel + "etik", rel + "ez"]
    out += [rel[:-1] + suf for suf in ("la", "lako", "larik")]
    out.append(rel[:-1] + "nean" if not rel.endswith("en") else rel + "ean")
    if f[0] == "d":
        out.append("bait" + f[1:])
    elif f[0] == "g":
        out.append("baik" + f[1:])
    elif f[0] == "n":
        out.append("bai" + f)
    else:
        out.append("bait" + f)
    out.append("ba" + f)
    return [x for x in out if x != f]


def short(text):
    text = re.sub(r"\s+", " ", text or "").strip()
    if len(text) > MAX_GLOSS:
        text = text[: MAX_GLOSS - 1].rsplit(" ", 1)[0] + "…"
    return text


def load_js_dict(path):
    s = Path(path).read_text(encoding="utf-8")
    return json.loads(s[s.index('"]=') + 3:].rstrip().rstrip(";"))


def lemma_of(raw):
    """'of esan and erran' / 'of joan # third-person plural' → 'esan' / 'joan'."""
    m = re.match(r"of ([^\s#(]+)", raw)
    return m.group(1).lower() if m else ""


def load_kaikki(path):
    entries, infl = {}, {}
    # Prioridad: formas sintéticas con entrada propia (du, zen: "of izan") > tablas de verbos > tablas de
    # nombres. "ziren" es el genitivo de "zi" (bellota), pero en un texto casi siempre es izan.
    synthetic, verb_forms = {}, {}
    with gzip.open(path, "rt", encoding="utf-8") as fh:
        for line in fh:
            e = json.loads(line)
            if e.get("lang_code") != "eu":
                continue
            word = (e.get("word") or "").strip().lower()
            if not word or " " in word:
                continue
            pos = POS_MAP.get(e.get("pos", ""), e.get("pos", ""))
            senses = []
            for s in e.get("senses", []):
                tags = set(s.get("tags", []))
                for fo in s.get("form_of", []) or s.get("alt_of", []):
                    lemma = re.split(r"\s+(?:and|or)(?:\s+|$)|\s*\(", (fo.get("word") or "").strip().lower())[0].strip()
                    if lemma and lemma != word:
                        infl.setdefault(word, lemma)
                if s.get("form_of") or "form-of" in tags:
                    continue
                if not s.get("glosses"):
                    # Formas sintéticas sin glosa: raw_tags "of izan" (du, zen), "of joan" (doa)...
                    lemma = next((lemma_of(r) for r in s.get("raw_tags", []) if r.startswith("of ")), "")
                    if lemma == "izan" and "transitive" in tags:
                        lemma = "ukan"
                    if lemma and lemma != word:
                        synthetic.setdefault(word, lemma)
                    continue
                if tags & SKIP_TAGS:
                    continue
                glosses = [short(g) for g in s.get("glosses", []) if g]
                item = {"t": [glosses[-1]]}  # la última glosa es la más específica
                if len(glosses) > 1:
                    item["d"] = glosses[0]
                senses.append(item)
                if len(senses) >= MAX_SENSES:
                    break
            if not senses:
                # Variantes dialectales de una forma sintética: dut → det (guipuzcoano), dot (vizcaíno).
                if word in synthetic:
                    for f in e.get("forms", []):
                        form = (f.get("form") or "").strip().lower()
                        if "alternative" in f.get("tags", []) and form and not re.search(r"[\s#]", form):
                            synthetic.setdefault(form, synthetic[word])
                continue
            rec = {"s": senses}
            if pos:
                rec["p"] = pos
            bucket = entries.setdefault(word, [])
            same = next((b for b in bucket if b.get("p") == pos), None)
            if same:
                same["s"].extend(it for it in senses if it not in same["s"])
                del same["s"][MAX_SENSES:]
            else:
                bucket.append(rec)
            # Tablas de declinación y conjugación de la propia entrada. Las de verbos mandan sobre las de
            # nombres: hartzen es hartu (coger) y no el genitivo plural de hartz (oso).
            target = verb_forms if pos == "v" else infl
            for f in e.get("forms", []):
                form = (f.get("form") or "").strip().lower()
                if not form or form == word or form == "-" or re.search(r"[\s#]", form) or set(f.get("tags", [])) & FORM_SKIP_TAGS:
                    continue
                target.setdefault(form, word)
    # Grafía antigua de los auxiliares (zan, ziran, zuan: la de los clásicos) y los vizcaínos más frecuentes,
    # que no están en kaikki y que las tablas de nombres confunden (zan: "zain", vena).
    for form, lemma in list(synthetic.items()):
        if form.endswith("en") and len(form) > 2:
            synthetic.setdefault(form[:-2] + "an", lemma)
    for form, lemma in OLD_AUX.items():
        synthetic[form] = lemma
    for forms in (synthetic, verb_forms):
        for form, lemma in list(forms.items()):
            for sub in subordinate_forms(form):
                forms.setdefault(sub, lemma)
    infl.update(verb_forms)
    infl.update(synthetic)
    return entries, infl


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("kaikki")
    ap.add_argument("--merge", help="diccionario directo eu-en (Apertium) cuyas entradas van primero")
    ap.add_argument("-o", "--out", required=True)
    args = ap.parse_args()

    entries, infl_raw = load_kaikki(args.kaikki)
    print(f"kaikki: {len(entries)} lemas, {len(infl_raw)} formas", file=sys.stderr)
    license_ = "Wiktionary (via kaikki.org) CC BY-SA 4.0"
    if args.merge:
        base = load_js_dict(args.merge)
        merged = dict(base["entries"])
        for lemma, recs in entries.items():
            direct = merged.get(lemma, [])
            if sum(len(r["s"]) for r in direct) >= MIN_DIRECT_SENSES:
                continue
            merged[lemma] = direct + recs
        entries = merged
        license_ = base["meta"].get("license", "") + "; " + license_

    infl, dropped = {}, 0
    for form, lemma in infl_raw.items():
        if lemma not in entries:
            continue
        if next((c for c in eu_candidates(form) if c in entries), None) == lemma:
            dropped += 1
            continue
        infl[form] = lemma

    data = {
        "meta": {"name": "Euskara → English", "src": "eu", "dst": "en", "license": license_, "entries": len(entries)},
        "entries": entries,
        "infl": infl,
    }
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write("// Generado por tools/build_kaikki_eu.py. No editar a mano.\n")
        fh.write('window.PDFR_DICTS=window.PDFR_DICTS||{};window.PDFR_DICTS["eu-en"]=')
        fh.write(payload)
        fh.write(";\n")
    print(f"{args.out}: {len(entries)} lemas, {len(infl)} flexiones guardadas ({dropped} regulares omitidas), {len(payload)/1e6:.1f} MB", file=sys.stderr)


if __name__ == "__main__":
    main()
