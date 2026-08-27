"""Genera js/beginners.js (libros infantiles y para principiantes por idioma) a partir del bloque JSON
final de cada informe docs/libros-infantiles-<idioma>.md.

Formato de cada entrada del JSON: {"source": "gb", "id": 36558, "title": ..., "author": ..., "level": "infantil",
"noimages": true} o {"source": "ws", "lang": "es", "title": "Título exacto de la página", "author": ..., "level": ...}.
Niveles: infantil | principiante | intermedio. Se ignoran fuentes que la app no sabe abrir (bloom, ia...).

Uso:
    python tools/build_beginners.py
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LANGS = ["es", "en", "it", "de", "ar", "zh"]
LEVELS = {"infantil", "principiante", "intermedio"}
ORDER = {"infantil": 0, "principiante": 1, "intermedio": 2}


def js_str(s):
    return json.dumps(str(s), ensure_ascii=False)


def load(lang):
    doc = ROOT / "docs" / f"libros-infantiles-{lang}.md"
    if not doc.is_file():
        return []
    text = doc.read_text(encoding="utf-8")
    blocks = re.findall(r"```json\s*(\[.*?\])\s*```", text, flags=re.S)
    if not blocks:
        print(f"{doc.name}: sin bloque JSON", file=sys.stderr)
        return []
    try:
        items = json.loads(blocks[-1])
    except json.JSONDecodeError as e:
        print(f"{doc.name}: JSON inválido ({e})", file=sys.stderr)
        return []
    out, seen = [], set()
    for it in items:
        src = it.get("source")
        level = it.get("level")
        if level not in LEVELS or not it.get("title"):
            continue
        if src == "gb" and isinstance(it.get("id"), int):
            key = ("gb", it["id"])
            rec = {"gb": it["id"], "noimages": bool(it.get("noimages"))}
        elif src == "ws":
            key = ("ws", it["title"])
            rec = {"ws": it.get("lang") or lang}
        else:
            continue
        if key in seen:
            continue
        seen.add(key)
        rec.update({"title": it["title"].strip(), "author": (it.get("author") or "").strip(), "level": level})
        out.append(rec)
    out.sort(key=lambda r: ORDER[r["level"]])
    return out


def main():
    lines = [
        "/* Libros para niños y lectores principiantes, por idioma de lectura. Se mezclan en el catálogo de cada",
        "   idioma con un distintivo de nivel y tienen su propio filtro (\"Infantil y principiantes\").",
        "   Fuentes: `gb` = ID de Project Gutenberg (EPUB vía el proxy; `noimages` pide la versión sin",
        "   imágenes cuando la ilustrada pesa decenas de MB); `ws` = título exacto de una página de",
        "   Wikisource en ese idioma (API con CORS, sin proxy). GENERADO por tools/build_beginners.py a partir",
        "   del bloque JSON de docs/libros-infantiles-<idioma>.md; no editar a mano. */",
        "window.BEGINNERS = {",
    ]
    total = 0
    for lang in LANGS:
        items = load(lang)
        if not items:
            continue
        lines.append(f"  {lang}: [")
        for r in items:
            head = f"gb: {r['gb']}" + (", noimages: true" if r.get("noimages") else "") if "gb" in r else f"ws: {js_str(r['ws'])}"
            lines.append(f"    {{ {head}, title: {js_str(r['title'])}, author: {js_str(r['author'])}, level: {js_str(r['level'])} }},")
        lines.append("  ],")
        total += len(items)
        print(f"{lang}: {len(items)} libros", file=sys.stderr)
    lines.append("};")
    (ROOT / "js" / "beginners.js").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"js/beginners.js: {total} libros", file=sys.stderr)


if __name__ == "__main__":
    main()
