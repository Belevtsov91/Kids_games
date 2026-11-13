"""Общие помощники: геометрия пишется в координатах three.js (Y вверх, +Z к зрителю), в Blender переводится в конце."""
import math

import bmesh
import bpy
from mathutils import Matrix, Vector, noise

C = Matrix.Rotation(math.pi / 2, 4, 'X')  # three -> Blender: (x, y, z) -> (x, -z, y)
CI = C.inverted()
Z_TO_Y = Matrix.Rotation(-math.pi / 2, 4, 'X')  # примитивы bmesh стоят вдоль Z, в three — вдоль Y


def lin(hex_color):
    """'#rrggbb' (sRGB) -> линейный цвет: так его ждёт glTF."""
    h = hex_color.lstrip('#')
    return tuple(((c / 255) / 12.92 if c / 255 <= 0.04045 else ((c / 255 + 0.055) / 1.055) ** 2.4) for c in (int(h[i:i + 2], 16) for i in (0, 2, 4)))


def mix(a, b, k):
    k = max(0.0, min(1.0, k))
    return tuple(x + (y - x) * k for x, y in zip(a, b))


def smooth(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def fbm(v, scale=1.0, octaves=3):
    """Мягкий шум -1..1 в точке."""
    return noise.fractal(Vector(v) * scale, 1.0, 2.0, octaves)


def at(x, y, z, sx=1.0, sy=None, sz=None, rot=(0, 0, 0)):
    """Матрица в координатах three: сдвиг, поворот (как Euler XYZ в three), масштаб."""
    sy = sx if sy is None else sy
    sz = sx if sz is None else sz
    r = Matrix.Rotation(rot[0], 4, 'X') @ Matrix.Rotation(rot[1], 4, 'Y') @ Matrix.Rotation(rot[2], 4, 'Z')
    return Matrix.Translation((x, y, z)) @ r @ Matrix.Diagonal((sx, sy, sz, 1))


def ball(bm, m, seg=32):
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=max(8, seg // 2), radius=1, matrix=m @ Z_TO_Y)


def tube(bm, m, r1=1.0, r2=1.0, seg=24, caps=True):
    """Цилиндр/конус высотой 1 вдоль Y с центром в начале: r1 — низ, r2 — верх."""
    bmesh.ops.create_cone(bm, cap_ends=caps, segments=seg, radius1=r1, radius2=r2, depth=1, matrix=m @ Z_TO_Y)


def box(bm, m):
    bmesh.ops.create_cube(bm, size=1, matrix=m)


def torus(bm, m, R=1.0, r=0.2, seg=32, ring=12, arc=math.tau):
    """Бублик в плоскости XY (как TorusGeometry в three)."""
    n = seg if arc >= math.tau - 1e-6 else seg + 1
    rows = []
    for i in range(n):
        a = arc * i / seg
        rows.append([bm.verts.new(m @ Vector(((R + r * math.cos(b)) * math.cos(a), (R + r * math.cos(b)) * math.sin(a), r * math.sin(b)))) for b in (math.tau * j / ring for j in range(ring))])
    for i in range(n if arc >= math.tau - 1e-6 else n - 1):
        a, b = rows[i], rows[(i + 1) % n]
        for j in range(ring):
            bm.faces.new((a[j], b[j], b[(j + 1) % ring], a[(j + 1) % ring]))


def lathe(bm, profile, seg=48, m=Matrix.Identity(4), wobble=None):
    """Тело вращения вокруг Y: profile — [(радиус, высота)], wobble(угол, i) множит радиус."""
    rows = []
    for i, (r, y) in enumerate(profile):
        row = []
        for s in range(seg):
            a = math.tau * s / seg
            k = wobble(a, i) if wobble else 1.0
            row.append(bm.verts.new(m @ Vector((math.cos(a) * r * k, y, math.sin(a) * r * k))))
        rows.append(row)
    for a, b in zip(rows, rows[1:]):
        for s in range(seg):
            bm.faces.new((a[s], a[(s + 1) % seg], b[(s + 1) % seg], b[s]))
    for row, flip in ((rows[0], False), (rows[-1], True)):
        if profile[rows.index(row)][0] > 1e-4:
            bm.faces.new(row if flip else row[::-1])
    return rows


def finish(bm, name, origin=(0, 0, 0), smooth_shade=True):
    """bmesh (в координатах three) -> объект Blender с точкой опоры в origin."""
    o = Vector(origin)
    bmesh.ops.transform(bm, matrix=C @ Matrix.Translation(-o), verts=bm.verts)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    ob.location = C @ o
    bpy.context.scene.collection.objects.link(ob)
    if smooth_shade:
        me.shade_smooth()
    return ob


def bake_mods(ob):
    """Применить модификаторы (объект остаётся тем же)."""
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    old = ob.data
    ob.modifiers.clear()
    ob.data = me
    bpy.data.meshes.remove(old)
    me.shade_smooth()
    return ob


def melt(ob, voxel=0.03, iters=6, sub=0):
    """Слить пересекающиеся формы в одну мягкую «плюшевую»: воксельная сетка + сглаживание."""
    r = ob.modifiers.new('remesh', 'REMESH')
    r.mode, r.voxel_size, r.use_smooth_shade = 'VOXEL', voxel, True
    s = ob.modifiers.new('smooth', 'SMOOTH')
    s.factor, s.iterations = 0.9, iters
    if sub:
        ob.modifiers.new('sub', 'SUBSURF').levels = sub
    return bake_mods(ob)


def soften(ob, bevel=0.02, sub=1, segments=2):
    """Скруглить рёбра: фаска + подразделение."""
    if bevel:
        b = ob.modifiers.new('bevel', 'BEVEL')
        b.width, b.segments, b.limit_method, b.angle_limit = bevel, segments, 'ANGLE', math.radians(35)
    if sub:
        ob.modifiers.new('sub', 'SUBSURF').levels = sub
    return bake_mods(ob)


def parent(child, par):
    bpy.context.view_layer.update()
    child.parent = par
    child.matrix_parent_inverse = par.matrix_world.inverted()


def empty(name, origin=(0, 0, 0)):
    ob = bpy.data.objects.new(name, None)
    ob.location = C @ Vector(origin)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def pillow(bm, m, power=0.55, seg=32):
    """Подушка: шар, «раздутый» к углам."""
    before = set(bm.verts)
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2, radius=1)
    for v in set(bm.verts) - before:
        x, y, z = v.co
        v.co = m @ Vector((math.copysign(abs(x) ** power, x), math.copysign(abs(z) ** 0.9, z), math.copysign(abs(y) ** power, -y)))


def slab(bm, x0, x1, y0, top, z0, z1, nx=36, ny=14):
    """Доска с фигурным верхом: top(x) — высота верхнего края."""
    def grid(z):
        return [[bm.verts.new((x0 + (x1 - x0) * i / nx, y0 + (top(x0 + (x1 - x0) * i / nx) - y0) * j / ny, z)) for j in range(ny + 1)] for i in range(nx + 1)]
    f, b = grid(z1), grid(z0)
    for g in (f, b):
        for i in range(nx):
            for j in range(ny):
                bm.faces.new((g[i][j], g[i + 1][j], g[i + 1][j + 1], g[i][j + 1]))
    rim = [(i, 0) for i in range(nx + 1)] + [(nx, j) for j in range(1, ny + 1)] + [(i, ny) for i in range(nx - 1, -1, -1)] + [(0, j) for j in range(ny - 1, 0, -1)]
    for (i, j), (k, l) in zip(rim, rim[1:] + rim[:1]):
        bm.faces.new((f[i][j], f[k][l], b[k][l], b[i][j]))


def pivot(ob):
    """Сустав: пустышка с именем объекта в его точке опоры, сам объект становится её ребёнком.
    Код сцены вращает пустышку — сжатие сетки (квантование) сдвигает только узел с сеткой и суставы не портит."""
    bpy.context.view_layer.update()
    name = ob.name
    ob.name = name + 'Mesh'
    e = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(e)
    e.location = ob.matrix_world.translation
    if ob.parent:
        parent(e, ob.parent)
    for ch in list(ob.children):
        parent(ch, e)
    parent(ob, e)
    return e
