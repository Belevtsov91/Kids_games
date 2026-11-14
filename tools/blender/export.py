"""Выгрузка сцены Blender в сжатый .glb."""
import os
import subprocess
import tempfile

import bpy


def export_glb(out, selected=False):
    """Пишет .glb без текстур (цвет в вершинах) и сжимает: квантование + meshopt (в 3–4 раза меньше).
    three.js распаковывает такой файл встроенным MeshoptDecoder."""
    out = os.path.abspath(out)
    raw = os.path.join(tempfile.mkdtemp(), 'raw.glb')
    bpy.ops.export_scene.gltf(
        filepath=raw, export_format='GLB', export_texcoords=False, export_normals=True, export_vertex_color='MATERIAL',
        export_all_vertex_colors=False, export_cameras=False, export_lights=False, export_animations=False, export_yup=True,
        use_selection=selected,
    )
    subprocess.run(['npx', '-y', '@gltf-transform/cli@4', 'meshopt', raw, out, '--level', 'medium'], check=True)
    verts = sum(len(o.data.vertices) for o in bpy.data.objects if o.type == 'MESH')
    print(os.path.basename(out) + ':', os.path.getsize(out) // 1024, 'KB;', verts, 'vertices')
