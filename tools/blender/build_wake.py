"""Собирает сцену «Мишка просыпается» и выгружает её в shell/src/wake/scene/wake.glb.

Запуск (нужен пакет bpy — Blender как модуль Python):  python tools/blender/build_wake.py [--preview out.png]
"""
import math
import os
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402

from bear import build_bear  # noqa: E402
from bed import build_blanket, build_shade, build_soft, build_wood  # noqa: E402
from island import build_island  # noqa: E402
from lib import pivot  # noqa: E402
from paint import bake_ao  # noqa: E402

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'shell', 'src', 'wake', 'scene', 'wake.glb')


def preview(path, bear):
    """Пробный кадр: мишка стоит на коврике, свет как утром."""
    sc = bpy.context.scene
    bear.location, bear.scale, bear.rotation_euler = (1.35, -0.5, 0.44), (0.8, 0.8, 0.8), (0, 0, 1.0)
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    cam.data.lens = 50
    cam.location, cam.rotation_euler = (6.2, -3.9, 2.9), (math.radians(74), 0, math.radians(57.5))
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN'))
    sun.data.energy, sun.data.angle, sun.rotation_euler = 3.5, 0.2, (math.radians(50), 0, math.radians(120))
    for ob in (cam, sun):
        sc.collection.objects.link(ob)
    sc.camera = cam
    sc.world.use_nodes = True
    sc.world.node_tree.nodes['Background'].inputs[0].default_value = (0.55, 0.5, 0.85, 1)
    sc.world.node_tree.nodes['Background'].inputs[1].default_value = 0.9
    sc.cycles.samples, sc.render.resolution_x, sc.render.resolution_y, sc.render.filepath = 48, 1100, 800, path
    sc.view_settings.view_transform = 'Standard'
    bpy.ops.render.render(write_still=True)


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bear = build_bear()
    wood, soft, shade, island = build_wood(), build_soft(), build_shade(), build_island()
    blanket = build_blanket()
    bake_ao([island, wood, soft], [shade], 0.8, 0.8, 160)
    bake_ao([blanket], [], 0.6, 0.3)
    pivot(blanket)
    raw = os.path.join(tempfile.mkdtemp(), 'wake.raw.glb')
    bpy.ops.export_scene.gltf(
        filepath=raw, export_format='GLB', export_texcoords=False, export_normals=True, export_vertex_color='MATERIAL',
        export_all_vertex_colors=False, export_cameras=False, export_lights=False, export_animations=False, export_yup=True,
    )
    # сжатие: квантование и meshopt (в 3–4 раза меньше); three.js распаковывает встроенным MeshoptDecoder
    subprocess.run(['npx', '-y', '@gltf-transform/cli@4', 'meshopt', raw, os.path.abspath(OUT), '--level', 'medium'], check=True)
    print('wake.glb:', os.path.getsize(os.path.abspath(OUT)) // 1024, 'KB;', sum(len(o.data.vertices) for o in bpy.data.objects if o.type == 'MESH'), 'vertices')
    if '--preview' in sys.argv:
        bpy.data.objects['BlanketMesh'].hide_render = True
        preview(sys.argv[sys.argv.index('--preview') + 1], bear)


main()
