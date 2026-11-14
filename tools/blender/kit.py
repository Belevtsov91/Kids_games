"""Общие детали сцен: основа летающего острова и деревья. Цвет задаёт код сцены (материал Tint),
в вершинах лежат только мягкие тени и лёгкие пятна — поэтому один файл подходит всем островам."""
import math

import bmesh

from lib import at, ball, fbm, finish, lathe, lin, melt, mix, smooth, soften, tube
from paint import bake_ao, material, paint, use

W = (1.0, 1.0, 1.0)
BARK = lin('#8a5a34')


def grey(k):
    return (k, k, k)


def island_top():
    prof = [(0.001, 0.275)] + [(0.1 * i, 0.275) for i in range(1, 10)] + [(0.97, 0.268), (1.005, 0.22), (1.025, 0.1), (1.0, -0.04), (0.95, -0.2), (0.9, -0.275)]
    bm = bmesh.new()
    lathe(bm, prof, 72, wobble=lambda a, i: 1 + (0.025 * math.sin(3 * a + 1) + 0.015 * math.sin(7 * a + 2)) * min(1, i / 9))
    ob = finish(bm, 'KitIslandTop')
    paint(ob, lambda p, n: mix(grey(0.8 + 0.2 * smooth(-0.4, 0.5, fbm((p.x, 0, p.z), 3.0))), grey(0.5), smooth(0.2, -0.25, p.y)))
    return ob


def island_soil():
    bm = bmesh.new()
    lathe(bm, [(0.9, -0.2), (0.97, -0.3), (0.95, -0.45), (0.9, -0.6), (0.86, -0.76), (0.4, -0.8)], 72, wobble=lambda a, i: 1 + 0.03 * math.sin(3 * a + 1) + 0.03 * fbm((math.cos(a) * 2, i, math.sin(a) * 2), 1.0))
    ob = finish(bm, 'KitIslandSoil')
    paint(ob, lambda p, n: grey(0.72 + 0.28 * smooth(-0.3, 0.3, fbm((p.x * 2, p.y * 14, p.z * 2), 1.0))))
    return ob


def island_rock():
    """Скала под островом: радиус 0.86, высота 1.5 — код растягивает её под размер острова."""
    prof = [(0.4, 0.02), (0.86, 0)] + [(0.86 * (1 - t) ** 0.8 + 0.01, -1.5 * t) for t in (i / 12 for i in range(1, 13))]
    bm = bmesh.new()
    lathe(bm, prof, 48)
    for v in bm.verts:
        p = v.co
        if p.y < -0.02:
            k = 1 + 0.2 * fbm((p.x * 2, p.y * 2.4, p.z * 2), 1.0, 2) + 0.07 * round(fbm((p.x, p.y, p.z), 5.0) * 2)
            v.co.x, v.co.z = p.x * k, p.z * k
    for i in range(3):
        a = i * 2.1 + 0.4
        ball(bm, at(math.cos(a) * 0.6, -1.25 - i * 0.14, math.sin(a) * 0.6, 0.1 + 0.04 * i, 0.09 + 0.04 * i, 0.1 + 0.03 * i), 14)
    ob = finish(bm, 'KitIslandRock')
    paint(ob, lambda p, n: grey(0.62 + 0.38 * smooth(-0.3, 0.3, fbm((p.x, p.y * 4, p.z), 1.6, 2))))
    return ob


def pine():
    bm = bmesh.new()
    tube(bm, at(0, 0.2, 0, 1, 0.42, 1), 0.09, 0.06, 10)
    trunk = finish(bm, 'KitPineTrunk')
    paint(trunk, lambda p, n: BARK)
    bm = bmesh.new()
    for i in range(3):
        r, y = 0.44 - 0.1 * i, 0.36 + i * 0.32
        lathe(bm, [(0.02, y + 0.62), (r * 0.5, y + 0.3), (r, y), (r * 0.6, y - 0.03), (0.02, y + 0.02)], 18, wobble=lambda a, j, i=i: 1 + 0.07 * math.sin(6 * a + i))
    leaves = soften(finish(bm, 'KitPineLeaves', smooth_shade=False), 0, 1)
    paint(leaves, lambda p, n: grey(0.7 + 0.3 * smooth(-0.2, 1.0, n.y) + fbm(p, 6.0) * 0.06))
    return trunk, leaves


def round_tree():
    bm = bmesh.new()
    lathe(bm, [(0.085, 0), (0.06, 0.2), (0.05, 0.5)], 10)
    trunk = finish(bm, 'KitTreeTrunk')
    paint(trunk, lambda p, n: BARK)
    bm = bmesh.new()
    for dx, dy, dz, r in ((0, 0.64, 0, 0.27), (0.19, 0.55, 0.04, 0.2), (-0.18, 0.56, -0.03, 0.2), (0.02, 0.53, 0.18, 0.18), (0, 0.82, -0.04, 0.19), (-0.04, 0.55, -0.19, 0.18)):
        ball(bm, at(dx, dy, dz, r), 18)
    leaves = melt(finish(bm, 'KitTreeLeaves'), 0.03, 3)
    paint(leaves, lambda p, n: grey(0.68 + 0.32 * smooth(-0.3, 1.0, n.y) + fbm(p, 6.0) * 0.08))
    return trunk, leaves


def build_kit():
    tint, matte = material('Tint', 0.9), material('Matte', 0.9)
    top, soil, rock = use(island_top(), tint), use(island_soil(), tint), use(island_rock(), tint)
    bake_ao([top, soil], [], 0.75, 0.5, 96)
    bake_ao([rock], [], 0.6, 0.4)
    for trunk, leaves in (pine(), round_tree()):
        use(trunk, matte)
        use(leaves, tint)
        bake_ao([trunk, leaves], [], 0.7, 0.4)
