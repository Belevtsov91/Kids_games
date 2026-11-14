"""Рисует плюшевые аватарки (shell/src/ui/avatars/*.webp) — по одной на каждого зверя.

Запуск:  python tools/blender/build_avatars.py
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402

from avatars import ANIMALS, build_animal  # noqa: E402

# зверь: (высота макушки, ширина)
FRAME = {'bunny': (2.3, 2.4), 'fox': (1.45, 2.4), 'koala': (1.05, 2.95), 'lion': (1.4, 2.9), 'monkey': (0.95, 2.7), 'octopus': (1.0, 2.5),
         'unicorn': (1.7, 2.6), 'whale': (1.6, 3.0), 'frog': (1.12, 2.6)}
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'shell', 'src', 'ui', 'avatars')


def studio():
    """Камера спереди чуть сверху, мягкий свет слева и подсветка контура."""
    sc = bpy.context.scene
    sc.render.engine, sc.cycles.device, sc.cycles.samples = 'CYCLES', 'CPU', 96
    sc.render.film_transparent = True
    sc.render.resolution_x = sc.render.resolution_y = 384
    sc.view_settings.view_transform = 'Standard'
    sc.world = bpy.data.worlds.new('w')
    sc.world.use_nodes = True
    bg = sc.world.node_tree.nodes['Background']
    bg.inputs[0].default_value, bg.inputs[1].default_value = (0.8, 0.78, 1.0, 1), 0.75
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    cam.data.type = 'ORTHO'
    cam.location, cam.rotation_euler = (0.9, -6, 1.1), (math.radians(80.5), 0, math.radians(8.5))
    sc.collection.objects.link(cam)
    sc.camera = cam
    for energy, rot, color in ((3.2, (50, 0, -35), (1, 0.95, 0.88)), (2.0, (-60, 0, 150), (0.7, 0.75, 1))):
        sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN'))
        sun.data.energy, sun.data.angle, sun.data.color = energy, 0.5, color
        sun.rotation_euler = tuple(math.radians(a) for a in rot)
        sc.collection.objects.link(sun)
    return cam


def main():
    from PIL import Image
    bpy.ops.wm.read_factory_settings(use_empty=True)
    cam = studio()
    os.makedirs(OUT, exist_ok=True)
    only = sys.argv[1:]
    for name, cfg in ANIMALS.items():
        if only and name not in only:
            continue
        obs = build_animal(name, cfg)
        # кадр по размеру зверя: от подбородка до макушки (ушей, рога) и по ширине
        top, span = FRAME.get(name, (1.1, 2.4))
        cam.data.ortho_scale = max(top + 1.15, span) + 0.2
        cam.location.z = 1.0 + (top - 1.15) / 2
        png = os.path.join(OUT, name + '.png')
        bpy.context.scene.render.filepath = png
        bpy.ops.render.render(write_still=True)
        Image.open(png).resize((256, 256), Image.LANCZOS).save(os.path.join(OUT, name + '.webp'), quality=88, method=6)
        os.remove(png)
        for ob in obs:
            bpy.data.objects.remove(ob)
        print('avatar', name)


main()
