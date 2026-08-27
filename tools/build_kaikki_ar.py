"""Construye dict/ar-en.js (árabe → inglés) a partir de:

  1. El volcado de kaikki.org del Wiktionary inglés para el árabe
     (https://kaikki.org/dictionary/Arabic/kaikki.org-dictionary-Arabic.jsonl.gz, CC BY-SA):
     ~77.000 entradas con glosas inglesas, categoría y, sobre todo, las FORMAS flexionadas
     (conjugaciones, plurales, casos), que van a `infl` para que el lematizador resuelva
     "كتبوا → كتب" sin reglas morfológicas complejas.
  2. FreeDict ara-eng (GPL, 53k lemas) como complemento para lo que kaikki no tenga.

Las claves se guardan SIN vocales (harakat) ni tatwil y con alif/ya normalizadas, igual que
hace `normalizeAr` en js/dictionary.js: los libros vienen casi siempre sin vocalizar.

Uso:
    python tools/build_kaikki_ar.py tools/kaikki-arabic.jsonl.gz tools/ara-eng/ara-eng.tei -o dict/ar-en.js
"""
import argparse
import gzip
import json
import re
import sys
import xml.etree.ElementTree as ET

TEI = "{http://www.tei-c.org/ns/1.0}"
POS_MAP = {
    "noun": "n", "verb": "v", "adj": "adj", "adv": "adv", "name": "pn", "prep": "prep", "conj": "conj",
    "pron": "pron", "num": "num", "intj": "int", "det": "det", "article": "det", "phrase": "phrase",
    "particle": "part", "prep_phrase": "phrase", "proverb": "phrase", "suffix": "suf", "prefix": "pref",
}
MAX_SENSES = 8
MAX_GLOSS = 100
SKIP_TAGS = {"obsolete", "archaic", "misspelling", "rare", "nonstandard"}
DIACRITICS = re.compile(r"[ً-ٰٟـۖ-ۭ]")


def normalize_ar(w):
    w = DIACRITICS.sub("", w or "")
    w = re.sub(r"[أإآٱ]", "ا", w)
    w = w.replace("ى", "ي")
    return w.strip()


def short(text):
    text = re.sub(r"\s+", " ", text or "").strip()
    if len(text) > MAX_GLOSS:
        text = text[: MAX_GLOSS - 1].rsplit(" ", 1)[0] + "…"
    return text


def load_kaikki(path, entries, infl):
    n = 0
    with gzip.open(path, "rt", encoding="utf-8") as fh:
        for line in fh:
            d = json.loads(line)
            word = normalize_ar(d.get("word", ""))
            if not word or " " in word:
                continue
            pos = POS_MAP.get(d.get("pos", ""), d.get("pos", ""))
            senses = []
            for s in d.get("senses", []):
                tags = set(s.get("tags", []))
                if tags & SKIP_TAGS:
                    continue
                form_of = s.get("form_of") or []
                if form_of:
                    lemma = normalize_ar(form_of[0].get("word", ""))
                    if lemma and lemma != word:
                        infl.setdefault(word, lemma)
                    continue
                glosses = [short(g) for g in (s.get("glosses") or []) if g]
                if not glosses:
                    continue
                # La glosa más específica es la última; las anteriores son contexto.
                item = {"t": [glosses[-1]]}
                if len(glosses) > 1:
                    item["d"] = short(" · ".join(glosses[:-1]))
                senses.append(item)
                if len(senses) >= MAX_SENSES:
                    break
            if senses:
                rec = {"s": senses}
                if pos:
                    rec["p"] = pos
                entries.setdefault(word, []).append(rec)
                n += 1
                # Formas flexionadas de la propia entrada (conjugación, plural, casos)
                for f in d.get("forms", []):
                    form = normalize_ar(f.get("form", ""))
                    ftags = set(f.get("tags", []))
                    if not form or " " in form or form == word or ftags & {"romanization", "table-tags", "inflection-template", "class"}:
                        continue
                    if re.search(r"[a-zA-Z]", form):
                        continue
                    infl.setdefault(form, word)
    return n


def load_freedict(path, entries):
    n = 0
    for _, el in ET.iterparse(path, events=("end",)):
        if el.tag != TEI + "entry":
            continue
        orth = el.find(TEI + "form/" + TEI + "orth")
        word = normalize_ar(orth.text if orth is not None else "")
        if word and " " not in word:
            trans = []
            for cit in el.iter(TEI + "cit"):
                if cit.get("type") != "trans":
                    continue
                for q in cit.findall(TEI + "quote"):
                    t = (q.text or "").strip()
                    if t and t not in trans:
                        trans.append(t)
            if trans:
                bucket = entries.setdefault(word, [])
                known = {t.lower() for r in bucket for s in r["s"] for t in s["t"]}
                fresh = [t for t in trans if t.lower() not in known]
                if fresh:
                    bucket.append({"s": [{"t": fresh[:6]}]})
                    n += 1
        el.clear()
    return n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("kaikki")
    ap.add_argument("freedict", nargs="?")
    ap.add_argument("-o", "--out", default="dict/ar-en.js")
    args = ap.parse_args()

    entries, infl = {}, {}
    n = load_kaikki(args.kaikki, entries, infl)
    print(f"kaikki: {n} entradas, {len(infl)} formas", file=sys.stderr)
    if args.freedict:
        m = load_freedict(args.freedict, entries)
        print(f"freedict: {m} entradas añadidas", file=sys.stderr)
    infl = {k: v for k, v in infl.items() if k not in entries and v in entries}

    data = {
        "meta": {
            "name": "العربية → English",
            "src": "ar",
            "dst": "en",
            "license": "kaikki.org (Wiktionary) CC BY-SA 4.0; FreeDict ara-eng 0.6.3 GPL",
            "entries": len(entries),
        },
        "entries": entries,
        "infl": infl,
    }
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write("// Generado por tools/build_kaikki_ar.py. No editar a mano.\n")
        fh.write('window.PDFR_DICTS=window.PDFR_DICTS||{};window.PDFR_DICTS["ar-en"]=')
        fh.write(payload)
        fh.write(";\n")
    print(f"{args.out}: {len(entries)} lemas, {len(infl)} flexiones, {len(payload)/1e6:.1f} MB", file=sys.stderr)


if __name__ == "__main__":
    main()
