"""Летающий остров: трава, земля, скала снизу, деревья, кусты, цветы, грибы, камни и игрушки."""
import math
import random

import bmesh
from mathutils import Vector

from lib import at, ball, box, fbm, finish, lathe, lin, melt, mix, smooth, soften, tube
from paint import join, material, paint

G1, G2, G3 = lin('#5fc470'), lin('#3fa565'), lin('#8fdc7c')
SOIL, SOIL_D, ROCK, ROCK_D = lin('#a86f48'), lin('#7c4f34'), lin('#8468b4'), lin('#5c4689')
rnd = random.Random(7)


def free(x, z, pad=0.0):
    """Свободно ли место: не под кроватью, тумбочкой и ковриком."""
    if abs(x) < 0.95 + pad and -1.55 - pad < z < 1.4 + pad:
        return False
    if -1.5 - pad < x < -0.7 and -1.3 - pad < z < -0.5 + pad:
        return False
    return math.hypot(x - 1.32, (z - 0.42) / 0.78) > 0.95 + pad and math.hypot(x, z) < 2.85


def build_ground():
    top = [(0.001, 0)] + [(0.1 * i, 0) for i in range(1, 31)]
    side = [(3.08, -0.05), (3.14, -0.15), (3.1, -0.28), (2.96, -0.36), (2.92, -0.6), (2.8, -0.86), (2.6, -1.1), (2.3, -1.7), (1.85, -2.5), (1.25, -3.4), (0.62, -4.3), (0.05, -5.0)]
    bm = bmesh.new()
    lathe(bm, top + side, 96, wobble=lambda a, i: 1 + (0.05 * math.sin(3 * a + 1) + 0.03 * math.sin(5 * a + 2)) * min(1, i / 20))
    for v in bm.verts:
        p = v.co
        r = math.hypot(p.x, p.z)
        if p.y > -0.01 and r > 2.2:  # холмики по краю
            v.co.y += (0.07 * fbm((p.x, 0, p.z), 1.3) + 0.03) * smooth(2.2, 2.7, r)
        elif p.y < -0.8 and r > 0.1:  # скала: уступы и сколы
            k = 1 + 0.16 * fbm((p.x, p.y * 1.6, p.z), 0.9, 2) + 0.05 * round(fbm((p.x, p.y, p.z), 2.5) * 2)
            v.co.x, v.co.z = p.x * k, p.z * k
    for i in range(3):
        a = i * 2.1 + 0.4
        ball(bm, at(math.cos(a) * 1.9, -3.9 - i * 0.4, math.sin(a) * 1.9, 0.3 + 0.1 * i, 0.26 + 0.1 * i, 0.3 + 0.08 * i), 16)
    ob = finish(bm, 'ground')

    def color(p, n):
        if p.y > -0.33 and (n.y > 0.1 or p.y > -0.2):
            g = mix(G1, G2, smooth(-0.3, 0.4, fbm((p.x, 0, p.z), 1.1)))
            g = mix(g, G3, smooth(0.25, 0.6, fbm((p.x + 9, 0, p.z), 2.6)) * 0.7)
            return mix(g, lin('#2f8556'), smooth(-0.05, -0.3, p.y))
        if p.y > -0.9:
            return mix(SOIL, SOIL_D, smooth(-0.2, 0.3, fbm((p.x, p.y * 6, p.z), 1.0)))
        return mix(ROCK, ROCK_D, smooth(-0.3, 0.3, fbm((p.x * 0.6, p.y * 2.4, p.z * 0.6), 1.0, 2)) * 0.8 + smooth(-2.0, -5.0, p.y) * 0.3)
    paint(ob, color)
    return ob


def pine(x, z, h, tint):
    bm = bmesh.new()
    tube(bm, at(x, 0.2, z, 1, 0.45, 1), 0.085, 0.06, 10)
    for i in range(3):
        r, y = 0.46 - 0.11 * i, 0.38 + i * 0.34 * h
        lathe(bm, [(0.02, y + 0.62), (r * 0.5, y + 0.3), (r, y), (r * 0.6, y - 0.03), (0.02, y + 0.02)], 18, at(x, 0, z), lambda a, j, i=i: 1 + 0.07 * math.sin(6 * a + i))
    ob = soften(finish(bm, 'pine', smooth_shade=False), 0, 1)
    dark, light = lin(tint), lin('#8fdcb4')
    paint(ob, lambda p, n: lin('#8a5a34') if p.y < 0.36 else mix(dark, light, smooth(0.1, 1.0, n.y) * 0.55 + fbm(p, 6.0) * 0.12))
    return ob


def round_tree(x, z):
    bm = bmesh.new()
    lathe(bm, [(0.1, 0), (0.07, 0.25), (0.06, 0.6)], 10, at(x, 0, z))
    for dx, dy, dz, r in ((0, 0.86, 0, 0.36), (0.25, 0.74, 0.05, 0.26), (-0.24, 0.76, -0.04, 0.27), (0.03, 0.72, 0.24, 0.24), (0, 1.1, -0.05, 0.25), (-0.05, 0.75, -0.25, 0.24)):
        ball(bm, at(x + dx, dy, z + dz, r), 20)
    ob = melt(finish(bm, 'tree'), 0.035, 3)
    paint(ob, lambda p, n: lin('#8a5a34') if p.y < 0.5 else mix(lin('#4fb04a'), lin('#a8e07a'), smooth(-0.2, 1.0, n.y) * 0.6 + fbm(p, 5.0) * 0.2))
    return ob


def small_props():
    obs = []
    spots = []
    while len(spots) < 30:
        a, r = rnd.uniform(0, math.tau), rnd.uniform(0.6, 2.8)
        x, z = math.cos(a) * r, math.sin(a) * r
        if free(x, z, 0.1) and all(math.hypot(x - sx, z - sz) > 0.3 for sx, sz in spots):
            spots.append((x, z))
    petals = [lin(c) for c in ('#ff8fc0', '#ffd25a', '#9fd4ff', '#ffffff', '#c7a6ff')]
    bm = bmesh.new()
    for i, (x, z) in enumerate(spots):
        y = 0.04 if math.hypot(x, z) > 2.3 else 0
        if i < 12:  # цветы
            tube(bm, at(x, y + 0.09, z, 1, 0.18, 1), 0.012, 0.01, 6)
            for k in range(5):
                a = math.tau * k / 5
                ball(bm, at(x + math.cos(a) * 0.045, y + 0.19, z + math.sin(a) * 0.045, 0.036, 0.018, 0.036), 8)
            ball(bm, at(x, y + 0.2, z, 0.028, 0.022, 0.028), 8)
        elif i < 15:  # грибы
            tube(bm, at(x, y + 0.07, z, 1, 0.14, 1), 0.04, 0.03, 10)
            ball(bm, at(x, y + 0.13, z, 0.11, 0.075, 0.11), 16)
        elif i < 20:  # камни
            s = rnd.uniform(0.1, 0.2)
            ball(bm, at(x, y + s * 0.4, z, s, s * 0.65, s * 0.85, (0, rnd.uniform(0, 3), 0)), 10)
        else:  # пучки травы
            for k in range(4):
                tube(bm, at(x + rnd.uniform(-0.05, 0.05), y + 0.07, z + rnd.uniform(-0.05, 0.05), 1, rnd.uniform(0.1, 0.18), 1, (rnd.uniform(-0.3, 0.3), 0, rnd.uniform(-0.3, 0.3))), 0.022, 0.002, 5)
    ob = finish(bm, 'props')

    def color(p, n):
        i = min(range(len(spots)), key=lambda j: math.hypot(p.x - spots[j][0], p.z - spots[j][1]))
        h = p.y - (0.04 if math.hypot(*spots[i]) > 2.3 else 0)
        if i < 12:
            d = math.hypot(p.x - spots[i][0], p.z - spots[i][1])
            return lin('#4fae6a') if h < 0.17 else (lin('#ffc93c') if d < 0.03 and h > 0.195 else petals[i % 5])
        if i < 15:
            return lin('#fff3e0') if h < 0.125 or fbm(p, 22.0) > 0.28 else lin('#ff6b6b')
        if i < 20:
            return mix(lin('#b9aed0'), lin('#8f84ad'), smooth(0.6, -0.4, n.y))
        return mix(lin('#4fae6a'), lin('#b6ec9a'), smooth(0.02, 0.16, h))
    paint(ob, color)
    obs.append(ob)
    # игрушки у кровати: кубики и мяч
    toys = [(-1.45, 0.11, 0.85, '#ff8f6b', 0.3), (-1.72, 0.11, 0.6, '#6bc5ff', -0.4), (-1.52, 0.33, 0.74, '#ffd25a', 0.9)]
    for x, y, z, c, r in toys:
        bm = bmesh.new()
        box(bm, at(x, y, z, 0.22, rot=(0, r, 0)))
        t = soften(finish(bm, 'block', smooth_shade=False), 0.03, 0, 3)
        t.data.shade_smooth()
        paint(t, lambda p, n, c=lin(c): mix(c, (1, 1, 1), 0.25 * smooth(0.5, 1.0, n.y)))
        obs.append(t)
    bm = bmesh.new()
    ball(bm, at(-1.2, 0.14, 1.75, 0.14), 24)
    b = finish(bm, 'ballToy')
    paint(b, lambda p, n: lin('#ff7eb6') if math.sin(math.atan2(p.z - 1.75, p.x + 1.2) * 3) > 0 else lin('#fff6e2'))
    return obs + [b]


def build_island():
    parts = [build_ground(), pine(-2.1, -1.4, 1.5, '#3fa58c'), pine(-1.45, -2.25, 1.1, '#2f9080'), pine(-2.55, -0.5, 0.9, '#4bb39a'), round_tree(2.1, -1.5), *small_props()]
    ob = join(parts, 'Island')
    ob.data.materials.clear()
    ob.data.materials.append(material('Matte', 0.9))
    return ob
