"""Плюшевый мишка в ночном колпаке. Точки опоры частей совпадают с суставами в shell/src/wake/scene/bear.ts."""
import math

import bmesh
from mathutils import Vector

from lib import at, ball, empty, fbm, finish, lathe, lin, melt, mix, parent, pivot, smooth, torus
from paint import bake_ao, join, material, paint, use

FUR, FUR_HI, LIGHT, PAD, DARK = lin('#9c5a28'), lin('#c07a3e'), lin('#f0c48a'), lin('#e79aa0'), lin('#24150f')
BLUSH, WHITE, CAP, CAP_HI = lin('#ff8fa8'), lin('#fff6e2'), lin('#4f7fff'), lin('#a9c4ff')


def fur(p, n):
    """Мех: светлее сверху, с лёгкими пятнами — как ворс, уложенный в разные стороны."""
    k = 0.5 + 0.5 * n.y + fbm(p, 9.0) * 0.35
    return mix(FUR, FUR_HI, k * 0.75)


def oval(p, c, rx, ry, rz=None):
    d = Vector(((p.x - c[0]) / rx, (p.y - c[1]) / ry, (p.z - c[2]) / (rz or rx)))
    return d.length


def build_torso():
    bm = bmesh.new()
    ball(bm, at(0, 0.47, 0, 0.47, 0.5, 0.44))
    ball(bm, at(0, 0.3, 0.02, 0.5, 0.36, 0.47))
    ball(bm, at(0, 0.24, -0.45, 0.12))  # хвостик
    ob = melt(finish(bm, 'Torso'), 0.03, 8)

    def color(p, n):
        d = math.hypot(p.x / 0.33, (p.y - 0.42) / 0.37)
        return mix(LIGHT, fur(p, n), smooth(0.86, 1.0, d) if p.z > 0 else 1)
    paint(ob, color)
    return ob


def build_head():
    bm = bmesh.new()
    ball(bm, at(0, 1.2, 0, 0.45, 0.41, 0.42), 40)
    for s in (-1, 1):
        ball(bm, at(s * 0.2, 1.1, 0.1, 0.25, 0.22, 0.24))  # щёки
        ball(bm, at(s * 0.32, 1.53, -0.02, 0.16, 0.16, 0.1))  # уши
    ball(bm, at(0, 1.11, 0.3, 0.21, 0.155, 0.18))  # мордочка
    ob = melt(finish(bm, 'Head', (0, 1.2, 0)), 0.02, 6)

    def color(p, n):
        c = fur(p, n)
        c = mix(LIGHT, c, smooth(0.88, 1.04, oval(p, (0, 1.105, 0.3), 0.215, 0.16, 0.2)))
        for s in (-1, 1):
            if n.z > 0.25:
                c = mix(LIGHT, c, smooth(0.55, 0.75, oval(p, (s * 0.32, 1.53, 0.05), 0.15, 0.15, 0.2)))
            c = mix(BLUSH, c, 0.35 + 0.65 * smooth(0.3, 1.0, oval(p, (s * 0.29, 1.1, 0.3), 0.1, 0.075, 0.16)))
        return c
    paint(ob, color)
    return ob


def build_face(head):
    gloss = material('Gloss', 0.12)
    eyes = []
    for i, s in enumerate((-1, 1)):
        bm = bmesh.new()
        ball(bm, at(0, 0, 0, 0.056, 0.066, 0.03), 24)
        ball(bm, at(0.016, 0.024, 0.022, 0.016), 12)
        eye = finish(bm, 'EyeL' if i == 0 else 'EyeR', (0, 0, 0))
        paint(eye, lambda p, n: WHITE if (p - Vector((0.016, 0.024, 0.022))).length < 0.0175 else DARK)
        eye.location = (s * 0.15, -0.375, 1.27)
        eyes.append(use(eye, gloss))
    bm = bmesh.new()
    ball(bm, at(0, 1.185, 0.475, 0.07, 0.05, 0.045), 24)
    nose = finish(bm, 'Nose', (0, 1.185, 0.475))
    paint(nose, lambda p, n: mix(DARK, lin('#6b4a3c'), smooth(0.3, 1.0, n.y) * 0.8))
    bm = bmesh.new()
    torus(bm, at(0, 0, 0, rot=(0, 0, math.pi)), 0.05, 0.013, 20, 10, math.pi)
    mouth = finish(bm, 'Mouth', (0, 0, 0))
    paint(mouth, lambda p, n: DARK)
    mouth.location = (0, -0.47, 1.06)
    for ob in (*eyes, use(nose, gloss), use(mouth, material('Matte', 0.9))):
        parent(ob, head)
    return eyes, mouth, nose


def build_cap():
    """Колпак: мягкий конус, кончик свисает набок; опушка и помпон."""
    tilt = at(0, 0, 0, rot=(-0.25, 0, 0))
    bm = bmesh.new()
    rings, seg, n = [], 28, 14
    for i in range(n + 1):
        t = i / n
        r = 0.31 * (1 - t) ** 0.85 + 0.012
        c = Vector((-0.2 * t * t, 0.62 * t - 0.1 * t ** 3, 0))
        rings.append([bm.verts.new(tilt @ (c + Vector((math.cos(a) * r, 0, math.sin(a) * r)))) for a in (math.tau * s / seg for s in range(seg))])
    for a, b in zip(rings, rings[1:]):
        for s in range(seg):
            bm.faces.new((a[s], a[(s + 1) % seg], b[(s + 1) % seg], b[s]))
    cone = finish(bm, 'CapCone', (0, 0, 0))
    paint(cone, lambda p, n: mix(CAP, CAP_HI, smooth(0.55, 0.9, math.sin(p.length * 34)) * 0.85))
    bm = bmesh.new()
    torus(bm, tilt @ at(0, 0, 0, rot=(math.pi / 2, 0, 0)), 0.31, 0.075, 40, 14)
    ball(bm, tilt @ at(-0.2, 0.55, 0, 0.105), 24)
    fluff = finish(bm, 'CapFluff', (0, 0, 0))
    for v in fluff.data.vertices:
        v.co += v.normal * fbm(v.co, 28.0, 2) * 0.012
    paint(fluff, lambda p, n: mix(WHITE, lin('#e9dcc6'), 0.5 - 0.5 * n.y))
    cap = join([cone, fluff], 'Cap')
    cap.location = (0.02, 0.04, 1.5)
    return use(cap, material('Plush', 0.85, sheen=0.7))


def build_limb(name, origin, r, length, paw, pad_fn):
    bm = bmesh.new()
    lathe(bm, [(0.02, 0.1 * r), (r * 0.9, 0), (r, -length * 0.3), (r * 0.94, -length), (0.02, -length - 0.02)], 20)
    ball(bm, at(0, 0, 0, r * 1.02))
    ball(bm, at(*paw[:3], *paw[3:]))
    ob = melt(finish(bm, name, (0, 0, 0)), 0.018, 6)
    paint(ob, lambda p, n: pad_fn(p, n, fur(p + Vector(origin), n)))
    ob.location = (origin[0], -origin[2], origin[1])
    return ob


def arm_pad(length):
    return lambda p, n, c: mix(LIGHT, c, smooth(0.8, 1.0, oval(p, (0, -length - 0.14, 0.06), 0.1, 0.1, 0.12)))


def leg_pad(p, n, c):
    if n.y > -0.2:
        return c
    c = mix(LIGHT, c, smooth(0.85, 1.0, oval(p, (0, -0.56, 0.06), 0.115, 0.3, 0.15)))
    for dx, dz in ((-0.07, 0.19), (0, 0.215), (0.07, 0.19)):
        c = mix(PAD, c, smooth(0.7, 1.0, oval(p, (dx, -0.56, dz), 0.03, 0.3, 0.03)))
    return mix(PAD, c, smooth(0.75, 1.0, oval(p, (0, -0.56, 0.05), 0.07, 0.3, 0.085)))


def build_bear():
    plush = material('Plush', 0.85, sheen=0.7)
    root, hips = empty('BearRoot'), empty('Hips')
    torso, head = use(build_torso(), plush), use(build_head(), plush)
    eyes, mouth, nose = build_face(head)
    cap = build_cap()
    arms = [use(build_limb(n, (s * 0.45, 0.75, 0), 0.125, 0.4, (0, -0.44, 0.03, 0.15, 0.15, 0.16), arm_pad(0.4)), plush) for n, s in (('ArmL', -1), ('ArmR', 1))]
    legs = [use(build_limb(n, (s * 0.22, 0.05, 0.05), 0.155, 0.38, (0, -0.42, 0.07, 0.17, 0.14, 0.21), leg_pad), plush) for n, s in (('LegL', -1), ('LegR', 1))]
    bake_ao([torso, head], [cap, nose], 0.7, 0.5)
    bake_ao([cap], [head], 0.7, 0.4)
    for ob in arms + legs:
        bake_ao([ob], [], 0.5, 0.3)
    parent(hips, root)
    for ob in (torso, *legs):
        parent(ob, hips)
    for ob in (head, *arms):
        parent(ob, torso)
    parent(cap, head)
    for ob in (torso, head, cap, *eyes, mouth, *arms, *legs):
        pivot(ob)
    return root
