"""Кровать, одеяло, тумбочка с лампой, коврик и тапочки. Размеры — как в shell/src/wake/scene/bed.ts."""
import math

import bmesh
from mathutils import Vector

from lib import at, ball, box, fbm, finish, lathe, lin, melt, mix, pillow, slab, smooth, soften, torus, tube
from paint import join, material, paint, use

WOOD, WOOD_D, WOOD_L, CREAM = lin('#96592e'), lin('#6c3c20'), lin('#b97a44'), lin('#fff6e6')
PINK, PINK_L, GOLD, SKY = lin('#f772ae'), lin('#ffc4dc'), lin('#ffd25a'), lin('#cfe3ff')
TOP, FOOT_Z, LEN = 0.62, 1.05, 1.45


def wood(p, n):
    """Дерево: тёмные и светлые волокна вдоль доски."""
    g = fbm((p.x * 1.5, p.y * 14, p.z * 1.5), 1.0, 2) if abs(n.z) > 0.6 else fbm((p.x * 14, p.y * 1.5, p.z * 1.5), 1.0, 2)
    return mix(mix(WOOD, WOOD_D, smooth(0.0, 0.5, g)), WOOD_L, smooth(0.05, 0.5, -g))


def star(p, cx, cy, r):
    a = math.atan2(p.x - cx, p.y - cy)
    return math.hypot(p.x - cx, p.y - cy) / (r * (0.6 + 0.4 * math.cos(5 * a)))


def post(bm, x, z, h):
    prof = [(0.072, 0), (0.072, 0.1), (0.058, 0.14), (0.058, h - 0.2), (0.075, h - 0.16), (0.075, h - 0.1), (0.045, h - 0.06), (0.03, h - 0.02)]
    lathe(bm, prof, 16, at(x, 0, z))
    ball(bm, at(x, h + 0.04, z, 0.085), 20)


def build_wood():
    bm = bmesh.new()
    for x in (-0.62, 0.62):
        post(bm, x, -1.18, 1.42)
        post(bm, x, 1.08, 0.92)
    posts = finish(bm, 'posts')
    bm = bmesh.new()
    box(bm, at(0, 0.32, -0.05, 1.3, 0.16, 2.3))
    slab(bm, -0.6, 0.6, 0.55, lambda x: 1.28 + 0.26 * math.cos(x / 0.6 * math.pi / 2) ** 0.7, -1.225, -1.135, 72, 40)
    slab(bm, -0.6, 0.6, 0.45, lambda x: 0.78 + 0.1 * math.cos(x / 0.6 * math.pi / 2) ** 0.7, 1.04, 1.12, 36, 8)
    # тумбочка: корпус, столешница, ящик, ножки, основание лампы и книжка
    box(bm, at(-1.05, 0.3, -0.9, 0.5, 0.46, 0.45))
    box(bm, at(-1.05, 0.555, -0.9, 0.58, 0.05, 0.52))
    box(bm, at(-1.05, 0.38, -0.668, 0.4, 0.2, 0.03))
    for dx in (-0.2, 0.2):
        for dz in (-0.17, 0.17):
            tube(bm, at(-1.05 + dx, 0.04, -0.9 + dz, 1, 0.08, 1), 0.025, 0.035, 10)
    frame = soften(finish(bm, 'frame', smooth_shade=False), 0.018, 0, 3)
    frame.data.shade_smooth()
    bm = bmesh.new()
    lathe(bm, [(0.1, 0.58), (0.1, 0.6), (0.04, 0.63), (0.03, 0.8), (0.04, 0.82)], 20, at(-1.05, 0, -0.9))
    ball(bm, at(-1.05, 0.38, -0.64, 0.03), 14)
    lamp = finish(bm, 'lampbase')
    ob = join([frame, posts, lamp], 'BedWood')

    def color(p, n):
        c = wood(p, n)
        if n.z > 0.7 and p.z < -1.1:
            c = mix(lin('#ffe2a8'), c, smooth(0.9, 1.0, star(p, 0, 1.1, 0.3)))
        if (p - Vector((-1.05, 0.38, -0.64))).length < 0.04 or (p.x < -0.9 and p.y > 0.575 and p.z < -0.7 and math.hypot(p.x + 1.05, p.z + 0.9) < 0.12):
            c = GOLD
        return c
    paint(ob, color)
    return use(ob, material('Wood', 0.5))


def build_soft():
    bm = bmesh.new()
    box(bm, at(0, TOP - 0.11, -0.05, 1.2, 0.22, 2.2))
    mattress = soften(finish(bm, 'mattress', smooth_shade=False), 0.05, 2, 3)
    paint(mattress, lambda p, n: mix(CREAM, lin('#e9ddf5'), smooth(0.2, -0.6, n.y)))
    bm = bmesh.new()
    pillow(bm, at(0, TOP + 0.085, -0.86, 0.42, 0.1, 0.23))
    pil = finish(bm, 'pillow')
    paint(pil, lambda p, n: mix(SKY, lin('#f4f9ff'), smooth(0.2, 1.0, n.y)))
    # коврик: плетёные кольца
    bm = bmesh.new()
    rings = [(0.001, 0.03)] + [(0.05 * i, 0.03 + 0.008 * abs(math.sin(i * math.pi / 2.0))) for i in range(1, 17)] + [(0.82, 0.012), (0.82, 0.0)]
    lathe(bm, rings, 56, at(1.32, 0, 0.42, 1, 1, 0.78))
    rug = finish(bm, 'rug')
    bands = [lin(c) for c in ('#ff9ec6', '#fff3d6', '#7ecbff', '#ffd25a', '#b79cff')]
    paint(rug, lambda p, n: bands[int(math.hypot(p.x - 1.32, (p.z - 0.42) / 0.78) / 0.165) % 5])
    # тапочки
    slips = []
    for dx in (-0.14, 0.14):
        bm = bmesh.new()
        ball(bm, at(1.25 + dx, 0.075, 0.5, 0.085, 0.04, 0.15))
        ball(bm, at(1.25 + dx, 0.11, 0.43, 0.088, 0.065, 0.09))
        s = melt(finish(bm, 'slipper'), 0.012, 4)
        paint(s, lambda p, n: mix(GOLD, lin('#fff0b8'), smooth(0.3, 1.0, n.y) * 0.6))
        bm = bmesh.new()
        ball(bm, at(1.25 + dx, 0.17, 0.4, 0.035), 12)
        pom = finish(bm, 'pom')
        paint(pom, lambda p, n: CREAM)
        slips += [s, pom]
    return use(join([mattress, pil, rug, *slips], 'BedSoft'), material('Plush', 0.85, sheen=0.7))


def build_blanket():
    """Стёганое одеяло: свод над кроватью, привязан к изножью (код сжимает его к ногам)."""
    bm = bmesh.new()
    nu, nv, rows = 40, 36, []
    for j in range(nv + 1):
        v = j / nv
        row = []
        for i in range(nu + 1):
            u = i / nu
            a = -0.3 + (math.pi + 0.6) * u
            puff = 0.022 * (abs(math.sin(u * math.pi * 6)) * abs(math.sin(v * math.pi * 6))) ** 0.5
            row.append(bm.verts.new(((0.66 + puff) * math.cos(a), (0.6 + puff) * math.sin(a), -LEN * v)))
        rows.append(row)
    for a, b in zip(rows, rows[1:]):
        for i in range(nu):
            bm.faces.new((a[i], a[i + 1], b[i + 1], b[i]))
    torus(bm, at(0, 0, -LEN), 0.63, 0.06, 28, 12, math.pi)
    ob = finish(bm, 'Blanket', (0, 0, 0))
    ob.modifiers.new('solid', 'SOLIDIFY').thickness = 0.035
    from lib import bake_mods
    bake_mods(ob)

    def color(p, n):
        if p.z < -LEN + 0.075:
            return CREAM
        u, v = math.atan2(p.y, p.x) / math.pi, -p.z / LEN
        dot = math.hypot((u * 6) % 1 - 0.5, (v * 6) % 1 - 0.5)
        return mix(PINK_L, PINK, smooth(0.1, 0.17, dot))
    paint(ob, color)
    ob.location = (0, -FOOT_Z, TOP - 0.02)
    return use(ob, material('Plush', 0.85, sheen=0.7))


def build_shade():
    bm = bmesh.new()
    lathe(bm, [(0.2, 0.81), (0.125, 1.03), (0.11, 1.03), (0.185, 0.81)], 28, at(-1.05, 0, -0.9))
    ob = finish(bm, 'LampShade')
    paint(ob, lambda p, n: lin('#ffd98a'))
    return use(ob, material('LampShade', 0.6, emissive='#ffb347'))
