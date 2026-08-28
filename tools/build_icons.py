from PIL import Image, ImageDraw, ImageChops
src = Image.open("logoGlosaBookReader.png").convert("RGBA")
# 1) recortar el margen blanco: caja de lo que no es blanco
bg = Image.new("RGBA", src.size, (255, 255, 255, 255))
diff = ImageChops.difference(src, bg).convert("L").point(lambda p: 255 if p > 20 else 0)
box = diff.getbbox()
tile = src.crop(box)
w, h = tile.size
side = max(w, h)
sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
sq.paste(tile, ((side - w) // 2, (side - h) // 2))
print("tile", box, sq.size)

def rounded(img, radius_frac):
    s = img.size[0]
    mask = Image.new("L", (s, s), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, s - 1, s - 1), radius=int(s * radius_frac), fill=255)
    out = img.copy()
    out.putalpha(ImageChops.multiply(out.getchannel("A"), mask))
    return out

# 2) emblema: la G con el libro (parte alta del azulejo), cuadrado sobre el propio fondo azul
ex0, ey0, ex1, ey1 = int(side * 0.17), int(side * 0.09), int(side * 0.83), int(side * 0.672)
eh = ey1 - ey0; ew = ex1 - ex0
# ensanchar hasta cuadrado con el azul del fondo (muestra tomada de un lateral)
blue = sq.getpixel((int(side * 0.08), int(side * 0.5)))
es = int(max(ew, eh) * 1.06)
emb = Image.new("RGBA", (es, es), blue)
emb.paste(sq.crop((ex0, ey0, ex1, ey1)), ((es - ew) // 2, (es - eh) // 2))
emb = rounded(emb, 0.22)

full = rounded(sq, 0.0)  # el azulejo ya trae sus esquinas redondeadas y transparencia fuera

def save(img, size, name):
    img.resize((size, size), Image.LANCZOS).save("icons/" + name, optimize=True)

for s in (16, 32, 48, 64):
    save(emb, s, f"favicon-{s}.png")
for s in (180, 192, 256, 512):
    save(full, s, f"icon-{s}.png")
save(full, 180, "apple-touch-icon.png")
# maskable (Android): el logo con margen de seguridad sobre fondo azul liso
m = Image.new("RGBA", (side, side), blue)
inner = sq.resize((int(side * 0.8), int(side * 0.8)), Image.LANCZOS)
m.alpha_composite(inner, (int(side * 0.1), int(side * 0.1)))
save(m, 512, "maskable-512.png")
# .ico multitamaño con el emblema
emb.resize((64, 64), Image.LANCZOS).save("icons/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
# emblema grande por si hace falta (og / redes)
save(emb, 512, "emblem-512.png")
print("ok")
