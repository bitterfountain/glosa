"""Construye dict/es-en.js o dict/it-en.js a partir del volcado de kaikki.org (Wiktionary inglés,
entradas en español o en italiano).

Uso:
    python tools/build_kaikki.py tools/kaikki-spanish.jsonl.gz -o dict/es-en.js
    python tools/build_kaikki.py tools/kaikki-italian.jsonl.gz --lang it --merge tools/it-en-wikdict.js -o dict/it-en.js

Con `--merge` (el it-en directo de WikDict + FreeDict) las traducciones directas van primero
tal cual y las glosas de kaikki rellenan los lemas que faltan y completan los que traen menos
de MIN_DIRECT_SENSES acepciones (como el --merge de build_pivot.py).

Fuente: https://kaikki.org/dictionary/Spanish/ o /Italian/ (CC BY-SA). Cada línea es una entrada
JSON con `word`, `pos`, `senses[].glosses` (en inglés) y, para las formas
flexionadas, `senses[].form_of[].word` (el lema). Salida con el mismo formato que
build_dict.py (ver ahí), pero:
  - `t` son las glosas inglesas cortas de cada acepción (no hay "traducción" separada),
  - `infl` solo guarda las formas que el lematizador por reglas de dictionary.js NO
    resolvería (irregulares: fui → ir, tuve → tener, dijo → decir...). Las regulares
    (andaba → andar) las deduce el JS y así el fichero no se dispara de tamaño.
    Réplicas en Python de candidatesEs / candidatesIt de js/dictionary.js: si cambian
    allí, cambiar aquí.
"""
from pathlib import Path
import unicodedata
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
MIN_DIRECT_SENSES = 3
MAX_GLOSS = 100
LANGS = {
    "es": {"name": "Español → English", "kaikki": "es"},
    "it": {"name": "Italiano → English", "kaikki": "it"},
}
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


# ---- Réplica en Python del lematizador italiano de js/dictionary.js ----
VERB_ENDINGS_IT = [
    "erebbero", "irebbero", "eremmo", "iremmo", "ereste", "ireste", "eresti", "iresti", "erebbe", "irebbe", "erei", "irei",
    "eranno", "iranno", "eremo", "iremo", "erete", "irete", "erai", "irai", "erò", "irò", "erà", "irà",
    "assero", "essero", "issero", "assimo", "essimo", "issimo", "aste", "este", "iste", "assi", "essi", "issi", "asse", "esse", "isse",
    "arono", "erono", "irono", "ammo", "emmo", "immo", "asti", "esti", "isti", "ai", "ei", "ii", "ò", "é", "ì",
    "avamo", "evamo", "ivamo", "avate", "evate", "ivate", "avano", "evano", "ivano", "avo", "evo", "ivo", "avi", "evi", "ivi", "ava", "eva", "iva",
    "iscono", "isco", "isci", "isce", "iamo", "ate", "ete", "ite", "ano", "ono", "ando", "endo",
    "ato", "ata", "ati", "uto", "uta", "uti", "ute", "ito", "ita", "iti",
    "o", "i", "a", "e",
]


def it_candidates(w):
    out = []

    def push(c):
        if c and len(c) > 1 and c not in out:
            out.append(c)

    push(w)
    m = re.match(r"^(.+?)(glielo|gliela|glieli|gliele|gliene|melo|mela|telo|tela|selo|sela|celo|cela|velo|vela|mi|ti|si|ci|vi|lo|la|li|le|ne|gli)$", w)
    stems = [w]
    if m and len(m.group(1)) > 2:
        stems.append(m.group(1))
    for s in stems:
        if s.endswith("chi"):
            push(s[:-3] + "co")
        if s.endswith("ghi"):
            push(s[:-3] + "go")
        if s.endswith("che"):
            push(s[:-3] + "ca")
        if s.endswith("ghe"):
            push(s[:-3] + "ga")
        if s.endswith("i"):
            push(s[:-1] + "o"); push(s[:-1] + "e"); push(s[:-1] + "a")
        if s.endswith("e"):
            push(s[:-1] + "a"); push(s[:-1] + "o")
        if s.endswith("a"):
            push(s[:-1] + "o")
        if s.endswith("mente"):
            push(s[:-5] + "e"); push(s[:-5] + "o")
        for suf in ("issimo", "issima", "issimi", "issime", "ino", "ina", "ini", "ine", "etto", "etta", "etti", "ette", "one", "oni"):
            if s.endswith(suf) and len(s) - len(suf) > 2:
                r = s[: -len(suf)]
                push(r + "o"); push(r + "a"); push(r + "e")
        for end in VERB_ENDINGS_IT:
            if s.endswith(end) and len(s) - len(end) >= 2:
                root = s[: -len(end)]
                conj = ("ere", "are", "ire") if end[0] == "e" else ("ire", "ere", "are") if end[0] == "i" else ("are", "ere", "ire")
                for inf in conj:
                    push(root + inf)
                if root.endswith("c") or root.endswith("g"):
                    push(root + "iare")
                if root.endswith("ch") or root.endswith("gh"):
                    push(root[:-1] + "are")
    bare = "".join(ch for ch in unicodedata.normalize("NFD", w) if not unicodedata.combining(ch))
    if bare != w:
        push(bare)
    return out


CANDIDATES = {"es": es_candidates, "it": it_candidates}


def load_js_dict(path):
    s = Path(path).read_text(encoding="utf-8")
    return json.loads(s[s.index('"]=') + 3:].rstrip().rstrip(";"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("-o", "--out", required=True)
    ap.add_argument("--lang", choices=sorted(LANGS), default="es")
    ap.add_argument("--merge", help="diccionario directo <lang>-en (WikDict/FreeDict) cuyas entradas van primero")
    args = ap.parse_args()
    lang = LANGS[args.lang]
    candidates = CANDIDATES[args.lang]

    entries = {}
    infl_raw = {}
    n = 0
    with gzip.open(args.src, "rt", encoding="utf-8") as fh:
        for line in fh:
            n += 1
            e = json.loads(line)
            if e.get("lang_code") != lang["kaikki"]:
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
                    # kaikki a veces mete la coordinación en el lema: "avere and (obsolete) havere" → "avere".
                    lemma = re.split(r"\s+(?:and|or)(?:\s+|$)|\s*\(", (fo.get("word") or "").strip().lower())[0].strip()
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

    license = "Wiktionary (via kaikki.org) CC BY-SA 4.0"
    if args.merge:
        base = load_js_dict(args.merge)
        merged = dict(base["entries"])
        for lemma, recs in entries.items():
            direct = merged.get(lemma, [])
            if sum(len(r["s"]) for r in direct) >= MIN_DIRECT_SENSES:
                continue
            merged[lemma] = direct + recs
        entries = merged
        license = (base["meta"].get("license", "") + "; " + license).strip("; ")

    # Solo se guardan las flexiones que las reglas del JS no resolverían.
    infl = {}
    dropped = 0
    for form, lemma in infl_raw.items():
        if lemma not in entries:
            continue
        # Una forma que es a la vez entrada propia (era → ser, vino → venir) se guarda
        # siempre: el lematizador nunca llega a aplicar reglas sobre ella.
        if form not in entries:
            resolved = next((c for c in candidates(form) if c in entries), None)
            if resolved == lemma:
                dropped += 1
                continue
        infl[form] = lemma

    pair = args.lang + "-en"
    data = {
        "meta": {
            "name": lang["name"],
            "src": args.lang,
            "dst": "en",
            "license": license,
            "entries": len(entries),
        },
        "entries": entries,
        "infl": infl,
    }
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    with open(args.out, "w", encoding="utf-8") as out:
        out.write("// Generado por tools/build_kaikki.py. No editar a mano.\n")
        out.write('window.PDFR_DICTS=window.PDFR_DICTS||{};window.PDFR_DICTS["' + pair + '"]=')
        out.write(payload)
        out.write(";\n")
    print(f"{n} líneas · {len(entries)} lemas · {len(infl)} flexiones irregulares guardadas ({dropped} regulares omitidas) · {len(payload)/1e6:.1f} MB", file=sys.stderr)


if __name__ == "__main__":
    main()
