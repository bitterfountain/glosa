"""Diccionarios directos X → euskera y euskera → X (X = en o es) a partir de Apertium y Wiktionary.

Fuentes, en este orden de preferencia:
  1. Apertium (tools/build_apertium.py, GPL): tools/<x>-eu-apertium.js y tools/eu-<x>-apertium.js.
  2. Las tablas de traducción al euskera del Wiktionary de X (volcados de kaikki.org, CC BY-SA):
     el inglés (https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl.gz, 523 MB;
     las traducciones van por acepción) o el español
     (https://kaikki.org/eswiktionary/Español/..., ya usado por build_es_ar.py). Dan X → eu y, al
     revés, eu → X.
  3. Solo con --vasco: las entradas en euskera del Wiktionary español
     (https://kaikki.org/eswiktionary/Vasco/kaikki.org-dictionary-Vasco.jsonl, ~3.000), cuya glosa
     corta es la traducción al español.

Uso:
    python tools/build_wikt_eu.py --lang en --dump tools/kaikki-english.jsonl.gz --to-eu dict/en-eu.js --from-eu tools/eu-en-direct.js --infl-from dict/en-es.js
    python tools/build_wikt_eu.py --lang es --dump tools/kaikki-eswiktionary-espanol.jsonl.gz --vasco tools/kaikki-eswiktionary-vasco.jsonl --to-eu tools/es-eu-direct.js --from-eu tools/eu-es-direct.js

`--infl-from` copia las flexiones de otro diccionario con el mismo origen (en-es.js para el inglés),
porque ni Apertium ni las tablas de traducción las traen.
"""
import argparse
import gzip
import json
import re
import sys
from pathlib import Path

POS_MAP = {
    "noun": "n", "verb": "v", "adj": "adj", "adv": "adv", "name": "pn", "prep": "prep", "postp": "postp", "conj": "conj",
    "pron": "pron", "num": "num", "intj": "int", "det": "det", "article": "det", "particle": "particle", "phrase": "phrase",
}
NAMES = {"en": "English", "es": "Español"}
MAX_TRANS = 6
MAX_SENSES = 6
MAX_DEF = 110


def load_js_dict(path):
    s = Path(path).read_text(encoding="utf-8")
    return json.loads(s[s.index('"]=') + 3:].rstrip().rstrip(";"))


def short(text):
    text = re.sub(r"\s+", " ", text or "").strip()
    text = re.sub(r"^\d+\.\s*", "", text)  # "1. to possess" → "to possess"
    if len(text) > MAX_DEF:
        text = text[: MAX_DEF - 1].rsplit(" ", 1)[0] + "…"
    return text


def read_translations(dump, lang):
    """(palabra X, categoría, acepción, palabra vasca) de las tablas de traducción del volcado."""
    out = []
    opener = gzip.open if dump.endswith(".gz") else open
    with opener(dump, "rt", encoding="utf-8") as fh:
        for line in fh:
            if '"eu"' not in line:
                continue
            e = json.loads(line)
            if e.get("lang_code") != lang:
                continue
            pos = POS_MAP.get(e.get("pos", ""), "")
            if pos == "pn":
                continue
            trs = [(t, t.get("sense", "")) for t in e.get("translations", []) or []]
            for s in e.get("senses", []):
                trs += [(t, t.get("sense") or (s.get("glosses") or [""])[0]) for t in s.get("translations", []) or []]
            for t, sense in trs:
                word = (t.get("word") or "").strip()
                if (t.get("lang_code") or t.get("code")) == "eu" and word:
                    out.append((e["word"].strip(), pos, short(sense), word))
    return out


def read_vasco(path):
    """(palabra vasca, categoría, glosa en español) de las entradas en euskera del Wiktionary español."""
    out = []
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            e = json.loads(line)
            pos = POS_MAP.get(e.get("pos", ""), "")
            if pos == "pn":
                continue
            for s in e.get("senses", []):
                for g in s.get("glosses", []) or []:
                    g = g.strip().rstrip(".")
                    # Solo las glosas que son una traducción ("Casa", "Perro, can"), no una definición.
                    for piece in re.split(r"\s*[,;]\s*", g):
                        if piece and len(piece.split()) <= 3:
                            out.append((e["word"].strip(), pos, piece[0].lower() + piece[1:]))
    return out


def add(entries, word, pos, trans, d=""):
    """Añade `trans` a la acepción (pos, d) de `word`, creando lo que falte."""
    word = word.lower()
    recs = entries.setdefault(word, [])
    rec = next((r for r in recs if r.get("p", "") == pos), None)
    if rec is None:
        rec = {"s": []}
        if pos:
            rec["p"] = pos
        recs.append(rec)
    if any(trans in s["t"] for s in rec["s"]):
        return
    sense = next((s for s in rec["s"] if s.get("d", "") == d), None)
    if sense is None:
        if len(rec["s"]) >= MAX_SENSES:
            return
        sense = {"t": []}
        if d:
            sense["d"] = d
        rec["s"].append(sense)
    if len(sense["t"]) < MAX_TRANS:
        sense["t"].append(trans)


def write(path, src, dst, entries, infl, license_):
    pair = src + "-" + dst
    names = dict(NAMES, eu="Euskara")
    data = {"meta": {"name": names[src] + " → " + names[dst], "src": src, "dst": dst, "license": license_, "entries": len(entries)}, "entries": entries, "infl": infl}
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("// Generado por tools/build_wikt_eu.py. No editar a mano.\n")
        fh.write('window.PDFR_DICTS=window.PDFR_DICTS||{};window.PDFR_DICTS["' + pair + '"]=')
        fh.write(payload)
        fh.write(";\n")
    print(f"{path}: {len(entries)} lemas, {len(infl)} flexiones, {len(payload)/1e6:.1f} MB", file=sys.stderr)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lang", choices=sorted(NAMES), required=True)
    ap.add_argument("--dump", required=True, help="volcado kaikki del Wiktionary de --lang (.jsonl o .jsonl.gz)")
    ap.add_argument("--vasco", help="entradas en euskera del Wiktionary español (solo --lang es)")
    ap.add_argument("--to-eu", required=True)
    ap.add_argument("--from-eu", required=True)
    ap.add_argument("--infl-from", help="diccionario con origen --lang cuyas flexiones se copian a --to-eu")
    args = ap.parse_args()
    x = args.lang
    to_eu = load_js_dict(f"tools/{x}-eu-apertium.js")["entries"]
    from_eu = load_js_dict(f"tools/eu-{x}-apertium.js")["entries"]

    trs = read_translations(args.dump, x)
    print(f"{args.dump}: {len(trs)} traducciones al euskera", file=sys.stderr)
    for word, pos, sense, eu in trs:
        add(to_eu, word, pos, eu, sense)
        if " " not in eu:
            add(from_eu, eu, pos, word, sense)
    if args.vasco:
        vasco = read_vasco(args.vasco)
        print(f"{args.vasco}: {len(vasco)} glosas", file=sys.stderr)
        for eu, pos, gloss in vasco:
            add(from_eu, eu, pos, gloss)

    lic = f"Apertium eu-{x} GPL; Wiktionary (via kaikki.org) CC BY-SA 4.0"
    infl = {}
    if args.infl_from:
        infl = {k: v for k, v in load_js_dict(args.infl_from).get("infl", {}).items() if v in to_eu and k not in to_eu}
    write(args.to_eu, x, "eu", to_eu, infl, lic)
    write(args.from_eu, "eu", x, from_eu, {}, lic)


if __name__ == "__main__":
    main()
