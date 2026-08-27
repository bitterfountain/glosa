"""Construye dict/es-ar.js (español → árabe estándar) a partir de dos fuentes:

  1. Traducciones DIRECTAS al árabe del Wiktionary español (volcado de kaikki.org,
     kaikki.org/eswiktionary/Español/kaikki.org-dictionary-Español.jsonl.gz, CC BY-SA):
     pocas (~1.700 lemas) pero son las palabras más comunes y traen la definición en español.
  2. PIVOTE español → inglés → árabe para todo lo demás: las glosas inglesas de dict/es-en.js
     (kaikki.org) se buscan en dict/en-ar.js (FreeDict eng-ara, 87k lemas). La glosa inglesa
     se conserva como definición (`d`) para dar contexto.

Las flexiones irregulares (`infl`) se heredan de dict/es-en.js, así el lematizador español de
dictionary.js funciona igual (comieron → comer).

Uso:
    python tools/build_es_ar.py tools/kaikki-eswiktionary-espanol.jsonl.gz -o dict/es-ar.js
"""
import argparse
import gzip
import json
import re
import sys
from pathlib import Path

POS_MAP = {
    "noun": "n", "verb": "v", "adj": "adj", "adv": "adv", "name": "pn", "prep": "prep", "conj": "conj",
    "pron": "pron", "num": "num", "intj": "int", "det": "det", "article": "det", "phrase": "phrase",
}
MAX_SENSES = 6
MAX_TRANS = 4
MAX_DEF = 110
STOP_EN = {"a", "an", "the", "to", "of", "or", "and", "in", "on", "at", "by", "with", "for", "be", "one", "someone", "something", "etc"}


def load_js_dict(path):
    s = Path(path).read_text(encoding="utf-8")
    return json.loads(s[s.index('"]=') + 3:].rstrip().rstrip(";"))


def short(text):
    text = re.sub(r"\s+", " ", text or "").strip()
    if len(text) > MAX_DEF:
        text = text[: MAX_DEF - 1].rsplit(" ", 1)[0] + "…"
    return text


def direct_entries(kaikki_path):
    """Lemas del Wiktionary español con traducción al árabe: {lema: [{p, s:[{t, d}]}]}"""
    out = {}
    with gzip.open(kaikki_path, "rt", encoding="utf-8") as fh:
        for line in fh:
            d = json.loads(line)
            trans = [t for t in d.get("translations", []) if t.get("lang_code") == "ar" and t.get("word")]
            if not trans:
                continue
            word = (d.get("word") or "").strip().lower()
            if not word or " " in word:
                continue
            glosses = [short(" ".join(s.get("glosses") or [])) for s in d.get("senses", [])]
            senses = {}
            for t in trans:
                try:
                    idx = int(str(t.get("sense_index") or "1").split("-")[0]) - 1
                except ValueError:
                    idx = 0
                idx = max(0, idx)
                bucket = senses.setdefault(idx, {"t": [], "d": glosses[idx] if idx < len(glosses) else ""})
                w = re.sub(r"\s+", " ", t["word"]).strip()
                if w and w not in bucket["t"] and len(bucket["t"]) < MAX_TRANS:
                    bucket["t"].append(w)
            rec = {"p": POS_MAP.get(d.get("pos", ""), d.get("pos", "")), "s": []}
            for idx in sorted(senses):
                item = {"t": senses[idx]["t"]}
                if senses[idx]["d"]:
                    item["d"] = senses[idx]["d"]
                rec["s"].append(item)
            if rec["s"]:
                out.setdefault(word, []).append(rec)
    return out


def english_tokens(gloss):
    """'to run quickly (of animals)' → ['run', 'run quickly']; 'big, large' → ['big', 'large']"""
    g = re.sub(r"\([^)]*\)", " ", gloss.lower())
    g = re.sub(r"^\s*(to|a|an|the)\s+", "", g)
    parts = re.split(r"\s*[,;/]\s*|\s+or\s+", g)
    toks = []
    for p in parts:
        p = re.sub(r"[^a-z' -]", " ", p).strip()
        if not p:
            continue
        words = [w for w in p.split() if w not in STOP_EN]
        if not words:
            continue
        toks.append(" ".join(words[:3]))
        if len(words) > 1:
            toks.append(words[0])
    return toks


def pivot_entries(es_en, en_ar):
    ent_en_ar = en_ar["entries"]

    def arabic_for(token):
        for cand in (token, token[:-1] if token.endswith("s") and len(token) > 3 else None):
            if not cand:
                continue
            recs = ent_en_ar.get(cand)
            if recs:
                out = []
                for r in recs:
                    for s in r["s"]:
                        for w in s["t"]:
                            if w not in out:
                                out.append(w)
                return out
        return []

    out = {}
    for lemma, recs in es_en["entries"].items():
        new_recs = []
        for rec in recs:
            senses = []
            for sense in rec["s"]:
                ar = []
                for gloss in sense.get("t", []):
                    for tok in english_tokens(gloss):
                        for w in arabic_for(tok):
                            if w not in ar:
                                ar.append(w)
                        if len(ar) >= MAX_TRANS:
                            break
                    if len(ar) >= MAX_TRANS:
                        break
                if ar:
                    item = {"t": ar[:MAX_TRANS], "d": short("; ".join(sense.get("t", [])))}
                    senses.append(item)
                if len(senses) >= MAX_SENSES:
                    break
            if senses:
                nr = {"s": senses}
                if rec.get("p"):
                    nr["p"] = rec["p"]
                new_recs.append(nr)
        if new_recs:
            out[lemma] = new_recs
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("kaikki_es", help="volcado kaikki del Wiktionary español (jsonl.gz)")
    ap.add_argument("--es-en", default="dict/es-en.js")
    ap.add_argument("--en-ar", default="dict/en-ar.js")
    ap.add_argument("-o", "--out", default="dict/es-ar.js")
    args = ap.parse_args()

    es_en = load_js_dict(args.es_en)
    en_ar = load_js_dict(args.en_ar)
    direct = direct_entries(args.kaikki_es)
    print(f"directas (Wiktionary es): {len(direct)} lemas", file=sys.stderr)
    pivot = pivot_entries(es_en, en_ar)
    print(f"pivote es→en→ar: {len(pivot)} lemas", file=sys.stderr)

    entries = {}
    for lemma in set(direct) | set(pivot):
        recs = list(direct.get(lemma, []))
        # Las acepciones pivotadas van detrás de las directas, sin repetir traducciones ya presentes
        seen = {w for r in recs for s in r["s"] for w in s["t"]}
        for r in pivot.get(lemma, []):
            senses = [s for s in r["s"] if not all(w in seen for w in s["t"])]
            if senses:
                recs.append({**r, "s": senses[:MAX_SENSES]})
        if recs:
            entries[lemma] = recs

    infl = {k: v for k, v in es_en.get("infl", {}).items() if v in entries and k not in entries}
    data = {
        "meta": {
            "name": "Español → العربية",
            "src": "es",
            "dst": "ar",
            "license": "Wiktionary español CC BY-SA (vía kaikki.org); pivote: kaikki.org es→en CC BY-SA + FreeDict eng-ara GPL",
            "entries": len(entries),
        },
        "entries": entries,
        "infl": infl,
    }
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write("// Generado por tools/build_es_ar.py. No editar a mano.\n")
        fh.write('window.PDFR_DICTS=window.PDFR_DICTS||{};window.PDFR_DICTS["es-ar"]=')
        fh.write(payload)
        fh.write(";\n")
    print(f"{args.out}: {len(entries)} lemas ({len(direct)} directos), {len(infl)} flexiones, {len(payload)/1e6:.1f} MB", file=sys.stderr)


if __name__ == "__main__":
    main()
