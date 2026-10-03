"""Diccionarios directos a partir de un diccionario bilingüe de Apertium (.dix, GPL).

Uso:
    python tools/build_apertium.py tools/apertium-eu-es.eu-es.dix --left eu --right es -o tools/eu-es-apertium.js --reverse tools/es-eu-apertium.js

Cada <e> empareja un lema de la izquierda con uno de la derecha (<l>/<r>, o <i> si coinciden) con su
categoría (<s n="n"/>, <s n="vblex"/>...). Los espacios de las locuciones van como <b/>. `r="LR"` marca
una entrada solo de izquierda a derecha y `r="RL"` solo de derecha a izquierda: en cada sentido van
primero las traducciones que valen en ese sentido y detrás las del otro (siguen siendo equivalentes,
solo que no son la traducción preferida). Mismo formato de salida que build_dict.py, sin `infl`
(las flexiones salen de kaikki y de los lematizadores del JS).
"""
import argparse
import json
import sys
import xml.etree.ElementTree as ET

POS_MAP = {
    "n": "n", "np": "pn", "vblex": "v", "vbmod": "v", "vbser": "v", "vbhaver": "v", "vbdo": "v", "vaux": "v",
    "adj": "adj", "adv": "adv", "preadv": "adv", "pr": "prep", "post": "postp", "cnjcoo": "conj", "cnjsub": "conj",
    "cnjadv": "conj", "prn": "pron", "det": "det", "num": "num", "ij": "int", "rel": "pron",
}
MAX_TRANS = 6


def side(el):
    """Texto del lema (con <b/> como espacio) y primera etiqueta <s n=...>."""
    if el is None:
        return "", ""
    parts = [el.text or ""]
    tags = []
    for ch in el.iter():
        if ch is el:
            continue
        if ch.tag == "b":
            parts.append(" ")
        elif ch.tag == "s":
            tags.append(ch.get("n", ""))
        elif ch.tag == "g":
            parts.append(ch.text or "")
        parts.append(ch.tail or "")
    return " ".join("".join(parts).split()), tags[0] if tags else ""


def read_pairs(path):
    pairs = []  # (izquierda, derecha, pos, dirección)
    for _, e in ET.iterparse(path, events=("end",)):
        if e.tag != "e":
            continue
        p = e.find("p")
        if p is not None:
            (lw, lt), (rw, rt) = side(p.find("l")), side(p.find("r"))
        else:
            lw, lt = side(e.find("i"))
            rw, rt = lw, lt
        pos = POS_MAP.get(lt) or POS_MAP.get(rt) or ""
        if lw and rw and pos != "pn":  # los nombres propios no aportan al lector
            pairs.append((lw, rw, pos, e.get("r", "")))
        e.clear()
    return pairs


def build(pairs, from_left, src, dst, license_):
    # word -> pos -> [(rango, orden, traducción)]: primero las de una palabra ("izan" → "ser" antes que
    # "ser cuestión de") y, dentro de eso, las que valen en este sentido.
    found = {}
    for n, (lw, rw, pos, direction) in enumerate(pairs):
        word, trans = (lw, rw) if from_left else (rw, lw)
        if "_" in trans or "_" in word:
            continue
        own = direction != ("RL" if from_left else "LR")
        found.setdefault(word.lower(), {}).setdefault(pos, []).append(((" " in trans, not own), n, trans))
    entries = {}
    for word, by_pos in found.items():
        recs = []
        for pos, items in sorted(by_pos.items(), key=lambda kv: min(kv[1])):
            ts = []
            for _, _, t in sorted(items):
                if t not in ts:
                    ts.append(t)
            rec = {"s": [{"t": ts[:MAX_TRANS]}]}
            if pos:
                rec["p"] = pos
            recs.append(rec)
        entries[word] = recs
    return {"meta": {"name": f"{src} → {dst}", "src": src, "dst": dst, "license": license_, "entries": len(entries)}, "entries": entries, "infl": {}}


def write(data, path):
    pair = data["meta"]["src"] + "-" + data["meta"]["dst"]
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("// Generado por tools/build_apertium.py. No editar a mano.\n")
        fh.write('window.PDFR_DICTS=window.PDFR_DICTS||{};window.PDFR_DICTS["' + pair + '"]=')
        fh.write(payload)
        fh.write(";\n")
    print(f"{path}: {len(data['entries'])} lemas, {len(payload)/1e6:.1f} MB", file=sys.stderr)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dix")
    ap.add_argument("--left", required=True)
    ap.add_argument("--right", required=True)
    ap.add_argument("-o", "--out", required=True, help="izquierda → derecha")
    ap.add_argument("--reverse", help="derecha → izquierda")
    args = ap.parse_args()
    pairs = read_pairs(args.dix)
    lic = f"Apertium {args.left}-{args.right} GPL"
    write(build(pairs, True, args.left, args.right, lic), args.out)
    if args.reverse:
        write(build(pairs, False, args.right, args.left, lic), args.reverse)


if __name__ == "__main__":
    main()
