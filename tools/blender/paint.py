"""Цвет по вершинам, запекание мягких теней (AO) в цвет и материалы."""
import bpy
from mathutils import Vector

from lib import CI, lin, mix

SHADOW = lin('#5a4a8c')  # тени не серые, а сиреневые: картинка теплее


def paint(ob, fn):
    """fn(точка в координатах three, нормаль) -> линейный цвет. Пишет атрибут Color."""
    me = ob.data
    attr = me.color_attributes.get('Color') or me.color_attributes.new('Color', 'FLOAT_COLOR', 'POINT')
    mw = ob.matrix_world
    nm = (CI @ mw).to_3x3()
    for v, d in zip(me.vertices, attr.data):
        p = CI @ (mw @ v.co)
        c = fn(p, (nm @ v.normal).normalized())
        d.color = (c[0], c[1], c[2], 1.0)
    me.color_attributes.active_color = attr
    me.color_attributes.render_color_index = list(me.color_attributes).index(attr)


def material(name, rough=0.8, sheen=0.0, emissive=None, metallic=0.0):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    m.use_backface_culling = True
    nt = m.node_tree
    bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    col = nt.nodes.new('ShaderNodeVertexColor')
    col.layer_name = 'Color'
    nt.links.new(col.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metallic
    if sheen:
        bsdf.inputs['Sheen Weight'].default_value = sheen
        bsdf.inputs['Sheen Roughness'].default_value = 0.5
        bsdf.inputs['Sheen Tint'].default_value = (0.32, 0.27, 0.24, 1.0)  # лёгкий «ворс» по краям, без белёсой пелены
    if emissive:
        bsdf.inputs['Emission Color'].default_value = (*lin(emissive), 1.0)
        bsdf.inputs['Emission Strength'].default_value = 1.0
    return m


def use(ob, mat):
    ob.data.materials.clear()
    ob.data.materials.append(mat)
    return ob


def bake_ao(targets, visible, strength=0.8, distance=0.9, samples=48):
    """Запечь мягкие тени для targets; в расчёте участвуют только visible."""
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = samples
    if not sc.world:
        sc.world = bpy.data.worlds.new('w')
    sc.world.light_settings.distance = distance
    show = set(visible) | set(targets)
    for ob in sc.objects:
        ob.hide_render = ob not in show
    for ob in targets:
        me = ob.data
        ao = me.color_attributes.new('AO', 'FLOAT_COLOR', 'POINT')
        me.color_attributes.active_color = ao
        bpy.ops.object.select_all(action='DESELECT')
        ob.select_set(True)
        bpy.context.view_layer.objects.active = ob
        bpy.ops.object.bake(type='AO', target='VERTEX_COLORS')
        col = me.color_attributes['Color']
        for d, a in zip(col.data, me.color_attributes['AO'].data):
            k = 1 - (1 - min(1.0, a.color[0] * 1.15)) * strength
            c = mix(tuple(x * y for x, y in zip(d.color[:3], SHADOW)), d.color[:3], k)
            d.color = (c[0], c[1], c[2], 1.0)
        me.color_attributes.remove(me.color_attributes['AO'])
        me.color_attributes.active_color = me.color_attributes['Color']
    for ob in sc.objects:
        ob.hide_render = False


def join(objs, name):
    """Склеить объекты в один (цвета сохраняются)."""
    bpy.ops.object.select_all(action='DESELECT')
    for ob in objs:
        ob.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    objs[0].name = name
    return objs[0]


def set_origin(ob, origin):
    """Перенести точку опоры объекта (в координатах three), не двигая геометрию."""
    from lib import C
    new = C @ Vector(origin)
    delta = ob.matrix_world.inverted() @ new
    ob.data.transform(__import__('mathutils').Matrix.Translation(-delta))
    ob.location = new
    return ob
