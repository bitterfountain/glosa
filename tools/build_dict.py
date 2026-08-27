"""Convierte diccionarios TEI (WikDict / FreeDict) a dict/<par>.js para el lector.

Uso:
    python tools/build_dict.py tools/wikdict-eng-spa.tei tools/eng-spa/eng-spa.tei -o dict/en-es.js --src en --dst es

Salida: un fichero JS que registra window.PDFR_DICTS["<src>-<dst>"] = {...}. Se
carga con <script> (bajo demanda, desde dictionary.js) para que funcione abriendo
index.html directamente desde disco (file://), donde fetch() de un JSON está
bloqueado por el navegador.

Formato:
    meta:    {name, src, dst, license, entries}
    entries: {"house": [{"p": "n", "s": [{"t": ["casa"], "d": "definición corta"}]}]}
    infl:    {"houses": "house"}   # forma flexionada -> lema
"""
import argparse
import json
import re
import sys
import xml.etree.ElementTree as ET

TEI = "{http://www.tei-c.org/ns/1.0}"
MAX_SENSES = 8
MAX_TRANS = 6
MAX_DEF = 110
# WikDict usa n/v/adj/adv/pn y nombres largos para el resto: se acortan a las claves pos.* de i18n.js.
POS_MAP = {
    "noun": "n", "verb": "v", "adjective": "adj", "adverb": "adv", "numeral": "num", "preposition": "prep",
    "interjection": "int", "pronoun": "pron", "conjunction": "conj", "determiner": "det", "article": "det",
    "suffix": "suf", "prefix": "pref", "abbreviation": "abbr", "phrase": "phrase", "proverb": "phrase",
}


def clean_def(text):
    text = re.sub(r"\s+", " ", text or "").strip()
    text = re.sub(r"\s*\[from [^\]]*\]$", "", text)
    if len(text) > MAX_DEF:
        text = text[: MAX_DEF - 1].rsplit(" ", 1)[0] + "…"
    return text


def parse_entry(entry):
    form = entry.find(TEI + "form")
    if form is None:
        return None
    orth = form.find(TEI + "orth")
    if orth is None or not (orth.text or "").strip():
        return None
    headword = orth.text.strip()
    infl = [
        o.text.strip()
        for f in form.findall(TEI + "form")
        if f.get("type") == "infl"
        for o in f.findall(TEI + "orth")
        if o.text and o.text.strip()
    ]
    pos_el = entry.find(TEI + "gramGrp/" + TEI + "pos")
    pos = (pos_el.text or "").strip() if pos_el is not None else ""
    pos = POS_MAP.get(pos, pos)

    senses = []
    for sense in entry.findall(TEI + "sense"):
        trans = []
        for cit in sense.findall(TEI + "cit"):
            if cit.get("type") != "trans":
                continue
            for q in cit.findall(TEI + "quote"):
                t = (q.text or "").strip()
                if t and t not in trans:
                    trans.append(t)
        if not trans:
            continue
        defs = [clean_def(d.text) for d in sense.iter(TEI + "def") if d.text]
        defs = [d for d in defs if d]
        item = {"t": trans[:MAX_TRANS]}
        if defs:
            item["d"] = defs[0]
        senses.append(item)
        if len(senses) >= MAX_SENSES:
            break
    if not senses:
        return None
    rec = {"s": senses}
    if pos:
        rec["p"] = pos
    return headword, rec, infl


def load_tei(path, entries, infl_map):
    count = 0
    for _, el in ET.iterparse(path, events=("end",)):
        if el.tag != TEI + "entry":
            continue
        parsed = parse_entry(el)
        el.clear()
        if not parsed:
            continue
        headword, rec, infl = parsed
        key = headword.lower()
        bucket = entries.setdefault(key, [])
        # Evita duplicar la misma categoría con las mismas traducciones (WikDict + FreeDict).
        if not any(b.get("p") == rec.get("p") and b["s"][0]["t"] == rec["s"][0]["t"] for b in bucket):
            bucket.append(rec)
            count += 1
        for f in infl:
            fk = f.lower()
            # Solo formas de una palabra: WikDict deu-* trae perífrasis enteras ("werde gemacht werden",
            # "dem haus") que nadie pulsa como una sola palabra y que multiplican por 15 el fichero.
            if re.search(r"[\s()]", fk):
                continue
            if fk != key and fk not in entries:
                infl_map.setdefault(fk, key)
    return count


# ---- Réplica en Python del lematizador alemán de js/dictionary.js (candidatesDe) ----
# Sirve para no guardar las flexiones que el JS ya deduce por reglas (gehst → gehen): sin esta
# poda, WikDict deu-* mete más de un millón de formas y el fichero pasa de 30-50 MB.
SEP_PREFIXES_DE = "ab|an|auf|aus|bei|ein|mit|nach|vor|zu|zurück|weg|her|hin|los|fort|weiter|um|durch|über|unter|wieder"


def de_umlaut(s):
    return s.replace("ä", "a").replace("ö", "o").replace("ü", "u")


def de_candidates(w):
    out = []

    def push(c):
        if c and len(c) > 1 and c not in out:
            out.append(c)

    push(w)
    for suf in ("ern", "en", "er", "es", "em", "e", "n", "s"):
        if w.endswith(suf) and len(w) - len(suf) >= 3:
            r = w[: -len(suf)]
            push(r)
            if de_umlaut(r) != r:
                push(de_umlaut(r))
    stem = w
    if re.match(r"^ge.{3,}(t|en)$", w):
        stem = w[2:]
    stem = re.sub(r"(test|tet|ten|est|st|et|te|en|t|e|n)$", "", stem, count=1)
    if len(stem) > 1:
        push(stem + "en")
        push(stem + "n")
        if de_umlaut(stem) != stem:
            push(de_umlaut(stem) + "en")
    m = re.match("^(" + SEP_PREFIXES_DE + ")ge(.{2,}?)(t|en)$", w)
    if m:
        push(m.group(1) + m.group(2) + "en")
    if w.endswith("sten"):
        push(de_umlaut(w[:-4]))
    if w.endswith("ste"):
        push(de_umlaut(w[:-3]))
    if w.endswith("er"):
        push(de_umlaut(w[:-2]))
    return out


PRUNERS = {"de": de_candidates}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("tei", nargs="+", help="ficheros TEI, el primero tiene prioridad")
    ap.add_argument("-o", "--out", required=True)
    ap.add_argument("--src", default="en")
    ap.add_argument("--dst", default="es")
    ap.add_argument("--name", default="English → Español")
    ap.add_argument(
        "--license",
        default="WikDict (Wiktionary via DBnary) CC BY-SA 3.0; FreeDict eng-spa GPL",
    )
    ap.add_argument(
        "--prune-infl",
        choices=sorted(PRUNERS),
        help="quita las flexiones que el lematizador por reglas de dictionary.js ya resuelve (idioma origen)",
    )
    args = ap.parse_args()

    entries, infl = {}, {}
    for path in args.tei:
        n = load_tei(path, entries, infl)
        print(f"{path}: {n} acepciones", file=sys.stderr)
    # Una forma flexionada que resulte ser también lema no debe redirigir.
    infl = {k: v for k, v in infl.items() if k not in entries and v in entries}
    if args.prune_infl:
        rules = PRUNERS[args.prune_infl]
        before = len(infl)
        infl = {k: v for k, v in infl.items() if v not in rules(k)}
        print(f"flexiones: {before} -> {len(infl)} tras podar las regulares ({args.prune_infl})", file=sys.stderr)

    data = {
        "meta": {
            "name": args.name,
            "src": args.src,
            "dst": args.dst,
            "license": args.license,
            "entries": len(entries),
        },
        "entries": entries,
        "infl": infl,
    }
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    pair = args.src + "-" + args.dst
    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write("// Generado por tools/build_dict.py. No editar a mano.\n")
        fh.write('window.PDFR_DICTS=window.PDFR_DICTS||{};window.PDFR_DICTS["' + pair + '"]=')
        fh.write(payload)
        fh.write(";\n")
    print(f"{args.out}: {len(entries)} lemas, {len(infl)} flexiones, {len(payload)/1e6:.1f} MB", file=sys.stderr)


if __name__ == "__main__":
    main()
