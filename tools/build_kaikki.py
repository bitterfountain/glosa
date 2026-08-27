"""Construye dict/es-en.js a partir del volcado de kaikki.org (Wiktionary inglés, entradas en español).

Uso:
    python tools/build_kaikki.py tools/kaikki-spanish.jsonl.gz -o dict/es-en.js

Fuente: https://kaikki.org/dictionary/Spanish/ (CC BY-SA). Cada línea es una entrada
JSON con `word`, `pos`, `senses[].glosses` (en inglés) y, para las formas
flexionadas, `senses[].form_of[].word` (el lema). Salida con el mismo formato que
build_dict.py (ver ahí), pero:
  - `t` son las glosas inglesas cortas de cada acepción (no hay "traducción" separada),
  - `infl` solo guarda las formas que el lematizador por reglas de dictionary.js NO
    resolvería (irregulares: fui → ir, tuve → tener, dijo → decir...). Las regulares
    (andaba → andar) las deduce el JS y así el fichero no se dispara de tamaño.
"""
import argparse
import gzip
import json
import re
import sys

POS_MAP = {
    "noun": "n", "verb": "v", "adj": "adj", "adv": "adv", "name": "pn", "prep": "prep",
    "conj": "conj", "pron": "pron", "num": "num", "intj": "int", "det": "det", "article": "det",
    "particle": "part", "phrase": "phrase", "prep_phrase": "phrase", "adv_phrase": "phrase",
    "proverb": "phrase", "suffix": "suf", "prefix": "pref", "contraction": "contr",
}
MAX_SENSES = 8
MAX_GLOSS = 100
SKIP_TAGS = {"obsolete", "archaic", "misspelling", "rare", "nonstandard", "eye-dialect"}


def short(text):
    text = re.sub(r"\s+", " ", text or "").strip()
    if len(text) > MAX_GLOSS:
        text = text[: MAX_GLOSS - 1].rsplit(" ", 1)[0] + "…"
    return text


# ---- Réplica en Python del lematizador español de js/dictionary.js ----
VERB_ENDINGS = [
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
]


def es_candidates(w):
    out = []

    def push(c):
        if c and len(c) > 1 and c not in out:
            out.append(c)

    push(w)
    m = re.match(r"^(.+?)(me|te|se|nos|os|lo|la|los|las|le|les)+$", w)
    stems = [w]
    if m and len(m.group(1)) > 2:
        stems.append(m.group(1))
    for s in stems:
        if s.endswith("es"):
            push(s[:-2]); push(s[:-1]); push(s[:-2] + "z") if s.endswith("ces") else None
        if s.endswith("s"):
            push(s[:-1])
        if s.endswith("a"):
            push(s[:-1] + "o")
        if s.endswith("as"):
            push(s[:-2] + "o")
        if s.endswith("mente"):
            push(s[:-5]); push(s[:-5][:-1] + "o")
        for suf in ("ísimo", "ísima", "ísimos", "ísimas", "ito", "ita", "itos", "itas", "cito", "cita"):
            if s.endswith(suf):
                push(s[: -len(suf)]); push(s[: -len(suf)] + "o"); push(s[: -len(suf)] + "a")
        for end in VERB_ENDINGS:
            if s.endswith(end) and len(s) - len(end) >= 2:
                root = s[: -len(end)]
                push(root + "ar"); push(root + "er"); push(root + "ir")
                if root.endswith("qu"):
                    push(root[:-2] + "car")
                if root.endswith("gu"):
                    push(root[:-2] + "gar")
                if root.endswith("c"):
                    push(root[:-1] + "zar")
                if root.endswith("y"):
                    push(root[:-1] + "er"); push(root[:-1] + "ir")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("-o", "--out", required=True)
    args = ap.parse_args()

    entries = {}
    infl_raw = {}
    n = 0
    with gzip.open(args.src, "rt", encoding="utf-8") as fh:
        for line in fh:
            n += 1
            e = json.loads(line)
            if e.get("lang_code") != "es":
                continue
            word = (e.get("word") or "").strip()
            if not word or " " in word and e.get("pos") not in ("phrase", "prep_phrase", "adv_phrase", "proverb"):
                pass
            key = word.lower()
            pos = POS_MAP.get(e.get("pos", ""), e.get("pos", ""))
            senses = []
            for s in e.get("senses", []):
                tags = set(s.get("tags", []))
                for fo in s.get("form_of", []) or s.get("alt_of", []):
                    lemma = (fo.get("word") or "").strip().lower()
                    if lemma and lemma != key:
                        infl_raw.setdefault(key, lemma)
                if "form-of" in tags or s.get("form_of"):
                    continue
                if tags & SKIP_TAGS:
                    continue
                glosses = [short(g) for g in s.get("glosses", []) if g]
                if not glosses:
                    continue
                item = {"t": [glosses[-1]]}  # la última glosa es la más específica
                if len(glosses) > 1:
                    item["d"] = glosses[0]
                senses.append(item)
                if len(senses) >= MAX_SENSES:
                    break
            if not senses:
                continue
            rec = {"s": senses}
            if pos:
                rec["p"] = pos
            bucket = entries.setdefault(key, [])
            same = next((b for b in bucket if b.get("p") == pos), None)
            if same:
                for it in senses:
                    if it not in same["s"] and len(same["s"]) < MAX_SENSES:
                        same["s"].append(it)
            else:
                bucket.append(rec)

    # Solo se guardan las flexiones que las reglas del JS no resolverían.
    infl = {}
    dropped = 0
    for form, lemma in infl_raw.items():
        if lemma not in entries:
            continue
        # Una forma que es a la vez entrada propia (era → ser, vino → venir) se guarda
        # siempre: el lematizador nunca llega a aplicar reglas sobre ella.
        if form not in entries:
            resolved = next((c for c in es_candidates(form) if c in entries), None)
            if resolved == lemma:
                dropped += 1
                continue
        infl[form] = lemma

    data = {
        "meta": {
            "name": "Español → English",
            "src": "es",
            "dst": "en",
            "license": "Wiktionary (via kaikki.org) CC BY-SA 4.0",
            "entries": len(entries),
        },
        "entries": entries,
        "infl": infl,
    }
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    with open(args.out, "w", encoding="utf-8") as out:
        out.write("// Generado por tools/build_kaikki.py. No editar a mano.\n")
        out.write('window.PDFR_DICTS=window.PDFR_DICTS||{};window.PDFR_DICTS["es-en"]=')
        out.write(payload)
        out.write(";\n")
    print(f"{n} líneas · {len(entries)} lemas · {len(infl)} flexiones irregulares guardadas ({dropped} regulares omitidas) · {len(payload)/1e6:.1f} MB", file=sys.stderr)


if __name__ == "__main__":
    main()
