"""Lista de libros en euskera de Armiarma (https://armiarma.eus/liburu-e/) → js/armiarma.js.

Armiarma ofrece en EPUB ~320 clásicos de la literatura vasca (siglos XVI-XX: narrativa, poesía, teatro,
ensayo, crónica y textos religiosos) y ~60 obras de la colección Literatura Unibertsala traducidas al
euskera. Su web no envía CORS: los EPUB se bajan por api.php?r=book/armiarma (con caché en el servidor).
La lista sale de las mismas llamadas que hace su página (cgi-bin/liburu-e/ajax-ordenatu.pl), una por siglo.

Uso:
    python tools/build_armiarma.py -o js/armiarma.js
"""
import argparse
import html
import json
import re
import sys
import urllib.parse
import urllib.request

LIST_URL = "https://armiarma.eus/cgi-bin/liburu-e/ajax-ordenatu.pl"
LISTS = ["kla_16_ord", "kla_18_ord", "kla_19_ord", "kla_201_ord", "kla_202_ord", "itz_ord"]
# Orden en el catálogo: primero lo que más se lee (narrativa vasca y literatura universal), los textos
# religiosos al final.
GENRE_ORDER = {"narratiba": 0, "": 1, "poesia": 2, "antzerkia": 3, "saiakera": 4, "kronika": 5, "erlijioa": 6}


def fetch(list_id):
    data = urllib.parse.urlencode({"id": list_id, "mo": "data1Ord"}).encode()
    req = urllib.request.Request(LIST_URL, data=data, headers={"User-Agent": "Glosa (build_armiarma.py)"})
    return urllib.request.urlopen(req, timeout=60).read().decode("latin-1")  # la web va en ISO-8859-1


def parse(page):
    out = []
    for li in re.findall(r"<li>(.*?)</li>", page, re.S):
        head = re.search(r"<b>(.*?) (?:-|:) <i>(.*?)</i></b>", li, re.S)
        epub = re.search(r'jaitsi\?m=(\w+)&(?:amp;)?f=([^"]+?)\.epub', li)
        if not head or not epub:
            continue
        genre = re.search(r'class="zerre-gene">\((.*?)\)', li)
        date = re.search(r'class="zerre-data">\s*([^<(]*)', li)
        year = re.search(r"\b(1[5-9]\d\d|20\d\d)\b", date.group(1)) if date else None
        out.append({
            "m": epub.group(1),
            "f": html.unescape(epub.group(2)),
            "title": " ".join(html.unescape(head.group(2)).split()),
            "author": " ".join(html.unescape(head.group(1)).split()),
            "genre": genre.group(1) if genre else "",
            "year": int(year.group(1)) if year else 0,
        })
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("-o", "--out", default="js/armiarma.js")
    args = ap.parse_args()
    books, seen = [], set()
    for list_id in LISTS:
        for b in parse(fetch(list_id)):
            if (b["m"], b["f"]) not in seen:
                seen.add((b["m"], b["f"]))
                books.append(b)
    books.sort(key=lambda b: (GENRE_ORDER.get(b["genre"], 1), b["year"] or 9999))
    rows = [[b["m"], b["f"], b["title"], b["author"], b["genre"], b["year"]] for b in books]
    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write("/* Libros en euskera de Armiarma (armiarma.eus/liburu-e): [m, f, título, autor, género, año].\n")
        fh.write("   m = kla (clásico vasco) o itz (traducción); f = nombre del fichero sin .epub.\n")
        fh.write("   GENERADO por tools/build_armiarma.py; no editar a mano. */\n")
        fh.write("window.ARMIARMA = ")
        fh.write(json.dumps(rows, ensure_ascii=False, separators=(",", ":")).replace("],[", "],\n["))
        fh.write(";\n")
    print(f"{args.out}: {len(rows)} libros", file=sys.stderr)


if __name__ == "__main__":
    main()
