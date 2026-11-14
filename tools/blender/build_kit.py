"""Собирает общие детали сцен (остров, деревья, мишка Тёпа) в shell/src/lib/kit.glb.

Запуск:  python tools/blender/build_kit.py [--preview out.png]
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402

from export import export_glb  # noqa: E402
from guard import build_guard  # noqa: E402
from kit import build_kit  # noqa: E402

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'shell', 'src', 'lib', 'kit.glb')


def preview(path):
    sc = bpy.context.scene
    for name in ('KitPineTrunk', 'KitPineLeaves'):
        bpy.data.objects[name].location.x = -1.6
    for name in ('KitTreeTrunk', 'KitTreeLeaves'):
        bpy.data.objects[name].location.x = 1.6
    for name in ('KitIslandTop', 'KitIslandSoil', 'KitIslandRock'):
        ob = bpy.data.objects[name]
        ob.scale, ob.location.z = (2.4, 2.4, 1 if name != 'KitIslandRock' else 2.4), -0.275 - (0.5 if name == 'KitIslandRock' else 0)
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    cam.data.lens = 50
    cam.location, cam.rotation_euler = (4.6, -6.2, 2.6), (math.radians(78), 0, math.radians(36.5))
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN'))
    sun.data.energy, sun.data.angle, sun.rotation_euler = 3.5, 0.2, (math.radians(50), 0, math.radians(120))
    for ob in (cam, sun):
        sc.collection.objects.link(ob)
    sc.camera = cam
    sc.world.use_nodes = True
    sc.world.node_tree.nodes['Background'].inputs[0].default_value = (0.55, 0.5, 0.85, 1)
    sc.cycles.samples, sc.render.resolution_x, sc.render.resolution_y, sc.render.filepath = 48, 1000, 800, path
    sc.view_settings.view_transform = 'Standard'
    bpy.ops.render.render(write_still=True)


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_guard()
    build_kit()
    export_glb(OUT)
    if '--preview' in sys.argv:
        preview(sys.argv[sys.argv.index('--preview') + 1])


main()
