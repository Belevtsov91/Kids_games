"""Мишка Тёпа для страницы входа и главной: стоит, в шарфе. Суставы — как в shell/src/auth/scene/bear.ts."""
import math

import bmesh
from mathutils import Vector

from bear import BLUSH, DARK, LIGHT, WHITE, fur, oval
from lib import at, ball, empty, finish, lathe, lin, melt, mix, parent, pivot, smooth, torus
from paint import bake_ao, material, paint, use

SCARF, SCARF_HI = lin('#ff6fae'), lin('#ffb3d4')


def build_body():
    bm = bmesh.new()
    ball(bm, at(0, 0.87, 0, 0.6, 0.64, 0.56))
    ball(bm, at(0, 0.66, 0.02, 0.63, 0.46, 0.6))
    ball(bm, at(0, 0.6, -0.58, 0.14))  # хвостик
    for s in (-1, 1):  # ножки
        ball(bm, at(s * 0.3, 0.2, 0.2, 0.23, 0.2, 0.3))
    ob = melt(finish(bm, 'GBody'), 0.035, 8)

    def color(p, n):
        c = mix(LIGHT, fur(p, n), smooth(0.86, 1.0, math.hypot(p.x / 0.42, (p.y - 0.8) / 0.46)) if p.z > 0 else 1)
        for s in (-1, 1):  # подушечки на ступнях
            if n.z > 0.35 and p.y < 0.45:
                c = mix(LIGHT, c, smooth(0.75, 1.0, oval(p, (s * 0.3, 0.2, 0.5), 0.13, 0.12, 0.3)))
        return c
    paint(ob, color)
    return ob


def build_head():
    bm = bmesh.new()
    ball(bm, at(0, 1.78, 0, 0.55, 0.5, 0.51), 40)
    for s in (-1, 1):
        ball(bm, at(s * 0.25, 1.66, 0.12, 0.3, 0.27, 0.29))
        ball(bm, at(s * 0.39, 2.19, -0.02, 0.19, 0.19, 0.12))
    ball(bm, at(0, 1.68, 0.37, 0.25, 0.185, 0.21))
    ob = melt(finish(bm, 'GHead', (0, 1.78, 0)), 0.024, 6)

    def color(p, n):
        c = mix(LIGHT, fur(p, n), smooth(0.88, 1.04, oval(p, (0, 1.675, 0.37), 0.255, 0.19, 0.24)))
        for s in (-1, 1):
            if n.z > 0.25:
                c = mix(LIGHT, c, smooth(0.55, 0.75, oval(p, (s * 0.39, 2.19, 0.06), 0.18, 0.18, 0.24)))
        return c
    paint(ob, color)
    return ob


def build_face(head):
    gloss, matte = material('Gloss', 0.12), material('Matte', 0.9)
    parts = []
    for name, s in (('GEyeL', -1), ('GEyeR', 1)):
        bm = bmesh.new()
        ball(bm, at(0, 0, 0, 0.068, 0.08, 0.036), 24)
        ball(bm, at(0.02, 0.03, 0.027, 0.02), 12)
        eye = finish(bm, name)
        paint(eye, lambda p, n: WHITE if (p - Vector((0.02, 0.03, 0.027))).length < 0.022 else DARK)
        eye.location = (s * 0.18, -0.465, 1.86)
        parts.append(use(eye, gloss))
    for name, s in (('GCheekL', -1), ('GCheekR', 1)):
        bm = bmesh.new()
        ball(bm, at(0, 0, 0, 0.085, 0.06, 0.03), 16)
        ch = finish(bm, name)
        paint(ch, lambda p, n: BLUSH)
        ch.location, ch.rotation_euler = (s * 0.34, -0.41, 1.65), (0, 0, s * 0.6)
        parts.append(use(ch, matte))
    bm = bmesh.new()
    ball(bm, at(0, 1.77, 0.575, 0.085, 0.06, 0.055), 24)
    nose = finish(bm, 'GNose', (0, 1.77, 0.575))
    paint(nose, lambda p, n: mix(DARK, lin('#6b4a3c'), smooth(0.3, 1.0, n.y) * 0.8))
    parts.append(use(nose, gloss))
    bm = bmesh.new()
    torus(bm, at(0, 0, 0, rot=(0, 0, math.pi)), 0.06, 0.016, 20, 10, math.pi)
    mouth = finish(bm, 'GMouth')
    paint(mouth, lambda p, n: DARK)
    mouth.location = (0, -0.575, 1.61)
    parts.append(use(mouth, matte))
    for ob in parts:
        parent(ob, head)
    return parts


def build_arm(name, s):
    bm = bmesh.new()
    lathe(bm, [(0.02, 0.02), (0.13, 0), (0.145, -0.2), (0.135, -0.58), (0.02, -0.6)], 20)
    ball(bm, at(0, 0, 0, 0.145))
    ball(bm, at(0, -0.64, 0.02, 0.175, 0.175, 0.185))
    ob = melt(finish(bm, name), 0.02, 6)
    origin = Vector((s * 0.55, 1.2, 0))
    paint(ob, lambda p, n: mix(LIGHT, fur(p + origin, n), smooth(0.8, 1.0, oval(p, (0, -0.8, 0.07), 0.12, 0.12, 0.14))))
    ob.location = (origin.x, 0, origin.y)
    return ob


def build_scarf():
    bm = bmesh.new()
    torus(bm, at(0, 1.33, 0, rot=(math.pi / 2, 0, 0)), 0.4, 0.105, 40, 14)
    for i, (dx, dy, rz) in enumerate(((0.2, -0.22, 0.25), (0.3, -0.16, 0.7))):  # концы шарфа
        ball(bm, at(0.12 + dx, 1.3 + dy, 0.4, 0.075, 0.2, 0.05, (0, 0, rz)), 16)
    ob = finish(bm, 'GScarf')
    paint(ob, lambda p, n: mix(SCARF, SCARF_HI, smooth(0.5, 0.9, math.sin(math.atan2(p.z, p.x) * 9 + p.y * 30))))
    return ob


def build_guard():
    plush = material('Plush', 0.85, sheen=0.7)
    root = empty('GBear')
    body, head, scarf = use(build_body(), plush), use(build_head(), plush), use(build_scarf(), plush)
    face = build_face(head)
    arms = [use(build_arm('GArmL', -1), plush), use(build_arm('GArmR', 1), plush)]
    bake_ao([body, head, scarf], [face[4]], 0.7, 0.5)
    for ob in arms:
        bake_ao([ob], [], 0.5, 0.3)
    for ob in (body, head, scarf, *arms):
        parent(ob, root)
    for ob in (head, *arms, *face[:4], face[5]):
        pivot(ob)
    return root
