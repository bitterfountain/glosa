"""Diccionario por PIVOTE: A → B (glosas o traducciones inglesas) → C, con un diccionario B → C.

Ejemplo, árabe → español a partir de árabe → inglés y de inglés → español:
    python tools/build_pivot.py dict/ar-en.js dict/en-es.js -o dict/ar-es.js --name "العربية → Español"

Para cada acepción del primer diccionario se toman sus glosas inglesas, se trocean en
candidatos ("to run quickly" → "run quickly", "run"; "big, large" → "big", "large") y se buscan
en el segundo; la glosa inglesa se conserva como definición (`d`) para dar contexto. Las
flexiones (`infl`) se heredan del primero. Mismo pivote que usa build_es_ar.py.
"""
import argparse
import json
import re
import sys
from pathlib import Path

MAX_SENSES = 6
MAX_TRANS = 4
MAX_DEF = 110
STOP = {"a", "an", "the", "to", "of", "or", "and", "in", "on", "at", "by", "with", "for", "be", "one", "someone", "something", "etc", "sth", "sb"}


def load_js_dict(path):
    s = Path(path).read_text(encoding="utf-8")
    return json.loads(s[s.index('"]=') + 3:].rstrip().rstrip(";"))


def short(text):
    text = re.sub(r"\s+", " ", text or "").strip()
    if len(text) > MAX_DEF:
        text = text[: MAX_DEF - 1].rsplit(" ", 1)[0] + "…"
    return text


def tokens(gloss):
    g = re.sub(r"\([^)]*\)|\[[^\]]*\]", " ", gloss.lower())
    g = re.sub(r"^\s*(to|a|an|the)\s+", "", g)
    out = []
    for p in re.split(r"\s*[,;/]\s*|\s+or\s+", g):
        p = re.sub(r"[^a-z' -]", " ", p).strip()
        words = [w for w in p.split() if w not in STOP]
        if not words:
            continue
        out.append(" ".join(words[:3]))
        if len(words) > 1:
            out.append(words[0])
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("first", help="diccionario A → B (glosas en B)")
    ap.add_argument("second", help="diccionario B → C")
    ap.add_argument("-o", "--out", required=True)
    ap.add_argument("--name", required=True)
    ap.add_argument("--license", default="")
    args = ap.parse_args()

    a = load_js_dict(args.first)
    b = load_js_dict(args.second)
    src, dst = a["meta"]["src"], b["meta"]["dst"]
    b_entries = b["entries"]

    def translate(token):
        for cand in (token, token[:-1] if token.endswith("s") and len(token) > 3 else None):
            if not cand:
                continue
            recs = b_entries.get(cand)
            if recs:
                out = []
                for r in recs:
                    for s in r["s"]:
                        for w in s["t"]:
                            if w not in out:
                                out.append(w)
                return out
        return []

    entries = {}
    for lemma, recs in a["entries"].items():
        new_recs = []
        for rec in recs:
            senses = []
            for sense in rec["s"]:
                found = []
                for gloss in sense.get("t", []):
                    for tok in tokens(gloss):
                        for w in translate(tok):
                            if w not in found:
                                found.append(w)
                        if len(found) >= MAX_TRANS:
                            break
                    if len(found) >= MAX_TRANS:
                        break
                if found:
                    # La definición conserva lo que ya traía el primer diccionario (p. ej. el pinyin del
                    # chino) delante de la glosa inglesa que se usó para pivotar.
                    ctx = " · ".join([x for x in (sense.get("d", ""), "; ".join(sense.get("t", []))) if x])
                    senses.append({"t": found[:MAX_TRANS], "d": short(ctx)})
                if len(senses) >= MAX_SENSES:
                    break
            if senses:
                nr = {"s": senses}
                if rec.get("p"):
                    nr["p"] = rec["p"]
                new_recs.append(nr)
        if new_recs:
            entries[lemma] = new_recs

    infl = {k: v for k, v in a.get("infl", {}).items() if v in entries and k not in entries}
    data = {
        # Se heredan las claves extra del primer diccionario (p. ej. `t2s` del chino).
        "meta": dict(a["meta"], name=args.name, src=src, dst=dst, license=args.license or (a["meta"].get("license", "") + "; " + b["meta"].get("license", "")), entries=len(entries)),
        "entries": entries,
        "infl": infl,
    }
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    pair = src + "-" + dst
    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write("// Generado por tools/build_pivot.py. No editar a mano.\n")
        fh.write('window.PDFR_DICTS=window.PDFR_DICTS||{};window.PDFR_DICTS["' + pair + '"]=')
        fh.write(payload)
        fh.write(";\n")
    print(f"{args.out}: {len(entries)} lemas de {len(a['entries'])}, {len(infl)} flexiones, {len(payload)/1e6:.1f} MB", file=sys.stderr)


if __name__ == "__main__":
    main()
