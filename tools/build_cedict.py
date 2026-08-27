"""Construye dict/zh-en.js (chino → inglés) a partir de CC-CEDICT (CC BY-SA 4.0,
https://www.mdbg.net/chinese/dictionary?page=cedict): 125.000 entradas con forma tradicional,
simplificada, pinyin y glosas inglesas.

  - Las claves son la forma SIMPLIFICADA. Para leer textos en tradicional (los de Gutenberg lo
    son casi todos), el fichero lleva en `meta.t2s` un mapa carácter tradicional → simplificado
    (sacado de las propias entradas) que dictionary.js aplica a la palabra pulsada y, si el lector
    quiere, a todo el libro en pantalla.
  - El pinyin (con marcas de tono) va como definición `d` de cada entrada.
  - No hay `infl`: el chino no flexiona; lo difícil es SEGMENTAR (dónde empieza y acaba la
    palabra), y eso lo hace popup.js probando contra estas claves.

Uso:
    python tools/build_cedict.py tools/cedict.txt.gz -o dict/zh-en.js
"""
import argparse
import gzip
import json
import re
import sys

MAX_GLOSS = 6
TONES = {
    "a": "aāáǎà", "e": "eēéěè", "i": "iīíǐì", "o": "oōóǒò", "u": "uūúǔù", "ü": "üǖǘǚǜ",
}


def pinyin_marks(syllable):
    """shou1 → shǒu; lu:4 → lǜ; tono 5 (neutro) sin marca."""
    m = re.match(r"^([a-zA-Z:]+)([1-5])$", syllable)
    if not m:
        return syllable
    body, tone = m.group(1).replace("u:", "ü").replace("U:", "Ü"), int(m.group(2))
    if tone == 5:
        return body
    lower = body.lower()
    # Regla: la marca va en a/e si están; si no, en la o de "ou"; si no, en la última vocal.
    if "a" in lower:
        idx = lower.index("a")
    elif "e" in lower:
        idx = lower.index("e")
    elif "ou" in lower:
        idx = lower.index("o")
    else:
        vowels = [i for i, ch in enumerate(lower) if ch in "aeiouü"]
        if not vowels:
            return body
        idx = vowels[-1]
    ch = body[idx]
    marked = TONES.get(ch.lower(), ch)[tone] if ch.lower() in TONES else ch
    if ch.isupper():
        marked = marked.upper()
    return body[:idx] + marked + body[idx + 1:]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cedict")
    ap.add_argument("-o", "--out", default="dict/zh-en.js")
    args = ap.parse_args()

    entries = {}
    t2s = {}
    n = 0
    opener = gzip.open if args.cedict.endswith(".gz") else open
    with opener(args.cedict, "rt", encoding="utf-8") as fh:
        for line in fh:
            if line.startswith("#"):
                continue
            m = re.match(r"^(\S+) (\S+) \[([^\]]*)\] /(.*)/\s*$", line)
            if not m:
                continue
            trad, simp, pinyin, glosses = m.groups()
            if len(trad) == len(simp):
                for a, b in zip(trad, simp):
                    if a != b:
                        t2s.setdefault(a, b)
            gl = [g.strip() for g in glosses.split("/") if g.strip()]
            gl = [g for g in gl if not g.startswith("CL:")][:MAX_GLOSS]  # CL: son clasificadores, no glosas
            if not gl:
                continue
            py = " ".join(pinyin_marks(s) for s in pinyin.split())
            sense = {"t": gl, "d": py}
            bucket = entries.setdefault(simp, [])
            # Mismo simplificado con varias pronunciaciones → varias acepciones
            if not any(s["d"] == py and s["t"] == gl for r in bucket for s in r["s"]):
                if bucket:
                    bucket[0]["s"].append(sense)
                else:
                    bucket.append({"s": [sense]})
            n += 1

    data = {
        "meta": {
            "name": "中文 → English",
            "src": "zh",
            "dst": "en",
            "license": "CC-CEDICT (MDBG) CC BY-SA 4.0",
            "entries": len(entries),
            "t2s": t2s,
        },
        "entries": entries,
        "infl": {},
    }
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write("// Generado por tools/build_cedict.py. No editar a mano.\n")
        fh.write('window.PDFR_DICTS=window.PDFR_DICTS||{};window.PDFR_DICTS["zh-en"]=')
        fh.write(payload)
        fh.write(";\n")
    print(f"{args.out}: {len(entries)} lemas de {n} líneas, {len(t2s)} caracteres trad→simp, {len(payload)/1e6:.1f} MB", file=sys.stderr)


if __name__ == "__main__":
    main()
