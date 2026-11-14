"""Плюшевые головы зверей для аватарок: 12 штук, по одной на каждый эмодзи из списка AVATARS."""
import math

import bmesh
from mathutils import Vector

from bear import oval
from lib import at, ball, fbm, finish, lathe, lin, melt, mix, smooth, torus
from paint import material, paint, use

DARK, WHITE, PINK = lin('#24150f'), lin('#fff6e6'), lin('#ff8fa8')


def sym(x, y, z, sx, sy=None, sz=None):
    return [(x, y, z, sx, sy or sx, sz or sx), (-x, y, z, sx, sy or sx, sz or sx)]


def fur(a, b):
    """Мех двух оттенков: светлее сверху, с мягкими пятнами."""
    ca, cb = lin(a), lin(b)
    return lambda p, n: mix(ca, cb, (0.5 + 0.5 * n.y + fbm(p, 5.0) * 0.3) * 0.8)


def patch(color, c, r, edge=(0.86, 1.02), front=None):
    """Пятно другого цвета в форме овала с мягким краем."""
    col = lin(color)
    return lambda p, n, base: base if front is not None and n.z < front else mix(col, base, smooth(edge[0], edge[1], oval(p, c, *r)))


def both(color, c, r, edge=(0.86, 1.02), front=None):
    a, b = patch(color, c, r, edge, front), patch(color, (-c[0], c[1], c[2]), r, edge, front)
    return lambda p, n, base: b(p, n, a(p, n, base))


MUZZLE = ((0, -0.24, 0.72), (0.46, 0.34, 0.4))
EARS = sym(0.68, 0.7, -0.05, 0.34, 0.34, 0.2)
INNER = ((0.68, 0.7, 0.1), (0.22, 0.22, 0.3))


def stripes(p, n, base):
    """Тигр: тёмные полоски на лбу и щеках."""
    k = smooth(0.55, 0.8, math.sin(p.x * 13 + math.sin(p.y * 3))) * smooth(0.25, 0.5, p.y) * smooth(0.5, 0.3, abs(p.x))
    k = max(k, smooth(0.5, 0.8, math.sin(p.y * 14)) * smooth(0.55, 0.8, abs(p.x)) * smooth(0.5, 0.1, abs(p.y + 0.05)))
    return mix(base, lin('#3a2416'), k * (1 if n.z > -0.2 else 0))


def spots(p, n, base):
    return mix(base, lin('#d9b8ff'), smooth(0.2, 0.34, fbm(p, 3.2)) * smooth(0.1, 0.5, p.y))


ANIMALS = {
    'bear': dict(fur=('#a8642e', '#cc8748'), blobs=EARS + [(0, -0.24, 0.6, 0.44, 0.33, 0.4)], paints=[patch('#f3cf9c', *MUZZLE), both('#f3cf9c', *INNER, front=0.2)]),
    'bunny': dict(fur=('#f3e4d8', '#fffaf2'), blobs=sym(0.36, 1.45, -0.05, 0.21, 0.78, 0.15) + [(0, -0.26, 0.62, 0.36, 0.28, 0.36)],
                  paints=[both('#ffb3c7', (0.36, 1.5, 0.08), (0.11, 0.6, 0.2), front=0.3)], nose='#ff7fa0', top=2.3),
    'fox': dict(fur=('#e8792c', '#f79a4a'), blobs=sym(0.66, 0.9, -0.05, 0.3, 0.52, 0.17) + [(0, -0.3, 0.72, 0.32, 0.26, 0.42)],
                paints=[patch('#fff6e6', (0, -0.62, 0.5), (0.95, 0.52, 0.9), (0.8, 1.0)), both('#3a2416', (0.7, 1.32, 0.0), (0.22, 0.2, 0.3)), both('#fff6e6', (0.66, 0.86, 0.1), (0.14, 0.3, 0.3), front=0.3)], nose_z=1.1),
    'panda': dict(fur=('#eee9e2', '#ffffff'), blobs=EARS + [(0, -0.24, 0.6, 0.42, 0.32, 0.38)], cheeks=False,
                  paints=[both('#2b2530', (0.68, 0.72, -0.05), (0.42, 0.42, 0.6), (0.9, 1.0)), both('#2b2530', (0.38, 0.1, 0.8), (0.2, 0.26, 0.4), (0.8, 1.0), front=0.2)]),
    'frog': dict(fur=('#58b83a', '#8ada5a'), blobs=sym(0.46, 0.74, 0.3, 0.34), eye=(0.46, 0.8, 0.6), nose=None, mouth=(0.3, -0.3, 0.86), wide=1.12,
                 paints=[patch('#d9f5a8', (0, -0.75, 0.4), (0.9, 0.5, 0.9), (0.75, 1.0))]),
    'lion': dict(fur=('#eeaa34', '#ffc95a'), blobs=sym(0.6, 0.72, 0.12, 0.26, 0.26, 0.16) + [(0, -0.24, 0.6, 0.44, 0.33, 0.4)], mane='#c2661e',
                 paints=[patch('#fff1cf', *MUZZLE), both('#f3cf9c', (0.6, 0.72, 0.2), (0.16, 0.16, 0.3), front=0.2)], nose='#7a4226'),
    'tiger': dict(fur=('#f08a2c', '#ffab4a'), blobs=EARS + [(0, -0.24, 0.6, 0.44, 0.33, 0.4)],
                  paints=[stripes, patch('#fff6e6', (0, -0.3, 0.72), (0.5, 0.38, 0.5)), both('#fff6e6', *INNER, front=0.2)], nose='#ff7fa0'),
    'koala': dict(fur=('#9aa2ad', '#c3cad3'), blobs=sym(0.92, 0.5, -0.05, 0.5, 0.5, 0.26), paints=[both('#f1e9f2', (0.92, 0.5, 0.12), (0.32, 0.32, 0.4), front=0.2)],
                  nose_size=(0.19, 0.27, 0.14), nose_at=(0, -0.08, 0.9), mouth=(0.14, -0.48, 0.8)),
    'monkey': dict(fur=('#8a5430', '#a86c40'), blobs=sym(1.0, 0.0, -0.05, 0.3, 0.3, 0.14) + [(0, -0.3, 0.62, 0.5, 0.36, 0.4)],
                   paints=[patch('#f6d3a8', (0, -0.3, 0.7), (0.56, 0.42, 0.5)), both('#f6d3a8', (0.33, 0.14, 0.8), (0.32, 0.34, 0.4)), both('#f6d3a8', (1.0, 0.0, 0.05), (0.18, 0.18, 0.3), front=0.2)], nose='#7a4226'),
    'unicorn': dict(fur=('#f6eef9', '#ffffff'), blobs=sym(0.6, 0.86, -0.05, 0.2, 0.36, 0.14) + [(0, -0.3, 0.62, 0.42, 0.32, 0.4)], horn=True, nose=None,
                    paints=[patch('#ffd3e2', *MUZZLE), both('#ffb3c7', (0.6, 0.86, 0.06), (0.1, 0.22, 0.3), front=0.3)], top=2.0),
    'octopus': dict(fur=('#a56df0', '#c79bff'), blobs=[(-0.8 + 0.4 * i, -0.82 - 0.05 * (i % 2), 0.1, 0.26, 0.3, 0.3) for i in range(5)], tall=1.08, nose=None, mouth=(0.11, -0.3, 0.9),
                    paints=[spots]),
    'whale': dict(fur=('#3f97ec', '#6fbaff'), blobs=[(0.95, 0.7, -0.3, 0.3, 0.2, 0.14), (1.25, 0.95, -0.3, 0.26, 0.16, 0.12), (1.15, 0.55, -0.3, 0.22, 0.16, 0.12)], wide=1.18, tall=0.9, nose=None,
                  paints=[patch('#eaf6ff', (0, -0.8, 0.4), (1.2, 0.56, 1.0), (0.8, 1.0))], eye=(0.5, -0.02, 0.76), mouth=(0.2, -0.3, 0.86), spout=True),
}


def build_animal(name, cfg):
    """Голова зверя в начале координат; возвращает список объектов."""
    wide, tall = cfg.get('wide', 1.0), cfg.get('tall', 1.0)
    bm = bmesh.new()
    ball(bm, at(0, 0, 0, 1.0 * wide, 0.92 * tall, 0.9), 40)
    if cfg.get('cheeks', True):
        for s in (-1, 1):
            ball(bm, at(s * 0.42 * wide, -0.28, 0.2, 0.56, 0.5, 0.52))
    for b in cfg['blobs']:
        ball(bm, at(*b[:3], *b[3:]), 24)
    head = melt(finish(bm, name), 0.035, 6)
    base = fur(*cfg['fur'])

    def color(p, n):
        c = base(p, n)
        for f in cfg['paints']:
            c = f(p, n, c)
        return c
    paint(head, color)
    plush, gloss, matte = material('Plush', 0.85, sheen=0.7), material('Gloss', 0.12), material('Matte', 0.9)
    obs = [use(head, plush)]
    ex, ey, ez = cfg.get('eye', (0.37, 0.08, 0.84))
    for s in (-1, 1):
        bm = bmesh.new()
        ball(bm, at(s * ex, ey, ez, 0.105, 0.125, 0.06), 24)
        ball(bm, at(s * ex + 0.035, ey + 0.045, ez + 0.045, 0.034), 12)
        eye = finish(bm, name + 'Eye')
        paint(eye, lambda p, n, s=s: WHITE if (p - Vector((s * ex + 0.035, ey + 0.045, ez + 0.045))).length < 0.037 else DARK)
        obs.append(use(eye, gloss))
        bm = bmesh.new()
        ball(bm, at(s * (ex + 0.24), ey - 0.3, ez - 0.1, 0.13, 0.085, 0.05, (0, s * 0.5, 0)), 16)
        blush = finish(bm, name + 'Blush')
        paint(blush, lambda p, n: PINK)
        obs.append(use(blush, matte))
    if cfg.get('nose', '#24150f'):
        nx, ny, nz = cfg.get('nose_at', (0, -0.14, cfg.get('nose_z', 0.98)))
        bm = bmesh.new()
        ball(bm, at(nx, ny, nz, *cfg.get('nose_size', (0.14, 0.1, 0.09))), 24)
        nose = finish(bm, name + 'Nose')
        nc = lin(cfg.get('nose', '#24150f'))
        paint(nose, lambda p, n: mix(nc, WHITE, smooth(0.4, 1.0, n.y) * 0.35))
        obs.append(use(nose, gloss))
    mw, my, mz = cfg.get('mouth', (0.1, -0.36, cfg.get('nose_z', 0.98) - 0.03))
    bm = bmesh.new()
    torus(bm, at(0, my, mz, rot=(0, 0, math.pi)), mw, 0.026, 20, 10, math.pi)
    mouth = finish(bm, name + 'Mouth')
    paint(mouth, lambda p, n: DARK)
    obs.append(use(mouth, matte))
    return obs + extras(name, cfg, plush)


def extras(name, cfg, plush):
    obs = []
    if cfg.get('mane'):  # грива льва: кольцо пушистых шаров
        bm = bmesh.new()
        for i in range(14):
            a = math.tau * i / 14
            ball(bm, at(math.cos(a) * 1.02, math.sin(a) * 0.98 - 0.05, -0.2, 0.36), 16)
        mane = melt(finish(bm, name + 'Mane'), 0.05, 4)
        paint(mane, fur(cfg['mane'], '#e08a34'))
        obs.append(use(mane, plush))
    if cfg.get('horn'):  # единорог: золотой витой рог и цветная грива
        bm = bmesh.new()
        lathe(bm, [(0.16 * (1 - i / 12) + 0.015, 0.78 + 0.85 * i / 12) for i in range(13)], 20, wobble=lambda a, i: 1 + 0.12 * math.sin(a + i * 1.3))
        horn = finish(bm, name + 'Horn')
        paint(horn, lambda p, n: mix(lin('#ffc93c'), lin('#fff0b0'), smooth(0.5, 1.0, math.sin(p.y * 22 + math.atan2(p.z, p.x)))))
        obs.append(use(horn, material('Gold', 0.3)))
        for i, c in enumerate(('#ff8fc0', '#b79cff', '#7ecbff', '#ff8fc0')):
            bm = bmesh.new()
            ball(bm, at(-0.5 - 0.22 * i, 0.72 - 0.3 * i, 0.3 - 0.12 * i, 0.3, 0.3, 0.26), 16)
            lock = finish(bm, name + 'Lock')
            paint(lock, fur(c, c))
            obs.append(use(lock, plush))
    if cfg.get('spout'):  # кит: фонтанчик
        bm = bmesh.new()
        for x, y, r in ((0, 1.02, 0.07), (-0.16, 1.26, 0.1), (0.16, 1.3, 0.1), (0, 1.5, 0.12)):
            ball(bm, at(x - 0.2, y, 0, r), 14)
        drops = finish(bm, name + 'Spout')
        paint(drops, lambda p, n: lin('#bfe6ff'))
        obs.append(use(drops, material('Gloss', 0.12)))
    return obs
